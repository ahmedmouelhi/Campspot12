import { Request, Response } from 'express';
import Notification, { INotification } from '../models/Notification';
import Logger from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: any;
    id?: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - title
 *         - message
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the notification
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: The notification title
 *         message:
 *           type: string
 *           maxLength: 1000
 *           description: The notification message
 *         type:
 *           type: string
 *           enum: [info, success, warning, error]
 *           description: The notification type
 *         userId:
 *           type: string
 *           description: The user ID (null for system-wide notifications)
 *         isRead:
 *           type: boolean
 *           description: Whether the notification has been read
 *         metadata:
 *           type: object
 *           description: Additional metadata for the notification
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The last update date
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, success, warning, error]
 *         description: Filter by notification type
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *         description: Show only unread notifications
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     unreadCount:
 *                       type: integer
 */
export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id?.toString();
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const unreadOnly = req.query.unreadOnly === 'true';

    // Build query
    const query: any = {
      $or: [
        { userId: userId }, // User-specific notifications
        { userId: null }    // System-wide notifications
      ]
    };

    if (type) {
      query.type = type;
    }

    if (unreadOnly) {
      query.isRead = false;
    }

    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get notifications
    const rawNotifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform notifications to match frontend expectations
    const notifications = rawNotifications.map(notif => ({
      id: notif._id.toString(),
      title: notif.title,
      message: notif.message,
      type: notif.type,
      userId: notif.userId,
      read: notif.isRead,
      createdAt: notif.createdAt,
      updatedAt: notif.updatedAt,
      metadata: notif.metadata
    }));

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      $or: [
        { userId: userId, isRead: false },
        { userId: null, isRead: false }
      ]
    });

    res.json({
      success: true,
      notifications,
      totalCount: total,
      unreadCount
    });
  } catch (error) {
    Logger.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *               type:
 *                 type: string
 *                 enum: [info, success, warning, error]
 *               userId:
 *                 type: string
 *                 description: Target user ID (null for system-wide)
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid request data
 */
export const createNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, message, type, userId, metadata } = req.body;

    // Validate required fields
    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and type are required'
      });
    }

    const notification = new Notification({
      title,
      message,
      type,
      userId: userId || null,
      metadata: metadata || {}
    });

    await notification.save();

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    Logger.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id?.toString();

    // Find notification that belongs to user or is system-wide
    const notification = await Notification.findOne({
      _id: id,
      $or: [
        { userId: userId },
        { userId: null }
      ]
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    Logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read for the user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
export const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id?.toString();

    await Notification.updateMany(
      {
        $or: [
          { userId: userId },
          { userId: null }
        ],
        isRead: false
      },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    Logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 */
export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id?.toString();

    // Find and delete notification that belongs to user or is system-wide
    const notification = await Notification.findOneAndDelete({
      _id: id,
      $or: [
        { userId: userId },
        { userId: null }
      ]
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    Logger.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Get all notifications (admin only)
 *     tags: [Admin, Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of notifications per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [info, success, warning, error]
 *         description: Filter by notification type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: List of all notifications
 *       403:
 *         description: Access denied
 */
export const getAllNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string;
    const userId = req.query.userId as string;

    // Build query
    const query: any = {};

    if (type) {
      query.type = type;
    }

    if (userId) {
      query.userId = userId;
    }

    // Get total count for pagination
    const total = await Notification.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get statistics
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadCount = await Notification.countDocuments({ isRead: false });
    const systemWideCount = await Notification.countDocuments({ userId: null });

    res.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      stats: {
        byType: stats.reduce((acc: any, stat: any) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        unreadCount,
        systemWideCount
      }
    });
  } catch (error) {
    Logger.error('Error fetching all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

/**
 * @swagger
 * /api/admin/notifications/{id}:
 *   delete:
 *     summary: Delete any notification (admin only)
 *     tags: [Admin, Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Notification not found
 */
export const adminDeleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    Logger.error('Error deleting notification (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

/**
 * @swagger
 * /api/admin/notifications/system:
 *   post:
 *     summary: Create system-wide notification (admin only)
 *     tags: [Admin, Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - type
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *               type:
 *                 type: string
 *                 enum: [info, success, warning, error]
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: System notification created successfully
 *       403:
 *         description: Access denied
 */
export const createSystemNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { title, message, type, metadata } = req.body;

    // Validate required fields
    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and type are required'
      });
    }

    const notification = new Notification({
      title,
      message,
      type,
      userId: null, // System-wide notification
      metadata: metadata || {}
    });

    await notification.save();

    res.status(201).json({
      success: true,
      notification,
      message: 'System notification created successfully'
    });
  } catch (error) {
    Logger.error('Error creating system notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create system notification'
    });
  }
};

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notification count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 unreadCount:
 *                   type: integer
 */
export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id?.toString();

    const unreadCount = await Notification.countDocuments({
      $or: [
        { userId: userId, isRead: false },
        { userId: null, isRead: false }
      ]
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    Logger.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
};
