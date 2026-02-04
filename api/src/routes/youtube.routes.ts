import { Router } from 'express';
import { getAllVideos, retrieveChannelShorts } from '../controllers/youtube.controller.js';
import { getOrCreateEmbedding, updateEmbedding } from '../controllers/video-embeddings.controller.js';

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
 * GET /api/youtube/embeddings/:video_id
 * Get video embedding by video_id, or create a new one if it doesn't exist
 */
router.get('/embeddings/:video_id', getOrCreateEmbedding);

/**
 * PUT /api/youtube/embeddings/:video_id
 * Update video embedding by video_id
 */
router.put('/embeddings/:video_id', updateEmbedding);

export default router;
