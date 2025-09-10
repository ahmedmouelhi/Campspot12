import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAllNotifications,
  adminDeleteNotification,
  createSystemNotification,
  getUnreadCount
} from '../controllers/notifications';

const router = Router();

// User notification routes
router.get('/', authenticateToken, getNotifications);
router.post('/', authenticateToken, createNotification);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.put('/:id/read', authenticateToken, markAsRead);
router.put('/mark-all-read', authenticateToken, markAllAsRead);
router.delete('/:id', authenticateToken, deleteNotification);

// Admin notification routes
router.get('/admin/all', authenticateToken, getAllNotifications);
router.post('/admin/system', authenticateToken, createSystemNotification);
router.delete('/admin/:id', authenticateToken, adminDeleteNotification);

export default router;
