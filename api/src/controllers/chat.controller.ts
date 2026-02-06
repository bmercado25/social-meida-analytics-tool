import { Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../config/database.js';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a marketing strategist and creative copy generator for a SaaS product.

Your role is to generate high-performing promotional content (hooks, scripts, captions, CTAs, angles, positioning statements) that is direct-response oriented, optimized for short-form and long-form digital platforms.

You will be provided with structured JSON data representing selected video content. This data may include (but is not limited to):
– topics
– hooks
– formats
– scripts or notes
– pacing
– tone or style descriptors
– gimmicks
– endings / CTAs
– performance indicators or qualitative trends

Treat this JSON as ground truth pattern data.

How to use the JSON:

Extract recurring patterns, trends, and stylistic signals (e.g. hook structure, language choices, pacing, emotional triggers, narrative devices).

Infer what works for this audience and product category without explicitly referencing the raw data.

Use these patterns to influence the structure, tone, and creative decisions of your output.

Output rules:

– Do not summarize or restate the JSON.
– Do not mention "the data," "the JSON," or "selected videos."
– Produce original marketing content that feels native to the identified trends.
– Favor clarity, memorability, and conversion over generic brand language.
– When uncertain, default to bold, specific, and testable ideas rather than safe generalities.

You combine:
– the user's intent
– the inferred patterns from the provided data
– best-practice SaaS marketing principles
– the best practices for marketing on YouTube Shorts that are proven to work based on data in both the JSON and youtube landscape trends and historical data

…to generate content that is distinct, compelling, and optimized to perform.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * POST /api/chat
 * Send a chat message with optional video context
 * Body: { message: string, videoIds: string[], history: ChatMessage[] }
 */
export const sendChatMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, videoIds, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({
        success: false,
        error: { message: 'message is required' },
      });
      return;
    }

    // Build context from selected videos + their embeddings
    let contextJson = '';
    if (videoIds && Array.isArray(videoIds) && videoIds.length > 0) {
      const contextData = await Promise.all(
        videoIds.map(async (videoId: string) => {
          // Fetch video data
          const { data: video } = await supabaseAdmin
            .from('youtube_videos')
            .select('*')
            .eq('video_id', videoId)
            .single();

          // Fetch embedding data
          let embedding = null;
          const { data: embeddingData } = await supabaseAdmin
            .from('video_embeddings')
            .select('*')
            .eq('video_id', videoId)
            .single();

          if (embeddingData) {
            embedding = embeddingData;
          }

          return { video, embedding };
        })
      );

      const validContext = contextData.filter((c) => c.video !== null);
      if (validContext.length > 0) {
        contextJson = JSON.stringify(validContext, null, 2);
      }
    }

    // Build the messages array for OpenAI
    const messages: ChatMessage[] = [];

    // System message with context
    let systemContent = SYSTEM_PROMPT;
    if (contextJson) {
      systemContent += `\n\n---\n\nContext:\n${contextJson}`;
    }
    messages.push({ role: 'system', content: systemContent });

    // Add conversation history (if provided)
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        if (
          msg.role &&
          msg.content &&
          (msg.role === 'user' || msg.role === 'assistant')
        ) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message.trim() });

    // Log the complete prompt for debugging
    console.log('\n========== COMPLETE PROMPT SENT TO OPENAI ==========');
    messages.forEach((msg, index) => {
      console.log(`\n--- Message ${index + 1} (${msg.role.toUpperCase()}) ---`);
      console.log(msg.content);
    });
    console.log('\n====================================================\n');

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    const assistantMessage =
      completion.choices[0]?.message?.content || 'No response generated.';

    res.json({
      success: true,
      data: {
        message: assistantMessage,
        usage: completion.usage,
      },
    });
  } catch (error: any) {
    console.error('Error in chat:', error);

    // Handle OpenAI specific errors
    if (error?.status === 401) {
      res.status(401).json({
        success: false,
        error: { message: 'Invalid OpenAI API key' },
      });
      return;
    }
    if (error?.status === 429) {
      res.status(429).json({
        success: false,
        error: { message: 'OpenAI rate limit exceeded. Please try again shortly.' },
      });
      return;
    }

    next(error);
  }
};
