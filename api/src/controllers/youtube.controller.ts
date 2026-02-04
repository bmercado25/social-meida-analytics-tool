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
    let errors = 0;

    // Process each video
    for (const video of videos) {
      try {
        const videoData = youtubeService.transformVideoData(
          video,
          CHANNEL_ID,
          channelName
        );

        // Check if video already exists
        const { data: existingVideo } = await supabaseAdmin
          .from('youtube_videos')
          .select('sync_count')
          .eq('video_id', videoData.video_id)
          .single();

        if (existingVideo) {
          // Get current sync_count
          const currentSyncCount = existingVideo.sync_count || 1;

          // Update existing video
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
          // Insert new video
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
      errors,
      channelId: CHANNEL_ID,
      channelName,
    });
  } catch (error: any) {
    console.error('Error retrieving channel shorts:', error);
    next(error);
  }
};
