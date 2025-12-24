import Notification from '../models/Notification';
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';

// Get user's notifications
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { page = 1, limit = 20, type, unreadOnly } = req.query;

        // Get user's registration date to filter out old system notifications
        const user = await User.findById(userId);
        const userCreatedAt = user?.createdAt || new Date();

        const query: any = {
            $or: [
                { userId: userId }, // User-specific notifications
                {
                    userId: null, // System-wide notifications
                    createdAt: { $gte: userCreatedAt } // Only created after user registered
                }
            ],
        };

        if (type) {
            query.type = type;
        }

        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Notification.countDocuments(query),
        ]);

        const unreadCount = await Notification.countDocuments({
            $or: [
                { userId: userId, isRead: false },
                {
                    userId: null,
                    isRead: false,
                    createdAt: { $gte: userCreatedAt }
                }
            ],
        });

        res.json({
            success: true,
            notifications: notifications,  // Changed from 'data' to 'notifications'
            totalCount: total,  // Added totalCount
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
            unreadCount,
        });
    } catch (error: any) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message,
        });
    }
};

// Get unread notification count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        // Get user's registration date
        const user = await User.findById(userId);
        const userCreatedAt = user?.createdAt || new Date();

        const unreadCount = await Notification.countDocuments({
            $or: [
                { userId: userId, isRead: false },
                {
                    userId: null,
                    isRead: false,
                    createdAt: { $gte: userCreatedAt }
                }
            ],
        });

        res.json({
            success: true,
            count: unreadCount,
        });
    } catch (error: any) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count',
            error: error.message,
        });
    }
};

// Mark notification as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user?._id;

        const notification = await Notification.findOne({
            _id: notificationId,
            $or: [{ userId: userId }, { userId: null }],
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        notification.isRead = true;
        await notification.save();

        res.json({
            success: true,
            message: 'Notification marked as read',
            data: notification,
        });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message,
        });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        await Notification.updateMany(
            {
                $or: [{ userId: userId }, { userId: null }],
                isRead: false,
            },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message,
        });
    }
};

// Delete notification
export const deleteNotification = async (req: AuthRequest, res: Response) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user?._id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            userId: userId, // Users can only delete their own notifications
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or unauthorized',
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message,
        });
    }
};

// ADMIN: Get all notifications
export const getAllNotifications = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 50, type, userId } = req.query;

        const query: any = {};

        if (type) {
            query.type = type;
        }

        if (userId) {
            query.userId = userId;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .populate('userId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Notification.countDocuments(query),
        ]);

        // Get statistics
        const [byType, unreadCount, systemWideCount] = await Promise.all([
            Notification.aggregate([
                { $group: { _id: '$type', count: { $sum: 1 } } },
            ]),
            Notification.countDocuments({ isRead: false }),
            Notification.countDocuments({ userId: null }),
        ]);

        const stats = {
            byType: byType.reduce((acc: any, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            unreadCount,
            systemWideCount,
        };

        res.json({
            success: true,
            notifications,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
            stats,
        });
    } catch (error: any) {
        console.error('Error fetching all notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message,
        });
    }
};

// ADMIN: Create system-wide notification
export const createSystemNotification = async (req: Request, res: Response) => {
    try {
        const { title, message, type = 'info' } = req.body;

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required',
            });
        }

        const notification = await Notification.create({
            userId: null, // System-wide
            title,
            message,
            type,
        });

        res.status(201).json({
            success: true,
            message: 'System notification created successfully',
            data: notification,
        });
    } catch (error: any) {
        console.error('Error creating system notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create system notification',
            error: error.message,
        });
    }
};

// ADMIN: Delete any notification
export const adminDeleteNotification = async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByIdAndDelete(notificationId);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message,
        });
    }
};

// Helper function to create notification (used by other controllers)
export const createNotification = async (
    userId: string | null,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    metadata?: any
) => {
    try {
        await Notification.create({
            userId,
            title,
            message,
            type,
            metadata,
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};
