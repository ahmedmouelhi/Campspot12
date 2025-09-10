import { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle, 
  Trash2, 
  Check, 
  Filter,
  Calendar,
  User,
  Globe
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import backendNotificationService from '../../services/backendNotificationService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'campsite' | 'booking' | 'user' | 'admin' | 'success' | 'warning' | 'error' | 'info';
  userId?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  totalCount?: number;
  unreadCount?: number;
}

const NotificationsPage = () => {
  const {
    unreadCount: hookUnreadCount,
    latestNotifications,
    isLoading: hookLoading,
    markAsRead: hookMarkAsRead,
    markAllAsRead: hookMarkAllAsRead,
    refreshNotifications
  } = useNotifications();
  
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    type: string;
    unreadOnly: boolean;
  }>({
    type: '',
    unreadOnly: false
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    unreadCount: 0
  });

  useEffect(() => {
    loadNotifications();
  }, [filter, pagination.page]);
  
  // Update pagination unread count from hook
  useEffect(() => {
    setPagination(prev => ({ ...prev, unreadCount: hookUnreadCount }));
  }, [hookUnreadCount]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await backendNotificationService.getNotifications({
        page: pagination.page,
        limit: pagination.limit,
        unreadOnly: filter.unreadOnly
      });

      if (response.success) {
        setAllNotifications(response.notifications || []);
        setPagination(prev => ({
          ...prev,
          total: response.totalCount || 0,
          totalPages: Math.ceil((response.totalCount || 0) / prev.limit)
        }));
      } else {
        // Failed to load notifications
      }
    } catch (error) {
      // Error loading notifications
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    // Use the hook's markAsRead function
    await hookMarkAsRead(notificationId);
    
    // Update local state
    setAllNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const markAllAsRead = async () => {
    // Use the hook's markAllAsRead function
    await hookMarkAllAsRead();
    
    // Update local state
    setAllNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await backendNotificationService.deleteNotification(notificationId);
      
      if (response.success) {
        setAllNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1
        }));
        // Refresh hook data
        refreshNotifications();
      }
    } catch (error) {
      // Error deleting notification
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'campsite':
        return <span className="text-green-500 text-xl">🏕️</span>;
      case 'booking':
        return <span className="text-blue-500 text-xl">📅</span>;
      case 'user':
        return <span className="text-purple-500 text-xl">👤</span>;
      case 'admin':
        return <span className="text-red-500 text-xl">🛡️</span>;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case 'campsite':
        return 'border-l-green-500';
      case 'booking':
        return 'border-l-blue-500';
      case 'user':
        return 'border-l-purple-500';
      case 'admin':
        return 'border-l-red-500';
      case 'success':
        return 'border-l-green-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'error':
        return 'border-l-red-500';
      case 'info':
      default:
        return 'border-l-blue-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          {pagination.unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {pagination.unreadCount}
            </span>
          )}
        </div>
        
        {pagination.unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="campsite">Campsite</option>
              <option value="booking">Booking</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filter.unreadOnly}
                onChange={(e) => setFilter(prev => ({ ...prev, unreadOnly: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Unread only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {allNotifications.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filter.unreadOnly 
                ? "You have no unread notifications." 
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          allNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl p-4 shadow-lg border-l-4 ${getNotificationBorderColor(notification.type)} ${
                !notification.read ? 'ring-2 ring-blue-100' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getNotificationIcon(notification.type)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className={`text-lg font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                      {!notification.userId && (
                        <Globe className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    
                    <p className={`text-sm mb-3 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>
                      
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {notification.type}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Metadata details */}
              {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">
                      View details
                    </summary>
                    <div className="mt-2 bg-gray-50 p-2 rounded text-xs font-mono">
                      {Object.entries(notification.metadata)
                        .filter(([key]) => !['timestamp', 'read'].includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="flex">
                            <span className="font-semibold min-w-0 w-1/3">{key}:</span>
                            <span className="ml-2 break-all">{JSON.stringify(value)}</span>
                          </div>
                        ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} notifications
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="bg-white rounded-xl p-4 shadow-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{pagination.total}</div>
            <div className="text-xs text-blue-600">Total</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{pagination.unreadCount}</div>
            <div className="text-xs text-red-600">Unread</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{pagination.total - pagination.unreadCount}</div>
            <div className="text-xs text-green-600">Read</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{pagination.totalPages}</div>
            <div className="text-xs text-gray-600">Pages</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
