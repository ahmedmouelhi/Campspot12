import express from 'express';
import {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  addActivityReview,
  getActivityCategories,
  getActivityStats
} from '../controllers/activities';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { body } from 'express-validator';

const router = express.Router();

// Validation rules
const activityValidation = [
  body('name').notEmpty().withMessage('Activity name is required'),
  body('icon').notEmpty().withMessage('Activity icon is required'),
  body('description').notEmpty().withMessage('Activity description is required'),
  body('duration').notEmpty().withMessage('Duration is required'),
  body('difficulty').isIn(['Easy', 'Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid difficulty level'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('Max participants must be at least 1'),
  body('equipment').optional().isArray().withMessage('Equipment must be an array')
];

const reviewValidation = [
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().withMessage('Comment is required')
];

/**
 * @swagger
 * components:
 *   schemas:
 *     Activity:
 *       type: object
 *       required:
 *         - name
 *         - icon
 *         - description
 *         - duration
 *         - difficulty
 *         - price
 *         - category
 *         - maxParticipants
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the activity
 *         name:
 *           type: string
 *           description: Activity name
 *         icon:
 *           type: string
 *           description: Activity icon (emoji or icon class)
 *         description:
 *           type: string
 *           description: Activity description
 *         duration:
 *           type: string
 *           description: Activity duration
 *         difficulty:
 *           type: string
 *           enum: [Easy, Beginner, Intermediate, Advanced]
 *           description: Difficulty level
 *         price:
 *           type: number
 *           description: Activity price
 *         category:
 *           type: string
 *           description: Activity category
 *         maxParticipants:
 *           type: integer
 *           description: Maximum number of participants
 *         equipment:
 *           type: array
 *           items:
 *             type: string
 *           description: Required equipment list
 *         rating:
 *           type: number
 *           description: Average rating
 *         status:
 *           type: string
 *           enum: [active, inactive, full]
 *           description: Activity status
 */

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Get all activities
 *     tags: [Activities]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: string
 *         description: Filter by difficulty
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of activities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Activity'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get('/', getActivities);

/**
 * @swagger
 * /api/activities/categories:
 *   get:
 *     summary: Get all activity categories
 *     tags: [Activities]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', getActivityCategories);

/**
 * @swagger
 * /api/activities/stats:
 *   get:
 *     summary: Get activity statistics
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Activity statistics
 */
router.get('/stats', authenticateToken, requireAdmin, getActivityStats);

/**
 * @swagger
 * /api/activities/{id}:
 *   get:
 *     summary: Get activity by ID
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Activity'
 *       404:
 *         description: Activity not found
 */
router.get('/:id', getActivityById);

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Create new activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Activity'
 *     responses:
 *       201:
 *         description: Activity created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', authenticateToken, requireAdmin, activityValidation, createActivity);

/**
 * @swagger
 * /api/activities/{id}:
 *   put:
 *     summary: Update activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Activity'
 *     responses:
 *       200:
 *         description: Activity updated successfully
 *       404:
 *         description: Activity not found
 */
router.put('/:id', authenticateToken, requireAdmin, activityValidation, updateActivity);

/**
 * @swagger
 * /api/activities/{id}:
 *   delete:
 *     summary: Delete activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     responses:
 *       200:
 *         description: Activity deleted successfully
 *       404:
 *         description: Activity not found
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteActivity);

/**
 * @swagger
 * /api/activities/{id}/reviews:
 *   post:
 *     summary: Add review to activity
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Activity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review added successfully
 *       400:
 *         description: Validation error or already reviewed
 *       404:
 *         description: Activity not found
 */
router.post('/:id/reviews', authenticateToken, reviewValidation, addActivityReview);

export default router;
