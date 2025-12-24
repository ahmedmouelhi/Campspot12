import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User, Settings, CreditCard, Bell, MapPin, Calendar, X, Edit2,
  Camera, Lock, Heart, History, Eye, Download, Trash2
} from 'lucide-react';
import GeolocationService, { type NearbyService } from '../services/geolocationService';
import NotificationService from '../services/notificationService';
import WebSocketService from '../services/WebSocketService';
import NotificationsPage from '../components/profile/NotificationsPage';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';

const Profile = () => {
  const { user, bookings, updateProfile, cancelBooking, logout, fetchBackendBookings } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [nearbyServices, setNearbyServices] = useState<NearbyService[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const geolocationService = GeolocationService.getInstance();
  const notificationService = NotificationService.getInstance();
  const wsService = WebSocketService.getInstance();

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Fetch backend bookings on mount and poll for updates
  useEffect(() => {
    if (user) {
      fetchBackendBookings();

      // Poll every 10 seconds for real-time updates
      const pollInterval = setInterval(() => {
        fetchBackendBookings();
      }, 10000); // 10 seconds

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [user]);

  // Handle URL hash-based tab navigation
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['profile', 'bookings', 'payments', 'notifications', 'location', 'settings'].includes(hash)) {
      setActiveTab(hash);
      if (hash === 'bookings') {
        fetchBackendBookings();
      }
    }
  }, [location.hash]);

  // Auto-refresh bookings every 30 seconds when on bookings tab
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTab === 'bookings') {
      interval = setInterval(() => {
        fetchBackendBookings();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, fetchBackendBookings]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/profile#${tabId}`, { replace: true });
    if (tabId === 'bookings') {
      fetchBackendBookings();
    }
  };

  const handleFindNearbyServices = async () => {
    setLoadingLocation(true);
    try {
      const services = await geolocationService.findNearbyServices(50);
      setNearbyServices(services);
    } catch (error) {
      toast.error('Failed to find nearby services');
    }
    setLoadingLocation(false);
  };

  const handleProfileUpdate = async () => {
    try {
      const response = await apiService.updateProfile(profileForm);
      if (response.success && response.user) {
        updateProfile({
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone
        });
        setEditingProfile(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    // Stronger password validation
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      toast.error('Password must contain uppercase, lowercase, number, and special character (@$!%*?&)');
      return;
    }

    try {
      const response = await apiService.request('/user/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setAvatarFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast.error('Please select an image first');
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await apiService.request('/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiService.getToken()}`
        },
        body: formData
      }) as any; // Type assertion needed for FormData upload

      // Update user profile with new avatar
      if (response.data?.avatar) {
        const avatarUrl = response.data.avatar.startsWith('http')
          ? response.data.avatar
          : `${window.location.protocol}//${window.location.hostname}:5000${response.data.avatar}`;
        updateProfile({ avatar: avatarUrl });
      }

      toast.success('Avatar uploaded successfully!');
      setShowAvatarModal(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleTestNotifications = async () => {
    await notificationService.testNotifications();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'campsite': return '🏕️';
      case 'activity': return '🥾';
      case 'equipment': return '⛺';
      default: return '📋';
    }
  };

  const getBookingCount = () => {
    const count = bookings.length;
    return count === 1 ? '1 Booking' : `${count} Bookings`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your profile</h2>
          <button
            onClick={() => navigate('/auth?mode=login')}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Enhanced Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between space-y-6 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              {/* Avatar with Upload */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-4 ring-teal-100">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowAvatarModal(true)}
                  className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  title="Change avatar"
                >
                  <Camera size={28} />
                </button>
              </div>

              {/* User Info */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{user.name}</h1>
                <p className="text-gray-600 mb-2">{user.email}</p>
                <p className="text-sm text-gray-500">Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2024'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setEditingProfile(!editingProfile)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Edit2 size={16} />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Lock size={16} />
                <span>Change Password</span>
              </button>
              <button
                onClick={() => logout(navigate)}
                className="text-red-600 hover:text-red-700 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              { id: 'profile', name: 'Profile', icon: User, count: null },
              { id: 'bookings', name: 'Bookings', icon: Calendar, count: bookings.length },
              { id: 'payments', name: 'Payments', icon: CreditCard, count: null },
              { id: 'notifications', name: 'Notifications', icon: Bell, count: null },
              { id: 'location', name: 'Nearby', icon: MapPin, count: null },
              { id: 'settings', name: 'Settings', icon: Settings, count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 sm:px-6 py-4 border-b-4 transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'border-teal-600 bg-teal-50 text-teal-700 font-semibold'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                <tab.icon size={18} />
                <span className="text-sm sm:text-base">{tab.name}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className="bg-teal-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Personal Information</h2>
                </div>

                {editingProfile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={handleProfileUpdate}
                        className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Name</h3>
                      <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                      <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                      <p className="text-lg font-semibold text-gray-900">{user.phone || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Member Since</h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2024'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Enhanced Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Your Bookings</h2>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={fetchBackendBookings}
                      className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-sm font-medium">Refresh</span>
                    </button>
                    <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {getBookingCount()}
                    </span>
                  </div>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl">
                    <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No bookings yet</h3>
                    <p className="text-gray-600 mb-6">Start exploring and book your first adventure!</p>
                    <button
                      onClick={() => navigate('/campsites')}
                      className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                    >
                      Explore Campsites
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all bg-white">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="text-4xl flex-shrink-0">{getTypeIcon(booking.type)}</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{booking.name || 'Booking'}</h3>
                              <p className="text-gray-600 mb-1">
                                {booking.date}
                                {booking.endDate && ` - ${booking.endDate}`}
                              </p>
                              {booking.status === 'cancelled' && booking.cancelledAt && (
                                <p className="text-sm text-red-600 flex items-center">
                                  <X size={14} className="mr-1" />
                                  Cancelled on {new Date(booking.cancelledAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                              {booking.location && (
                                <p className="text-sm text-gray-500 flex items-center">
                                  <MapPin size={14} className="mr-1" />
                                  {booking.location}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-start lg:items-end space-y-3">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${getStatusColor(booking.status)}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                            <p className="text-3xl font-bold text-gray-900">
                              €{typeof booking.price === 'number' ? booking.price.toFixed(2) : booking.price}
                            </p>

                            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                              <button
                                onClick={() => navigate(`/booking/${booking.id}`)}
                                className="flex items-center space-x-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                              >
                                <Eye size={16} />
                                <span>View Details</span>
                              </button>

                              {booking.status === 'approved' && (
                                <button
                                  onClick={() => navigate(`/payment/${booking.id}`, { state: { booking } })}
                                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                  <CreditCard size={16} />
                                  <span>Pay Now</span>
                                </button>
                              )}

                              {(booking.status === 'confirmed' || booking.status === 'pending') && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to cancel this booking?')) {
                                      try {
                                        // Call the appropriate cancel endpoint based on booking type
                                        if (booking.type === 'activity') {
                                          await apiService.request(`/activity-bookings/${booking.id}/cancel`, { method: 'POST' });
                                        } else if (booking.type === 'equipment') {
                                          await apiService.request(`/equipment-bookings/${booking.id}/cancel`, { method: 'POST' });
                                        } else {
                                          // Default to campsite booking
                                          await cancelBooking(booking.id);
                                        }
                                        await fetchBackendBookings();
                                        toast.success('Booking cancelled successfully');
                                      } catch (error: any) {
                                        toast.error(error.message || 'Failed to cancel booking');
                                      }
                                    }
                                  }}
                                  className="flex items-center space-x-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                                >
                                  <X size={16} />
                                  <span>Cancel</span>
                                </button>
                              )}

                              {(booking.status === 'cancelled' || booking.status === 'rejected') && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) {
                                      try {
                                        // Call the appropriate delete endpoint based on booking type
                                        if (booking.type === 'activity') {
                                          await apiService.request(`/activity-bookings/${booking.id}`, { method: 'DELETE' });
                                        } else if (booking.type === 'equipment') {
                                          await apiService.request(`/equipment-bookings/${booking.id}`, { method: 'DELETE' });
                                        } else {
                                          // Default to campsite booking
                                          await apiService.deleteBooking(booking.id);
                                        }
                                        await fetchBackendBookings();
                                        toast.success('Booking permanently deleted');
                                      } catch (error: any) {
                                        toast.error(error.message || 'Failed to delete booking');
                                      }
                                    }
                                  }}
                                  className="flex items-center space-x-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                >
                                  <Trash2 size={16} />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <NotificationsPage />
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Payment Methods</h2>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <CreditCard size={24} className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">Secure Payment Processing</h3>
                  </div>
                  <p className="text-blue-800">
                    All payments are processed securely through Stripe. Your payment information is encrypted and protected.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Saved Payment Methods</h3>
                  <div className="space-y-3">
                    <div className="border-2 border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0 bg-white">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-lg">
                          VISA
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">•••• •••• •••• 4242</p>
                          <p className="text-sm text-gray-600">Expires 12/25</p>
                        </div>
                      </div>
                      <button className="text-red-600 hover:text-red-700 font-medium text-sm self-start sm:self-auto">
                        Remove
                      </button>
                    </div>
                  </div>
                  <button className="text-teal-600 hover:text-teal-700 font-semibold flex items-center space-x-2">
                    <span>+</span>
                    <span>Add New Payment Method</span>
                  </button>
                </div>
              </div>
            )}

            {/* Location Tab - Keep existing implementation */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Nearby Services</h2>
                  <button
                    onClick={handleFindNearbyServices}
                    disabled={loadingLocation}
                    className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium self-start sm:self-auto"
                  >
                    {loadingLocation ? 'Finding...' : 'Find Nearby'}
                  </button>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <MapPin size={24} className="text-yellow-600" />
                    <h3 className="text-lg font-semibold text-yellow-900">Location Services</h3>
                  </div>
                  <p className="text-yellow-800">
                    Enable location access to find campsites, activities, and equipment rentals near you.
                  </p>
                </div>

                {nearbyServices.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Services within 50km</h3>
                    {nearbyServices.map((service) => (
                      <div key={service.id} className="border-2 border-gray-200 rounded-xl p-6 bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h4>
                            <p className="text-gray-600 mb-2">{service.description}</p>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="text-sm text-gray-500 flex items-center">
                                <MapPin size={14} className="mr-1" />
                                {service.distance}km away
                              </span>
                              <span className="text-yellow-500 text-sm flex items-center">
                                ⭐ {service.rating}
                              </span>
                              {service.price && (
                                <span className="text-teal-600 font-semibold">€{service.price}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => window.open(geolocationService.getDirectionsUrl(service), '_blank')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium self-start sm:self-auto"
                          >
                            Directions
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab - Keep existing implementation with enhancements */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h2>

                {/* Notification Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <div className="space-y-4">
                    <label className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Browser Notifications</p>
                        <p className="text-sm text-gray-600">Get notified about bookings and updates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationService.isBrowserNotificationEnabled()}
                        onChange={handleTestNotifications}
                        className="rounded h-5 w-5 text-teal-600 self-start sm:self-auto"
                      />
                    </label>
                    <label className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive booking confirmations and receipts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={user.preferences?.notifications || false}
                        onChange={(e) => updateProfile({
                          preferences: {
                            ...user.preferences,
                            notifications: e.target.checked
                          }
                        })}
                        className="rounded h-5 w-5 text-teal-600 self-start sm:self-auto"
                      />
                    </label>
                  </div>
                  <button
                    onClick={handleTestNotifications}
                    className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                  >
                    Test Notifications
                  </button>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Privacy</h3>
                  <label className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Location Services</p>
                      <p className="text-sm text-gray-600">Allow location access for nearby services</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={user.preferences?.location || false}
                      onChange={(e) => updateProfile({
                        preferences: {
                          ...user.preferences,
                          location: e.target.checked
                        }
                      })}
                      className="rounded h-5 w-5 text-teal-600 self-start sm:self-auto"
                    />
                  </label>
                </div>

                {/* Account Actions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Account</h3>
                  <div className="space-y-3">
                    <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium">
                      <Download size={16} />
                      <span>Download My Data</span>
                    </button>
                    <button
                      onClick={() => notificationService.clearNotifications()}
                      className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium"
                    >
                      <Trash2 size={16} />
                      <span>Clear Notification History</span>
                    </button>
                    <button className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium">
                      <Trash2 size={16} />
                      <span>Delete Account</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                  minLength={6}
                />
              </div>
              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Avatar Upload Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Change Avatar</h3>
              <button
                onClick={() => {
                  setShowAvatarModal(false);
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Avatar Preview */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                    ) : user?.avatar ? (
                      <img src={user.avatar} alt="Current avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-4xl font-bold">
                        {user?.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* File Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Choose Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleAvatarUpload}
                  disabled={!avatarFile || uploadingAvatar}
                  className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                </button>
                <button
                  onClick={() => {
                    setShowAvatarModal(false);
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
