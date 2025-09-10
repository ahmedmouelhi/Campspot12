import { toast } from 'react-toastify';

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId?: string;
  metadata?: Record<string, any>;
}

export interface EmailData {
  to: string;
  subject: string;
  template: 'booking_confirmation' | 'payment_receipt' | 'reminder' | 'newsletter';
  data: Record<string, any>;
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationData[] = [];
  private emailQueue: EmailData[] = [];

  private constructor() {
    this.loadNotifications();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request browser notification permission
  private async requestBrowserNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Load notifications from localStorage
  private loadNotifications(): void {
    const saved = localStorage.getItem('campspot_notifications');
    if (saved) {
      try {
        this.notifications = JSON.parse(saved);
      } catch (error) {
        console.error('Error loading notifications:', error);
        this.notifications = [];
      }
    }
  }

  // Save notifications to localStorage
  private saveNotifications(): void {
    try {
      localStorage.setItem('campspot_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Send browser notification
  public async sendBrowserNotification(data: NotificationData): Promise<boolean> {
    const hasPermission = await this.requestBrowserNotificationPermission();
    
    if (!hasPermission) {
      // Only show permission message for important notifications, not test notifications
      if (!data.metadata?.test && (data.type === 'error' || data.type === 'warning')) {
        console.log('Browser notifications not enabled, showing toast instead');
      }
      return false;
    }

    try {
      const notification = new Notification(data.title, {
        body: data.message,
        icon: '/logo.svg',
        badge: '/logo.svg',
        tag: `campspot-${Date.now()}`,
        requireInteraction: data.type === 'error' || data.type === 'warning'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Navigate to relevant page based on notification type
        if (data.metadata?.bookingId) {
          window.location.href = '/profile#bookings';
        }
      };

      // Auto-close after 10 seconds for non-critical notifications
      if (data.type === 'info' || data.type === 'success') {
        setTimeout(() => notification.close(), 10000);
      }

      return true;
    } catch (error) {
      console.error('Error sending browser notification:', error);
      return false;
    }
  }

  // Send toast notification
  public sendToastNotification(data: NotificationData): void {
    switch (data.type) {
      case 'success':
        toast.success(data.message);
        break;
      case 'error':
        toast.error(data.message);
        break;
      case 'warning':
        toast.warn(data.message);
        break;
      case 'info':
      default:
        toast.info(data.message);
        break;
    }
  }

  // Send notification (both toast and browser)
  public async sendNotification(data: NotificationData): Promise<void> {
    // Send toast notification immediately
    this.sendToastNotification(data);

    // Send browser notification if enabled
    await this.sendBrowserNotification(data);

    // Save to backend if user is logged in
    try {
      const token = localStorage.getItem('campspot_token');
      if (token) {
        const response = await fetch('http://localhost:5000/api/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: data.title,
            message: data.message,
            type: data.type,
            userId: data.userId,
            metadata: data.metadata
          })
        });
        
        if (response.ok) {
          console.log('📡 Notification saved to backend');
        } else {
          console.warn('⚠️ Failed to save notification to backend');
        }
      }
    } catch (error) {
      console.error('❌ Error saving notification to backend:', error);
    }

    // Also store locally as backup
    this.notifications.unshift({
      ...data,
      metadata: {
        ...data.metadata,
        timestamp: new Date().toISOString(),
        read: false
      }
    });

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveNotifications();
  }

  // Send email notification (mock implementation)
  public async sendEmailNotification(emailData: EmailData): Promise<boolean> {
    try {
      // In a real application, this would call your backend API
      // For demo purposes, we'll simulate the email sending
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.emailQueue.push({
        ...emailData,
        metadata: {
          timestamp: new Date().toISOString(),
          status: 'sent'
        }
      } as any);

      // Send confirmation notification
      await this.sendNotification({
        title: 'Email Sent',
        message: `Email sent successfully to ${emailData.to}`,
        type: 'success',
        metadata: { emailData }
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      
      await this.sendNotification({
        title: 'Email Failed',
        message: `Failed to send email to ${emailData.to}`,
        type: 'error'
      });

      return false;
    }
  }

  // Send booking confirmation notifications
  public async sendBookingConfirmation(bookingData: {
    userEmail: string;
    userName: string;
    bookingId: string;
    itemName: string;
    date: string;
    total: number;
  }): Promise<void> {
    const { userEmail, userName, bookingId, itemName, date, total } = bookingData;

    // Send browser/toast notification
    await this.sendNotification({
      title: 'Booking Confirmed!',
      message: `Your booking for ${itemName} on ${date} has been confirmed.`,
      type: 'success',
      metadata: { bookingId, type: 'booking_confirmation' }
    });

    // Send email confirmation
    await this.sendEmailNotification({
      to: userEmail,
      subject: `Booking Confirmation - ${itemName}`,
      template: 'booking_confirmation',
      data: {
        userName,
        bookingId,
        itemName,
        date,
        total
      }
    });
  }

  // Send payment receipt
  public async sendPaymentReceipt(paymentData: {
    userEmail: string;
    userName: string;
    paymentId: string;
    amount: number;
    itemName: string;
  }): Promise<void> {
    const { userEmail, userName, paymentId, amount, itemName } = paymentData;

    // Send notification
    await this.sendNotification({
      title: 'Payment Successful',
      message: `Payment of €${amount} for ${itemName} has been processed successfully.`,
      type: 'success',
      metadata: { paymentId, type: 'payment_receipt' }
    });

    // Send email receipt
    await this.sendEmailNotification({
      to: userEmail,
      subject: `Payment Receipt - ${itemName}`,
      template: 'payment_receipt',
      data: {
        userName,
        paymentId,
        amount,
        itemName,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Send reminder notifications
  public async sendReminder(reminderData: {
    userEmail: string;
    userName: string;
    message: string;
    bookingId?: string;
  }): Promise<void> {
    const { userEmail, userName, message, bookingId } = reminderData;

    // Send notification
    await this.sendNotification({
      title: 'Reminder',
      message,
      type: 'info',
      metadata: { bookingId, type: 'reminder' }
    });

    // Send email reminder
    await this.sendEmailNotification({
      to: userEmail,
      subject: 'CampSpot Reminder',
      template: 'reminder',
      data: {
        userName,
        message,
        bookingId
      }
    });
  }

  // Schedule notifications for upcoming bookings
  public scheduleBookingReminders(bookings: any[]): void {
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.date);
      const reminderDate = new Date(bookingDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
      const now = new Date();

      if (reminderDate > now && booking.status === 'confirmed') {
        const timeUntilReminder = reminderDate.getTime() - now.getTime();
        
        setTimeout(async () => {
          await this.sendReminder({
            userEmail: 'user@example.com', // This would come from user data
            userName: 'User', // This would come from user data
            message: `Your ${booking.name} booking is tomorrow at ${booking.date}!`,
            bookingId: booking.id
          });
        }, timeUntilReminder);
      }
    });
  }

  // Get notification history
  public getNotifications(): NotificationData[] {
    return this.notifications;
  }

  // Mark notification as read
  public markAsRead(index: number): void {
    if (this.notifications[index]) {
      this.notifications[index].metadata = {
        ...this.notifications[index].metadata,
        read: true
      };
      this.saveNotifications();
    }
  }

  // Clear all notifications
  public clearNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
    toast.info('All notifications cleared.');
  }

  // Get unread notification count
  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.metadata?.read).length;
  }

  // Check if browser notifications are enabled
  public isBrowserNotificationEnabled(): boolean {
    return Notification.permission === 'granted';
  }

  // Test notification system
  public async testNotifications(): Promise<void> {
    await this.sendNotification({
      title: 'Test Notification',
      message: 'This is a test notification from CampSpot!',
      type: 'info',
      metadata: { test: true }
    });
  }
}

export default NotificationService;
