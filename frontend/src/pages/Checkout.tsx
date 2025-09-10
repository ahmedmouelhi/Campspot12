import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CreditCard, Lock, User, Mail, Phone, MapPin, Calendar, Users, Clock } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface PaymentData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCart();
  const { user, addBooking } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setPaymentData(prev => ({ ...prev, cardNumber: formatted }));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setPaymentData(prev => ({ ...prev, expiryDate: value }));
  };

  const validateForm = (): boolean => {
    const requiredFields: (keyof PaymentData)[] = [
      'email', 'firstName', 'lastName', 'phone', 'address', 'city', 'zipCode',
      'cardNumber', 'expiryDate', 'cvv', 'cardName'
    ];

    for (const field of requiredFields) {
      if (!paymentData[field].trim()) {
        toast.error(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Validate card number (basic check for 16 digits)
    const cardDigits = paymentData.cardNumber.replace(/\s/g, '');
    if (cardDigits.length !== 16) {
      toast.error('Please enter a valid 16-digit card number');
      return false;
    }

    // Validate expiry date
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(paymentData.expiryDate)) {
      toast.error('Please enter a valid expiry date (MM/YY)');
      return false;
    }

    // Validate CVV
    if (paymentData.cvv.length !== 3 && paymentData.cvv.length !== 4) {
      toast.error('Please enter a valid CVV');
      return false;
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

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add all items as bookings
      items.forEach(item => {
        if (item.type === 'campsite') {
          addBooking({
            type: 'campsite',
            name: item.name,
            date: item.checkIn!,
            endDate: item.checkOut,
            price: item.totalPrice,
            status: 'confirmed',
            location: item.location || 'Campsite',
            guests: item.guests,
            nights: item.nights
          });
        } else if (item.type === 'activity') {
          addBooking({
            type: 'activity',
            name: item.name,
            date: item.date!,
            time: item.time,
            price: item.totalPrice,
            status: 'confirmed',
            location: 'Activity',
            participants: item.participants
          });
        } else if (item.type === 'equipment') {
          addBooking({
            type: 'equipment',
            name: item.name,
            date: item.startDate!,
            endDate: item.endDate,
            price: item.totalPrice,
            status: 'confirmed',
            location: 'Equipment Rental',
            quantity: item.quantity,
            days: item.days
          });
        }
      });

      // Clear the cart
      clearCart();

      // Show success notification
      toast.success('🎉 Payment successful! Your bookings have been confirmed.');
      
      // Send booking confirmation notifications
      items.forEach(item => {
        if (item.type === 'campsite') {
          toast.info(`📧 Booking confirmation sent for ${item.name} (${item.checkIn} - ${item.checkOut})`);
        } else if (item.type === 'activity') {
          toast.info(`📧 Activity confirmation sent for ${item.name} on ${item.date} at ${item.time}`);
        } else if (item.type === 'equipment') {
          toast.info(`📧 Rental confirmation sent for ${item.name} (${item.startDate} - ${item.endDate})`);
        }
      });
      
      // Send payment receipt notification
      setTimeout(() => {
        toast.success(`💳 Payment receipt sent to ${paymentData.email}`);
      }, 1000);

      // Navigate to profile page
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (error) {
      toast.error('❌ Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Order Summary</h2>
            
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
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-teal-600">€{item.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center text-xl font-bold text-gray-800">
                <span>Total:</span>
                <span className="text-teal-600">€{getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Secure Checkout</h2>
            </div>

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
                      value={paymentData.firstName}
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
                      value={paymentData.lastName}
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
                      value={paymentData.email}
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
                      value={paymentData.phone}
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
                      value={paymentData.address}
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
                        value={paymentData.city}
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
                        value={paymentData.zipCode}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      name="cardName"
                      value={paymentData.cardName}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard size={16} className="inline mr-2" />
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={paymentData.expiryDate}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength={5}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={paymentData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength={4}
                        required
                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    <span>Complete Payment (€{getTotalPrice().toFixed(2)})</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
