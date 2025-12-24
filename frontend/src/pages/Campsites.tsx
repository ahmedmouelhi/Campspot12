import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Calendar, Users, X, ShoppingCart, MapPin, Star, Search,
  SlidersHorizontal, Filter, Wifi, Flame, TreePine,
  Home, Car, Shield, Check, Heart, Award, Eye, ChevronLeft, ChevronRight
} from 'lucide-react';
import apiService from '../services/apiService';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface Campsite {
  _id: string;
  id?: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  description: string;
  features: string[] | string;
  capacity: number;
  availability: 'available' | 'limited' | 'unavailable';
  image?: string;
  type?: string;
  reviewCount?: number;
  verified?: boolean;
  featured?: boolean;
  popularityScore?: number;
}

const Campsites = () => {
  const [camps, setCamps] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCampsite, setSelectedCampsite] = useState<Campsite | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState(1);
  const [sortBy, setSortBy] = useState('featured');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 2
  });

  const { addCampsite, isDateAvailable } = useCart();
  const { isAuthenticated } = useAuth();

  // Available features for filtering
  const availableFeatures = [
    'WiFi',
    'Parking',
    'Fire Pit',
    'Hiking Trails',
    'Beachfront',
    'Mountain View',
    'Camel Rides',
    'Family Friendly',
    'Pet Friendly',
    'Bathroom',
    'Shower'
  ];

  useEffect(() => {
    loadCampsites();
  }, []);

  const loadCampsites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCampsites();
      const campsitesData = response.success ? response.data : (response.data || response);

      // Enhance campsites with mock data for demo
      const enhancedCamps = (Array.isArray(campsitesData) ? campsitesData : []).map((camp: Campsite) => ({
        ...camp,
        reviewCount: camp.reviewCount || Math.floor(Math.random() * 200) + 20,
        verified: Math.random() > 0.3,
        featured: camp.rating >= 4.5,
        popularityScore: Math.floor(Math.random() * 100)
      }));

      setCamps(enhancedCamps);
    } catch (err: any) {
      console.error('Error loading campsites:', err);
      setError('Failed to load campsites. Please try again later.');
      toast.error('Failed to load campsites');
    } finally {
      setLoading(false);
    }
  };

  // Get unique locations
  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(camps.map(camp => camp.location))).sort();
  }, [camps]);

  // Get price range from data
  const dataPriceRange = useMemo(() => {
    if (camps.length === 0) return { min: 0, max: 500 };
    const prices = camps.map(c => c.price);
    return {
      min: Math.floor(Math.min(...prices) / 10) * 10,
      max: Math.ceil(Math.max(...prices) / 10) * 10
    };
  }, [camps]);

  // Filter and sort campsites
  const filteredAndSortedCamps = useMemo(() => {
    let filtered = camps.filter(camp => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          camp.name.toLowerCase().includes(query) ||
          camp.location.toLowerCase().includes(query) ||
          camp.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Location filter
      if (selectedLocation !== 'all' && camp.location !== selectedLocation) {
        return false;
      }

      // Price range
      if (camp.price < priceRange.min || camp.price > priceRange.max) {
        return false;
      }

      // Guest capacity
      if (camp.capacity < guestCount) {
        return false;
      }

      // Availability
      if (availabilityFilter !== 'all') {
        if (availabilityFilter === 'available' && camp.availability !== 'available') {
          return false;
        }
        if (availabilityFilter === 'limited' && camp.availability !== 'limited') {
          return false;
        }
      }

      // Features
      if (selectedFeatures.length > 0) {
        const campFeatures = typeof camp.features === 'string'
          ? camp.features.split(' ')
          : camp.features;

        const hasAllFeatures = selectedFeatures.every(feature =>
          campFeatures.some(cf => cf.toLowerCase().includes(feature.toLowerCase()))
        );
        if (!hasAllFeatures) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'popularity':
          return (b.popularityScore || 0) - (a.popularityScore || 0);
        case 'featured':
        default:
          // Featured first, then by rating
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.rating - a.rating;
      }
    });

    return filtered;
  }, [camps, searchQuery, selectedLocation, priceRange, guestCount, availabilityFilter, selectedFeatures, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCamps.length / itemsPerPage);
  const paginatedCamps = filteredAndSortedCamps.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleBookClick = (campsite: Campsite) => {
    if (!isAuthenticated) {
      toast.error('Please log in to book a campsite');
      return;
    }
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

    if (!isDateAvailable('campsite', selectedCampsite.id || selectedCampsite._id, bookingData.checkIn, bookingData.checkOut)) {
      toast.error('These dates conflict with an existing booking.');
      return;
    }

    if (bookingData.guests > selectedCampsite.capacity) {
      toast.error(`This campsite can only accommodate ${selectedCampsite.capacity} guests.`);
      return;
    }

    const campsiteForCart = {
      ...selectedCampsite,
      id: selectedCampsite.id || selectedCampsite._id
    };

    addCampsite(campsiteForCart, bookingData.checkIn, bookingData.checkOut, bookingData.guests);
    toast.success(`🏕️ ${selectedCampsite.name} added to cart!`);
    setShowBookingModal(false);
    setSelectedCampsite(null);
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('all');
    setPriceRange(dataPriceRange);
    setSelectedFeatures([]);
    setGuestCount(1);
    setAvailabilityFilter('all');
    setCurrentPage(1);
  };

  const activeFilterCount = [
    searchQuery ? 1 : 0,
    selectedLocation !== 'all' ? 1 : 0,
    priceRange.min !== dataPriceRange.min || priceRange.max !== dataPriceRange.max ? 1 : 0,
    selectedFeatures.length,
    guestCount > 1 ? 1 : 0,
    availabilityFilter !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

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
    if (lowerFeature.includes('wifi')) return <Wifi size={16} className="text-teal-600" />;
    if (lowerFeature.includes('bathroom') || lowerFeature.includes('shower')) return <Home size={16} className="text-teal-600" />;
    if (lowerFeature.includes('fire') || lowerFeature.includes('pit')) return <Flame size={16} className="text-teal-600" />;
    if (lowerFeature.includes('trail') || lowerFeature.includes('hiking')) return <TreePine size={16} className="text-teal-600" />;
    if (lowerFeature.includes('parking')) return <Car size={16} className="text-teal-600" />;
    return <Check size={16} className="text-teal-600" />;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section with Search */}
      <section className="bg-gradient-to-br from-teal-600 to-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Link to="/" className="text-white/80 hover:text-white text-sm">Home</Link>
            <span className="mx-2 text-white/60">/</span>
            <span className="text-white text-sm font-medium">Campsites</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">Discover Your Perfect Campsite</h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl">
            Explore amazing camping spots in breathtaking locations across Tunisia
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-xl p-4 max-w-4xl">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name, location, or description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <SlidersHorizontal size={20} />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-teal-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Panel */}
      {showFilters && (
        <section className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">All Locations</option>
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: €{priceRange.min} - €{priceRange.max}
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={dataPriceRange.min}
                    max={dataPriceRange.max}
                    value={priceRange.max}
                    onChange={(e) => {
                      setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }));
                      setCurrentPage(1);
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users size={16} className="inline mr-1" />
                  Guests
                </label>
                <select
                  value={guestCount}
                  onChange={(e) => {
                    setGuestCount(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  value={availabilityFilter}
                  onChange={(e) => {
                    setAvailabilityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="limited">Limited</option>
                </select>
              </div>
            </div>

            {/* Features Filter */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Filter size={16} className="inline mr-1" />
                Features
              </label>
              <div className="flex flex-wrap gap-2">
                {availableFeatures.map(feature => (
                  <button
                    key={feature}
                    onClick={() => {
                      toggleFeature(feature);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedFeatures.includes(feature)
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-teal-600 hover:text-teal-700 font-medium text-sm flex items-center space-x-1"
                >
                  <X size={16} />
                  <span>Clear all filters</span>
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Results Bar */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-gray-700">
              <span className="font-semibold">{filteredAndSortedCamps.length}</span> campsite{filteredAndSortedCamps.length !== 1 ? 's' : ''} found
              {activeFilterCount > 0 && (
                <span className="text-gray-500 ml-2">({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)</span>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-3">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              >
                <option value="featured">Featured</option>
                <option value="rating">Highest Rated</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popularity">Most Popular</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Campsites Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Loading campsites...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadCampsites}
                className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && paginatedCamps.length === 0 && (
            <div className="text-center py-16">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No campsites found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search query</p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {!loading && !error && paginatedCamps.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {paginatedCamps.map((camp) => {
                  const campFeatures = typeof camp.features === 'string' ? camp.features.split(' ') : camp.features;

                  return (
                    <div
                      key={camp._id || camp.id}
                      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group"
                    >
                      {/* Image Section */}
                      <div className="relative h-64 overflow-hidden">
                        {/* Featured Badge */}
                        {camp.featured && (
                          <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                            <Award size={14} />
                            <span>Featured</span>
                          </div>
                        )}

                        {/* Favorite Button */}
                        <button className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors shadow-lg">
                          <Heart size={18} className="text-gray-700" />
                        </button>

                        {/* Single Image */}
                        <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-600">
                          {camp.image && (
                            <img
                              src={camp.image}
                              alt={camp.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          )}
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-6">
                        {/* Badges Row */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {camp.verified && (
                              <span className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                <Shield size={12} />
                                <span>Verified</span>
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${camp.availability === 'available'
                                ? 'bg-green-100 text-green-800'
                                : camp.availability === 'limited'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                              {camp.availability === 'available' && '✓ Available'}
                              {camp.availability === 'limited' && '⚠ Limited'}
                              {camp.availability === 'unavailable' && '✕ Unavailable'}
                            </span>
                          </div>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={star <= camp.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                          <span className="font-semibold text-gray-900">{camp.rating}</span>
                          <span className="text-sm text-gray-500">({camp.reviewCount} reviews)</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-teal-600 transition-colors">
                          {camp.name}
                        </h3>

                        {/* Location */}
                        <div className="flex items-center text-gray-600 mb-3">
                          <MapPin size={16} className="mr-1 flex-shrink-0" />
                          <span className="text-sm line-clamp-1">{camp.location}</span>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {camp.description}
                        </p>

                        {/* Features Icons */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {campFeatures.slice(0, 4).map((feature, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-1 px-2 py-1 bg-gray-50 rounded-lg text-xs"
                              title={feature}
                            >
                              {getFeatureIcon(feature)}
                              <span className="text-gray-700 font-medium">{feature}</span>
                            </div>
                          ))}
                          {campFeatures.length > 4 && (
                            <div className="flex items-center px-2 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
                              +{campFeatures.length - 4} more
                            </div>
                          )}
                        </div>

                        {/* Price and Capacity */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                          <div>
                            <div className="text-2xl font-bold text-teal-600">
                              €{camp.price}
                              <span className="text-sm font-normal text-gray-600">/night</span>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Users size={14} className="mr-1" />
                              Up to {camp.capacity} guests
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <Link
                            to={`/campsites/${camp._id || camp.id}`}
                            className="flex-1 py-2.5 px-4 border-2 border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-semibold text-center flex items-center justify-center space-x-2"
                          >
                            <Eye size={18} />
                            <span>View Details</span>
                          </Link>
                          <button
                            onClick={() => handleBookClick(camp)}
                            disabled={camp.availability === 'unavailable'}
                            className={`flex-1 py-2.5 px-4 rounded-lg transition-colors font-semibold flex items-center justify-center space-x-2 ${camp.availability === 'unavailable'
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-teal-600 text-white hover:bg-teal-700'
                              }`}
                          >
                            <ShoppingCart size={18} />
                            <span>
                              {camp.availability === 'unavailable' ? 'Unavailable' : 'Book Now'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg transition-colors ${currentPage === page
                              ? 'bg-teal-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && selectedCampsite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Book {selectedCampsite.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{selectedCampsite.location}</p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={bookingData.checkIn}
                    onChange={(e) => {
                      const newCheckIn = e.target.value;
                      setBookingData(prev => ({
                        ...prev,
                        checkIn: newCheckIn,
                        checkOut: prev.checkOut && prev.checkOut <= newCheckIn ? '' : prev.checkOut
                      }));
                    }}
                    min={getTomorrowDate()}
                    max={getMaxDate()}
                    required
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Check-out
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
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Guest Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users size={16} className="inline mr-1" />
                  Number of Guests
                </label>
                <select
                  value={bookingData.guests}
                  onChange={(e) => setBookingData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {Array.from({ length: selectedCampsite.capacity }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              {/* Price Breakdown */}
              {bookingData.checkIn && bookingData.checkOut && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h4 className="font-semibold text-gray-900 mb-3">Price Breakdown</h4>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      €{selectedCampsite.price} × {calculateNights(bookingData.checkIn, bookingData.checkOut)} night{calculateNights(bookingData.checkIn, bookingData.checkOut) > 1 ? 's' : ''}
                    </span>
                    <span className="font-medium">
                      €{(selectedCampsite.price * calculateNights(bookingData.checkIn, bookingData.checkOut)).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cleaning fee</span>
                    <span className="font-medium">€15.00</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service fee (10%)</span>
                    <span className="font-medium">
                      €{((selectedCampsite.price * calculateNights(bookingData.checkIn, bookingData.checkOut)) * 0.1).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes (8%)</span>
                    <span className="font-medium">
                      €{(((selectedCampsite.price * calculateNights(bookingData.checkIn, bookingData.checkOut)) + 15 + ((selectedCampsite.price * calculateNights(bookingData.checkIn, bookingData.checkOut)) * 0.1)) * 0.08).toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-gray-300 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900 text-lg">Total</span>
                    <span className="font-bold text-teal-600 text-lg">
                      €{(
                        (selectedCampsite.price * calculateNights(bookingData.checkIn, bookingData.checkOut)) +
                        15 +
                        ((selectedCampsite.price * calculateNights(bookingData.checkIn, bookingData.checkOut)) * 0.1) +
                        (((selectedCampsite.price * calculateNights(bookingData.checkIn, bookingData.checkOut)) + 15 + ((selectedCampsite.price * calculateNights(bookingData.checkIn, bookingData.checkOut)) * 0.1)) * 0.08)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Trust Elements */}
              <div className="space-y-2">
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <Shield size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Free cancellation up to 48 hours before check-in</span>
                </div>
                <div className="flex items-start space-x-2 text-sm text-gray-600">
                  <Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>You won't be charged yet</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bookingData.checkIn || !bookingData.checkOut}
                  className="flex-1 py-3 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <ShoppingCart size={20} />
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
