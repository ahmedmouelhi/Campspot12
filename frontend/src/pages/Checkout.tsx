import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CreditCard, Lock, User, Mail, Phone, MapPin, Calendar, Users, Clock, Shield, Bell } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useAuthCheck } from '../hooks/useAuthCheck';
import apiService from '../services/apiService';

interface BookingFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, isAuthenticated, fetchBackendBookings } = useAuth();
  const { requireAuthForCheckout } = useAuthCheck();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    zipCode: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };



  const validateForm = (): boolean => {
    const requiredFields: (keyof BookingFormData)[] = [
      'email', 'firstName', 'lastName', 'phone', 'address', 'city', 'zipCode'
    ];

    for (const field of requiredFields) {
      if (!formData[field].trim()) {
        toast.error(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Check if user is authenticated before proceeding
    if (!requireAuthForCheckout()) {
      return; // Auth hook handles the redirect
    }

    setIsProcessing(true);

    try {
      console.log('🚀 Starting checkout process...');
      console.log('📦 Cart items:', items);
      console.log('📊 Number of items:', items.length);

      // Process each cart item
      for (const item of items) {
        console.log('🔍 Processing item:', item);
        console.log('🏷️ Item type:', item.type);

        if (item.type === 'campsite') {
          console.log('🏕️ Creating campsite booking...');
          // Create booking request (status will be 'pending' awaiting admin approval)
          // Cart stores IDs like: 'campsite-{objectId}-{dates}'
          // Extract only the MongoDB ObjectId (first part after removing prefix)
          const campsiteId = item.id.replace(/^campsite-/, '').split('-')[0];

          console.log('🔍 Booking Debug:', {
            originalId: item.id,
            strippedId: campsiteId,
            itemType: item.type
          });

          const bookingData = {
            campingSiteId: campsiteId,
            startDate: item.checkIn!,
            endDate: item.checkOut!,
            guests: item.guests,
            equipment: [], // Can be expanded for equipment rentals
            activities: [], // Can be expanded for activities
            specialRequests: ''
          };

          console.log('📝 Booking data:', bookingData);

          try {
            console.log('📡 Calling createBooking API...');
            const bookingResponse = await apiService.createBooking(bookingData);
            console.log('✅ Booking API response:', bookingResponse);
            if (bookingResponse.success) {
              toast.success(`✅ Booking request submitted: ${item.name}`);
            }
          } catch (bookingError: any) {
            console.error('Failed to create campsite booking:', bookingError);
            toast.error(`❌ Failed to book ${item.name}: ${bookingError.message}`);
            // Continue with other bookings even if one fails
          }
        } else if (item.type === 'activity') {
          // Create activity booking via backend API
          const activityId = item.id.replace(/^activity-/, '').split('-')[0];

          const activityBookingData = {
            activityId,
            date: item.date!,
            time: item.time || '09:00',
            participants: item.participants || 1,
            specialRequests: ''
          };

          try {
            const bookingResponse = await apiService.createActivityBooking(activityBookingData);
            if (bookingResponse.success) {
              toast.success(`✅ Activity booking request submitted: ${item.name}`);
            }
          } catch (bookingError: any) {
            console.error('Failed to create activity booking:', bookingError);
            toast.error(`❌ Failed to book ${item.name}: ${bookingError.message}`);
          }
        } else if (item.type === 'equipment') {
          // Create equipment booking via backend API
          const equipmentId = item.id.replace(/^equipment-/, '').split('-')[0];

          const equipmentBookingData = {
            equipmentId,
            startDate: item.startDate!,
            endDate: item.endDate!,
            quantity: item.quantity || 1,
            specialRequests: ''
          };

          try {
            const bookingResponse = await apiService.createEquipmentBooking(equipmentBookingData);
            if (bookingResponse.success) {
              toast.success(`✅ Equipment booking request submitted: ${item.name}`);
            }
          } catch (bookingError: any) {
            console.error('Failed to create equipment booking:', bookingError);
            toast.error(`❌ Failed to book ${item.name}: ${bookingError.message}`);
          }
        }
      }

      // Clear cart after all bookings are processed
      clearCart();

      // Fetch updated bookings from backend
      await fetchBackendBookings();

      // Show booking request submitted notification
      toast.success('🎉 Booking request submitted successfully!');
      toast.info('⏳ Your booking is pending admin approval. You will be notified once approved.');
      toast.info('💳 Payment will be required after admin approval.');

      // Navigate to profile page to see pending bookings
      setTimeout(() => {
        navigate('/profile#bookings');
      }, 2000);

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error('❌ Failed to submit booking request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated && showLoginPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Lock className="w-16 h-16 text-teal-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Login Required</h2>
            <p className="text-gray-600 mb-8">
              You need to be logged in to complete your booking. Please log in to continue with your purchase.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => {
                  // Save cart state and redirect to login
                  sessionStorage.setItem('checkout_redirect', 'true');
                  navigate('/profile');
                }}
                className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors font-medium"
              >
                Log In to Continue
              </button>
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigate('/cart');
                }}
                className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">Add some items to your cart before checking out.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Order Summary</h2>
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="text-sm text-teal-600 hover:text-teal-700 underline"
              >
                Edit Cart
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.id} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{item.type}</p>

                      {item.type === 'campsite' && (
                        <div className="text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            <span>{item.checkIn} to {item.checkOut}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Users size={14} className="mr-1" />
                            <span>{item.guests} guests • {item.nights} nights</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            €{(item.totalPrice / item.nights).toFixed(2)} × {item.nights} nights
                          </div>
                        </div>
                      )}

                      {item.type === 'activity' && (
                        <div className="text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            <span>{item.date}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock size={14} className="mr-1" />
                            <span>{item.time} • {item.participants} participants</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            €{(item.totalPrice / (item.participants || 1)).toFixed(2)} × {item.participants} participants
                          </div>
                        </div>
                      )}

                      {item.type === 'equipment' && (
                        <div className="text-sm text-gray-600 mt-1">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            <span>{item.startDate} to {item.endDate}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <span>Qty: {item.quantity} • {item.days} days</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            €{(item.totalPrice / ((item.quantity || 1) * (item.days || 1))).toFixed(2)} × {item.quantity} × {item.days} days
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-teal-600">€{(item.totalPrice || item.price || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between items-center text-xl font-bold text-gray-800">
                <span>Total:</span>
                <span className="text-teal-600">€{getTotalPrice().toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full text-sm text-gray-600 hover:text-gray-800 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Continue Shopping
              </button>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Booking Request</h2>
            </div>

            {/* Authentication Status */}
            {isAuthenticated && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm text-green-700">Logged in as {user?.email}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contact Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User size={16} className="inline mr-2" />
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail size={16} className="inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone size={16} className="inline mr-2" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Billing Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-2" />
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  🔒 <strong>Privacy:</strong> Your contact details are used only for booking confirmations and notifications. We never share your information with third parties.
                </p>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="mb-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/terms')}
                      className="text-teal-600 hover:text-teal-700 underline"
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/privacy')}
                      className="text-teal-600 hover:text-teal-700 underline"
                    >
                      Privacy Policy
                    </button>
                  </span>
                </label>
              </div>


              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting Booking Request...</span>
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    <span>Submit Booking Request (€{getTotalPrice().toFixed(2)})</span>
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <Lock size={14} className="text-green-600" />
                  <span>Secure data handling</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield size={14} className="text-blue-600" />
                  <span>Privacy protected</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CreditCard size={14} className="text-teal-600" />
                  <span>No payment now</span>
                </div>
              </div>

              {/* Approval Process Explanation */}
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Bell size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-800 font-medium mb-2">
                      📋 How the booking process works:
                    </p>
                    <ol className="text-sm text-yellow-800 space-y-1 ml-4 list-decimal">
                      <li>Submit your booking request (no payment required)</li>
                      <li>Our team reviews your request (usually within 24 hours)</li>
                      <li>You'll receive a notification once approved</li>
                      <li>Complete payment securely after approval</li>
                    </ol>
                    <details className="mt-3">
                      <summary className="text-sm font-medium text-yellow-900 cursor-pointer hover:text-yellow-700">
                        Why is approval needed?
                      </summary>
                      <p className="text-sm text-yellow-800 mt-2 ml-4">
                        We manually review each booking to ensure availability, verify special requests,
                        and provide personalized service. This helps us maintain quality and prevent
                        double-bookings while giving you the best camping experience.
                      </p>
                    </details>
                  </div>
                </div>
              </div>

              {/* Guarantees and Policies */}
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/cancellation-policy')}
                    className="text-teal-600 hover:text-teal-700 underline"
                  >
                    Cancellation Policy
                  </button>
                  {' • '}
                  <button
                    type="button"
                    onClick={() => navigate('/contact')}
                    className="text-teal-600 hover:text-teal-700 underline"
                  >
                    Customer Support
                  </button>
                  {' • '}
                  <span>100% Secure Booking</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
