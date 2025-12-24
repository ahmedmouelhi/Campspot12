import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Calendar, Users, MapPin, Star, ArrowLeft, X, ShoppingCart,
    Wifi, Flame, TreePine, Home, Car, Shield, Check, Info,
    Clock, DollarSign, AlertCircle, ChevronLeft, ChevronRight,
    Heart, Share2, ThumbsUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import MapPreview from '../components/MapPreview';

interface Campsite {
    _id: string;
    id?: string;
    name: string;
    location: string;
    price: number;
    rating: number;
    description: string;
    features: string[];
    capacity: number;
    availability: 'available' | 'limited' | 'unavailable';
    image?: string;
    images?: string[]; // Gallery images array
    type?: string;
    reviewCount?: number;
}

const CampsiteDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [campsite, setCampsite] = useState<Campsite | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [bookingData, setBookingData] = useState({
        checkIn: '',
        checkOut: '',
        guests: 2
    });

    const { addCampsite, isDateAvailable } = useCart();
    const { isAuthenticated } = useAuth();

    // Gallery images - use campsite images array if available, otherwise use main image
    const galleryImages = campsite?.images && campsite.images.length > 0
        ? campsite.images
        : campsite?.image
            ? [campsite.image]
            : [];

    // Mock review data (in production, this would come from the API)
    const mockReviews = [
        {
            id: '1',
            userName: 'John Doe',
            userInitials: 'JD',
            rating: 5,
            date: '2 weeks ago',
            comment: 'Amazing campsite! The location is perfect and the facilities are very clean. Would definitely recommend to families.',
            helpful: 12
        },
        {
            id: '2',
            userName: 'Sarah Smith',
            userInitials: 'SS',
            rating: 4,
            date: '1 month ago',
            comment: 'Great experience overall. Beautiful views and well-maintained grounds. Only minor issue was limited cell service.',
            helpful: 8
        }
    ];

    // Calculate rating breakdown
    const ratingBreakdown = [
        { stars: 5, percentage: 70, count: 89 },
        { stars: 4, percentage: 20, count: 25 },
        { stars: 3, percentage: 7, count: 9 },
        { stars: 2, percentage: 2, count: 3 },
        { stars: 1, percentage: 1, count: 1 }
    ];

    useEffect(() => {
        loadCampsite();
    }, [id]);

    const loadCampsite = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiService.getCampsiteById(id!);
            const campsiteData = response.success ? response.data : response;
            setCampsite(campsiteData);
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to load campsite details';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleBookNow = () => {
        if (!isAuthenticated) {
            toast.error('Please log in to book a campsite');
            navigate('/auth?mode=login');
            return;
        }
        setShowBookingModal(true);
    };

    const handleBookingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!campsite || !bookingData.checkIn || !bookingData.checkOut) {
            return;
        }

        if (!isDateAvailable('campsite', campsite.id || campsite._id, bookingData.checkIn, bookingData.checkOut)) {
            toast.error('These dates conflict with an existing booking');
            return;
        }

        const campsiteForCart = {
            ...campsite,
            id: campsite.id || campsite._id
        };

        const success = addCampsite(campsiteForCart, bookingData.checkIn, bookingData.checkOut, bookingData.guests);
        if (success) {
            toast.success(`🏕️ ${campsite.name} added to cart!`);
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

    const getFeatureIcon = (feature: string) => {
        const lowerFeature = feature.toLowerCase();
        if (lowerFeature.includes('wifi')) return <Wifi size={18} />;
        if (lowerFeature.includes('bathroom') || lowerFeature.includes('shower')) return <Home size={18} />;
        if (lowerFeature.includes('fire') || lowerFeature.includes('pit')) return <Flame size={18} />;
        if (lowerFeature.includes('trail') || lowerFeature.includes('hiking')) return <TreePine size={18} />;
        if (lowerFeature.includes('parking')) return <Car size={18} />;
        return <Check size={18} />;
    };

    const getCampsiteTypeIcon = (type: string) => {
        const lowerType = type?.toLowerCase() || '';
        if (lowerType.includes('rv')) return '🚐';
        if (lowerType.includes('cabin')) return '🏠';
        return '⛺';
    };

    const getCampsiteTypeName = (type: string) => {
        const lowerType = type?.toLowerCase() || '';
        if (lowerType.includes('rv')) return 'RV Camping';
        if (lowerType.includes('cabin')) return 'Cabin';
        return 'Tent Camping';
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    <p className="mt-4 text-gray-600">Loading campsite details...</p>
                </div>
            </div>
        );
    }

    if (error || !campsite) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">{error || 'Campsite not found'}</p>
                    <Link to="/campsites" className="text-teal-600 hover:underline">
                        ← Back to Campsites
                    </Link>
                </div>
            </div>
        );
    }

    const nights = calculateNights(bookingData.checkIn, bookingData.checkOut);
    const subtotal = campsite.price * nights;
    const cleaningFee = 15;
    const serviceFee = subtotal * 0.1;
    const taxes = (subtotal + cleaningFee + serviceFee) * 0.08; // 8% tax
    const total = subtotal + cleaningFee + serviceFee + taxes;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <Link
                        to="/campsites"
                        className="flex items-center text-gray-600 hover:text-teal-600 transition-colors group"
                        aria-label="Back to campsites listing"
                    >
                        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Campsites</span>
                    </Link>
                </div>
            </div>

            {/* Image Gallery */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Main Image */}
                        <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden group">
                            <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-600">
                                {galleryImages.length > 0 && galleryImages[currentImageIndex] && (
                                    <img
                                        src={galleryImages[currentImageIndex]}
                                        alt={`${campsite.name} - View ${currentImageIndex + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            {/* Gallery Navigation */}
                            <button
                                onClick={prevImage}
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                aria-label="Next image"
                            >
                                <ChevronRight size={24} />
                            </button>
                            {/* Image Counter */}
                            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                                {currentImageIndex + 1} / {galleryImages.length}
                            </div>
                            {/* Action Buttons */}
                            <div className="absolute top-4 right-4 flex space-x-2">
                                <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors" aria-label="Share campsite">
                                    <Share2 size={20} />
                                </button>
                                <button className="bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors" aria-label="Save to favorites">
                                    <Heart size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Thumbnail Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {galleryImages.slice(0, 4).map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`h-48 md:h-60 rounded-xl overflow-hidden cursor-pointer hover:opacity-75 transition-opacity ${currentImageIndex === idx ? 'ring-4 ring-teal-600' : ''
                                        }`}
                                    onClick={() => setCurrentImageIndex(idx)}
                                >
                                    <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-600">
                                        {img && (
                                            <img
                                                src={img}
                                                alt={`${campsite.name} - View ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header with Badges */}
                        <div>
                            {/* Highlight Strip */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                {/* Campsite Type */}
                                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-semibold">
                                    <span>{getCampsiteTypeIcon(campsite.type || 'tent')}</span>
                                    <span className="capitalize">{getCampsiteTypeName(campsite.type || 'tent')}</span>
                                </span>

                                {/* Top Rated Badge */}
                                {campsite.rating >= 4.5 && (
                                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                                        <Star size={14} className="fill-current" />
                                        <span>Top Rated</span>
                                    </span>
                                )}

                                {/* Family Friendly */}
                                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                    <span>👨‍👩‍👧‍👦</span>
                                    <span>Family Friendly</span>
                                </span>

                                {/* Pet Friendly */}
                                <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                    <span>🐕</span>
                                    <span>Pet Friendly</span>
                                </span>

                                {/* WiFi Available */}
                                {campsite.features.some(f => f.toLowerCase().includes('wifi')) && (
                                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
                                        <Wifi size={14} />
                                        <span>WiFi</span>
                                    </span>
                                )}

                                {/* Parking */}
                                {campsite.features.some(f => f.toLowerCase().includes('parking')) && (
                                    <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                                        <Car size={14} />
                                        <span>Parking</span>
                                    </span>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-heading">
                                {campsite.name}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                <div className="flex items-center space-x-1">
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold text-gray-900">{campsite.rating}</span>
                                    <span className="text-sm">({campsite.reviewCount || 127} reviews)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <MapPin size={18} />
                                    <span>{campsite.location}</span>
                                </div>
                            </div>
                        </div>

                        {/* About Section */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">About this campsite</h2>
                            <p className="text-gray-700 leading-relaxed mb-6">{campsite.description}</p>

                            {/* Check-in/out Times */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-3">
                                    <Clock size={20} className="text-teal-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">Check-in</p>
                                        <p className="font-semibold text-gray-900">After 2:00 PM</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Clock size={20} className="text-teal-600" />
                                    <div>
                                        <p className="text-sm text-gray-600">Check-out</p>
                                        <p className="font-semibold text-gray-900">Before 11:00 AM</p>
                                    </div>
                                </div>
                            </div>

                            {/* Minimum Stay */}
                            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg mb-4">
                                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Minimum stay: 2 nights</p>
                                    <p className="text-xs text-blue-700 mt-1">Required for all bookings</p>
                                </div>
                            </div>

                            {/* Nearby Attractions */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Nearby Attractions</h3>
                                <ul className="space-y-2">
                                    <li className="flex items-start space-x-2 text-gray-700">
                                        <Check size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                                        <span>Scenic hiking trails (0.5 miles)</span>
                                    </li>
                                    <li className="flex items-start space-x-2 text-gray-700">
                                        <Check size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                                        <span>Crystal Lake for swimming and fishing (2 miles)</span>
                                    </li>
                                    <li className="flex items-start space-x-2 text-gray-700">
                                        <Check size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                                        <span>Mountain View Lookout (3 miles)</span>
                                    </li>
                                    <li className="flex items-start space-x-2 text-gray-700">
                                        <Check size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                                        <span>Local farmers market on weekends (5 miles)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Features & Amenities */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">Features & Amenities</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {campsite.features.map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="text-teal-600">
                                            {getFeatureIcon(feature)}
                                        </div>
                                        <span className="text-gray-700 font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* House Rules */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">House Rules</h2>
                            <ul className="space-y-3">
                                <li className="flex items-start space-x-3">
                                    <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Quiet hours: 10 PM - 7 AM</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Maximum {campsite.capacity} guests</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Pets allowed (on leash)</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">No smoking in facilities</span>
                                </li>
                                <li className="flex items-start space-x-3">
                                    <Check size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-gray-700">Check-in after 2:00 PM, check-out before 11:00 AM</span>
                                </li>
                            </ul>
                            <div className="mt-4">
                                <Link to="/house-rules" className="text-teal-600 hover:text-teal-700 font-medium text-sm">
                                    View full house rules →
                                </Link>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 font-heading">Reviews</h2>
                                <button
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold text-sm"
                                    aria-label="Write a review for this campsite"
                                >
                                    Write a Review
                                </button>
                            </div>

                            {/* Rating Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className="text-5xl font-bold text-gray-900">{campsite.rating}</div>
                                    <div>
                                        <div className="flex items-center space-x-1 mb-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={20}
                                                    className={star <= campsite.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-600">{campsite.reviewCount || 127} reviews</p>
                                    </div>
                                </div>

                                {/* Rating Breakdown */}
                                <div className="space-y-2">
                                    {ratingBreakdown.map((item) => (
                                        <div key={item.stars} className="flex items-center space-x-3">
                                            <span className="text-sm text-gray-600 w-8">{item.stars}★</span>
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-400"
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-gray-600 w-12 text-right">
                                                {item.percentage}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Review Form */}
                            {showReviewForm && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Write Your Review</h3>
                                    <form className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Your Rating
                                            </label>
                                            <div className="flex space-x-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        className="text-gray-300 hover:text-yellow-400 transition-colors"
                                                        aria-label={`Rate ${star} stars`}
                                                    >
                                                        <Star size={32} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Your Review
                                            </label>
                                            <textarea
                                                rows={4}
                                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                                placeholder="Share your experience..."
                                            />
                                        </div>
                                        <div className="flex space-x-3">
                                            <button
                                                type="button"
                                                onClick={() => setShowReviewForm(false)}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                            >
                                                Submit Review
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Sample Reviews */}
                            <div className="space-y-4">
                                {mockReviews.map((review) => (
                                    <div key={review.id} className="border-t border-gray-200 pt-4">
                                        <div className="flex items-start space-x-4">
                                            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                                                {review.userInitials}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{review.userName}</p>
                                                        <p className="text-sm text-gray-500">{review.date}</p>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                size={14}
                                                                className={star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-gray-700 mb-3">{review.comment}</p>
                                                <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900">
                                                    <ThumbsUp size={14} />
                                                    <span>Helpful ({review.helpful})</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Map Preview */}
                        <MapPreview location={campsite.location} />
                    </div>

                    {/* Booking Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 sticky top-24">
                            {/* Price Header */}
                            <div className="mb-6">
                                <div className="flex items-baseline space-x-2 mb-2">
                                    <span className="text-3xl font-bold text-gray-900">€{campsite.price}</span>
                                    <span className="text-gray-600">/ night</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold">{campsite.rating}</span>
                                    <span className="text-sm text-gray-600">({campsite.reviewCount || 127} reviews)</span>
                                </div>
                            </div>

                            {/* Availability Badge */}
                            <div className="mb-4">
                                <span className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold w-full justify-center ${campsite.availability === 'available'
                                    ? 'bg-green-100 text-green-800'
                                    : campsite.availability === 'limited'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                    {campsite.availability === 'available' && (
                                        <>
                                            <Check size={16} />
                                            <span>Available</span>
                                        </>
                                    )}
                                    {campsite.availability === 'limited' && (
                                        <>
                                            <AlertCircle size={16} />
                                            <span>Limited Availability</span>
                                            <div className="group relative">
                                                <Info size={14} className="cursor-help" />
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-900 text-white text-xs rounded-lg">
                                                    Only a few spots left for selected dates
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    {campsite.availability === 'unavailable' && (
                                        <>
                                            <X size={16} />
                                            <span>Unavailable</span>
                                        </>
                                    )}
                                </span>
                            </div>

                            {/* Quick Date Selector */}
                            <div className="space-y-3 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Check-in
                                    </label>
                                    <input
                                        type="date"
                                        value={bookingData.checkIn}
                                        onChange={(e) => setBookingData(prev => ({ ...prev, checkIn: e.target.value }))}
                                        min={getTomorrowDate()}
                                        max={getMaxDate()}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        aria-label="Select check-in date"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Check-out
                                    </label>
                                    <input
                                        type="date"
                                        value={bookingData.checkOut}
                                        onChange={(e) => setBookingData(prev => ({ ...prev, checkOut: e.target.value }))}
                                        min={bookingData.checkIn || getTomorrowDate()}
                                        max={getMaxDate()}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        aria-label="Select check-out date"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Guests
                                    </label>
                                    <select
                                        value={bookingData.guests}
                                        onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                                        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        aria-label="Select number of guests"
                                    >
                                        {Array.from({ length: campsite.capacity }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* View Calendar Button */}
                                <button
                                    onClick={() => setShowCalendar(!showCalendar)}
                                    className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <Calendar size={16} />
                                    <span>{showCalendar ? 'Hide' : 'View'} Availability Calendar</span>
                                </button>
                            </div>

                            {/* Availability Calendar */}
                            {showCalendar && (
                                <div className="mb-6">
                                    <AvailabilityCalendar
                                        onDateSelect={(start, end) => {
                                            setBookingData(prev => ({ ...prev, checkIn: start, checkOut: end }));
                                            setShowCalendar(false);
                                        }}
                                        minDate={getTomorrowDate()}
                                        maxDate={getMaxDate()}
                                    />
                                </div>
                            )}

                            {/* Price Breakdown */}
                            {bookingData.checkIn && bookingData.checkOut && nights > 0 && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-xl space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">€{campsite.price} × {nights} nights</span>
                                        <span className="font-medium">€{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Cleaning fee</span>
                                        <span className="font-medium">€{cleaningFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Service fee (10%)</span>
                                        <span className="font-medium">€{serviceFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Taxes (8%)</span>
                                        <span className="font-medium">€{taxes.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                                        <span className="font-semibold text-gray-900">Total</span>
                                        <span className="font-bold text-teal-600 text-lg">€{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Book Button */}
                            <button
                                onClick={handleBookNow}
                                disabled={campsite.availability === 'unavailable'}
                                className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${campsite.availability === 'unavailable'
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-teal-600 text-white hover:bg-teal-700'
                                    }`}
                                aria-label="Reserve this campsite"
                            >
                                <Calendar size={20} />
                                <span>{campsite.availability === 'unavailable' ? 'Unavailable' : 'Reserve'}</span>
                            </button>

                            <p className="text-xs text-gray-500 text-center mt-2">You won't be charged yet</p>

                            {/* Trust Elements */}
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                                    <Shield size={20} className="text-green-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-900">Free cancellation</p>
                                        <p className="text-xs text-green-700">Up to 48 hours before check-in</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                                    <Shield size={20} className="text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900">Secure payment</p>
                                        <p className="text-xs text-blue-700">Your payment info is protected</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 justify-center pt-2">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" className="h-6" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6" />
                                </div>
                                <Link
                                    to="/cancellation-policy"
                                    className="block text-sm text-teal-600 hover:text-teal-700 font-medium text-center"
                                >
                                    View cancellation policy →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal (kept for backward compatibility) */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-xl font-bold">Confirm Booking</h3>
                            <button
                                onClick={() => setShowBookingModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Close booking modal"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleBookingSubmit} className="p-6">
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h4 className="font-semibold text-gray-900 mb-3">Booking Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Campsite:</span>
                                        <span className="font-medium">{campsite.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Check-in:</span>
                                        <span className="font-medium">{bookingData.checkIn}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Check-out:</span>
                                        <span className="font-medium">{bookingData.checkOut}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Guests:</span>
                                        <span className="font-medium">{bookingData.guests}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nights:</span>
                                        <span className="font-medium">{nights}</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between">
                                        <span className="font-semibold">Total:</span>
                                        <span className="font-bold text-teal-600">€{total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowBookingModal(false)}
                                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center space-x-2"
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

export default CampsiteDetail;
