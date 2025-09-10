import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, CreditCard, Bell, MapPin, Calendar, X, Edit2 } from 'lucide-react';
import GeolocationService, { type NearbyService } from '../services/geolocationService';
import NotificationService from '../services/notificationService';
import NotificationsPage from '../components/profile/NotificationsPage';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';

const Profile = () => {
  const { user, bookings, updateProfile, cancelBooking, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [nearbyServices, setNearbyServices] = useState<NearbyService[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const geolocationService = GeolocationService.getInstance();
  const notificationService = NotificationService.getInstance();

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Handle URL hash-based tab navigation
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['profile', 'bookings', 'payments', 'notifications', 'location', 'settings'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/profile#${tabId}`, { replace: true });
  };

  const handleFindNearbyServices = async () => {
    setLoadingLocation(true);
    try {
      const services = await geolocationService.findNearbyServices(50);
      setNearbyServices(services);
    } catch (error) {
      console.error('Error finding nearby services:', error);
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
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile. Please try again.');
    }
  };

  const handleTestNotifications = async () => {
    await notificationService.testNotifications();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your profile</h2>
          <button className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors">
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{user.name}</h1>
                <p className="text-gray-600 break-all">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => logout(navigate)}
              className="text-red-600 hover:text-red-700 transition-colors text-sm sm:text-base"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-md mb-4 sm:mb-6">
          <div className="flex overflow-x-auto scrollbar-hide border-b">
            {[
              { id: 'profile', name: 'Profile', icon: User },
              { id: 'bookings', name: 'Bookings', icon: Calendar },
              { id: 'payments', name: 'Payments', icon: CreditCard },
              { id: 'notifications', name: 'Notifications', icon: Bell },
              { id: 'location', name: 'Nearby', icon: MapPin },
              { id: 'settings', name: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-4 sm:px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon size={16} />
                <span className="text-sm sm:text-base">{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-semibold">Personal Information</h2>
                  <button
                    onClick={() => setEditingProfile(!editingProfile)}
                    className="flex items-center space-x-2 text-teal-600 hover:text-teal-700 self-start sm:self-auto"
                  >
                    <Edit2 size={16} />
                    <span>{editingProfile ? 'Cancel' : 'Edit'}</span>
                  </button>
                </div>

                {editingProfile ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleProfileUpdate}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h3 className="font-medium text-gray-700">Name</h3>
                      <p className="text-gray-900">{user.name}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Email</h3>
                      <p className="text-gray-900">{user.email}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Phone</h3>
                      <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Member Since</h3>
                      <p className="text-gray-900">January 2024</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-semibold">Your Bookings</h2>
                  <span className="text-gray-600 text-sm sm:text-base">{bookings.length} total bookings</span>
                </div>

                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No bookings yet</h3>
                    <p className="text-gray-600">Start exploring and book your first adventure!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                          <div className="flex items-start sm:items-center space-x-4">
                            <div className="text-2xl flex-shrink-0">{getTypeIcon(booking.type)}</div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-semibold text-gray-800 break-words">{booking.name}</h3>
                              <p className="text-gray-600 text-sm sm:text-base">
                                {booking.date}
                                {booking.endDate && ` - ${booking.endDate}`}
                              </p>
                              {booking.location && (
                                <p className="text-sm text-gray-500">{booking.location}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </div>
                            <p className="text-lg font-semibold text-gray-800 mt-1">
                              €{booking.price}
                            </p>
                            {booking.status === 'confirmed' && (
                              <button
                                onClick={() => cancelBooking(booking.id)}
                                className="text-red-600 hover:text-red-700 text-sm mt-1"
                              >
                                Cancel
                              </button>
                            )}
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
                <h2 className="text-lg sm:text-xl font-semibold">Payment Methods</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard size={20} className="text-blue-600" />
                    <h3 className="font-medium text-blue-800">Secure Payment Processing</h3>
                  </div>
                  <p className="text-blue-700 mt-2">
                    All payments are processed securely through Stripe. Your payment information is encrypted and protected.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Saved Payment Methods</h3>
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                          VISA
                        </div>
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-gray-600">Expires 12/25</p>
                        </div>
                      </div>
                      <button className="text-red-600 hover:text-red-700 text-sm self-start sm:self-auto">Remove</button>
                    </div>
                  </div>
                  <button className="text-teal-600 hover:text-teal-700 font-medium">
                    + Add New Payment Method
                  </button>
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-semibold">Nearby Services</h2>
                  <button
                    onClick={handleFindNearbyServices}
                    disabled={loadingLocation}
                    className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors self-start sm:self-auto"
                  >
                    {loadingLocation ? 'Finding...' : 'Find Nearby'}
                  </button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <MapPin size={20} className="text-yellow-600" />
                    <h3 className="font-medium text-yellow-800">Location Services</h3>
                  </div>
                  <p className="text-yellow-700 mt-2">
                    Enable location access to find campsites, activities, and equipment rentals near you.
                  </p>
                </div>

                {nearbyServices.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Services within 50km</h3>
                    {nearbyServices.map((service) => (
                      <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-800 break-words">{service.name}</h4>
                            <p className="text-gray-600 text-sm sm:text-base">{service.description}</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                              <span className="text-sm text-gray-500">{service.distance}km away</span>
                              <span className="text-yellow-500 text-sm">⭐ {service.rating}</span>
                              {service.price && (
                                <span className="text-teal-600 font-semibold text-sm">€{service.price}</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => window.open(geolocationService.getDirectionsUrl(service), '_blank')}
                            className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors self-start sm:self-auto"
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

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-lg sm:text-xl font-semibold">Settings</h2>

                {/* Notification Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium">Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <p className="font-medium">Browser Notifications</p>
                        <p className="text-sm text-gray-600">Get notified about bookings and updates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationService.isBrowserNotificationEnabled()}
                        onChange={handleTestNotifications}
                        className="rounded self-start sm:self-auto"
                      />
                    </label>
                    <label className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <p className="font-medium">Email Notifications</p>
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
                        className="rounded self-start sm:self-auto"
                      />
                    </label>
                  </div>
                  <button
                    onClick={handleTestNotifications}
                    className="text-teal-600 hover:text-teal-700 text-sm"
                  >
                    Test Notifications
                  </button>
                </div>

                {/* Privacy Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium">Privacy</h3>
                  <label className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <p className="font-medium">Location Services</p>
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
                      className="rounded self-start sm:self-auto"
                    />
                  </label>
                </div>

                {/* Account Actions */}
                <div className="space-y-4">
                  <h3 className="font-medium">Account</h3>
                  <div className="space-y-2">
                    <button className="text-blue-600 hover:text-blue-700 text-sm">
                      Download My Data
                    </button>
                    <br />
                    <button 
                      onClick={() => notificationService.clearNotifications()}
                      className="text-orange-600 hover:text-orange-700 text-sm"
                    >
                      Clear Notification History
                    </button>
                    <br />
                    <button className="text-red-600 hover:text-red-700 text-sm">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
