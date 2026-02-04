import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { randomUUID } from 'crypto';

interface VideoEmbedding {
  id?: string;
  video_id: string;
  topic?: string | null;
  format?: string | null;
  poc?: string | null;
  hook?: string | null;
  style?: string | null;
  gimmick?: string | null;
  end_cta?: string | null;
  script?: string | null;
  embedding_text?: string | null;
}

/**
 * GET /api/youtube/embeddings/:video_id
 * Get video embedding by video_id, or create a new one if it doesn't exist
 */
export const getOrCreateEmbedding = async (
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

    // First, verify the video exists in youtube_videos
    const { data: video, error: videoError } = await supabaseAdmin
      .from('youtube_videos')
      .select('video_id')
      .eq('video_id', video_id)
      .single();

    if (videoError || !video) {
      res.status(404).json({
        success: false,
        error: { message: 'Video not found in youtube_videos table' },
      });
      return;
    }

    // Try to get existing embedding
    const { data: existingEmbedding, error: fetchError } = await supabaseAdmin
      .from('video_embeddings')
      .select('*')
      .eq('video_id', video_id)
      .single();

    // Check if error is "not found" (expected if no embedding exists)
    // Supabase/PostgREST returns PGRST116 for "not found" errors
    if (fetchError && fetchError.code !== 'PGRST116' && !fetchError.message?.includes('No rows')) {
      throw fetchError;
    }

    if (existingEmbedding) {
      // Return existing embedding
      res.json({
        success: true,
        data: existingEmbedding,
      });
      return;
    }

    // Create new embedding row with just video_id
    const newEmbedding: VideoEmbedding = {
      id: randomUUID(),
      video_id,
      topic: null,
      format: null,
      poc: null,
      hook: null,
      style: null,
      gimmick: null,
      end_cta: null,
      script: null,
      embedding_text: null,
    };

    const { data: createdEmbedding, error: createError } = await supabaseAdmin
      .from('video_embeddings')
      .insert(newEmbedding)
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    res.json({
      success: true,
      data: createdEmbedding,
      created: true,
    });
  } catch (error: any) {
    console.error('Error getting/creating embedding:', error);
    next(error);
  }
};

/**
 * PUT /api/youtube/embeddings/:video_id
 * Update video embedding by video_id
 */
export const updateEmbedding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { video_id } = req.params;
    const updateData: Partial<VideoEmbedding> = req.body;

    if (!video_id) {
      res.status(400).json({
        success: false,
        error: { message: 'video_id is required' },
      });
      return;
    }

    // Verify the video exists
    const { data: video, error: videoError } = await supabaseAdmin
      .from('youtube_videos')
      .select('video_id')
      .eq('video_id', video_id)
      .single();

    if (videoError || !video) {
      res.status(404).json({
        success: false,
        error: { message: 'Video not found in youtube_videos table' },
      });
      return;
    }

    // Check if embedding exists
    const { data: existingEmbedding, error: fetchError } = await supabaseAdmin
      .from('video_embeddings')
      .select('id')
      .eq('video_id', video_id)
      .single();

    // Check if error is "not found" (expected if no embedding exists)
    if (fetchError && fetchError.code !== 'PGRST116' && !fetchError.message?.includes('No rows')) {
      throw fetchError;
    }

    // Remove id and video_id from update data (these shouldn't be updated)
    const { id, video_id: _, ...fieldsToUpdate } = updateData;

    if (existingEmbedding) {
      // Update existing embedding
      const { data: updatedEmbedding, error: updateError } = await supabaseAdmin
        .from('video_embeddings')
        .update(fieldsToUpdate)
        .eq('video_id', video_id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      res.json({
        success: true,
        data: updatedEmbedding,
        message: 'Embedding updated successfully',
      });
    } else {
      // Create new embedding if it doesn't exist
      const newEmbedding: VideoEmbedding = {
        id: randomUUID(),
        video_id,
        ...fieldsToUpdate,
      };

      const { data: createdEmbedding, error: createError } = await supabaseAdmin
        .from('video_embeddings')
        .insert(newEmbedding)
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      res.json({
        success: true,
        data: createdEmbedding,
        message: 'Embedding created successfully',
        created: true,
      });
    }
  } catch (error: any) {
    console.error('Error updating embedding:', error);
    next(error);
  }
};
