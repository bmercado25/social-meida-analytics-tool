import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/database.js';

/**
 * Test Supabase connection
 */
export const testConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Test connection by querying test_table
    const { data, error } = await supabaseAdmin
      .from('test_table')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Connection to DB successful',
      table: 'test_table',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('DB connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'DB connection test failed',
      error: error.message,
      details: error.details || null,
    });
  }
};

/**
 * Health check endpoint
 */
export const healthCheck = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
};
