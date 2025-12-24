import { Router } from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import {
  getUserNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAllNotifications,
  adminDeleteNotification,
  createSystemNotification
} from '../controllers/notification';

const router = Router();

// User notification routes
router.get('/', authenticateToken, getUserNotifications);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.put('/:notificationId/read', authenticateToken, markAsRead);
router.put('/mark-all-read', authenticateToken, markAllAsRead);
router.delete('/:notificationId', authenticateToken, deleteNotification);

// Admin notification routes
router.get('/admin/all', authenticateToken, isAdmin, getAllNotifications);
router.post('/admin/system', authenticateToken, isAdmin, createSystemNotification);
router.delete('/admin/:notificationId', authenticateToken, isAdmin, adminDeleteNotification);

export default router;
