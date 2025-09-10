import { Request, Response } from 'express';
import Equipment, { IEquipment } from '../models/Equipment';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { clearCache } from '../middleware/cache';

import mongoose from 'mongoose';

// Helper function to wait for MongoDB connection
const waitForConnection = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('MongoDB connection timeout'));
    }, 10000); // 10 second timeout
    
    if (mongoose.connection.readyState === 0) {
      // If disconnected, wait for connection
      mongoose.connection.once('connected', () => {
        clearTimeout(timeout);
        resolve();
      });
    } else if (mongoose.connection.readyState === 2) {
      // If connecting, wait for it to complete
      mongoose.connection.once('connected', () => {
        clearTimeout(timeout);
        resolve();
      });
      mongoose.connection.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    } else {
      // For other states, resolve immediately
      clearTimeout(timeout);
      resolve();
    }
  });
};

// Get all equipment
export const getEquipment = async (req: Request, res: Response) => {
  try {
    // Wait for MongoDB connection
    await waitForConnection();
    
    const {
      category,
      condition,
      availability,
      minPrice,
      maxPrice,
      period,
      search,
      sort = 'name',
      order = 'asc',
      page = 1,
      limit = 50 // Increased default limit for admin views
    } = req.query;

    // Build filter object - remove status filter as it might not exist in seeded data
    const filter: any = {};
    
    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (availability) filter.availability = availability;
    if (period) filter.period = period;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search as string };
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(100, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get equipment with pagination
    const equipment = await Equipment
      .find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate('reviews.user', 'name avatar');

    // Get total count
    const total = await Equipment.countDocuments(filter);

    res.json({
      success: true,
      data: equipment,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve equipment'
    });
  }
};

// Get equipment by ID
export const getEquipmentById = async (req: Request, res: Response) => {
  try {
    await waitForConnection();
    const { id } = req.params;
    
    const equipment = await Equipment
      .findById(id)
      .populate('reviews.user', 'name avatar')
      .populate('rentalHistory.user', 'name');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    console.error('Error getting equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve equipment'
    });
  }
};

// Create new equipment
export const createEquipment = async (req: Request, res: Response) => {
  try {
    await waitForConnection();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const equipmentData = req.body;
    
    const equipment = new Equipment(equipmentData);
    await equipment.save();

    // Clear equipment cache
    clearCache('/api/equipment');
    clearCache('/api/equipment/categories');
    clearCache('/api/equipment/stats');

    res.status(201).json({
      success: true,
      data: equipment,
      message: 'Equipment created successfully'
    });
  } catch (error) {
    console.error('Error creating equipment:', error);
    
    if ((error as any).name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create equipment'
    });
  }
};

// Update equipment
export const updateEquipment = async (req: Request, res: Response) => {
  try {
    await waitForConnection();
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const equipment = await Equipment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    // Clear equipment cache
    clearCache('/api/equipment');
    clearCache('/api/equipment/categories');
    clearCache('/api/equipment/stats');

    res.json({
      success: true,
      data: equipment,
      message: 'Equipment updated successfully'
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    
    if ((error as any).name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update equipment'
    });
  }
};

// Delete equipment
export const deleteEquipment = async (req: Request, res: Response) => {
  try {
    await waitForConnection();
    const { id } = req.params;

    const equipment = await Equipment.findByIdAndDelete(id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    // Clear equipment cache
    clearCache('/api/equipment');
    clearCache('/api/equipment/categories');
    clearCache('/api/equipment/stats');

    res.json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete equipment'
    });
  }
};

// Add review to equipment
export const addEquipmentReview = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    // Check if user already reviewed this equipment
    const existingReview = equipment.reviews.find(
      review => review.user.toString() === userId.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this equipment'
      });
    }

    // Add new review
    equipment.reviews.push({
      user: userId,
      rating,
      comment,
      date: new Date()
    });

    // Update equipment rating
    await equipment.updateRating();
    await equipment.save();

    const updatedEquipment = await Equipment
      .findById(id)
      .populate('reviews.user', 'name avatar');

    res.json({
      success: true,
      data: updatedEquipment,
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add review'
    });
  }
};

// Get equipment categories
export const getEquipmentCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Equipment.distinct('category', { status: 'active' });
    
    res.json({
      success: true,
      data: categories.sort()
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve categories'
    });
  }
};

// Check equipment availability for rental period
export const checkEquipmentAvailability = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, quantity = 1 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        error: 'Equipment not found'
      });
    }

    // Check if equipment is available
    if (equipment.availability === 'Unavailable' || equipment.quantity < Number(quantity)) {
      return res.json({
        success: true,
        data: {
          available: false,
          reason: 'Insufficient quantity available'
        }
      });
    }

    // Check for conflicting active rentals
    const conflictingRentals = equipment.rentalHistory.filter(rental => {
      if (rental.status !== 'active') return false;
      
      const rentalStart = new Date(rental.startDate);
      const rentalEnd = new Date(rental.endDate);
      const requestStart = new Date(startDate as string);
      const requestEnd = new Date(endDate as string);
      
      return (requestStart < rentalEnd && requestEnd > rentalStart);
    });

    const rentedQuantity = conflictingRentals.length;
    const availableQuantity = equipment.quantity - rentedQuantity;

    res.json({
      success: true,
      data: {
        available: availableQuantity >= Number(quantity),
        availableQuantity,
        totalQuantity: equipment.quantity,
        rentedQuantity
      }
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check availability'
    });
  }
};

// Get equipment statistics (for admin dashboard)
export const getEquipmentStats = async (req: Request, res: Response) => {
  try {
    const totalEquipment = await Equipment.countDocuments();
    const availableEquipment = await Equipment.countDocuments({ availability: 'Available' });
    const avgRating = await Equipment.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const categoryCounts = await Equipment.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const conditionCounts = await Equipment.aggregate([
      { $group: { _id: '$condition', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalEquipment,
        available: availableEquipment,
        limited: await Equipment.countDocuments({ availability: 'Limited' }),
        unavailable: await Equipment.countDocuments({ availability: 'Unavailable' }),
        avgRating: avgRating[0]?.avgRating || 0,
        categories: categoryCounts,
        conditions: conditionCounts
      }
    });
  } catch (error) {
    console.error('Error getting equipment stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve equipment statistics'
    });
  }
};
