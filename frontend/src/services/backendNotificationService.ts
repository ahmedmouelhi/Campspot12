const API_BASE_URL = 'http://localhost:5000/api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'campsite' | 'booking' | 'user' | 'admin';
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  success: boolean;
  notifications?: Notification[];
  totalCount?: number;
  unreadCount?: number;
  message?: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

class BackendNotificationService {
  private getAuthHeaders() {
    const token = localStorage.getItem('campspot_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get notifications from backend
   */
  async getNotifications(params: GetNotificationsParams = {}): Promise<NotificationResponse> {
    try {
      const { page = 1, limit = 10, unreadOnly = false } = params;
      const url = new URL(`${API_BASE_URL}/notifications`);

      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());
      if (unreadOnly) {
        url.searchParams.append('unreadOnly', 'true');
      }

      console.log('🔔 Fetching notifications from:', url.toString());

      const response = await fetch(url.toString(), {
        headers: this.getAuthHeaders()
      });

      console.log('🔔 Notifications response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔔 Notifications data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return {
        success: false,
        unreadCount: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new notification (for testing purposes)
   */
  async createNotification(notification: {
    title: string;
    message: string;
    type: 'campsite' | 'booking' | 'user' | 'admin';
    userId?: string;
  }): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(notification)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<NotificationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export default new BackendNotificationService();
