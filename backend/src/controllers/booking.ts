import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import Booking from '../models/Booking';
import CampingSite from '../models/CampingSite';
import User from '../models/User';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors';
import Logger from '../utils/logger';
import NotificationService from '../services/notificationService';

export const createBooking = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      campingSiteId,
      startDate,
      endDate,
      guests,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      equipment,
      activities,
      specialRequests
    } = req.body;

    // Support both parameter formats for flexibility
    const actualStartDate = startDate || checkInDate;
    const actualEndDate = endDate || checkOutDate;
    const actualGuests = guests || numberOfGuests;

    // Validate required fields
    if (!campingSiteId || !actualStartDate || !actualEndDate || !actualGuests) {
      throw new BadRequestError('Missing required booking information');
    }

    // Check if camping site exists
    const campingSite = await CampingSite.findById(campingSiteId).session(session);
    if (!campingSite) {
      throw new NotFoundError('Camping site not found');
    }

    // Check capacity
    if (actualGuests > campingSite.capacity) {
      throw new BadRequestError(`Site capacity is ${campingSite.capacity} guests`);
    }

    // Check if the site is available for the selected dates
    const existingBooking = await Booking.findOne({
      campingSite: campingSiteId,
      status: { $ne: 'cancelled' },
      $or: [
        {
          startDate: { $lte: new Date(actualEndDate) },
          endDate: { $gte: new Date(actualStartDate) },
        },
      ],
    }).session(session);

    if (existingBooking) {
      throw new ConflictError('Site is not available for these dates');
    }

    // Calculate total price
    const start = new Date(actualStartDate);
    const end = new Date(actualEndDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = days * campingSite.price;

    // Verify user exists
    const userExists = await User.findById(req.user!._id);
    if (!userExists) {
      return res.status(404).json(errorResponse('User not found'));
    }

    const booking = new Booking({
      user: req.user!._id,
      campingSite: campingSiteId,
      startDate: actualStartDate,
      endDate: actualEndDate,
      guests: actualGuests,
      totalPrice,
      status: 'pending',
      paymentStatus: 'pending',
      bookingDetails: {
        equipment: equipment || [],
        activities: activities || [],
        specialRequests: specialRequests || ''
      }
    });

    await booking.save({ session });

    // Update campsite availability if needed
    if (campingSite.availability === 'available') {
      const upcomingBookings = await Booking.countDocuments({
        campingSite: campingSiteId,
        status: { $ne: 'cancelled' },
        startDate: { $gte: new Date() }
      }).session(session);

      if (upcomingBookings >= 10) { // Threshold for limited availability
        campingSite.availability = 'limited';
        await campingSite.save({ session });
      }
    }

    await session.commitTransaction();

    // Populate the booking for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('campingSite', 'name location image')
      .populate('user', 'name email');

    Logger.info(`New booking created: ${booking._id} for user ${req.user!._id}`);

    // Trigger notifications for new booking
    try {
      Logger.info(`🔔 Attempting to create booking confirmation notification for user ${req.user!._id}`);
      // Notify the user about booking confirmation
      await NotificationService.notifyBookingConfirmed(req.user!._id.toString(), {
        _id: booking._id,
        campingSiteName: (populatedBooking as any).campingSite.name,
        startDate: booking.startDate,
        endDate: booking.endDate,
        campingSiteId: booking.campingSite
      });
      Logger.info(`✅ Booking confirmation notification created successfully`);

      // Notify admins about new booking
      await NotificationService.notifyAdminsNewBooking({
        _id: booking._id,
        campingSiteName: (populatedBooking as any).campingSite.name,
        userName: (populatedBooking as any).user.name,
        userId: req.user!._id.toString(),
        campingSiteId: booking.campingSite
      });
    } catch (notificationError) {
      Logger.error('❌ Failed to send booking notifications:', notificationError);
      // Don't fail the booking if notification fails
    }

    res.status(201).json(successResponse(populatedBooking, 'Booking created successfully'));
  } catch (error) {
    await session.abortTransaction();
    Logger.error(`Booking creation failed: ${error}`);
    throw error; // Let error handler middleware handle it
  } finally {
    session.endSession();
  }
};

export const getUserBookings = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ user: req.user!._id })
      .populate('campingSite', 'name location image price')
      .sort({ startDate: -1 });

    res.json(successResponse(bookings, 'Bookings retrieved successfully'));
  } catch (error) {
    throw error;
  }
};

export const getBookingById = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user!._id,
    }).populate('campingSite', 'name location image price');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    res.json(successResponse(booking, 'Booking retrieved successfully'));
  } catch (error) {
    throw error;
  }
};

export const cancelBooking = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find booking by ID first
    Logger.info(`🔍 Attempting to find booking with ID: ${req.params.id}`);
    Logger.info(`🔍 User ID making request: ${req.user!._id}`);

    const booking = await Booking.findById(req.params.id).session(session);

    Logger.info(`🔍 Booking found: ${booking ? 'YES' : 'NO'}`);
    if (booking) {
      Logger.info(`🔍 Booking user: ${booking.user}`);
      Logger.info(`🔍 Booking status: ${booking.status}`);
    }

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Verify ownership
    if (booking.user.toString() !== req.user!._id.toString()) {
      throw new BadRequestError('You can only cancel your own bookings');
    }

    // Only allow cancellation of pending, confirmed, or approved bookings
    if (!['pending', 'confirmed', 'approved'].includes(booking.status)) {
      throw new BadRequestError('Cannot cancel this booking');
    }

    // Update booking status
    Logger.info(`📝 Updating booking ${booking._id} status from '${booking.status}' to 'cancelled'`);
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user!._id;
    await booking.save({ session });
    Logger.info(`✅ Booking ${booking._id} status updated to '${booking.status}'`);

    // Update campsite availability
    const campingSite = await CampingSite.findById(booking.campingSite).session(session);
    if (campingSite && campingSite.availability === 'limited') {
      const upcomingBookings = await Booking.countDocuments({
        campingSite: booking.campingSite,
        status: { $ne: 'cancelled' },
        startDate: { $gte: new Date() }
      }).session(session);

      if (upcomingBookings < 10) {
        campingSite.availability = 'available';
        await campingSite.save({ session });
      }
    }

    await session.commitTransaction();

    Logger.info(`Booking cancelled: ${booking._id} by user ${req.user!._id}`);

    // Emit real-time WebSocket event
    const SocketService = require('../services/socketService').default;
    const socketService = SocketService.getInstance();
    socketService.emitBookingCancelled(req.user!._id.toString(), String(booking._id));

    // Trigger notification for booking cancellation
    try {
      const populatedBooking = await Booking.findById(booking._id)
        .populate('campingSite', 'name location');

      await NotificationService.notifyBookingCancelled(req.user!._id.toString(), {
        _id: booking._id,
        campingSiteName: (populatedBooking as any).campingSite.name,
        campingSiteId: booking.campingSite
      });
    } catch (notificationError) {
      Logger.error('Failed to send booking cancellation notification:', notificationError);
      // Don't fail the cancellation if notification fails
    }

    res.json(successResponse(booking, 'Booking cancelled successfully'));
  } catch (error) {
    await session.abortTransaction();
    Logger.error(`Booking cancellation failed: ${error}`);
    throw error;
  } finally {
    session.endSession();
  }
};

// Delete booking - only for cancelled or rejected bookings
export const deleteBooking = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    Logger.info(`🗑️ Delete request for booking ${req.params.id} with status: ${booking.status}`);

    // Only allow deletion of cancelled or rejected bookings
    if (booking.status !== 'cancelled' && booking.status !== 'rejected') {
      Logger.error(`❌ Cannot delete booking ${req.params.id} - status is '${booking.status}', must be 'cancelled' or 'rejected'`);
      throw new BadRequestError('Can only delete cancelled or rejected bookings');
    }

    await Booking.findByIdAndDelete(req.params.id);

    Logger.info(`Booking deleted: ${req.params.id} by user ${req.user!._id}`);

    res.json(successResponse(null, 'Booking deleted successfully'));
  } catch (error) {
    Logger.error(`Booking deletion failed: ${error}`);
    throw error;
  }
};


export const completePayment = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user!._id,
    });

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Update booking to completed and paid
    booking.status = 'completed';
    booking.paymentStatus = 'paid';
    await booking.save();

    Logger.info(`Payment completed for booking ${booking._id} by user ${req.user!._id}`);

    res.json(successResponse(booking, 'Payment completed successfully'));
  } catch (error) {
    Logger.error(`Payment completion failed: ${error}`);
    throw error;
  }
};

export const updateBooking = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { startDate, endDate, guests, checkInDate, checkOutDate, numberOfGuests } = req.body;

    // Support both parameter formats for flexibility
    const actualStartDate = startDate || checkInDate;
    const actualEndDate = endDate || checkOutDate;
    const actualGuests = guests || numberOfGuests;

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user!._id,
    }).session(session);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Only allow updating pending bookings
    if (booking.status !== 'pending') {
      throw new BadRequestError('Can only update pending bookings');
    }

    // Check if camping site exists and validate capacity if guests changed
    if (actualGuests && actualGuests !== booking.guests) {
      const campingSite = await CampingSite.findById(booking.campingSite).session(session);
      if (!campingSite) {
        throw new NotFoundError('Camping site not found');
      }

      if (actualGuests > campingSite.capacity) {
        throw new BadRequestError(`Site capacity is ${campingSite.capacity} guests`);
      }
    }

    // Check availability for new dates if dates changed
    if (actualStartDate || actualEndDate) {
      const newStartDate = actualStartDate ? new Date(actualStartDate) : booking.startDate;
      const newEndDate = actualEndDate ? new Date(actualEndDate) : booking.endDate;

      const conflictingBooking = await Booking.findOne({
        _id: { $ne: booking._id }, // Exclude current booking
        campingSite: booking.campingSite,
        status: { $ne: 'cancelled' },
        $or: [
          {
            startDate: { $lte: newEndDate },
            endDate: { $gte: newStartDate },
          },
        ],
      }).session(session);

      if (conflictingBooking) {
        throw new ConflictError('Site is not available for these dates');
      }

      // Recalculate price if dates changed
      if (actualStartDate || actualEndDate) {
        const campingSite = await CampingSite.findById(booking.campingSite).session(session);
        const days = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24));
        booking.totalPrice = days * campingSite!.price;
      }

      booking.startDate = newStartDate;
      booking.endDate = newEndDate;
    }

    // Update guests if provided
    if (actualGuests) {
      booking.guests = actualGuests;
    }

    // Update booking status
    booking.status = 'cancelled';
    booking.cancelledAt = new Date(); // Add cancellation timestamp
    await booking.save({ session });
    await session.commitTransaction();

    // Populate the booking for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('campingSite', 'name location image')
      .populate('user', 'name email');

    Logger.info(`Booking updated: ${booking._id} by user ${req.user!._id}`);

    res.json(successResponse(populatedBooking, 'Booking updated successfully'));
  } catch (error) {
    await session.abortTransaction();
    Logger.error(`Booking update failed: ${error}`);
    throw error;
  } finally {
    session.endSession();
  }
};

export const checkAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { campingSiteId, startDate, endDate, checkInDate, checkOutDate } = req.body;

    // Support both parameter formats for flexibility
    const actualStartDate = startDate || checkInDate;
    const actualEndDate = endDate || checkOutDate;

    if (!campingSiteId || !actualStartDate || !actualEndDate) {
      throw new BadRequestError('Missing required parameters');
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(campingSiteId)) {
      throw new BadRequestError('Invalid camping site ID format');
    }

    const [existingBooking, campingSite] = await Promise.all([
      Booking.findOne({
        campingSite: campingSiteId,
        status: { $ne: 'cancelled' },
        $or: [
          {
            startDate: { $lte: new Date(actualEndDate as string) },
            endDate: { $gte: new Date(actualStartDate as string) },
          },
        ],
      }),
      CampingSite.findById(campingSiteId)
    ]);

    if (!campingSite) {
      throw new NotFoundError('Camping site not found');
    }

    const isAvailable = !existingBooking && campingSite.availability !== 'unavailable';

    res.json(successResponse({
      available: isAvailable,
      siteAvailability: campingSite.availability,
      conflictingBooking: !!existingBooking
    }, 'Availability checked successfully'));
  } catch (error) {
    throw error;
  }
};

// Admin-only functions
export const approveBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { adminNotes } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('campingSite', 'name location');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestError('Can only approve pending bookings');
    }

    booking.status = 'approved';
    booking.approvedBy = req.user!._id;
    booking.approvedAt = new Date();
    booking.adminNotes = adminNotes || '';

    await booking.save();

    // Notify user about approval
    try {
      await NotificationService.notifyBookingApproved(booking.user.toString(), {
        _id: booking._id,
        campingSiteName: (booking as any).campingSite.name,
        startDate: booking.startDate,
        endDate: booking.endDate,
        campingSiteId: booking.campingSite
      });
    } catch (notificationError) {
      Logger.error('Failed to send booking approval notification:', notificationError);
    }

    // Emit real-time WebSocket event
    const SocketService = require('../services/socketService').default;
    const socketService = SocketService.getInstance();
    socketService.emitBookingApproved(booking.user.toString(), booking);

    Logger.info(`Booking approved: ${booking._id} by admin ${req.user!._id}`);

    res.json(successResponse(booking, 'Booking approved successfully'));
  } catch (error) {
    throw error;
  }
};

export const rejectBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!rejectionReason) {
      throw new BadRequestError('Rejection reason is required');
    }

    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email')
      .populate('campingSite', 'name location');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.status !== 'pending') {
      throw new BadRequestError('Can only reject pending bookings');
    }

    booking.status = 'rejected';
    booking.rejectionReason = rejectionReason;
    booking.adminNotes = adminNotes || '';
    booking.approvedBy = req.user!._id;
    booking.approvedAt = new Date();

    await booking.save();

    // Update campsite availability when booking is rejected
    const campingSite = await CampingSite.findById(booking.campingSite);
    if (campingSite && campingSite.availability === 'limited') {
      const upcomingBookings = await Booking.countDocuments({
        campingSite: booking.campingSite,
        status: { $nin: ['cancelled', 'rejected'] },
        startDate: { $gte: new Date() }
      });

      if (upcomingBookings < 10) {
        campingSite.availability = 'available';
        await campingSite.save();
        Logger.info(`✅ Campsite ${campingSite._id} availability updated to 'available' after rejection`);
      }
    }

    // Notify user about rejection
    try {
      await NotificationService.notifyBookingRejected(booking.user.toString(), {
        _id: booking._id,
        campingSiteName: (booking as any).campingSite.name,
        rejectionReason: rejectionReason,
        campingSiteId: booking.campingSite
      });
    } catch (notificationError) {
      Logger.error('Failed to send booking rejection notification:', notificationError);
    }

    // Emit real-time WebSocket event
    const SocketService = require('../services/socketService').default;
    const socketService = SocketService.getInstance();
    socketService.emitBookingRejected(booking.user.toString(), booking);

    Logger.info(`Booking rejected: ${booking._id} by admin ${req.user!._id}`);

    res.json(successResponse(booking, 'Booking rejected successfully'));
  } catch (error) {
    throw error;
  }
};

export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    Logger.info(`📋 Admin fetching bookings - Status: ${status || 'all'}, Page: ${page}, Limit: ${limit}`);

    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email instagramUrl')
        .populate('campingSite', 'name location image price')
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter)
    ]);

    // Log bookings with null references
    const nullUserBookings = bookings.filter(b => !b.user);
    const nullCampsiteBookings = bookings.filter(b => !b.campingSite);

    if (nullUserBookings.length > 0) {
      Logger.warn(`⚠️ ${nullUserBookings.length} bookings have null user references`);
      Logger.warn('Booking IDs with null users:', nullUserBookings.map(b => b._id));
    }

    if (nullCampsiteBookings.length > 0) {
      Logger.warn(`⚠️ ${nullCampsiteBookings.length} bookings have null campingSite references`);
      Logger.warn('Booking IDs with null campsites:', nullCampsiteBookings.map(b => b._id));
    }

    Logger.info(`✅ Found ${bookings.length} bookings out of ${total} total`);

    res.json(successResponse({
      bookings,
      pagination: {
        current: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total
      }
    }, 'All bookings retrieved successfully'));
  } catch (error) {
    Logger.error('❌ Error fetching bookings:', error);
    throw error;
  }
};

export const getBookingsByStatus = async (req: AuthRequest, res: Response) => {
  try {
    const bookingStats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    const stats = {
      pending: { count: 0, totalRevenue: 0 },
      approved: { count: 0, totalRevenue: 0 },
      rejected: { count: 0, totalRevenue: 0 },
      cancelled: { count: 0, totalRevenue: 0 },
      completed: { count: 0, totalRevenue: 0 }
    };

    bookingStats.forEach(stat => {
      if (stats[stat._id as keyof typeof stats]) {
        stats[stat._id as keyof typeof stats] = {
          count: stat.count,
          totalRevenue: stat.totalRevenue
        };
      }
    });

    res.json(successResponse(stats, 'Booking statistics retrieved successfully'));
  } catch (error) {
    throw error;
  }
};

export const generateReceipt = async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user!._id,
    })
      .populate('campingSite', 'name location image price')
      .populate('user', 'name email');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Calculate duration
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate refund amount if cancelled
    let refundAmount = 0;
    let refundPercentage = 0;

    if (booking.status === 'cancelled' && booking.cancelledAt) {
      const cancelDate = new Date(booking.cancelledAt);
      const hoursUntilCheckIn = (start.getTime() - cancelDate.getTime()) / (1000 * 60 * 60);

      if (hoursUntilCheckIn > 48) {
        refundPercentage = 100;
        refundAmount = booking.totalPrice;
      } else if (hoursUntilCheckIn > 24) {
        refundPercentage = 50;
        refundAmount = booking.totalPrice * 0.5;
      }
    }

    // Generate receipt data
    const receipt = {
      bookingId: String(booking._id),
      bookingReference: String(booking._id).slice(-8).toUpperCase(),
      status: booking.status,
      createdAt: booking.createdAt,
      cancelledAt: booking.cancelledAt || null,

      // User details
      user: {
        name: (booking as any).user.name,
        email: (booking as any).user.email,
      },

      // Campsite details
      campsite: {
        name: (booking as any).campingSite.name,
        location: (booking as any).campingSite.location,
        image: (booking as any).campingSite.image,
      },

      // Booking details
      checkIn: booking.startDate,
      checkOut: booking.endDate,
      guests: booking.guests,
      duration: days,

      // Pricing
      pricePerNight: (booking as any).campingSite.price,
      subtotal: booking.totalPrice,
      totalPrice: booking.totalPrice,

      // Payment status
      paymentStatus: booking.paymentStatus,

      // Cancellation details (if applicable)
      cancellation: booking.status === 'cancelled' ? {
        cancelledAt: booking.cancelledAt,
        refundPercentage,
        refundAmount,
      } : null,

      // Additional details
      bookingDetails: booking.bookingDetails,
      adminNotes: booking.adminNotes,
    };

    Logger.info(`Receipt generated for booking ${booking._id} by user ${req.user!._id}`);

    res.json(successResponse(receipt, 'Receipt generated successfully'));
  } catch (error) {
    Logger.error(`Receipt generation failed: ${error}`);
    throw error;
  }
};
