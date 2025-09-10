import { useState, useEffect, useCallback } from 'react';
import { NotificationPollingService, NotificationUpdate } from '../services/notificationPollingService';
import backendNotificationService from '../services/backendNotificationService';
import { useAuth } from '../contexts/AuthContext';

export interface UseNotificationsResult {
  unreadCount: number;
  latestNotifications: any[];
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
}

export const useNotifications = (): UseNotificationsResult => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  
  // Get polling service instance
  const notificationPolling = NotificationPollingService.getInstance();

  // Handle notification updates from polling service
  const handleNotificationUpdate = useCallback((update: NotificationUpdate) => {
    console.log('🔔 Notification update received:', update);
    setUnreadCount(update.unreadCount);
    setLatestNotifications(update.latestNotifications);
  }, []);

  // Refresh notifications manually
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [unreadResponse, notificationsResponse] = await Promise.all([
        backendNotificationService.getUnreadCount(),
        backendNotificationService.getNotifications({ page: 1, limit: 5, unreadOnly: true })
      ]);

      if (unreadResponse?.success) {
        setUnreadCount(unreadResponse.unreadCount);
        notificationPolling.setCurrentUnreadCount(unreadResponse.unreadCount);
      }

      if (notificationsResponse?.success) {
        setLatestNotifications(notificationsResponse.notifications || []);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await backendNotificationService.markAsRead(notificationId);
      // Refresh to get updated counts
      await refreshNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [refreshNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await backendNotificationService.markAllAsRead();
      // Update local state immediately
      setUnreadCount(0);
      setLatestNotifications([]);
      notificationPolling.setCurrentUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  // Start polling
  const startPolling = useCallback(() => {
    if (!user) return;
    
    notificationPolling.startPolling(30000); // Poll every 30 seconds
    setIsPolling(true);
  }, [user]);

  // Stop polling
  const stopPolling = useCallback(() => {
    notificationPolling.stopPolling();
    setIsPolling(false);
  }, []);

  // Setup and cleanup
  useEffect(() => {
    if (!user) {
      // User logged out, stop polling and reset state
      stopPolling();
      setUnreadCount(0);
      setLatestNotifications([]);
      return;
    }

    // User logged in, setup notifications
    console.log('🔔 Setting up notifications for user:', user.email);
    
    // Add listener for polling updates
    notificationPolling.addListener(handleNotificationUpdate);
    
    // Initial load
    refreshNotifications();
    
    // Start polling
    startPolling();

    // Cleanup on unmount or user change
    return () => {
      notificationPolling.removeListener(handleNotificationUpdate);
    };
  }, [user, handleNotificationUpdate, refreshNotifications, startPolling, stopPolling]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopPolling();
      notificationPolling.removeListener(handleNotificationUpdate);
    };
  }, [handleNotificationUpdate, stopPolling]);

  return {
    unreadCount,
    latestNotifications,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    startPolling,
    stopPolling,
    isPolling
  };
};
