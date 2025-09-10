import express from 'express';
import mongoose from 'mongoose';
import { successResponse } from '../utils/apiResponse';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Health check endpoint
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 mongodb:
 *                   type: string
 *                   enum: [connected, disconnected]
 *                 environment:
 *                   type: string
 *                 version:
 *                   type: string
 */
// Health check endpoint with detailed status
router.get('/', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    console.log('Health check - Database status:', dbStatus);
    
    const healthData = {
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    };
    
    res.json(successResponse(healthData, 'API is healthy'));
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error?.message || 'Unknown error'
    });
  }
});

export { router as healthRouter };
