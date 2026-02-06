import { Router } from 'express';
import { sendChatMessage } from '../controllers/chat.controller.js';

const router = Router();

/**
 * POST /api/chat
 * Send a message to the AI chatbot with optional video context
 */
router.post('/', sendChatMessage);

export default router;
