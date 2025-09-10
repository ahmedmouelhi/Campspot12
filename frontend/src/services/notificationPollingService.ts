import backendNotificationService from './backendNotificationService';

export interface NotificationUpdate {
  unreadCount: number;
  latestNotifications: any[];
}

export class NotificationPollingService {
  private static instance: NotificationPollingService;
  private intervalId: number | null = null;
  private listeners: Array<(update: NotificationUpdate) => void> = [];
  private lastUnreadCount = 0;
  private isPolling = false;
  private pollingInterval = 30000; // 30 seconds

  static getInstance(): NotificationPollingService {
    if (!this.instance) {
      this.instance = new NotificationPollingService();
    }
    return this.instance;
  }

  /**
   * Start polling for notification updates
   */
  startPolling(interval: number = 30000) {
    if (this.isPolling) {
      console.log('🔔 Notification polling already active');
      return;
    }

    this.pollingInterval = interval;
    this.isPolling = true;
    
    console.log(`🔔 Starting notification polling every ${interval / 1000} seconds`);
    
    // Poll immediately, then set interval
    this.pollForUpdates();
    
    this.intervalId = window.setInterval(() => {
      this.pollForUpdates();
    }, interval);
  }

  /**
   * Stop polling for notification updates
   */
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isPolling = false;
      console.log('🔔 Notification polling stopped');
    }
  }

  /**
   * Add a listener for notification updates
   */
  addListener(callback: (update: NotificationUpdate) => void) {
    this.listeners.push(callback);
    console.log('🔔 Notification listener added');
  }

  /**
   * Remove a listener
   */
  removeListener(callback: (update: NotificationUpdate) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
    console.log('🔔 Notification listener removed');
  }

  /**
   * Manually trigger a poll for updates
   */
  async pollNow() {
    await this.pollForUpdates();
  }

  /**
   * Internal method to poll for updates
   */
  private async pollForUpdates() {
    try {
      // Get current unread count
      const unreadCountResponse = await backendNotificationService.getUnreadCount();
      if (!unreadCountResponse?.success) {
        console.warn('Failed to get unread count');
        return;
      }

      const currentUnreadCount = unreadCountResponse.unreadCount;

      // Check if unread count changed
      if (currentUnreadCount !== this.lastUnreadCount) {
        console.log(`🔔 Unread count changed: ${this.lastUnreadCount} → ${currentUnreadCount}`);
        
        // Get latest notifications to show what's new
        const notificationsResponse = await backendNotificationService.getNotifications({
          page: 1,
          limit: 5,
          unreadOnly: true
        });

        const update: NotificationUpdate = {
          unreadCount: currentUnreadCount,
          latestNotifications: notificationsResponse?.notifications || []
        };

        // Notify all listeners
        this.listeners.forEach(listener => {
          try {
            listener(update);
          } catch (error) {
            console.error('Error in notification listener:', error);
          }
        });

        this.lastUnreadCount = currentUnreadCount;
      }
    } catch (error) {
      console.error('Error polling for notification updates:', error);
      // Don't stop polling on error, just log it
    }
  }

  /**
   * Set the current unread count (useful for initialization)
   */
  setCurrentUnreadCount(count: number) {
    this.lastUnreadCount = count;
  }

  /**
   * Get current polling status
   */
  getPollingStatus() {
    return {
      isPolling: this.isPolling,
      interval: this.pollingInterval,
      listenersCount: this.listeners.length,
      lastUnreadCount: this.lastUnreadCount
    };
  }
}

// Export singleton instance
export const notificationPolling = NotificationPollingService.getInstance();
