import { Router } from 'express';
import { validateSearchParams } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import {
  getAllCampingSites,
  searchCampingSites,
  getCampingSiteById,
  getCampingSiteAvailability,
  createCampingSite,
  updateCampingSite,
  deleteCampingSite,
} from '../controllers/campingSitesController';

/**
 * @swagger
 * tags:
 *   name: Camping Sites
 *   description: Camping site management and search
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CampingSite:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - type
 *         - location
 *         - price
 *         - maxGuests
 *         - availability
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         name:
 *           type: string
 *           description: Name of the camping site
 *         description:
 *           type: string
 *           description: Detailed description of the site
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           default: active
 *         type:
 *           type: string
 *           enum: [tent, rv, cabin, glamping]
 *         location:
 *           type: object
 *           properties:
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *             address:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *         price:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             currency:
 *               type: string
 *               default: USD
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         maxGuests:
 *           type: number
 *         rating:
 *           type: number
 *         reviews:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *         availability:
 *           type: object
 *           properties:
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 */

/**
 * @swagger
 * /api/camping-sites/search:
 *   get:
 *     summary: Search camping sites with filters
 *     tags: [Camping Sites]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for name or description
 *       - in: query
 *         name: priceRange.min
 *         schema:
 *           type: number
 *       - in: query
 *         name: priceRange.max
 *         schema:
 *           type: number
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: dates.checkIn
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dates.checkOut
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: amenities
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [tent, rv, cabin, glamping]
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: List of camping sites matching the criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sites:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CampingSite'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */

/**
 * @swagger
 * /api/camping-sites/{id}:
 *   get:
 *     summary: Get camping site by ID
 *     tags: [Camping Sites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Camping site ID
 *     responses:
 *       200:
 *         description: Camping site details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CampingSite'
 *       404:
 *         description: Camping site not found
 */

/**
 * @swagger
 * /api/camping-sites/{id}/availability:
 *   get:
 *     summary: Check camping site availability
 *     tags: [Camping Sites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Availability status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 bookedDates:
 *                   type: array
 *                   items:
 *                     type: string
 *                     format: date
 *       404:
 *         description: Camping site not found
 */

const router = Router();

/**
 * @route   GET /api/camping-sites
 * @desc    Get all camping sites
 * @access  Public
 */
router.get('/', getAllCampingSites);

router.get('/search', validateSearchParams, searchCampingSites);

/**
 * @route   GET /api/camping-sites/:id
 * @desc    Get camping site by ID
 * @access  Public
 */
router.get('/:id', getCampingSiteById);

/**
 * @route   GET /api/camping-sites/:id/availability
 * @desc    Check availability for a camping site
 * @access  Public
 */
router.get('/:id/availability', getCampingSiteAvailability);

// Admin routes for camping site management
/**
 * @route   POST /api/camping-sites
 * @desc    Create a new camping site
 * @access  Admin only
 */
router.post('/', authenticateToken, requireAdmin, createCampingSite);

/**
 * @route   PUT /api/camping-sites/:id
 * @desc    Update a camping site
 * @access  Admin only
 */
router.put('/:id', authenticateToken, requireAdmin, updateCampingSite);

/**
 * @route   DELETE /api/camping-sites/:id
 * @desc    Delete a camping site
 * @access  Admin only
 */
router.delete('/:id', authenticateToken, requireAdmin, deleteCampingSite);

export default router;
