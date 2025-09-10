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
    const { campingSiteId, startDate, endDate, guests, checkInDate, checkOutDate, numberOfGuests } = req.body;
    
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

    const booking = new Booking({
      user: req.user!._id,
      campingSite: campingSiteId,
      startDate: actualStartDate,
      endDate: actualEndDate,
      guests: actualGuests,
      totalPrice,
      status: 'pending',
      paymentStatus: 'pending',
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
      // Notify the user about booking confirmation
      await NotificationService.notifyBookingConfirmed(req.user!._id.toString(), {
        _id: booking._id,
        campingSiteName: (populatedBooking as any).campingSite.name,
        startDate: booking.startDate,
        endDate: booking.endDate,
        campingSiteId: booking.campingSite
      });
      
      // Notify admins about new booking
      await NotificationService.notifyAdminsNewBooking({
        _id: booking._id,
        campingSiteName: (populatedBooking as any).campingSite.name,
        userName: (populatedBooking as any).user.name,
        userId: req.user!._id.toString(),
        campingSiteId: booking.campingSite
      });
    } catch (notificationError) {
      Logger.error('Failed to send booking notifications:', notificationError);
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
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user!._id,
    }).session(session);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Only allow cancellation of pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new BadRequestError('Cannot cancel this booking');
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save({ session });
    
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
