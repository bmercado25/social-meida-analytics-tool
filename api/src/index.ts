import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import analyticsRoutes from './routes/analytics.routes.js';
import healthRoutes from './routes/health.routes.js';
import testRoutes from './routes/test.routes.js';
import youtubeRoutes from './routes/youtube.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRoutes);
app.use('/api', testRoutes); // /api/test-connection
app.use('/api/analytics', analyticsRoutes);
app.use('/api/youtube', youtubeRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  console.log(`📊 Environment: ${env.NODE_ENV}`);
});
