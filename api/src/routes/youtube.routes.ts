import { Router } from 'express';
import { getAllVideos, retrieveChannelShorts, getVideoStats } from '../controllers/youtube.controller.js';
import { 
  getOrCreateEmbedding,
  checkEmbeddingExists,
  updateEmbedding,
  updateEmbeddingById,
  getUnassignedEmbeddings,
  getAvailableVideos,
  createUnassignedEmbedding,
  assignVideoToEmbedding,
  unassignVideoFromEmbedding,
  deleteEmbedding,
} from '../controllers/video-embeddings.controller.js';

const router = Router();

/**
 * GET /api/youtube/videos
 * Get all videos from youtube_videos table
 */
router.get('/videos', getAllVideos);

/**
 * POST /api/youtube/retrieve
 * Retrieve all shorts from the configured channel and populate youtube_videos table
 */
router.post('/retrieve', retrieveChannelShorts);

/**
 * GET /api/youtube/stats/:video_id
 * Get historical stats for a video
 */
router.get('/stats/:video_id', getVideoStats);

/**
 * GET /api/youtube/embeddings/unassigned/list
 * Get all unassigned embeddings
 * Must come BEFORE /embeddings/:video_id to avoid matching "unassigned" as video_id
 */
router.get('/embeddings/unassigned/list', getUnassignedEmbeddings);

/**
 * GET /api/youtube/embeddings/available-videos
 * Get videos without embeddings
 * Must come BEFORE /embeddings/:video_id to avoid matching "available-videos" as video_id
 */
router.get('/embeddings/available-videos', getAvailableVideos);

/**
 * GET /api/youtube/embeddings/:video_id/check
 * Check if embedding exists without creating one
 * This must come BEFORE the /embeddings/:video_id route to match correctly
 */
router.get('/embeddings/:video_id/check', checkEmbeddingExists);

/**
 * GET /api/youtube/embeddings/:video_id
 * Get video embedding by video_id, or create a new one if it doesn't exist
 * This must come LAST to avoid matching other routes
 */
router.get('/embeddings/:video_id', getOrCreateEmbedding);

/**
 * PUT /api/youtube/embeddings/:video_id
 * Update video embedding by video_id
 */
router.put('/embeddings/:video_id', updateEmbedding);

/**
 * POST /api/youtube/embeddings/unassigned
 * Create a new unassigned embedding
 */
router.post('/embeddings/unassigned', createUnassignedEmbedding);

/**
 * PUT /api/youtube/embeddings/by-id/:embedding_id
 * Update an embedding by id
 */
router.put('/embeddings/by-id/:embedding_id', updateEmbeddingById);

/**
 * PUT /api/youtube/embeddings/:embedding_id/assign
 * Assign a video_id to an embedding
 */
router.put('/embeddings/:embedding_id/assign', assignVideoToEmbedding);

/**
 * PUT /api/youtube/embeddings/:embedding_id/unassign
 * Unassign a video_id from an embedding
 */
router.put('/embeddings/:embedding_id/unassign', unassignVideoFromEmbedding);

/**
 * DELETE /api/youtube/embeddings/:embedding_id
 * Delete an embedding by id
 */
router.delete('/embeddings/:embedding_id', deleteEmbedding);

export default router;
