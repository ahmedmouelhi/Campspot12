import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Shield, Settings, X, ShoppingCart } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import AuthModal from './AuthModal';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const {
    unreadCount,
    latestNotifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications();

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', name: 'Home' },
    { path: '/campsites', name: 'Campsites' },
    { path: '/activities', name: 'Activities' },
    { path: '/about', name: 'About' },
    { path: '/blog', name: 'Blog' },
    { path: '/equipment', name: 'Équipement' },
  ];

  const handleAuthClick = (tab: 'login' | 'register') => {
    setAuthTab(tab);
    setShowAuthModal(true);
  };

  // Load notifications when panel opens
  useEffect(() => {
    if (showNotificationPanel && isAuthenticated) {
      refreshNotifications();
    }
  }, [showNotificationPanel, isAuthenticated, refreshNotifications]);

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotificationPanel) {
        const target = event.target as Element;
        if (!target.closest('.notification-panel') && !target.closest('.notification-bell')) {
          setShowNotificationPanel(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationPanel]);

  const handleNotificationClick = () => {
    setShowNotificationPanel(!showNotificationPanel);
    if (!showNotificationPanel) {
      refreshNotifications();
    }
  };

  const clearAllNotifications = () => {
    markAllAsRead();
    setShowNotificationPanel(false);
    toast.success('All notifications cleared successfully!');
  };

  const handleNotificationItemClick = (notificationId: string) => {
    // Mark as read and navigate to notifications page
    markAsRead(notificationId);
    setShowNotificationPanel(false);
    navigate('/profile#notifications');
  };

  const handleViewAllNotifications = () => {
    setShowNotificationPanel(false);
    navigate('/profile#notifications');
  };

  return (
    <>
      <nav className="bg-white shadow-lg fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="text-2xl font-bold text-teal-600">CampSpot</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors ${
                    isActive(link.path)
                      ? 'text-teal-600 font-semibold'
                      : 'text-gray-700 hover:text-teal-600'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {/* Admin Access for authenticated admins */}
                  {isAdmin && (
                    <button
                      onClick={() => navigate('/admin')}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Shield size={16} />
                      <span className="text-sm font-medium">Admin Panel</span>
                    </button>
                  )}
                  
                  {/* Notification Bell */}
                  <div className="relative">
                    <button 
                      onClick={handleNotificationClick}
                      className="notification-bell relative p-2 text-gray-700 hover:text-teal-600 transition-colors"
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Desktop Notification Panel */}
                    {showNotificationPanel && (
                      <div className="notification-panel absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden hidden md:block">
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                            <div className="flex items-center space-x-2">
                              {unreadCount > 0 && (
                                <button
                                  onClick={clearAllNotifications}
                                  className="text-sm text-red-600 hover:text-red-800"
                                >
                                  Clear All
                                </button>
                              )}
                              <button
                                onClick={() => setShowNotificationPanel(false)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                          {isLoading ? (
                            <div className="p-4 text-center text-gray-500">
                              <p>Loading notifications...</p>
                            </div>
                          ) : latestNotifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                              <p>No notifications yet</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {latestNotifications.map((notification) => (
                                <div 
                                  key={notification.id}
                                  className={`p-3 hover:bg-gray-50 cursor-pointer ${
                                    notification.read ? 'opacity-70' : 'bg-blue-50'
                                  }`}
                                  onClick={() => handleNotificationItemClick(notification.id)}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                      {notification.type === 'campsite' && <span className="text-green-500">🏕️</span>}
                                      {notification.type === 'booking' && <span className="text-blue-500">📅</span>}
                                      {notification.type === 'user' && <span className="text-purple-500">👤</span>}
                                      {notification.type === 'admin' && <span className="text-red-500">🛡️</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                      <p className="text-sm text-gray-600 truncate">{notification.message}</p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {new Date(notification.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* View All Link */}
                          {latestNotifications.length > 5 && (
                            <div className="p-3 border-t border-gray-200">
                              <button 
                                onClick={handleViewAllNotifications}
                                className="w-full text-center text-sm text-teal-600 hover:text-teal-800 font-medium"
                              >
                                View All Notifications
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Cart Icon */}
                  <Link to="/cart" className="relative p-2 text-gray-700 hover:text-teal-600 transition-colors">
                    <ShoppingCart size={20} />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Link>
                  
                  {/* Profile Link */}
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-gray-700 hover:text-teal-600 transition-colors"
                  >
                    <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:block">{user?.name}</span>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="text-gray-700 hover:text-teal-600 transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => handleAuthClick('register')}
                    className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-3 py-2 transition-colors ${
                    isActive(link.path)
                      ? 'text-teal-600 font-semibold bg-teal-50'
                      : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  {/* Admin Access for mobile */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      <Shield size={16} />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  
                  {/* Notifications for mobile */}
                  <div className="relative">
                    <button
                      onClick={handleNotificationClick}
                      className="notification-bell flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-teal-600 w-full text-left"
                    >
                      <div className="relative">
                        <Bell size={16} />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Mobile Notification Panel */}
                    {showNotificationPanel && (
                      <div className="notification-panel absolute left-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                            <div className="flex items-center space-x-2">
                              {unreadCount > 0 && (
                                <button
                                  onClick={clearAllNotifications}
                                  className="text-sm text-red-600 hover:text-red-800"
                                >
                                  Clear All
                                </button>
                              )}
                              <button
                                onClick={() => setShowNotificationPanel(false)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="max-h-80 overflow-y-auto">
                          {isLoading ? (
                            <div className="p-4 text-center text-gray-500">
                              <p>Loading notifications...</p>
                            </div>
                          ) : latestNotifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                              <p>No notifications yet</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-200">
                              {latestNotifications.map((notification) => (
                                <div 
                                  key={`mobile-${notification.id}`}
                                  className={`p-3 hover:bg-gray-50 cursor-pointer ${
                                    notification.read ? 'opacity-70' : 'bg-blue-50'
                                  }`}
                                  onClick={() => handleNotificationItemClick(notification.id)}
                                >
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                      {notification.type === 'campsite' && <span className="text-green-500">🏕️</span>}
                                      {notification.type === 'booking' && <span className="text-blue-500">📅</span>}
                                      {notification.type === 'user' && <span className="text-purple-500">👤</span>}
                                      {notification.type === 'admin' && <span className="text-red-500">🛡️</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                      <p className="text-sm text-gray-600 truncate">{notification.message}</p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        {new Date(notification.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* View All Link */}
                          {latestNotifications.length > 5 && (
                            <div className="p-3 border-t border-gray-200">
                              <button 
                                onClick={() => {
                                  handleViewAllNotifications();
                                  setIsOpen(false);
                                }}
                                className="w-full text-center text-sm text-teal-600 hover:text-teal-800 font-medium"
                              >
                                View All Notifications
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Cart for mobile */}
                  <Link
                    to="/cart"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-teal-600"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="relative">
                      <ShoppingCart size={16} />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                    </div>
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="ml-auto bg-teal-500 text-white text-xs px-2 py-1 rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  
                  {/* Profile for mobile */}
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:text-teal-600"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span>Profile ({user?.name})</span>
                  </Link>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="w-full text-left px-3 py-2 text-gray-700 hover:text-teal-600"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => handleAuthClick('register')}
                    className="w-full bg-teal-600 text-white px-3 py-2 rounded-lg hover:bg-teal-700"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authTab}
      />
    </>
  );
};

export default Navbar;
