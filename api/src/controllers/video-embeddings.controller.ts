import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database.js';
import { randomUUID } from 'crypto';

interface VideoEmbedding {
  id?: string;
  video_id: string | null;
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

/**
 * GET /api/youtube/embeddings/:video_id/check
 * Check if an embedding exists for a video (without creating one)
 * Used to determine if assignment modal should be shown
 */
export const checkEmbeddingExists = async (
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

    // Check if embedding exists (don't create if it doesn't)
    const { data: existingEmbedding, error: fetchError } = await supabaseAdmin
      .from('video_embeddings')
      .select('id, video_id')
      .eq('video_id', video_id)
      .single();

    // Check if error is "not found" (expected if no embedding exists)
    if (fetchError && fetchError.code !== 'PGRST116' && !fetchError.message?.includes('No rows')) {
      throw fetchError;
    }

    res.json({
      success: true,
      exists: !!existingEmbedding,
      data: existingEmbedding || null,
    });
  } catch (error: any) {
    console.error('Error checking embedding:', error);
    next(error);
  }
};

/**
 * GET /api/youtube/embeddings/unassigned
 * Get all pending scripts (embeddings where video_id is null)
 * These are scripts created for future videos that haven't been published yet
 */
export const getUnassignedEmbeddings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Query embeddings where video_id IS NULL
    const { data: unassigned, error: embeddingsError } = await supabaseAdmin
      .from('video_embeddings')
      .select('*')
      .is('video_id', null)
      .order('created_at', { ascending: false });

    if (embeddingsError) {
      throw embeddingsError;
    }

    res.json({
      success: true,
      data: unassigned || [],
      count: (unassigned || []).length,
    });
  } catch (error: any) {
    console.error('Error fetching unassigned embeddings:', error);
    next(error);
  }
};

/**
 * GET /api/youtube/embeddings/available-videos
 * Get all videos that don't have embeddings assigned yet
 * Used when assigning a pending script to an existing video
 * 
 * Logic: Returns videos from youtube_videos that don't have a corresponding
 * row in video_embeddings with a non-null video_id
 */
export const getAvailableVideos = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get all videos from youtube_videos table
    const { data: allVideos, error: videosError } = await supabaseAdmin
      .from('youtube_videos')
      .select('video_id, title, view_count, engagement_rate')
      .order('view_count', { ascending: false });

    if (videosError) {
      throw videosError;
    }

    if (!allVideos || allVideos.length === 0) {
      res.json({
        success: true,
        data: [],
        count: 0,
      });
      return;
    }

    // Get all video_ids from video_embeddings that are NOT null
    // These are the videos that already have embeddings assigned
    const { data: embeddings, error: embeddingsError } = await supabaseAdmin
      .from('video_embeddings')
      .select('video_id')
      .not('video_id', 'is', null);

    if (embeddingsError) {
      throw embeddingsError;
    }

    // Create a Set of video_ids that already have embeddings
    const assignedVideoIds = new Set<string>();
    if (embeddings && embeddings.length > 0) {
      embeddings.forEach((e: any) => {
        if (e.video_id) {
          assignedVideoIds.add(e.video_id);
        }
      });
    }

    // Filter to only return videos that DON'T have an embedding assigned
    const available = allVideos.filter(
      (video: any) => video.video_id && !assignedVideoIds.has(video.video_id)
    );

    res.json({
      success: true,
      data: available,
      count: available.length,
    });
  } catch (error: any) {
    console.error('Error fetching available videos:', error);
    next(error);
  }
};

/**
 * POST /api/youtube/embeddings/unassigned
 * Create a new pending script (embedding with video_id set to null)
 * These are scripts for videos that haven't been published yet
 */
export const createUnassignedEmbedding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const embeddingData: Partial<VideoEmbedding> = req.body;

    // Create new embedding with NULL video_id (unassigned)
    const newEmbedding: VideoEmbedding = {
      id: randomUUID(),
      video_id: null,
      topic: embeddingData.topic || null,
      format: embeddingData.format || null,
      poc: embeddingData.poc || null,
      hook: embeddingData.hook || null,
      style: embeddingData.style || null,
      gimmick: embeddingData.gimmick || null,
      end_cta: embeddingData.end_cta || null,
      script: embeddingData.script || null,
      embedding_text: embeddingData.embedding_text || null,
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
      message: 'Unassigned embedding created successfully',
    });
  } catch (error: any) {
    console.error('Error creating unassigned embedding:', error);
    next(error);
  }
};

/**
 * PUT /api/youtube/embeddings/:embedding_id/assign
 * Assign a video_id to an unassigned embedding
 */
export const assignVideoToEmbedding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { embedding_id } = req.params;
    const { video_id } = req.body;

    if (!embedding_id) {
      res.status(400).json({
        success: false,
        error: { message: 'embedding_id is required' },
      });
      return;
    }

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

    // Check if video already has an embedding
    const { data: existingEmbedding, error: checkError } = await supabaseAdmin
      .from('video_embeddings')
      .select('id')
      .eq('video_id', video_id)
      .single();

    if (existingEmbedding && existingEmbedding.id !== embedding_id) {
      res.status(400).json({
        success: false,
        error: { message: 'Video already has an embedding assigned' },
      });
      return;
    }

    // Update the embedding with the video_id
    const { data: updatedEmbedding, error: updateError } = await supabaseAdmin
      .from('video_embeddings')
      .update({ video_id })
      .eq('id', embedding_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      data: updatedEmbedding,
      message: 'Video assigned to embedding successfully',
    });
  } catch (error: any) {
    console.error('Error assigning video to embedding:', error);
    next(error);
  }
};

/**
 * PUT /api/youtube/embeddings/:embedding_id
 * Update an embedding by id (works for both assigned and unassigned)
 */
export const updateEmbeddingById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { embedding_id } = req.params;
    const updateData: Partial<VideoEmbedding> = req.body;

    if (!embedding_id) {
      res.status(400).json({
        success: false,
        error: { message: 'embedding_id is required' },
      });
      return;
    }

    // Remove id and video_id from update data (video_id should be updated via assign endpoint)
    const { id, video_id: _, ...fieldsToUpdate } = updateData;

    const { data: updatedEmbedding, error: updateError } = await supabaseAdmin
      .from('video_embeddings')
      .update(fieldsToUpdate)
      .eq('id', embedding_id)
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
  } catch (error: any) {
    console.error('Error updating embedding:', error);
    next(error);
  }
};

/**
 * PUT /api/youtube/embeddings/:embedding_id/unassign
 * Unassign a video_id from an embedding (set video_id to null)
 */
export const unassignVideoFromEmbedding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { embedding_id } = req.params;

    if (!embedding_id) {
      res.status(400).json({
        success: false,
        error: { message: 'embedding_id is required' },
      });
      return;
    }

    // Update the embedding to set video_id to null (unassigned)
    const { data: updatedEmbedding, error: updateError } = await supabaseAdmin
      .from('video_embeddings')
      .update({ video_id: null })
      .eq('id', embedding_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      data: updatedEmbedding,
      message: 'Video unassigned from embedding successfully',
    });
  } catch (error: any) {
    console.error('Error unassigning video from embedding:', error);
    next(error);
  }
};

/**
 * DELETE /api/youtube/embeddings/:embedding_id
 * Delete an embedding by id
 */
export const deleteEmbedding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { embedding_id } = req.params;

    if (!embedding_id) {
      res.status(400).json({
        success: false,
        error: { message: 'embedding_id is required' },
      });
      return;
    }

    const { error: deleteError } = await supabaseAdmin
      .from('video_embeddings')
      .delete()
      .eq('id', embedding_id);

    if (deleteError) {
      throw deleteError;
    }

    res.json({
      success: true,
      message: 'Embedding deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting embedding:', error);
    next(error);
  }
};
