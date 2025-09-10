import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Calendar, Users, X, ShoppingCart, MapPin, Star } from 'lucide-react';
import apiService from '../services/apiService';
import { useCart } from '../contexts/CartContext';

// Define Campsite interface locally since we're removing AdminDataService dependency
interface Campsite {
  _id: string;
  id?: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  description: string;
  features: string[] | string; // Can be array or space-separated string
  capacity: number;
  availability: 'available' | 'limited' | 'unavailable';
  image?: string;
}

const Campsites = () => {
  const [camps, setCamps] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCampsite, setSelectedCampsite] = useState<Campsite | null>(null);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2
  });
  const { addCampsite, isDateAvailable } = useCart();

  useEffect(() => {
    const loadCampsites = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getCampsites();
        // Handle standardized API response format
        const campsitesData = response.success ? response.data : (response.data || response);
        setCamps(Array.isArray(campsitesData) ? campsitesData : []);
      } catch (err: any) {
        console.error('Error loading campsites:', err);
        setError('Failed to load campsites. Please try again later.');
        toast.error('Failed to load campsites');
      } finally {
        setLoading(false);
      }
    };
    
    loadCampsites();
  }, []);

  const handleBookClick = (campsite: Campsite) => {
    if (campsite.availability === 'unavailable') {
      return;
    }
    setSelectedCampsite(campsite);
    setBookingData({
      checkIn: '',
      checkOut: '',
      guests: 2
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampsite || !bookingData.checkIn || !bookingData.checkOut) {
      return;
    }

    // Check if dates are available
    if (!isDateAvailable('campsite', selectedCampsite.id, bookingData.checkIn, bookingData.checkOut)) {
      toast.error('These dates conflict with an existing booking for this campsite.');
      return;
    }

    // Check capacity
    if (bookingData.guests > selectedCampsite.capacity) {
      toast.error(`This campsite can only accommodate ${selectedCampsite.capacity} guests.`);
      return;
    }

    // Use _id if available, fallback to id for backward compatibility
    const campsiteForCart = {
      ...selectedCampsite,
      id: selectedCampsite.id || selectedCampsite._id
    };
    addCampsite(campsiteForCart, bookingData.checkIn, bookingData.checkOut, bookingData.guests);
    toast.success(`🏡 ${selectedCampsite.name} added to cart for ${bookingData.guests} guests!`);
    setShowBookingModal(false);
    setSelectedCampsite(null);
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 365);
    return maxDate.toISOString().split('T')[0];
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getAvailabilityColor = (availability: string) => {
    switch(availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'unavailable': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">Campsites</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover amazing camping spots in breathtaking locations. Book your perfect outdoor getaway today!
          </p>
        </div>
      </section>

      {/* Campsites Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Loading campsites...</p>
            </div>
          )}
          
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
              >
                Retry
              </button>
            </div>
          )}
          
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {camps.map((camp) => (
              <div key={camp._id || camp.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-green-400 to-teal-600 relative">
                  {camp.image && (
                    <img src={camp.image} alt={camp.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAvailabilityColor(camp.availability)}`}>
                      {camp.availability}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-current text-yellow-500" />
                      <span className="text-sm text-gray-600">{camp.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{camp.name}</h3>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin size={16} className="mr-1" />
                    <span className="text-sm">{camp.location}</span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{camp.description}</p>
                  
                  {camp.features && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 mb-2">Features:</h4>
                      <div className="flex flex-wrap gap-1">
                        {(typeof camp.features === 'string' ? camp.features.split(' ') : camp.features).slice(0, 3).map((feature, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {feature}
                          </span>
                        ))}
                        {(typeof camp.features === 'string' ? camp.features.split(' ') : camp.features).length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{(typeof camp.features === 'string' ? camp.features.split(' ') : camp.features).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-2xl font-bold text-teal-600">
                        €{camp.price}
                        <span className="text-sm font-normal text-gray-600">/night</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <Users size={14} className="inline mr-1" />
                        Up to {camp.capacity} guests
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleBookClick(camp)}
                    className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                      camp.availability === 'available'
                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                        : camp.availability === 'limited'
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-gray-400 text-white cursor-not-allowed'
                    }`}
                    disabled={camp.availability === 'unavailable'}
                  >
                    {camp.availability !== 'unavailable' && <ShoppingCart size={16} />}
                    <span>
                      {camp.availability === 'available' && 'Book Now'}
                      {camp.availability === 'limited' && 'Limited Availability'}
                      {camp.availability === 'unavailable' && 'Unavailable'}
                    </span>
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
          
          {!loading && !error && camps.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No campsites available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && selectedCampsite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md mx-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">Book {selectedCampsite.name}</h3>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={bookingData.checkIn}
                  onChange={(e) => {
                    const newCheckIn = e.target.value;
                    setBookingData(prev => ({ 
                      ...prev, 
                      checkIn: newCheckIn,
                      // Clear checkout if it's before the new check-in
                      checkOut: prev.checkOut && prev.checkOut <= newCheckIn ? '' : prev.checkOut
                    }));
                  }}
                  min={getTomorrowDate()}
                  max={getMaxDate()}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-2" />
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={bookingData.checkOut}
                  onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                  min={bookingData.checkIn ? 
                    new Date(new Date(bookingData.checkIn).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
                    getTomorrowDate()
                  }
                  max={getMaxDate()}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users size={16} className="inline mr-2" />
                  Number of Guests
                </label>
                <select
                  value={bookingData.guests}
                  onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {Array.from({ length: selectedCampsite.capacity }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              
              {bookingData.checkIn && bookingData.checkOut && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="font-medium">{calculateNights(bookingData.checkIn, bookingData.checkOut)} night{calculateNights(bookingData.checkIn, bookingData.checkOut) > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Rate per night:</span>
                    <span className="font-medium">€{selectedCampsite.price}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-teal-600 text-lg">
                        €{(selectedCampsite.price * calculateNights(bookingData.checkIn, bookingData.checkOut)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bookingData.checkIn || !bookingData.checkOut}
                  className="flex-1 py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  <ShoppingCart size={16} />
                  <span>Add to Cart</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Campsites;

