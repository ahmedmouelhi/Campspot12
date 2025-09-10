import React from 'react';
import { Calendar, Users, MapPin, Clock, CreditCard, Star, Shield } from 'lucide-react';

interface BookingPreviewProps {
  booking: {
    id?: string;
    campsiteName: string;
    location: string;
    image?: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
    pricePerNight: number;
    totalPrice: number;
    equipment?: string[];
    activities?: string[];
    specialRequests?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  };
  onConfirm?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  isPreview?: boolean;
}

const BookingPreview: React.FC<BookingPreviewProps> = ({
  booking,
  onConfirm,
  onEdit,
  onCancel,
  isPreview = false
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'pending':
        return '⏳';
      case 'rejected':
        return '❌';
      case 'cancelled':
        return '🚫';
      default:
        return '📋';
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {isPreview ? 'Booking Preview' : 'Booking Details'}
            </h2>
            <p className="text-teal-100 mt-1">
              {isPreview ? 'Review your booking before confirming' : 'Your camping reservation'}
            </p>
          </div>
          {booking.status && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)} {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </div>
          )}
        </div>
      </div>

      {/* Campsite Information */}
      <div className="p-6 border-b">
        <div className="flex items-start space-x-4">
          {booking.image && (
            <div className="flex-shrink-0">
              <img
                src={booking.image}
                alt={booking.campsiteName}
                className="w-24 h-24 rounded-lg object-cover"
              />
            </div>
          )}
          <div className="flex-grow">
            <h3 className="text-xl font-semibold text-gray-900">{booking.campsiteName}</h3>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin size={16} className="mr-1" />
              <span>{booking.location}</span>
            </div>
            <div className="flex items-center text-yellow-500 mt-2">
              <Star size={16} className="mr-1 fill-current" />
              <span className="text-gray-600 text-sm">Premium campsite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-gray-700 mb-2">
              <Calendar size={18} className="mr-2 text-teal-600" />
              <span className="font-medium">Check-in</span>
            </div>
            <p className="text-lg font-semibold">{new Date(booking.checkIn).toLocaleDateString()}</p>
            <p className="text-sm text-gray-500">After 3:00 PM</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-gray-700 mb-2">
              <Clock size={18} className="mr-2 text-teal-600" />
              <span className="font-medium">Check-out</span>
            </div>
            <p className="text-lg font-semibold">{new Date(booking.checkOut).toLocaleDateString()}</p>
            <p className="text-sm text-gray-500">Before 11:00 AM</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-gray-700 mb-2">
              <Users size={18} className="mr-2 text-teal-600" />
              <span className="font-medium">Guests</span>
            </div>
            <p className="text-lg font-semibold">{booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center text-gray-700 mb-2">
              <Calendar size={18} className="mr-2 text-teal-600" />
              <span className="font-medium">Duration</span>
            </div>
            <p className="text-lg font-semibold">{booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'}</p>
          </div>
        </div>

        {/* Additional Services */}
        {(booking.equipment?.length || booking.activities?.length) && (
          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Additional Services</h4>
            
            {booking.equipment && booking.equipment.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Equipment Rental:</p>
                <div className="flex flex-wrap gap-2">
                  {booking.equipment.map((item, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {booking.activities && booking.activities.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Activities:</p>
                <div className="flex flex-wrap gap-2">
                  {booking.activities.map((activity, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Special Requests */}
        {booking.specialRequests && (
          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Special Requests</h4>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{booking.specialRequests}</p>
          </div>
        )}

        {/* Pricing */}
        <div className="border-t pt-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Pricing Details</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">€{booking.pricePerNight} × {booking.nights} nights</span>
              <span className="text-gray-900">€{(booking.pricePerNight * booking.nights).toFixed(2)}</span>
            </div>
            {booking.equipment && booking.equipment.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Equipment rental</span>
                <span className="text-gray-900">€25.00</span>
              </div>
            )}
            {booking.activities && booking.activities.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Activities</span>
                <span className="text-gray-900">€15.00</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Service fee</span>
              <span className="text-gray-900">€5.99</span>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-teal-600">€{booking.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Status Information */}
        {booking.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Shield className="text-yellow-600 mr-2" size={20} />
              <div>
                <p className="text-yellow-800 font-medium">Booking Pending Approval</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Your booking is being reviewed by our team. You will receive a notification once it's approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {booking.status === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Shield className="text-green-600 mr-2" size={20} />
              <div>
                <p className="text-green-800 font-medium">Booking Approved!</p>
                <p className="text-green-700 text-sm mt-1">
                  Your booking has been confirmed. Prepare for an amazing camping experience!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isPreview && onConfirm && (
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-teal-600 text-white py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center"
            >
              <CreditCard size={20} className="mr-2" />
              Confirm & Pay €{booking.totalPrice.toFixed(2)}
            </button>
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Edit Booking
              </button>
            )}
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">
            By confirming, you agree to our terms and conditions
          </p>
        </div>
      )}

      {!isPreview && booking.status === 'pending' && onCancel && (
        <div className="p-6 bg-gray-50 border-t">
          <button
            onClick={onCancel}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Cancel Booking
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingPreview;
