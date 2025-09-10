import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  checkAvailability,
  approveBooking,
  rejectBooking,
  getAllBookings,
  getBookingsByStatus
} from '../controllers/booking';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       required:
 *         - userId
 *         - campingSiteId
 *         - checkInDate
 *         - checkOutDate
 *         - numberOfGuests
 *       properties:
 *         id:
 *           type: string
 *           description: Booking unique identifier
 *         userId:
 *           type: string
 *           description: ID of the user making the booking
 *         campingSiteId:
 *           type: string
 *           description: ID of the camping site being booked
 *         checkInDate:
 *           type: string
 *           format: date
 *           description: Check-in date
 *         checkOutDate:
 *           type: string
 *           format: date
 *           description: Check-out date
 *         numberOfGuests:
 *           type: integer
 *           minimum: 1
 *           description: Number of guests for the booking
 *         status:
 *           type: string
 *           enum: [pending, confirmed, cancelled]
 *           description: Current status of the booking
 *         totalPrice:
 *           type: number
 *           description: Total price for the booking
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the booking was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the booking was last updated
 * 
 *     BookingCreate:
 *       type: object
 *       required:
 *         - campingSiteId
 *         - checkInDate
 *         - checkOutDate
 *         - numberOfGuests
 *       properties:
 *         campingSiteId:
 *           type: string
 *         checkInDate:
 *           type: string
 *           format: date
 *         checkOutDate:
 *           type: string
 *           format: date
 *         numberOfGuests:
 *           type: integer
 *           minimum: 1
 *
 *     AvailabilityCheck:
 *       type: object
 *       required:
 *         - campingSiteId
 *         - checkInDate
 *         - checkOutDate
 *       properties:
 *         campingSiteId:
 *           type: string
 *         checkInDate:
 *           type: string
 *           format: date
 *         checkOutDate:
 *           type: string
 *           format: date
 *
 *     AvailabilityResponse:
 *       type: object
 *       properties:
 *         available:
 *           type: boolean
 *         availableDates:
 *           type: array
 *           items:
 *             type: string
 *             format: date
 */

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management endpoints
 */

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Get all bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, getUserBookings);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get a specific booking by ID
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 */
router.get('/:id', authenticateToken, getBookingById);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingCreate'
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid request body
 */
router.post('/', authenticateToken, createBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingCreate'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 */
router.put('/:id', authenticateToken, updateBooking);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 */
router.post('/:id/cancel', authenticateToken, cancelBooking);

/**
 * @swagger
 * /api/bookings/check-availability:
 *   post:
 *     summary: Check camping site availability for given dates
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AvailabilityCheck'
 *     responses:
 *       200:
 *         description: Availability check result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvailabilityResponse'
 *       400:
 *         description: Invalid request body
 */
router.post('/check-availability', checkAvailability);

// Admin-only routes
/**
 * @swagger
 * /api/bookings/admin/all:
 *   get:
 *     summary: Get all bookings (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled, completed]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: List of all bookings with pagination
 *       403:
 *         description: Access denied - Admin only
 */
router.get('/admin/all', authenticateToken, isAdmin, getAllBookings);

/**
 * @swagger
 * /api/bookings/admin/stats:
 *   get:
 *     summary: Get booking statistics (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Booking statistics by status
 *       403:
 *         description: Access denied - Admin only
 */
router.get('/admin/stats', authenticateToken, isAdmin, getBookingsByStatus);

/**
 * @swagger
 * /api/bookings/admin/{bookingId}/approve:
 *   post:
 *     summary: Approve a pending booking (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking approved successfully
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Booking not found
 */
router.post('/admin/:bookingId/approve', authenticateToken, isAdmin, approveBooking);

/**
 * @swagger
 * /api/bookings/admin/{bookingId}/reject:
 *   post:
 *     summary: Reject a pending booking (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking rejected successfully
 *       403:
 *         description: Access denied - Admin only
 *       404:
 *         description: Booking not found
 */
router.post('/admin/:bookingId/reject', authenticateToken, isAdmin, rejectBooking);

export { router as bookingsRouter };
