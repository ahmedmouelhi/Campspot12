import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import path from 'path';
import Logger from './utils/logger';
import { errorHandler } from './utils/errors';
import { successResponse } from './utils/apiResponse';
import authRoutes from './routes/auth';
import campingSitesRoutes from './routes/campingSites';
import { bookingsRouter } from './routes/bookings';
import activitiesRoutes from './routes/activities';
import equipmentRoutes from './routes/equipment';
import blogRoutes from './routes/blog';
import cartRoutes from './routes/cart';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import notificationRoutes from './routes/notifications';
import { healthRouter } from './routes/health';
import { apiLimiter, authLimiter } from './middleware/rateLimit';
import { cacheMiddleware, CACHE_DURATIONS } from './middleware/cache';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  Logger.info(`${req.method} ${req.path} ${JSON.stringify(req.query)}`);
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    Logger.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// CORS Configuration
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.CORS_ORIGINS || 'https://campspot12-h6zhy2uue-ahmedmouelhis-projects.vercel.app').split(',').map(origin => origin.trim()).filter(Boolean)
  : [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    ];

// Add common Vercel domains as fallback
if (process.env.NODE_ENV === 'production') {
  corsOrigins.push(
    'https://campspot12-h6zhy2uue-ahmedmouelhis-projects.vercel.app',
    'https://campspot12.vercel.app',
    'https://*.vercel.app'
  );
}

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to ensure JSON responses have correct Content-Type
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  res.json = function(data: any) {
    res.setHeader('Content-Type', 'application/json');
    return originalJson.call(this, data);
  };
  next();
});

// Rate limiting
app.use(apiLimiter);

// MongoDB connection with better error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/camping-app';

// MongoDB connection options
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  maxPoolSize: 10, // Maintain up to 10 socket connections
  bufferCommands: false // Disable mongoose buffering
};

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });
    Logger.info('✅ Connected to MongoDB successfully');
  } catch (error: any) {
    Logger.error('❌ MongoDB connection error: ' + error.message);
    // Exit process on database connection failure in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Handle MongoDB events
mongoose.connection.on('error', (error) => {
  Logger.error('MongoDB error: ' + error.message);
});

mongoose.connection.on('disconnected', () => {
  Logger.warn('MongoDB disconnected');
  if (process.env.NODE_ENV === 'production') {
    setTimeout(connectDB, 5000);
  }
});

mongoose.connection.on('connected', () => {
  Logger.info('MongoDB connected');
});

// Connect to MongoDB
connectDB();

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Swagger JSON
/**
 * @swagger
 * tags:
 *   name: Health
 *   description: API health monitoring
 */

app.get('/api-docs.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Mount routes (single mount only)
app.use('/api/health', healthRouter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/camping-sites', campingSitesRoutes);
app.use('/api/bookings', bookingsRouter);
app.use('/api/activities', cacheMiddleware(CACHE_DURATIONS.ACTIVITIES), activitiesRoutes);
app.use('/api/equipment', cacheMiddleware(CACHE_DURATIONS.EQUIPMENT), equipmentRoutes);
app.use('/api/blog', cacheMiddleware(CACHE_DURATIONS.BLOG_POSTS), blogRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// API Documentation root redirect
app.get('/', (req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// API root redirect
app.get('/api', (req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// Enhanced error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  Logger.info(`🚀 Server is running on port ${port}`);
  Logger.info(`📚 API Documentation available at http://localhost:${port}/api-docs`);
  Logger.info('📋 Available routes:');
  Logger.info('- GET /api/health');
  Logger.info('- /api/auth/*');
  Logger.info('- /api/camping-sites/*');
  Logger.info('- /api/activities/*');
  Logger.info('- /api/equipment/*');
  Logger.info('- /api/blog/*');
  Logger.info('- /api/bookings/*');
  Logger.info('- /api/cart/*');
  Logger.info('- /api/admin/*');
  Logger.info('- /api/upload/*');
  
  Logger.info('🎉 Server started successfully!');
  Logger.info('💡 To view API docs, visit: http://localhost:' + port + '/api-docs');
  Logger.info('🔍 To test API, visit: http://localhost:' + port + '/api/health');
});
