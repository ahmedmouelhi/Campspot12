import express from 'express';
import {
  getDashboardStats,
  getRecentActivities,
  getRevenueAnalytics,
  getUserAnalytics,
  getSystemHealth,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} from '../controllers/admin';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateUserRegistration, validateProfileUpdate } from '../middleware/validation';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// Dashboard statistics
router.get('/dashboard/stats', getDashboardStats);

// Recent activities/logs
router.get('/dashboard/activities', getRecentActivities);

// Revenue analytics
router.get('/analytics/revenue', getRevenueAnalytics);

// User analytics
router.get('/analytics/users', getUserAnalytics);

// System health
router.get('/system/health', getSystemHealth);

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
// Create user with admin validation (allows setting default password)
router.post('/users', [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim()
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .toLowerCase(),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Phone number must be at least 1 character'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        message: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
], createUser);
router.put('/users/:id', validateProfileUpdate, updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);

export default router;
