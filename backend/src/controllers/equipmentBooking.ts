import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import EquipmentBooking from '../models/EquipmentBooking';
import Equipment from '../models/Equipment';
import User from '../models/User';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { BadRequestError, NotFoundError } from '../utils/errors';
import Logger from '../utils/logger';
import NotificationService from '../services/notificationService';

// Create equipment booking
export const createEquipmentBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { equipmentId, startDate, endDate, quantity, specialRequests } = req.body;

        // Validate equipment exists
        const equipment = await Equipment.findById(equipmentId);
        if (!equipment) {
            throw new NotFoundError('Equipment not found');
        }

        // Calculate total price (days * price * quantity)
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = days * equipment.price * quantity;

        // Create booking
        const booking = new EquipmentBooking({
            user: req.user!._id,
            equipment: equipmentId,
            startDate,
            endDate,
            quantity,
            totalPrice,
            status: 'pending',
            paymentStatus: 'pending',
            specialRequests
        });

        await booking.save();

        // Populate for response
        const populatedBooking = await EquipmentBooking.findById(booking._id)
            .populate('equipment', 'name description price image')
            .populate('user', 'name email');

        Logger.info(`New equipment booking created: ${booking._id} for user ${req.user!._id}`);

        // Send confirmation notification to user
        try {
            await NotificationService.notifyBookingConfirmed(req.user!._id.toString(), {
                _id: booking._id,
                campingSiteName: (populatedBooking as any).equipment.name,
                startDate: booking.startDate,
                endDate: booking.endDate,
                campingSiteId: booking.equipment
            });
        } catch (notificationError) {
            Logger.error('Failed to send booking confirmation notification:', notificationError);
        }

        res.status(201).json(successResponse(populatedBooking, 'Equipment booking created successfully'));
    } catch (error) {
        Logger.error(`Equipment booking creation failed: ${error}`);
        throw error;
    }
};

// Get user's equipment bookings
export const getUserEquipmentBookings = async (req: AuthRequest, res: Response) => {
    try {
        const bookings = await EquipmentBooking.find({ user: req.user!._id })
            .populate('equipment', 'name description price image')
            .sort({ createdAt: -1 });

        res.json(successResponse(bookings, 'User equipment bookings retrieved successfully'));
    } catch (error) {
        throw error;
    }
};

// Cancel equipment booking
export const cancelEquipmentBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const booking = await EquipmentBooking.findOne({
            _id: id,
            user: req.user!._id
        });

        if (!booking) {
            throw new NotFoundError('Equipment booking not found');
        }

        if (booking.status === 'cancelled') {
            throw new BadRequestError('Booking is already cancelled');
        }

        if (booking.status === 'completed') {
            throw new BadRequestError('Cannot cancel completed booking');
        }

        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        await booking.save();

        const populatedBooking = await EquipmentBooking.findById(booking._id)
            .populate('equipment', 'name description price');

        // Send cancellation notification
        try {
            await NotificationService.notifyBookingCancelled(req.user!._id.toString(), {
                _id: booking._id,
                campingSiteName: (populatedBooking as any).equipment.name,
                campingSiteId: booking.equipment
            });
        } catch (notificationError) {
            Logger.error('Failed to send cancellation notification:', notificationError);
        }

        Logger.info(`Equipment booking ${id} cancelled by user ${req.user!._id}`);

        res.json(successResponse(populatedBooking, 'Equipment booking cancelled successfully'));
    } catch (error) {
        Logger.error(`Equipment booking cancellation failed: ${error}`);
        throw error;
    }
};

// Delete equipment booking (only cancelled or rejected)
export const deleteEquipmentBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const booking = await EquipmentBooking.findOne({
            _id: id,
            user: req.user!._id
        });

        if (!booking) {
            throw new NotFoundError('Equipment booking not found');
        }

        // Only allow deletion of cancelled or rejected bookings
        if (booking.status !== 'cancelled' && booking.status !== 'rejected') {
            throw new BadRequestError('Can only delete cancelled or rejected bookings');
        }

        await EquipmentBooking.findByIdAndDelete(id);

        Logger.info(`Equipment booking deleted: ${id} by user ${req.user!._id}`);

        res.json(successResponse(null, 'Equipment booking deleted successfully'));
    } catch (error) {
        Logger.error(`Equipment booking deletion failed: ${error}`);
        throw error;
    }
};




// Get all equipment bookings (Admin only)
export const getAllEquipmentBookings = async (req: AuthRequest, res: Response) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const filter: any = {};
        if (status) {
            filter.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [bookings, total] = await Promise.all([
            EquipmentBooking.find(filter)
                .populate('user', 'name email')
                .populate('equipment', 'name description price image')
                .populate('approvedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            EquipmentBooking.countDocuments(filter)
        ]);

        res.json(successResponse({
            bookings,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total
            }
        }, 'All equipment bookings retrieved successfully'));
    } catch (error) {
        throw error;
    }
};

// Approve equipment booking (Admin only)
export const approveEquipmentBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { bookingId } = req.params;
        const { adminNotes } = req.body;

        const booking = await EquipmentBooking.findById(bookingId);
        if (!booking) {
            throw new NotFoundError('Equipment booking not found');
        }

        if (booking.status !== 'pending') {
            throw new BadRequestError('Only pending bookings can be approved');
        }

        booking.status = 'approved';
        booking.approvedBy = req.user!._id;
        booking.approvedAt = new Date();
        if (adminNotes) {
            booking.adminNotes = adminNotes;
        }

        await booking.save();

        // Populate for response
        const populatedBooking = await EquipmentBooking.findById(booking._id)
            .populate('user', 'name email')
            .populate('equipment', 'name description price')
            .populate('approvedBy', 'name email');

        // Send notification to user
        try {
            await NotificationService.notifyBookingApproved(booking.user.toString(), {
                _id: booking._id,
                campingSiteName: (populatedBooking as any).equipment.name,
                startDate: booking.startDate,
                endDate: booking.endDate,
                campingSiteId: booking.equipment
            });
        } catch (notificationError) {
            Logger.error('Failed to send approval notification:', notificationError);
        }

        Logger.info(`Equipment booking ${bookingId} approved by admin ${req.user!._id}`);

        res.json(successResponse(populatedBooking, 'Equipment booking approved successfully'));
    } catch (error) {
        throw error;
    }
};

// Reject equipment booking (Admin only)
export const rejectEquipmentBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { bookingId } = req.params;
        const { rejectionReason, adminNotes } = req.body;

        if (!rejectionReason) {
            throw new BadRequestError('Rejection reason is required');
        }

        const booking = await EquipmentBooking.findById(bookingId);
        if (!booking) {
            throw new NotFoundError('Equipment booking not found');
        }

        if (booking.status !== 'pending') {
            throw new BadRequestError('Only pending bookings can be rejected');
        }

        booking.status = 'rejected';
        booking.rejectionReason = rejectionReason;
        if (adminNotes) {
            booking.adminNotes = adminNotes;
        }

        await booking.save();

        const populatedBooking = await EquipmentBooking.findById(booking._id)
            .populate('user', 'name email')
            .populate('equipment', 'name description price');

        // Send rejection notification to user
        try {
            await NotificationService.notifyBookingRejected(booking.user.toString(), {
                _id: booking._id,
                campingSiteName: (populatedBooking as any).equipment.name,
                rejectionReason: rejectionReason,
                campingSiteId: booking.equipment
            });
        } catch (notificationError) {
            Logger.error('Failed to send rejection notification:', notificationError);
        }

        Logger.info(`Equipment booking ${bookingId} rejected by admin ${req.user!._id}`);

        res.json(successResponse(populatedBooking, 'Equipment booking rejected'));
    } catch (error) {
        throw error;
    }
};

// Get equipment booking stats (Admin only)
export const getEquipmentBookingStats = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await EquipmentBooking.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$totalPrice' }
                }
            }
        ]);

        const formattedStats = stats.reduce((acc: any, stat) => {
            acc[stat._id] = {
                count: stat.count,
                totalRevenue: stat.totalRevenue
            };
            return acc;
        }, {});

        res.json(successResponse(formattedStats, 'Equipment booking stats retrieved successfully'));
    } catch (error) {
        throw error;
    }
};
