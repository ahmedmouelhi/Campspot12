import Notification from '../models/Notification';
import User from '../models/User';
import Logger from '../utils/logger';

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'campsite' | 'booking' | 'user' | 'admin';
  userId?: string | null; // null for system-wide notifications
  metadata?: Record<string, any>;
}

export class NotificationService {
  
  /**
   * Create a notification for a specific user
   */
  static async createUserNotification(userId: string, data: Omit<NotificationData, 'userId'>) {
    try {
      const notification = new Notification({
        ...data,
        userId
      });
      await notification.save();
      Logger.info(`📢 User notification created for ${userId}: ${data.title}`);
      return notification;
    } catch (error) {
      Logger.error('Error creating user notification:', error);
      throw error;
    }
  }

  /**
   * Create a system-wide notification for all users
   */
  static async createSystemNotification(data: Omit<NotificationData, 'userId'>) {
    try {
      const notification = new Notification({
        ...data,
        userId: null // System-wide
      });
      await notification.save();
      Logger.info(`📢 System notification created: ${data.title}`);
      return notification;
    } catch (error) {
      Logger.error('Error creating system notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for admin users only
   */
  static async createAdminNotification(data: Omit<NotificationData, 'userId'>) {
    try {
      const admins = await User.find({ role: 'admin', isActive: true });
      const notifications = [];

      for (const admin of admins) {
        const notification = new Notification({
          ...data,
          userId: admin._id.toString()
        });
        await notification.save();
        notifications.push(notification);
      }

      Logger.info(`📢 Admin notification created for ${admins.length} admins: ${data.title}`);
      return notifications;
    } catch (error) {
      Logger.error('Error creating admin notification:', error);
      throw error;
    }
  }

  /**
   * Create notifications for multiple specific users
   */
  static async createBulkUserNotifications(userIds: string[], data: Omit<NotificationData, 'userId'>) {
    try {
      const notifications = [];

      for (const userId of userIds) {
        const notification = new Notification({
          ...data,
          userId
        });
        await notification.save();
        notifications.push(notification);
      }

      Logger.info(`📢 Bulk notification created for ${userIds.length} users: ${data.title}`);
      return notifications;
    } catch (error) {
      Logger.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  // Event-specific notification methods

  /**
   * Notify when a new campsite is created
   */
  static async notifyNewCampsite(campsiteData: any) {
    return this.createSystemNotification({
      title: 'New Campsite Available!',
      message: `A new campsite "${campsiteData.name}" has been added to ${campsiteData.location}. Check it out!`,
      type: 'campsite',
      metadata: {
        event: 'campsite_created',
        campsiteId: campsiteData._id,
        campsiteName: campsiteData.name,
        location: campsiteData.location
      }
    });
  }

  /**
   * Notify when a campsite is updated
   */
  static async notifyCampsiteUpdate(campsiteData: any) {
    return this.createSystemNotification({
      title: 'Campsite Updated',
      message: `Campsite "${campsiteData.name}" has been updated with new information.`,
      type: 'campsite',
      metadata: {
        event: 'campsite_updated',
        campsiteId: campsiteData._id,
        campsiteName: campsiteData.name
      }
    });
  }

  /**
   * Notify when a booking is confirmed
   */
  static async notifyBookingConfirmed(userId: string, bookingData: any) {
    return this.createUserNotification(userId, {
      title: 'Booking Confirmed!',
      message: `Your booking for ${bookingData.campingSiteName} from ${new Date(bookingData.startDate).toLocaleDateString()} to ${new Date(bookingData.endDate).toLocaleDateString()} has been confirmed.`,
      type: 'booking',
      metadata: {
        event: 'booking_confirmed',
        bookingId: bookingData._id,
        campsiteId: bookingData.campingSiteId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate
      }
    });
  }

  /**
   * Notify when a booking is cancelled
   */
  static async notifyBookingCancelled(userId: string, bookingData: any) {
    return this.createUserNotification(userId, {
      title: 'Booking Cancelled',
      message: `Your booking for ${bookingData.campingSiteName} has been cancelled.`,
      type: 'booking',
      metadata: {
        event: 'booking_cancelled',
        bookingId: bookingData._id,
        campsiteId: bookingData.campingSiteId
      }
    });
  }

  /**
   * Notify admins of new bookings
   */
  static async notifyAdminsNewBooking(bookingData: any) {
    return this.createAdminNotification({
      title: 'New Booking Received',
      message: `A new booking has been made for ${bookingData.campingSiteName} by ${bookingData.userName}.`,
      type: 'admin',
      metadata: {
        event: 'admin_new_booking',
        bookingId: bookingData._id,
        userId: bookingData.userId,
        campsiteId: bookingData.campingSiteId
      }
    });
  }

  /**
   * Welcome notification for new users
   */
  static async notifyWelcomeUser(userId: string, userData: any) {
    return this.createUserNotification(userId, {
      title: 'Welcome to CampSpot!',
      message: `Hi ${userData.name}! Welcome to CampSpot. Discover amazing camping experiences and book your perfect outdoor adventure.`,
      type: 'user',
      metadata: {
        event: 'user_welcome',
        userId: userId
      }
    });
  }

  /**
   * Notify admins of new user registration
   */
  static async notifyAdminsNewUser(userData: any) {
    return this.createAdminNotification({
      title: 'New User Registration',
      message: `A new user "${userData.name}" (${userData.email}) has registered.`,
      type: 'admin',
      metadata: {
        event: 'admin_new_user',
        userId: userData._id,
        userEmail: userData.email,
        userName: userData.name
      }
    });
  }

  /**
   * Notify when equipment is added
   */
  static async notifyNewEquipment(equipmentData: any) {
    return this.createSystemNotification({
      title: 'New Equipment Available!',
      message: `New camping equipment "${equipmentData.name}" is now available for rent.`,
      type: 'admin',
      metadata: {
        event: 'equipment_added',
        equipmentId: equipmentData._id,
        equipmentName: equipmentData.name
      }
    });
  }

  /**
   * Notify when blog post is published
   */
  static async notifyNewBlogPost(blogData: any) {
    return this.createSystemNotification({
      title: 'New Blog Post',
      message: `Check out our latest blog post: "${blogData.title}"`,
      type: 'admin',
      metadata: {
        event: 'blog_published',
        blogId: blogData._id,
        blogTitle: blogData.title
      }
    });
  }

  /**
   * Notify about system maintenance
   */
  static async notifyMaintenance(maintenanceData: { startTime: Date; endTime: Date; description?: string }) {
    return this.createSystemNotification({
      title: 'Scheduled Maintenance',
      message: `System maintenance is scheduled from ${maintenanceData.startTime.toLocaleString()} to ${maintenanceData.endTime.toLocaleString()}. ${maintenanceData.description || 'Some features may be temporarily unavailable.'}`,
      type: 'admin',
      metadata: {
        event: 'system_maintenance',
        startTime: maintenanceData.startTime,
        endTime: maintenanceData.endTime
      }
    });
  }

  /**
   * Notify about special offers or promotions
   */
  static async notifyPromotion(promotionData: { title: string; description: string; code?: string; validUntil?: Date }) {
    return this.createSystemNotification({
      title: promotionData.title,
      message: `${promotionData.description}${promotionData.code ? ` Use code: ${promotionData.code}` : ''}${promotionData.validUntil ? ` Valid until ${promotionData.validUntil.toLocaleDateString()}` : ''}`,
      type: 'admin',
      metadata: {
        event: 'promotion',
        code: promotionData.code,
        validUntil: promotionData.validUntil
      }
    });
  }

  /**
   * Notify when a new activity is created
   */
  static async notifyNewActivity(activityData: any) {
    return this.createSystemNotification({
      title: 'New Activity Available!',
      message: `A new activity "${activityData.name}" has been added. Check it out!`,
      type: 'admin',
      metadata: {
        event: 'activity_created',
        activityId: activityData._id,
        activityName: activityData.name,
        category: activityData.category
      }
    });
  }

  /**
   * Notify when an activity is updated
   */
  static async notifyActivityUpdate(activityData: any) {
    return this.createSystemNotification({
      title: 'Activity Updated',
      message: `Activity "${activityData.name}" has been updated with new information.`,
      type: 'admin',
      metadata: {
        event: 'activity_updated',
        activityId: activityData._id,
        activityName: activityData.name
      }
    });
  }

  /**
   * Notify when payment is completed
   */
  static async notifyPaymentCompleted(userId: string, paymentData: any) {
    return this.createUserNotification(userId, {
      title: 'Payment Successful! 🎉',
      message: `Your payment of €${paymentData.amount.toFixed(2)} has been processed successfully. Order #${paymentData.orderId} is confirmed with ${paymentData.itemCount} item${paymentData.itemCount > 1 ? 's' : ''}.`,
      type: 'success',
      metadata: {
        event: 'payment_completed',
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        itemCount: paymentData.itemCount,
        items: paymentData.items
      }
    });
  }
}

export default NotificationService;
