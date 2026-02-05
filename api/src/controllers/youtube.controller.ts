import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { YouTubeService } from '../services/youtube.service.js';

const youtubeService = new YouTubeService();
const CHANNEL_ID = 'UCkKQDuX3OteRGzQjnjXMCKA';

/**
 * Get all videos from youtube_videos table
 */
export const getAllVideos = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('youtube_videos')
      .select('*')
      .order('published_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    next(error);
  }
};

/**
 * GET /api/youtube/stats/:video_id
 * Get historical stats for a video from youtube_video_stats table
 */
export const getVideoStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { video_id } = req.params;

    if (!video_id) {
      res.status(400).json({
        success: false,
        error: { message: 'video_id is required' },
      });
      return;
    }

    // Get historical stats from youtube_video_stats
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('youtube_video_stats')
      .select('*')
      .eq('video_id', video_id)
      .order('recorded_at', { ascending: true });

    if (statsError) {
      throw statsError;
    }

    // Get current video data
    const { data: currentVideo, error: videoError } = await supabaseAdmin
      .from('youtube_videos')
      .select('video_id, view_count, like_count, comment_count, engagement_rate, days_since_published, last_synced_at')
      .eq('video_id', video_id)
      .single();

    if (videoError && videoError.code !== 'PGRST116') {
      throw videoError;
    }

    res.json({
      success: true,
      data: {
        historical: stats || [],
        current: currentVideo || null,
      },
    });
  } catch (error: any) {
    console.error('Error fetching video stats:', error);
    next(error);
  }
};

/**
 * Retrieve all shorts from channel and populate youtube_videos table
 * Uses upsert to avoid duplicates based on video_id
 */
export const retrieveChannelShorts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('Starting retrieval of shorts from channel:', CHANNEL_ID);

    // Get channel name
    const channelName = await youtubeService.getChannelName(CHANNEL_ID);
    console.log('Channel name:', channelName);

    // Fetch all shorts from channel
    console.log('Fetching shorts from channel...');
    const videoIds = await youtubeService.getAllShortsFromChannel(CHANNEL_ID);
    console.log(`Found ${videoIds.length} shorts`);

    if (videoIds.length === 0) {
      res.json({
        success: true,
        message: 'No shorts found in channel',
        videosProcessed: 0,
        channelId: CHANNEL_ID,
        channelName,
      });
      return;
    }

    // Fetch video details
    console.log('Fetching video details...');
    const videos = await youtubeService.getVideoDetails(videoIds);
    console.log(`Fetched details for ${videos.length} videos`);

    let videosInserted = 0;
    let videosUpdated = 0;
    let statsArchived = 0;
    let errors = 0;
    const snapshotTimestamp = new Date().toISOString();

    // Process each video
    for (const video of videos) {
      try {
        const videoData = youtubeService.transformVideoData(
          video,
          CHANNEL_ID,
          channelName
        );

        // Check if video already exists
        const { data: existingVideo, error: fetchError } = await supabaseAdmin
          .from('youtube_videos')
          .select('*')
          .eq('video_id', videoData.video_id)
          .single();

        // Video exists if we have data and no error, or if error is "not found" (PGRST116)
        const isNotFound = fetchError && (fetchError.code === 'PGRST116' || fetchError.message?.includes('No rows'));
        const videoExists = existingVideo && !isNotFound;

        if (videoExists && existingVideo) {
          // Archive the old stats to youtube_video_stats before updating
          try {
            // Get the previous stats entry to calculate growth
            const { data: previousStats } = await supabaseAdmin
              .from('youtube_video_stats')
              .select('view_count, like_count, comment_count, recorded_at')
              .eq('video_id', videoData.video_id)
              .order('recorded_at', { ascending: false })
              .limit(1)
              .single();

            // Calculate growth (difference from previous entry)
            const viewGrowth = previousStats
              ? (existingVideo.view_count || 0) - (previousStats.view_count || 0)
              : 0;
            const likeGrowth = previousStats
              ? (existingVideo.like_count || 0) - (previousStats.like_count || 0)
              : 0;
            const commentGrowth = previousStats
              ? (existingVideo.comment_count || 0) - (previousStats.comment_count || 0)
              : 0;

            // Calculate views_per_hour
            // If we have previous stats, calculate based on time difference
            let viewsPerHour: number | null = null;
            if (previousStats && previousStats.recorded_at) {
              const timeDiffHours = (new Date(snapshotTimestamp).getTime() - new Date(previousStats.recorded_at).getTime()) / (1000 * 60 * 60);
              if (timeDiffHours > 0) {
                viewsPerHour = viewGrowth / timeDiffHours;
              }
            } else if (existingVideo.views_per_day) {
              // Fallback to views_per_day / 24 if available
              viewsPerHour = existingVideo.views_per_day / 24;
            }

            // Build stats row with only the fields that exist in youtube_video_stats table
            const statsRow: any = {
              video_id: existingVideo.video_id,
              recorded_at: snapshotTimestamp,
              view_count: existingVideo.view_count || 0,
              like_count: existingVideo.like_count || 0,
              comment_count: existingVideo.comment_count || 0,
              favorite_count: existingVideo.favorite_count || 0,
              view_growth: viewGrowth,
              like_growth: likeGrowth,
              comment_growth: commentGrowth,
              engagement_rate: existingVideo.engagement_rate || null,
              views_per_hour: viewsPerHour,
              days_since_published: existingVideo.days_since_published || null,
            };

            // Insert into youtube_video_stats
            const { error: archiveError } = await supabaseAdmin
              .from('youtube_video_stats')
              .insert(statsRow);

            if (archiveError) {
              console.error(`Error archiving stats for video ${videoData.video_id}:`, archiveError);
              // Don't fail the whole operation, just log the error
            } else {
              statsArchived++;
              console.log(`Archived stats for video ${videoData.video_id} at ${snapshotTimestamp}`);
            }
          } catch (archiveErr: any) {
            console.error(`Error archiving stats for video ${videoData.video_id}:`, archiveErr);
            // Continue with update even if archiving fails
          }

          // Get current sync_count
          const currentSyncCount = existingVideo.sync_count || 1;

          // Update existing video with new data
          const { error: updateError } = await supabaseAdmin
            .from('youtube_videos')
            .update({
              ...videoData,
              updated_at: new Date().toISOString(),
              last_synced_at: new Date().toISOString(),
              sync_count: currentSyncCount + 1,
            })
            .eq('video_id', videoData.video_id);

          if (updateError) {
            console.error(`Error updating video ${videoData.video_id}:`, updateError);
            errors++;
          } else {
            videosUpdated++;
          }
        } else {
          // Insert new video (no stats to archive for new videos)
          const { error: insertError } = await supabaseAdmin
            .from('youtube_videos')
            .insert({
              ...videoData,
              first_synced_at: new Date().toISOString(),
              last_synced_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error(`Error inserting video ${videoData.video_id}:`, insertError);
            errors++;
          } else {
            videosInserted++;
          }
        }
      } catch (error: any) {
        console.error(`Error processing video ${video.id}:`, error);
        errors++;
      }
    }

    res.json({
      success: true,
      message: `Retrieved ${videos.length} shorts from channel`,
      videosProcessed: videos.length,
      videosInserted,
      videosUpdated,
      statsArchived,
      errors,
      channelId: CHANNEL_ID,
      channelName,
    });
  } catch (error: any) {
    console.error('Error retrieving channel shorts:', error);
    next(error);
  }
};
