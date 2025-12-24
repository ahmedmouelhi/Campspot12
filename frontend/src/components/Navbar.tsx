import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, ChevronDown, LogOut, UserCircle, Calendar, Mail, Bell } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ContactModal from './ContactModal';

const Navbar = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { items, cartCount, getTotalPrice } = useCart();
  const [unreadCount, setUnreadCount] = useState(0);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/campsites', name: 'Campsites' },
    { path: '/activities', name: 'Activities' },
    { path: '/equipment', name: 'Equipment' },
    { path: '/about', name: 'About' },
    { path: '/blog', name: 'Blog' },
  ];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  // Fetch unread notification count
  React.useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('campspot_token');
        const response = await fetch('http://localhost:5000/api/notifications/unread-count', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        // Silently fail - notification feature might not be available
      }
    };

    fetchUnreadCount();
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchUnreadCount, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Logo variant="dark" size="md" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${isActive(link.path)
                  ? 'text-teal-600'
                  : 'text-gray-700 hover:text-teal-600'
                  }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/contact"
              className={`flex items-center space-x-1 text-sm font-medium transition-colors ${isActive('/contact')
                ? 'text-teal-600'
                : 'text-gray-700 hover:text-teal-600'
                }`}
            >
              <Mail size={16} />
              <span>Contact</span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart with Preview */}
            <div
              className="relative"
              onMouseEnter={() => setShowCartPreview(true)}
              onMouseLeave={() => setShowCartPreview(false)}
            >
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-teal-600 transition-colors"
              >
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-teal-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>

              {/* Cart Preview Dropdown */}
              {showCartPreview && cartCount > 0 && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 animate-fadeIn">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {items.slice(0, 3).map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm py-2 border-b border-gray-100">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium truncate">{item.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                        </div>
                        <span className="text-teal-600 font-semibold ml-2">€{(item.totalPrice || item.price || 0).toFixed(2)}</span>
                      </div>
                    ))}
                    {items.length > 3 && (
                      <p className="text-xs text-gray-500 text-center py-1">
                        +{items.length - 3} more {items.length - 3 === 1 ? 'item' : 'items'}
                      </p>
                    )}
                  </div>
                  <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-teal-600">€{(getTotalPrice() || 0).toFixed(2)}</span>
                  </div>
                  <Link
                    to="/checkout"
                    className="mt-3 w-full bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-700 transition-colors text-center block font-semibold"
                  >
                    Checkout
                  </Link>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            {isAuthenticated && (
              <Link
                to="/profile#notifications"
                className="relative p-2 text-gray-600 hover:text-teal-600 transition-colors"
                title="Notifications"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div
                className="relative"
                onMouseEnter={() => setShowUserMenu(true)}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                  <User size={20} className="text-gray-600" />
                  <span className="hidden md:block text-sm font-medium text-gray-700 max-w-32 truncate">
                    {user?.name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-0 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <UserCircle size={18} />
                      <span className="text-sm">My Profile</span>
                    </Link>

                    <Link
                      to="/profile#bookings"
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Calendar className="text-teal-600" size={18} />
                      <span className="text-sm">My Bookings</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="text-sm font-medium">Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                    >
                      <LogOut size={18} />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={() => navigate('/auth?mode=login')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => navigate('/auth?mode=register')}
                  className="px-4 py-2 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-teal-600"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block text-sm font-medium py-2 transition-colors ${isActive(link.path)
                  ? 'text-teal-600'
                  : 'text-gray-700'
                  }`}
                onClick={() => setShowMobileMenu(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/contact"
              className={`block text-sm font-medium py-2 transition-colors ${isActive('/contact')
                ? 'text-teal-600'
                : 'text-gray-700'
                }`}
              onClick={() => setShowMobileMenu(false)}
            >
              Contact
            </Link>

            {!isAuthenticated && (
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <button
                  onClick={() => {
                    navigate('/auth?mode=login');
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    navigate('/auth?mode=register');
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-2 text-sm font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Modal */}
      <ContactModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </nav>
  );
};

export default Navbar;
