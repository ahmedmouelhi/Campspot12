import express from 'express';
import { authenticateToken, isAdmin } from '../middleware/auth';
import {
    createEquipmentBooking,
    getUserEquipmentBookings,
    cancelEquipmentBooking,
    deleteEquipmentBooking,
    getAllEquipmentBookings,
    approveEquipmentBooking,
    rejectEquipmentBooking,
    getEquipmentBookingStats
} from '../controllers/equipmentBooking';

const router = express.Router();

// User routes
router.post('/', authenticateToken, createEquipmentBooking);
router.get('/', authenticateToken, getUserEquipmentBookings);
router.post('/:id/cancel', authenticateToken, cancelEquipmentBooking);
router.delete('/:id', authenticateToken, deleteEquipmentBooking);

// Admin routes
router.get('/admin/all', authenticateToken, isAdmin, getAllEquipmentBookings);
router.get('/admin/stats', authenticateToken, isAdmin, getEquipmentBookingStats);
router.post('/admin/:bookingId/approve', authenticateToken, isAdmin, approveEquipmentBooking);
router.post('/admin/:bookingId/reject', authenticateToken, isAdmin, rejectEquipmentBooking);

export { router as equipmentBookingsRouter };
