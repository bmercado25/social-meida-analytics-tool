import axios from 'axios';
import { env } from '../config/env.js';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export class YouTubeService {
  private apiKey: string;

  constructor() {
    this.apiKey = env.YOUTUBE_API_KEY;
  }

  /**
   * Get channel name from channel ID
   */
  async getChannelName(channelId: string): Promise<string> {
    try {
      const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
        params: {
          part: 'snippet',
          id: channelId,
          key: this.apiKey,
        },
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].snippet.title;
      }
      return 'Unknown Channel';
    } catch (error: any) {
      console.error('Error fetching channel name:', error);
      return 'Unknown Channel';
    }
  }

  /**
   * Fetch all video IDs from a channel (Shorts only)
   * YouTube Shorts are videos with duration <= 60 seconds
   */
  async getAllShortsFromChannel(channelId: string): Promise<string[]> {
    const videoIds: string[] = [];
    let nextPageToken: string | undefined = undefined;

    try {
      do {
        const response = await axios.get(`${YOUTUBE_API_BASE}/search`, {
          params: {
            part: 'id',
            channelId: channelId,
            type: 'video',
            maxResults: 50,
            order: 'date',
            pageToken: nextPageToken,
            key: this.apiKey,
          },
        });

        const items = response.data.items || [];
        const batchVideoIds = items.map((item: any) => item.id.videoId);
        
        // Fetch video details to filter for shorts (duration <= 60 seconds)
        if (batchVideoIds.length > 0) {
          const shortsIds = await this.filterShorts(batchVideoIds);
          videoIds.push(...shortsIds);
        }
        
        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      return videoIds;
    } catch (error: any) {
      console.error('Error fetching shorts from channel:', error);
      throw new Error(`Failed to fetch shorts: ${error.message}`);
    }
  }

  /**
   * Filter videos to only include shorts (duration <= 60 seconds)
   */
  private async filterShorts(videoIds: string[]): Promise<string[]> {
    try {
      // YouTube API allows up to 50 video IDs per request
      const batches = [];
      for (let i = 0; i < videoIds.length; i += 50) {
        batches.push(videoIds.slice(i, i + 50));
      }

      const shortsIds: string[] = [];
      for (const batch of batches) {
        const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
          params: {
            part: 'contentDetails',
            id: batch.join(','),
            key: this.apiKey,
          },
        });

        const items = response.data.items || [];
        for (const item of items) {
          const duration = this.parseDuration(item.contentDetails.duration || 'PT0S');
          if (duration <= 60) {
            shortsIds.push(item.id);
          }
        }
      }

      return shortsIds;
    } catch (error: any) {
      console.error('Error filtering shorts:', error);
      return [];
    }
  }

  /**
   * Fetch video details (metadata + stats)
   */
  async getVideoDetails(videoIds: string[]): Promise<any[]> {
    if (videoIds.length === 0) return [];

    // YouTube API allows up to 50 video IDs per request
    const batches = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      batches.push(videoIds.slice(i, i + 50));
    }

    const allVideos = [];
    for (const batch of batches) {
      try {
        const response = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
          params: {
            part: 'snippet,statistics,contentDetails',
            id: batch.join(','),
            key: this.apiKey,
          },
        });
        allVideos.push(...(response.data.items || []));
      } catch (error: any) {
        console.error(`Error fetching video details for batch:`, error);
      }
    }

    return allVideos;
  }

  /**
   * Transform YouTube API response to our database format
   */
  transformVideoData(video: any, channelId: string, channelName: string) {
    const stats = video.statistics || {};
    const snippet = video.snippet || {};
    const contentDetails = video.contentDetails || {};
    
    // Calculate duration in seconds
    const duration = this.parseDuration(contentDetails.duration || 'PT0S');
    
    // Calculate engagement rate
    const views = parseInt(stats.viewCount || '0');
    const likes = parseInt(stats.likeCount || '0');
    const comments = parseInt(stats.commentCount || '0');
    const engagementRate = views > 0 
      ? (likes + comments) / views 
      : null;
    
    // Calculate days since published
    const publishedAt = new Date(snippet.publishedAt);
    const daysSincePublished = Math.floor(
      (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Calculate views per day
    const viewsPerDay = daysSincePublished > 0 
      ? views / daysSincePublished 
      : views;

    return {
      video_id: video.id,
      channel_id: channelId,
      channel_name: channelName,
      title: snippet.title,
      description: snippet.description || null,
      published_at: snippet.publishedAt,
      duration_seconds: duration,
      category_id: parseInt(snippet.categoryId || '0'),
      category_name: snippet.categoryId || null,
      tags: snippet.tags || [],
      thumbnail_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || null,
      default_language: snippet.defaultLanguage || snippet.defaultAudioLanguage || null,
      view_count: views,
      like_count: likes,
      comment_count: comments,
      favorite_count: parseInt(stats.favoriteCount || '0'),
      engagement_rate: engagementRate,
      views_per_day: viewsPerDay,
      days_since_published: daysSincePublished,
    };
  }

  /**
   * Parse ISO 8601 duration (PT4M13S) to seconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }
}
