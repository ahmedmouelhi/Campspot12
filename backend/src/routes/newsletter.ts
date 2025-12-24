import express from 'express';
import { subscribe, unsubscribe, getAllSubscribers } from '../controllers/newsletter';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin routes
router.get('/subscribers', authenticateToken, requireAdmin, getAllSubscribers);

export default router;
