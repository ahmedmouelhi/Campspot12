import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, Calendar, Users, Clock, MapPin, Lock } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { CartItem } from '../services/cartService';
import { toast } from 'react-toastify';

const Cart = () => {
  const { cart, cartTotal, removeItem, updateQuantity, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to proceed to checkout');
      // Optionally redirect to profile/login page
      navigate('/profile');
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingCart className="mx-auto h-24 w-24 text-gray-300 mb-8" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-lg text-gray-600 mb-4">
              Start exploring our campsites, activities, and equipment to plan your perfect adventure!
            </p>
            {!isAuthenticated && (
              <p className="text-sm text-gray-500 mb-8">
                💡 <Link to="/profile" className="text-teal-600 hover:text-teal-700 underline">Log in</Link> to save your cart items and complete bookings
              </p>
            )}
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link
                to="/campsites"
                className="block w-full sm:w-auto bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
              >
                Browse Campsites
              </Link>
              <Link
                to="/activities"
                className="block w-full sm:w-auto border border-teal-600 text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
              >
                Explore Activities
              </Link>
              <Link
                to="/equipment"
                className="block w-full sm:w-auto border border-teal-600 text-teal-600 px-6 py-3 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
              >
                Rent Equipment
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderCartItem = (item: CartItem) => {
    const getItemDetails = () => {
      switch (item.type) {
        case 'campsite':
          return (
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                {new Date(item.checkIn!).toLocaleDateString()} - {new Date(item.checkOut!).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Users size={16} className="mr-1" />
                {item.guests} guest{item.guests! > 1 ? 's' : ''}
              </div>
            </div>
          );
        case 'activity':
          return (
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                {new Date(item.date!).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                {item.time}
              </div>
              <div className="flex items-center">
                <Users size={16} className="mr-1" />
                {item.participants} participant{item.participants! > 1 ? 's' : ''}
              </div>
            </div>
          );
        case 'equipment':
          return (
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar size={16} className="mr-1" />
                {new Date(item.rentalStart!).toLocaleDateString()} - {new Date(item.rentalEnd!).toLocaleDateString()}
              </div>
              <div className="text-gray-600">
                {item.rentalDays} day{item.rentalDays! > 1 ? 's' : ''}
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    const canUpdateQuantity = item.type === 'equipment';

    return (
      <div key={item.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Item Image/Icon */}
          <div className="flex-shrink-0 self-center sm:self-start">
            {item.image && item.image.startsWith('http') ? (
              <img src={item.image} alt={item.name} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg" />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                {item.image || '📦'}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{item.name}</h3>
                <div className="mt-2">
                  {getItemDetails()}
                </div>
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full capitalize">
                    {item.type}
                  </span>
                </div>
              </div>

              {/* Price and Actions */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start sm:space-y-3 space-x-3 sm:space-x-0">
                <div className="text-left sm:text-right">
                  <div className="text-lg sm:text-xl font-bold text-teal-600">
                    €{(item.totalPrice || item.price || 0).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-0 sm:flex-col sm:space-y-3">
                  {/* Quantity Controls (only for equipment) */}
                  {canUpdateQuantity && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={12} className="sm:w-3.5 sm:h-3.5" />
                      </button>
                      <span className="w-8 sm:w-12 text-center font-medium text-sm sm:text-base">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-xs sm:text-sm"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-3 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-800 text-sm font-medium self-start sm:self-auto"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => renderCartItem(item))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 lg:sticky lg:top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.length} item{cart.length > 1 ? 's' : ''})</span>
                  <span>€{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (10%)</span>
                  <span>€{(cartTotal * 0.1).toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-semibold text-gray-900">
                  <span>Total</span>
                  <span>€{(cartTotal * 1.1).toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${isAuthenticated
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'bg-gray-400 text-gray-700 hover:bg-gray-500'
                  }`}
              >
                {!isAuthenticated && <Lock size={16} />}
                <span>Proceed to Checkout</span>
              </button>

              {!isAuthenticated && (
                <p className="text-center text-sm text-gray-500 mt-2">
                  <Link to="/profile" className="text-teal-600 hover:text-teal-700 underline">
                    Log in
                  </Link> to complete your booking
                </p>
              )}

              <div className="mt-4 text-center">
                <Link
                  to="/campsites"
                  className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Cart Summary by Type */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Booking Summary</h3>
                {cart.filter(item => item.type === 'campsite').length > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>🏕️ Campsites</span>
                    <span>{cart.filter(item => item.type === 'campsite').length}</span>
                  </div>
                )}
                {cart.filter(item => item.type === 'activity').length > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>🎯 Activities</span>
                    <span>{cart.filter(item => item.type === 'activity').length}</span>
                  </div>
                )}
                {cart.filter(item => item.type === 'equipment').length > 0 && (
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>🎒 Equipment</span>
                    <span>{cart.filter(item => item.type === 'equipment').reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
