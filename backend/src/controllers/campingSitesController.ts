import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import mongoose from 'mongoose';
import CampingSite, { ICampingSite } from '../models/CampingSite';
import Booking from '../models/Booking';
import { BadRequestError, NotFoundError, CustomError } from '../utils/errors';
import NotificationService from '../services/notificationService';

interface SearchQuery extends ParsedQs {
  q?: string;
  priceRange?: {
    min?: string;
    max?: string;
  };
  location?: string;
  dates?: {
    checkIn: string;
    checkOut: string;
  };
  guests?: string;
  amenities?: string[];
  type?: string[];
  rating?: string;
  page?: string;
  pageSize?: string;
}

interface SearchRequest extends Request {
  query: SearchQuery;
}

/**
 * Get all camping sites (base endpoint)
 */
export const getAllCampingSites = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sort = 'rating',
      order = 'desc'
    } = req.query;

    // Build sort object
    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = Math.max(1, Number(page));
    const pageSizeNum = Math.max(1, Math.min(50, Number(pageSize)));
    const skip = (pageNum - 1) * pageSizeNum;

    // Get active camping sites with pagination
    const [sites, total] = await Promise.all([
      CampingSite.find({ status: 'active' })
        .sort(sortObj)
        .skip(skip)
        .limit(pageSizeNum),
      CampingSite.countDocuments({ status: 'active' }),
    ]);

    res.json({
      success: true,
      data: sites,
      pagination: {
        total,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(total / pageSizeNum),
      }
    });
  } catch (error) {
    console.error('Error getting camping sites:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get camping sites',
      message: 'Error getting camping sites' 
    });
  }
};

/**
 * Search camping sites with filters
 */
export const searchCampingSites = async (req: SearchRequest, res: Response) => {
  try {
    const {
      q = '',
      location,
      guests,
      amenities,
      type,
      rating,
      page = 1,
      pageSize = 10,
    } = req.query;

    // Handle nested query parameters properly
    const priceMin = req.query['priceRange.min'] as string;
    const priceMax = req.query['priceRange.max'] as string;
    const checkInDate = req.query['dates.checkIn'] as string;
    const checkOutDate = req.query['dates.checkOut'] as string;

    // Build query
    const query: any = { status: 'active' };

    // Text search
    if (q) {
      query.$text = { $search: q };
    }

    // Price range filter
    if (priceMin || priceMax) {
      query.price = {
        ...(priceMin ? { $gte: Number(priceMin) } : {}),
        ...(priceMax ? { $lte: Number(priceMax) } : { $lte: Number.MAX_SAFE_INTEGER }),
      };
    }

    // Location filter
    if (location) {
      query.$or = [
        { location: { $regex: location, $options: 'i' } },
        { 'address.city': { $regex: location, $options: 'i' } },
        { 'address.state': { $regex: location, $options: 'i' } },
      ];
    }

    // Guest capacity filter
    if (guests) {
      query.capacity = { $gte: Number(guests) };
    }

    // Features filter (equivalent to amenities)
    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      query.features = { $all: amenities };
    }

    // Site type filter
    if (type && Array.isArray(type) && type.length > 0) {
      query.type = { $in: type };
    }

    // Rating filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Date availability filter - only check for available sites and no conflicting bookings
    if (checkInDate && checkOutDate) {
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      // Only show sites that are marked as available
      query.availability = 'available';

      // Find sites that don't have conflicting bookings
      const bookedSites = await Booking.find({
        status: { $in: ['confirmed', 'pending'] },
        $or: [
          {
            startDate: { $lte: checkOut },
            endDate: { $gte: checkIn },
          },
        ],
      }).distinct('campingSite');

      query._id = { $nin: bookedSites };
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(pageSize);
    console.log('🔍 Search query being executed:', JSON.stringify(query, null, 2));
    const [sites, total] = await Promise.all([
      CampingSite.find(query)
        .sort({ rating: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      CampingSite.countDocuments(query),
    ]);
    console.log(`📊 Search results: ${sites.length} sites found, total: ${total}`);
    console.log('🏕️ Found sites:', sites.map(s => ({ id: s._id, name: s.name, status: s.status })));

    // Set no-cache headers to prevent stale data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      success: true,
      data: sites,
      pagination: {
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      }
    });
  } catch (error) {
    console.error('Error searching camping sites:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to search camping sites',
      message: 'Error searching camping sites' 
    });
  }
};

/**
 * Get camping site by ID
 */
export const getCampingSiteById = async (req: Request, res: Response) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new BadRequestError('Invalid camping site ID format');
    }
    
    const site = await CampingSite.findById(req.params.id);
    if (!site) {
      throw new NotFoundError('Camping site not found');
    }
    res.json({
      success: true,
      data: site
    });
  } catch (error) {
    console.error('Error getting camping site:', error);
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({ 
        success: false,
        error: error.message,
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to get camping site',
        message: 'Error getting camping site' 
      });
    }
  }
};

/**
 * Check camping site availability
 */
export const getCampingSiteAvailability = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      throw new BadRequestError('Start date and end date are required');
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new BadRequestError('Invalid camping site ID format');
    }

    const site = await CampingSite.findById(req.params.id);
    if (!site) {
      throw new NotFoundError('Camping site not found');
    }

    // Check if the site is available
    if (site.availability !== 'available') {
      return res.json({
        available: false,
        message: 'Site is not available during this period',
      });
    }

    // Check for existing bookings
    const conflictingBookings = await Booking.find({
      campingSite: site._id,
      $or: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate },
        },
      ],
    });

    // Get all booked dates
    const bookedDates = conflictingBookings.reduce((dates: string[], booking) => {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const current = new Date(start);

      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    }, []);

    res.json({
      success: true,
      data: {
        available: conflictingBookings.length === 0,
        bookedDates: [...new Set(bookedDates)], // Remove duplicates
      }
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({ 
        success: false,
        error: error.message,
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to check availability',
        message: 'Error checking availability' 
      });
    }
  }
};

/**
 * Create a new camping site (Admin only)
 */
export const createCampingSite = async (req: Request, res: Response) => {
  try {
    const campingSiteData = req.body;
    console.log('🏕️  Creating campsite with data:', JSON.stringify(campingSiteData, null, 2));
    
    const newSite = new CampingSite(campingSiteData);
    console.log('📋 New site before save:', JSON.stringify(newSite.toObject(), null, 2));
    const savedSite = await newSite.save();
    console.log('💾 Saved site:', JSON.stringify(savedSite.toObject(), null, 2));
    
    // Trigger notification for new campsite
    try {
      await NotificationService.notifyNewCampsite(savedSite);
    } catch (notificationError) {
      console.error('Failed to send campsite creation notification:', notificationError);
      // Don't fail the campsite creation if notification fails
    }
    
    res.status(201).json({
      success: true,
      data: savedSite,
      message: 'Camping site created successfully'
    });
  } catch (error) {
    console.error('Error creating camping site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create camping site',
      message: 'Error creating camping site'
    });
  }
};

/**
 * Update a camping site (Admin only)
 */
export const updateCampingSite = async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new BadRequestError('Invalid camping site ID format');
    }
    
    const updatedSite = await CampingSite.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedSite) {
      throw new NotFoundError('Camping site not found');
    }
    
    // Trigger notification for campsite update
    try {
      await NotificationService.notifyCampsiteUpdate(updatedSite);
    } catch (notificationError) {
      console.error('Failed to send campsite update notification:', notificationError);
      // Don't fail the update if notification fails
    }
    
    res.json({
      success: true,
      data: updatedSite,
      message: 'Camping site updated successfully'
    });
  } catch (error) {
    console.error('Error updating camping site:', error);
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update camping site',
        message: 'Error updating camping site'
      });
    }
  }
};

/**
 * Delete a camping site (Admin only)
 */
export const deleteCampingSite = async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new BadRequestError('Invalid camping site ID format');
    }
    
    const deletedSite = await CampingSite.findByIdAndDelete(req.params.id);
    
    if (!deletedSite) {
      throw new NotFoundError('Camping site not found');
    }
    
    res.json({
      success: true,
      message: 'Camping site deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting camping site:', error);
    if (error instanceof CustomError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete camping site',
        message: 'Error deleting camping site'
      });
    }
  }
};
