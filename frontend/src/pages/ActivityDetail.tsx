import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Users, X, ShoppingCart, ArrowLeft, Star, Zap } from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

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

const ActivityDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingData, setBookingData] = useState({
        date: '',
        time: '09:00',
        participants: 1
    });

    const { addActivity, isDateAvailable } = useCart();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        loadActivity();
    }, [id]);

    const loadActivity = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.getActivityById(id!);
            const activityData = response.success ? response.data : response;
            setActivity(activityData);
        } catch (err: any) {
            console.error('Error loading activity:', err);
            setError('Failed to load activity details');
            toast.error('Failed to load activity');
        } finally {
            setLoading(false);
        }
    };

    const handleBookNow = () => {
        if (!isAuthenticated) {
            toast.error('Please log in to book an activity');
            navigate('/auth?mode=login');
            return;
        }
        setShowBookingModal(true);
    };

    const handleBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activity || !bookingData.date) {
            return;
        }

        if (!isDateAvailable('activity', activity.id || activity._id, bookingData.date, bookingData.date)) {
            toast.error('This time slot is not available');
            return;
        }

        const activityForCart = {
            ...activity,
            id: activity.id || activity._id
        };

        const success = addActivity(activityForCart, bookingData.date, bookingData.time, bookingData.participants);
        if (success) {
            toast.success(`🎯 ${activity.name} added to cart!`);
            setShowBookingModal(false);
            navigate('/cart');
        }
    };

    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    const getMaxDate = () => {
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 90);
        return maxDate.toISOString().split('T')[0];
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Easy': return 'bg-green-100 text-green-800';
            case 'Beginner': return 'bg-blue-100 text-blue-800';
            case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'Advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    <p className="mt-4 text-gray-600">Loading activity details...</p>
                </div>
            </div>
        );
    }

    if (error || !activity) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Activity not found'}</p>
                    <Link to="/activities" className="text-teal-600 hover:underline">
                        ← Back to Activities
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <Link to="/activities" className="flex items-center text-gray-600 hover:text-teal-600 transition-colors">
                    <ArrowLeft size={20} className="mr-2" />
                    Back to Activities
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-4">
                <div className="h-96 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl overflow-hidden shadow-lg flex items-center justify-center">
                    <div className="text-9xl text-white">{activity.icon}</div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <h1 className="text-4xl font-bold text-gray-900">{activity.name}</h1>
                                <div className="flex items-center space-x-1">
                                    <Star className="w-6 h-6 fill-current text-yellow-500" />
                                    <span className="text-2xl font-bold">{activity.rating || '4.8'}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(activity.difficulty)}`}>
                                    {activity.difficulty}
                                </span>
                                <span className="text-gray-600">{activity.category}</span>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md">
                            <h2 className="text-2xl font-bold mb-4">About this activity</h2>
                            <p className="text-gray-700 leading-relaxed">{activity.description}</p>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md">
                            <h2 className="text-2xl font-bold mb-4">Activity Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center space-x-3">
                                    <Clock className="text-teal-600" size={20} />
                                    <div>
                                        <div className="text-sm text-gray-600">Duration</div>
                                        <div className="font-semibold">{activity.duration}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Users className="text-teal-600" size={20} />
                                    <div>
                                        <div className="text-sm text-gray-600">Max Participants</div>
                                        <div className="font-semibold">{activity.maxParticipants}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Zap className="text-teal-600" size={20} />
                                    <div>
                                        <div className="text-sm text-gray-600">Difficulty</div>
                                        <div className="font-semibold">{activity.difficulty}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {activity.equipment && activity.equipment.length > 0 && (
                            <div className="bg-white rounded-xl p-6 shadow-md">
                                <h2 className="text-2xl font-bold mb-4">Required Equipment</h2>
                                <ul className="space-y-2">
                                    {activity.equipment.map((item, index) => (
                                        <li key={index} className="flex items-center">
                                            <span className="text-teal-600 mr-2">✓</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl p-6 shadow-lg sticky top-24">
                            <div className="mb-6">
                                <div className="text-3xl font-bold text-teal-600 mb-2">
                                    €{activity.price}
                                    <span className="text-sm font-normal text-gray-600">/person</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <Users size={16} className="mr-2" />
                                    <span>Up to {activity.maxParticipants} participants</span>
                                </div>
                            </div>

                            <button
                                onClick={handleBookNow}
                                className="w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 bg-teal-600 text-white hover:bg-teal-700"
                            >
                                <Calendar size={20} />
                                <span>Book Now</span>
                            </button>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <p className="text-sm text-gray-600 text-center">
                                    Free cancellation up to 24 hours before activity
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showBookingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-xl font-bold">Book {activity.name}</h3>
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
                                    {Array.from({ length: activity.maxParticipants }, (_, i) => i + 1).map(num => (
                                        <option key={num} value={num}>{num} participant{num > 1 ? 's' : ''}</option>
                                    ))}
                                </select>
                            </div>

                            {bookingData.participants && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Price per person:</span>
                                        <span className="font-medium">€{activity.price}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Participants:</span>
                                        <span className="font-medium">{bookingData.participants}</span>
                                    </div>
                                    <div className="border-t pt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold">Total:</span>
                                            <span className="font-bold text-teal-600 text-lg">
                                                €{(activity.price * bookingData.participants).toFixed(2)}
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

export default ActivityDetail;
