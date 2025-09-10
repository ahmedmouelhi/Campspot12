import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Calendar, Clock, Users, X, ShoppingCart, MapPin, Star, Zap } from 'lucide-react';
import apiService from '../services/apiService';
import { useCart } from '../contexts/CartContext';

// Define Activity interface locally
interface Activity {
  _id: string;
  id?: string;
  name: string;
  icon: string;
  description: string;
  duration: string;
  difficulty: 'Easy' | 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  category: string;
  maxParticipants: number;
  equipment: string[];
  rating?: number;
}

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '09:00',
    participants: 1
  });
  const { addActivity, isDateAvailable } = useCart();

  useEffect(() => {
    const loadActivities = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getActivities();
        // Handle standardized API response format
        const activitiesData = response.success ? response.data : (response.data || response);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      } catch (err: any) {
        console.error('Error loading activities:', err);
        setError('Failed to load activities. Please try again later.');
        toast.error('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };
    
    loadActivities();
  }, []);

  const handleBookClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setBookingData({
      date: '',
      time: '09:00',
      participants: 1
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !bookingData.date) {
      return;
    }

    // Check if the date/time slot is available
    if (!isDateAvailable('activity', selectedActivity.id, bookingData.date, bookingData.date)) {
      toast.error('This time slot is not available for the selected activity.');
      return;
    }

    // Check capacity if the activity has a max participants limit
    if (selectedActivity.maxParticipants && bookingData.participants > selectedActivity.maxParticipants) {
      toast.error(`This activity can only accommodate ${selectedActivity.maxParticipants} participants.`);
      return;
    }

    // Use _id if available, fallback to id for backward compatibility
    const activityForCart = {
      ...selectedActivity,
      id: selectedActivity.id || selectedActivity._id
    };
    addActivity(activityForCart, bookingData.date, bookingData.time, bookingData.participants);
    toast.success(`🎯 ${selectedActivity.name} added to cart for ${bookingData.date} at ${bookingData.time}!`);
    setShowBookingModal(false);
    setSelectedActivity(null);
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90); // 3 months ahead for activities
    return maxDate.toISOString().split('T')[0];
  };

  const getDifficultyColor = (difficulty: string) => {
    switch(difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Beginner': return 'bg-blue-100 text-blue-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">Outdoor Activities</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Embark on thrilling adventures and discover the beauty of nature through our exciting outdoor activities!
          </p>
        </div>
      </section>

      {/* Activities Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Loading activities...</p>
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
              {activities.map((activity) => (
              <div key={activity._id || activity.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-600 relative flex items-center justify-center">
                  <div className="text-6xl text-white">{activity.icon}</div>
                  {activity.category && (
                    <div className="absolute top-4 left-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-3 py-1">
                      <span className="text-white text-sm font-medium">{activity.category}</span>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(activity.difficulty)}`}>
                      {activity.difficulty}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-current text-yellow-500" />
                      <span className="text-sm text-gray-600">{activity.rating || '4.8'}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{activity.name}</h3>
                  <p className="text-gray-600 mb-4">{activity.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-500">
                        <Clock size={14} className="mr-1" />
                        <span className="text-sm">Duration</span>
                      </div>
                      <span className="text-gray-700 text-sm font-medium">{activity.duration}</span>
                    </div>
                    
                    {activity.maxParticipants && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-500">
                          <Users size={14} className="mr-1" />
                          <span className="text-sm">Max Participants</span>
                        </div>
                        <span className="text-gray-700 text-sm font-medium">{activity.maxParticipants}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-500">
                        <Zap size={14} className="mr-1" />
                        <span className="text-sm">Difficulty</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(activity.difficulty)}`}>
                        {activity.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-teal-600">
                      €{activity.price}
                      <span className="text-sm font-normal text-gray-600">/person</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleBookClick(activity)}
                    className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart size={16} />
                    <span>Book Now</span>
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
          
          {!loading && !error && activities.length === 0 && (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No activities available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md mx-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold">Book {selectedActivity.name}</h3>
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
                  Activity Date
                </label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, date: e.target.value }))}
                  min={getTomorrowDate()}
                  max={getMaxDate()}
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock size={16} className="inline mr-2" />
                  Preferred Time
                </label>
                <select
                  value={bookingData.time}
                  onChange={(e) => setBookingData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="13:00">1:00 PM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users size={16} className="inline mr-2" />
                  Number of Participants
                </label>
                <select
                  value={bookingData.participants}
                  onChange={(e) => setBookingData(prev => ({ ...prev, participants: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {Array.from({ length: selectedActivity.maxParticipants || 10 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} participant{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              
              {bookingData.participants && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Activity:</span>
                    <span className="font-medium">{selectedActivity.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="font-medium">{selectedActivity.duration}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Price per person:</span>
                    <span className="font-medium">€{selectedActivity.price}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Participants:</span>
                    <span className="font-medium">{bookingData.participants}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-teal-600 text-lg">
                        €{(selectedActivity.price * bookingData.participants).toFixed(2)}
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
                  disabled={!bookingData.date}
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

export default Activities;
