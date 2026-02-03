import { Router, Request, Response } from 'express';
import { supabase } from '../config/database.js';

const router = Router();

/**
 * GET /api/analytics
 * Get all analytics data
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/:id
 * Get analytics by ID
 */
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analytics
 * Create new analytics entry
 */
router.post('/', async (req: Request, res: Response, next) => {
  try {
    const { data, error } = await supabase
      .from('analytics')
      .insert(req.body)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/analytics/:id
 * Update analytics entry
 */
router.put('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('analytics')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/analytics/:id
 * Delete analytics entry
 */
router.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('analytics')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
