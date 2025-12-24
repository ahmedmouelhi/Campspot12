import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import {
    createActivityBooking,
    getUserActivityBookings,
    cancelActivityBooking,
    deleteActivityBooking,
    getAllActivityBookings,
    approveActivityBooking,
    rejectActivityBooking,
    getActivityBookingStats
} from '../controllers/activityBooking';

const router = express.Router();

// User routes
router.post('/', authenticateToken, createActivityBooking);
router.get('/', authenticateToken, getUserActivityBookings);
router.post('/:id/cancel', authenticateToken, cancelActivityBooking);
router.delete('/:id', authenticateToken, deleteActivityBooking);

// Admin routes
router.get('/admin/all', authenticateToken, isAdmin, getAllActivityBookings);
router.get('/admin/stats', authenticateToken, isAdmin, getActivityBookingStats);
router.post('/admin/:bookingId/approve', authenticateToken, isAdmin, approveActivityBooking);
router.post('/admin/:bookingId/reject', authenticateToken, isAdmin, rejectActivityBooking);

export { router as activityBookingsRouter };
