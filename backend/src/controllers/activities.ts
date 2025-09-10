import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Activity from '../models/Activity';
import { AuthRequest } from '../middleware/auth';
import { clearCache } from '../middleware/cache';
import { NotificationService } from '../services/notificationService';

// Get all activities
export const getActivities = async (req: Request, res: Response) => {
  try {
    const {
      category,
      difficulty,
      minPrice,
      maxPrice,
      status = 'active',
      sort = 'name',
      order = 'asc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter: any = { status };
    
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sort as string] = order === 'desc' ? -1 : 1;

    // Calculate pagination
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Math.min(50, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get activities with pagination
    const activities = await Activity
      .find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .populate('reviews.user', 'name avatar');

    // Get total count
    const total = await Activity.countDocuments(filter);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve activities'
    });
  }
};

// Get activity by ID
export const getActivityById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity
      .findById(id)
      .populate('reviews.user', 'name avatar');

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Error getting activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve activity'
    });
  }
};

// Create new activity
export const createActivity = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const activityData = req.body;
    
    const activity = new Activity(activityData);
    await activity.save();

    // Clear activities cache
    clearCache('/api/activities');
    clearCache('/api/activities/categories');
    clearCache('/api/activities/stats');

    // Create notification for new activity
    try {
      await NotificationService.notifyNewActivity(activity);
    } catch (error) {
      console.error('Error creating activity notification:', error);
    }

    res.status(201).json({
      success: true,
      data: activity,
      message: 'Activity created successfully'
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    
    if ((error as any).name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create activity'
    });
  }
};

// Update activity
export const updateActivity = async (req: Request, res: Response) => {
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
    const updateData = req.body;

    // Get original activity before update
    const originalActivity = await Activity.findById(id);
    if (!originalActivity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    const activity = await Activity.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Clear activities cache
    clearCache('/api/activities');
    clearCache('/api/activities/categories');
    clearCache('/api/activities/stats');

    // Create notification for activity update (if status changed to active)
    if (activity && activity.status === 'active' && originalActivity.status !== 'active') {
      try {
        await NotificationService.notifyActivityUpdate(activity);
      } catch (error) {
        console.error('Error creating activity update notification:', error);
      }
    }

    res.json({
      success: true,
      data: activity,
      message: 'Activity updated successfully'
    });
  } catch (error) {
    console.error('Error updating activity:', error);
    
    if ((error as any).name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update activity'
    });
  }
};

// Delete activity
export const deleteActivity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findByIdAndDelete(id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    // Clear activities cache
    clearCache('/api/activities');
    clearCache('/api/activities/categories');
    clearCache('/api/activities/stats');

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete activity'
    });
  }
};

// Add review to activity
export const addActivityReview = async (req: AuthRequest, res: Response) => {
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

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    // Check if user already reviewed this activity
    const existingReview = activity.reviews.find(
      review => review.user.toString() === userId.toString()
    );

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this activity'
      });
    }

    // Add new review
    activity.reviews.push({
      user: userId,
      rating,
      comment,
      date: new Date()
    });

    // Update activity rating
    await activity.updateRating();
    await activity.save();

    const updatedActivity = await Activity
      .findById(id)
      .populate('reviews.user', 'name avatar');

    res.json({
      success: true,
      data: updatedActivity,
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

// Get activity categories
export const getActivityCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Activity.distinct('category', { status: 'active' });
    
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

// Get activity statistics (for admin dashboard)
export const getActivityStats = async (req: Request, res: Response) => {
  try {
    const totalActivities = await Activity.countDocuments();
    const activeActivities = await Activity.countDocuments({ status: 'active' });
    const avgRating = await Activity.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const categoryCounts = await Activity.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        total: totalActivities,
        active: activeActivities,
        avgRating: avgRating[0]?.avgRating || 0,
        categories: categoryCounts
      }
    });
  } catch (error) {
    console.error('Error getting activity stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve activity statistics'
    });
  }
};
