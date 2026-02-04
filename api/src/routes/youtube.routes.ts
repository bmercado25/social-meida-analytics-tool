import { Router } from 'express';
import { getAllVideos, retrieveChannelShorts } from '../controllers/youtube.controller.js';

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

export default router;
