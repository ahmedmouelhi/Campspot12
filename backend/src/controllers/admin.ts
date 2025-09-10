import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import CampingSite from '../models/CampingSite';
import Activity from '../models/Activity';
import BlogPost from '../models/BlogPost';
import Equipment from '../models/Equipment';
import Booking from '../models/Booking';

// Get admin dashboard statistics
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalCampsites,
      availableCampsites,
      totalActivities,
      activeActivities,
      totalBlogPosts,
      publishedBlogPosts,
      totalEquipment,
      availableEquipment,
      totalBookings,
      confirmedBookings
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      CampingSite.countDocuments(),
      CampingSite.countDocuments({ availability: 'available' }),
      Activity.countDocuments(),
      Activity.countDocuments({ status: 'active' }),
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ published: true }),
      Equipment.countDocuments(),
      Equipment.countDocuments({ availability: 'Available' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' })
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        admins: await User.countDocuments({ role: 'admin' })
      },
      campsites: {
        total: totalCampsites,
        available: availableCampsites,
        limited: await CampingSite.countDocuments({ availability: 'limited' }),
        unavailable: await CampingSite.countDocuments({ availability: 'unavailable' }),
        avgRating: 0
      },
      activities: {
        total: totalActivities,
        active: activeActivities,
        inactive: totalActivities - activeActivities,
        avgPrice: 0,
        categories: 0
      },
      blog: {
        total: totalBlogPosts,
        published: publishedBlogPosts,
        draft: totalBlogPosts - publishedBlogPosts,
        totalViews: 0,
        categories: 0
      },
      equipment: {
        total: totalEquipment,
        available: availableEquipment,
        limited: await Equipment.countDocuments({ availability: 'Limited' }),
        unavailable: await Equipment.countDocuments({ availability: 'Unavailable' }),
        categories: 0
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        pending: await Booking.countDocuments({ status: 'pending' }),
        cancelled: await Booking.countDocuments({ status: 'cancelled' })
      }
    };

    // Calculate averages and additional stats
    const [avgCampsiteRating, avgActivityPrice, activityCategories, blogCategories, equipmentCategories, totalBlogViews] = await Promise.all([
      CampingSite.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' } } }]),
      Activity.aggregate([{ $group: { _id: null, avgPrice: { $avg: '$price' } } }]),
      Activity.distinct('category', { status: 'active' }),
      BlogPost.distinct('category', { published: true }),
      Equipment.distinct('category', { status: 'active' }),
      BlogPost.aggregate([{ $group: { _id: null, totalViews: { $sum: '$views' } } }])
    ]);

    stats.campsites.avgRating = avgCampsiteRating[0]?.avgRating || 0;
    stats.activities.avgPrice = avgActivityPrice[0]?.avgPrice || 0;
    stats.activities.categories = activityCategories.length;
    stats.blog.categories = blogCategories.length;
    stats.blog.totalViews = totalBlogViews[0]?.totalViews || 0;
    stats.equipment.categories = equipmentCategories.length;

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve dashboard statistics'
    });
  }
};

// Get recent activities (admin log)
export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent bookings, user registrations, etc.
    const [recentBookings, recentUsers] = await Promise.all([
      Booking.find()
        .populate('user', 'name email')
        .populate('campingSite', 'name')
        .sort({ createdAt: -1 })
        .limit(Number(limit) / 2),
      User.find()
        .sort({ registrationDate: -1 })
        .limit(Number(limit) / 2)
        .select('name email role registrationDate')
    ]);

    const activities = [
      ...recentBookings.map(booking => ({
        type: 'booking',
        message: `New booking for ${(booking.campingSite as any)?.name || 'Unknown Site'} by ${(booking.user as any)?.name || 'Unknown User'}`,
        timestamp: booking.createdAt,
        user: (booking.user as any)?.name || 'Unknown User',
        details: {
          bookingId: booking._id,
          amount: booking.totalPrice
        }
      })),
      ...recentUsers.map(user => ({
        type: 'registration',
        message: `New user registered: ${user.name}`,
        timestamp: user.registrationDate,
        user: user.name,
        details: {
          email: user.email,
          role: user.role
        }
      }))
    ];

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({
      success: true,
      data: activities.slice(0, Number(limit))
    });
  } catch (error) {
    console.error('Error getting recent activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent activities'
    });
  }
};

// Get revenue analytics
export const getRevenueAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const { period = '30d' } = req.query;

    let startDate: Date;
    const endDate = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const revenueData = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalRevenue: { $sum: '$totalPrice' },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const totalRevenue = revenueData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalBookings = revenueData.reduce((sum, item) => sum + item.bookingCount, 0);

    res.json({
      success: true,
      data: {
        period,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings,
        averageBookingValue: totalBookings > 0 ? Math.round((totalRevenue / totalBookings) * 100) / 100 : 0,
        dailyData: revenueData.map(item => ({
          date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
          revenue: Math.round(item.totalRevenue * 100) / 100,
          bookings: item.bookingCount
        }))
      }
    });
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve revenue analytics'
    });
  }
};

// Get user analytics
export const getUserAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    // Get user registrations over time
    const registrationData = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$registrationDate' },
            month: { $month: '$registrationDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get users by role
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        registrationTrend: registrationData,
        roleDistribution
      }
    });
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user analytics'
    });
  }
};

// Get system health
export const getSystemHealth = async (req: AuthRequest, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        status: 'connected',
        collections: {
          users: await User.countDocuments(),
          campsites: await CampingSite.countDocuments(),
          activities: await Activity.countDocuments(),
          blogPosts: await BlogPost.countDocuments(),
          equipment: await Equipment.countDocuments(),
          bookings: await Booking.countDocuments()
        }
      },
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system health'
    });
  }
};

// User management functions
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.isActive = status === 'active';
    }
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ registrationDate: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users'
    });
  }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user'
    });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    // If no password provided, set a default one
    if (!req.body.password) {
      req.body.password = 'TempPass123!';
    }
    
    // Set default values
    const userData = {
      ...req.body,
      role: req.body.role || 'user',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      registrationDate: new Date()
    };
    
    const newUser = new User(userData);
    const savedUser = await newUser.save();
    
    // Remove password from response
    const userResponse = savedUser.toObject();
    const { password, ...userWithoutPassword } = userResponse;
    
    res.status(201).json({
      success: true,
      data: userWithoutPassword,
      message: 'User created successfully'
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists',
        message: 'A user with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: error.message || 'Unknown error occurred'
    });
  }
};


export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
};

export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    const userResponse = user.toObject();
    const { password, ...userWithoutPassword } = userResponse;
    
    res.json({
      success: true,
      data: userWithoutPassword,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle user status'
    });
  }
};
