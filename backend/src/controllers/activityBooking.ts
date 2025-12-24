import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ActivityBooking from '../models/ActivityBooking';
import Activity from '../models/Activity';
import User from '../models/User';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { BadRequestError, NotFoundError } from '../utils/errors';
import Logger from '../utils/logger';
import NotificationService from '../services/notificationService';

// Create activity booking
export const createActivityBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { activityId, date, time, participants, specialRequests } = req.body;

        // Validate activity exists
        const activity = await Activity.findById(activityId);
        if (!activity) {
            throw new NotFoundError('Activity not found');
        }

        // Calculate total price
        const totalPrice = activity.price * participants;

        // Create booking
        const booking = new ActivityBooking({
            user: req.user!._id,
            activity: activityId,
            date,
            time,
            participants,
            totalPrice,
            status: 'pending',
            paymentStatus: 'pending',
            specialRequests
        });

        await booking.save();

        // Populate for response
        const populatedBooking = await ActivityBooking.findById(booking._id)
            .populate('activity', 'name description price image')
            .populate('user', 'name email');

        Logger.info(`New activity booking created: ${booking._id} for user ${req.user!._id}`);

        // Send confirmation notification to user
        try {
            await NotificationService.notifyBookingConfirmed(req.user!._id.toString(), {
                _id: booking._id,
                campingSiteName: (populatedBooking as any).activity.name,
                startDate: booking.date,
                endDate: booking.date,
                campingSiteId: booking.activity
            });
        } catch (notificationError) {
            Logger.error('Failed to send booking confirmation notification:', notificationError);
        }

        res.status(201).json(successResponse(populatedBooking, 'Activity booking created successfully'));
    } catch (error) {
        Logger.error(`Activity booking creation failed: ${error}`);
        throw error;
    }
};

// Get user's activity bookings
export const getUserActivityBookings = async (req: AuthRequest, res: Response) => {
    try {
        const bookings = await ActivityBooking.find({ user: req.user!._id })
            .populate('activity', 'name description price image')
            .sort({ createdAt: -1 });

        res.json(successResponse(bookings, 'User activity bookings retrieved successfully'));
    } catch (error) {
        throw error;
    }
};

// Cancel activity booking
export const cancelActivityBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const booking = await ActivityBooking.findOne({
            _id: id,
            user: req.user!._id
        });

        if (!booking) {
            throw new NotFoundError('Activity booking not found');
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

        const populatedBooking = await ActivityBooking.findById(booking._id)
            .populate('activity', 'name description price');

        // Send cancellation notification
        try {
            await NotificationService.notifyBookingCancelled(req.user!._id.toString(), {
                _id: booking._id,
                campingSiteName: (populatedBooking as any).activity.name,
                campingSiteId: booking.activity
            });
        } catch (notificationError) {
            Logger.error('Failed to send cancellation notification:', notificationError);
        }

        Logger.info(`Activity booking ${id} cancelled by user ${req.user!._id}`);

        res.json(successResponse(populatedBooking, 'Activity booking cancelled successfully'));
    } catch (error) {
        Logger.error(`Activity booking cancellation failed: ${error}`);
        throw error;
    }
};

// Delete activity booking (only cancelled or rejected)
export const deleteActivityBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const booking = await ActivityBooking.findOne({
            _id: id,
            user: req.user!._id
        });

        if (!booking) {
            throw new NotFoundError('Activity booking not found');
        }

        // Only allow deletion of cancelled or rejected bookings
        if (booking.status !== 'cancelled' && booking.status !== 'rejected') {
            throw new BadRequestError('Can only delete cancelled or rejected bookings');
        }

        await ActivityBooking.findByIdAndDelete(id);

        Logger.info(`Activity booking deleted: ${id} by user ${req.user!._id}`);

        res.json(successResponse(null, 'Activity booking deleted successfully'));
    } catch (error) {
        Logger.error(`Activity booking deletion failed: ${error}`);
        throw error;
    }
};


// Get all activity bookings (Admin only)
export const getAllActivityBookings = async (req: AuthRequest, res: Response) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const filter: any = {};
        if (status) {
            filter.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [bookings, total] = await Promise.all([
            ActivityBooking.find(filter)
                .populate('user', 'name email')
                .populate('activity', 'name description price image')
                .populate('approvedBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            ActivityBooking.countDocuments(filter)
        ]);

        res.json(successResponse({
            bookings,
            pagination: {
                current: Number(page),
                pages: Math.ceil(total / Number(limit)),
                total
            }
        }, 'All activity bookings retrieved successfully'));
    } catch (error) {
        throw error;
    }
};

// Approve activity booking (Admin only)
export const approveActivityBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { bookingId } = req.params;
        const { adminNotes } = req.body;

        const booking = await ActivityBooking.findById(bookingId);
        if (!booking) {
            throw new NotFoundError('Activity booking not found');
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
        const populatedBooking = await ActivityBooking.findById(booking._id)
            .populate('user', 'name email')
            .populate('activity', 'name description price')
            .populate('approvedBy', 'name email');

        // Send notification to user
        try {
            await NotificationService.notifyBookingApproved(booking.user.toString(), {
                _id: booking._id,
                campingSiteName: (populatedBooking as any).activity.name,
                startDate: booking.date,
                endDate: booking.date,
                campingSiteId: booking.activity
            });
        } catch (notificationError) {
            Logger.error('Failed to send approval notification:', notificationError);
        }

        Logger.info(`Activity booking ${bookingId} approved by admin ${req.user!._id}`);

        res.json(successResponse(populatedBooking, 'Activity booking approved successfully'));
    } catch (error) {
        throw error;
    }
};

// Reject activity booking (Admin only)
export const rejectActivityBooking = async (req: AuthRequest, res: Response) => {
    try {
        const { bookingId } = req.params;
        const { rejectionReason, adminNotes } = req.body;

        if (!rejectionReason) {
            throw new BadRequestError('Rejection reason is required');
        }

        const booking = await ActivityBooking.findById(bookingId);
        if (!booking) {
            throw new NotFoundError('Activity booking not found');
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

        const populatedBooking = await ActivityBooking.findById(booking._id)
            .populate('user', 'name email')
            .populate('activity', 'name description price');

        // Send rejection notification to user
        try {
            await NotificationService.notifyBookingRejected(booking.user.toString(), {
                _id: booking._id,
                campingSiteName: (populatedBooking as any).activity.name,
                rejectionReason: rejectionReason,
                campingSiteId: booking.activity
            });
        } catch (notificationError) {
            Logger.error('Failed to send rejection notification:', notificationError);
        }

        Logger.info(`Activity booking ${bookingId} rejected by admin ${req.user!._id}`);

        res.json(successResponse(populatedBooking, 'Activity booking rejected'));
    } catch (error) {
        throw error;
    }
};

// Get activity booking stats (Admin only)
export const getActivityBookingStats = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await ActivityBooking.aggregate([
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

        res.json(successResponse(formattedStats, 'Activity booking stats retrieved successfully'));
    } catch (error) {
        throw error;
    }
};
