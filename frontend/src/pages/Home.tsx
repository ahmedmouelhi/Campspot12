import React, { useState, useEffect } from 'react';
import { Star, Sparkles, Award, MessageCircle, BookOpen, TrendingUp, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatBot from '../components/ChatBot';
import CampsiteReviews from '../components/CampsiteReviews';
import ScrollingBackground from '../components/ScrollingBackground';
import WhyChooseCampSpot from '../components/WhyChooseCampSpot';
import apiService from '../services/apiService';
import { toast } from 'react-toastify';
import { useAuthCheck } from '../hooks/useAuthCheck';
import { useAuth } from '../contexts/AuthContext';

interface Campsite {
  _id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  description: string;
  image: string;
  type: string;
  capacity: number;
  features: string[];
}

const Home = () => {
  const [featuredCampsites, setFeaturedCampsites] = useState<Campsite[]>([]);
  const [campsitesLoading, setCampsitesLoading] = useState(true);
  const navigate = useNavigate();
  const { requireAuthForBooking, requireAuthForCart, isAuthenticated } = useAuthCheck();
  const { user } = useAuth();

  // Static fallback data in case API fails
  const fallbackCampsites = [
    { _id: '1', name: 'Mountain View Camp', price: 45, rating: 4.8, image: '🏔️', description: 'Breathtaking alpine views and pristine hiking trails', location: 'Rocky Mountains', type: 'tent', capacity: 6, features: [] },
    { _id: '2', name: 'Lakeside Retreat', price: 35, rating: 4.6, image: '🏞️', description: 'Peaceful waters perfect for fishing and kayaking', location: 'Blue Lake', type: 'cabin', capacity: 4, features: [] },
    { _id: '3', name: 'Forest Haven', price: 40, rating: 4.7, image: '🌲', description: 'Deep forest experience with abundant wildlife', location: 'Pine Forest', type: 'rv', capacity: 8, features: [] }
  ];

  useEffect(() => {
    const loadFeaturedCampsites = async () => {
      try {
        setCampsitesLoading(true);
        // Try to fetch real campsites from API
        const response = await apiService.getCampsites({ pageSize: 3 });
        console.log('Campsites API response:', response);

        if (response.success && response.data && response.data.length > 0) {
          setFeaturedCampsites(response.data.slice(0, 3)); // Show only first 3
        } else {
          // Use fallback data if API fails or returns no data
          console.log('Using fallback campsites data');
          setFeaturedCampsites(fallbackCampsites);
        }
      } catch (error) {
        console.error('Error loading campsites:', error);
        // Use fallback data on error
        setFeaturedCampsites(fallbackCampsites);
      } finally {
        setCampsitesLoading(false);
      }
    };

    loadFeaturedCampsites();
  }, []);

  return (
    <div>
      {/* ChatBot Widget */}
      <ChatBot />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-indigo-900 via-purple-900 to-teal-800 overflow-hidden">
        {/* Scrolling Background */}
        <ScrollingBackground />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-white">
          <div className="animate-fade-in text-center sm:text-left">
            {/* Personalized Greeting */}
            {user && (
              <div className="mb-4">
                <span className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                  <Sparkles size={16} className="text-yellow-300" />
                  <span>Hi {user.name.split(' ')[0]}, ready for your next trip?</span>
                </span>
              </div>
            )}
            <div className="mb-6">
              <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30 mb-4">
                🌍 Explore World-Class Destinations
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">
                Discover Your Next
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-200 to-blue-200 bg-clip-text text-transparent">
                Adventure
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 sm:mb-10 max-w-3xl mx-auto sm:mx-0 text-white/90 leading-relaxed">
              Experience nature like never before with our premium camping locations and outdoor activities across breathtaking destinations worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
              <button
                onClick={(e) => { e.preventDefault(); window.location.href = '/campsites'; }}
                className="inline-block bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                🏕️ Explore Campsites
              </button>
              <button
                onClick={(e) => { e.preventDefault(); document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-block bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-all duration-300 border border-white/30 hover:border-white/50"
              >
                📅 Quick Book
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section id="booking" className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Award size={32} className="text-teal-600" />
              <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                Why Choose CampSpot?
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of adventurers who trust us for their outdoor experiences
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '500+', label: 'Premium Campsites', icon: '🏕️', gradient: 'from-green-500 to-teal-600' },
              { number: '50+', label: 'Outdoor Activities', icon: '🎯', gradient: 'from-blue-500 to-purple-600' },
              { number: '1000+', label: 'Equipment Items', icon: '🎒', gradient: 'from-orange-500 to-red-600' },
              { number: '10K+', label: 'Happy Campers', icon: '⭐', gradient: 'from-yellow-500 to-orange-600' }
            ].map((stat, index) => (
              <div key={stat.label} className="group bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">{stat.number}</div>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = '/campsites'; }}
              className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-teal-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
            >
              🏕️ Browse All Campsites
            </button>
          </div>
        </div>
      </section>


      {/* Featured Campsites */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <TrendingUp size={32} className="text-teal-600" />
              <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                Featured Camping Spots
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover our most loved destinations with world-class amenities
            </p>
          </div>
          {campsitesLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <p className="mt-4 text-gray-600">Loading campsites...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCampsites.map((campsite, index) => (
                <div key={campsite._id} className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="h-56 relative overflow-hidden bg-gradient-to-br from-green-400 via-teal-500 to-blue-600">
                    {campsite.image && campsite.image.startsWith('http') ? (
                      // Display actual image if it's a URL
                      <>
                        <img
                          src={campsite.image}
                          alt={campsite.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            // Fallback to gradient with emoji if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                      </>
                    ) : (
                      // Display emoji for fallback data
                      <div className="flex items-center justify-center text-7xl relative h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20" />
                        <span className="relative z-10 group-hover:scale-110 transition-transform duration-300">
                          {campsite.image || '🏕️'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-800 group-hover:text-teal-600 transition-colors">
                        {campsite.name}
                      </h3>
                      <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
                        <Star size={16} className="text-yellow-500 fill-current" />
                        <span className="text-sm font-bold text-yellow-600">{campsite.rating}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2 text-sm font-medium">{campsite.location}</p>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {campsite.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                        ${campsite.price}<span className="text-sm text-gray-500 font-normal">/night</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (requireAuthForBooking({ name: campsite.name, id: campsite._id }, '/campsites')) {
                            navigate('/campsites');
                          }
                        }}
                        className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:from-teal-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        {isAuthenticated ? 'Book Now' : 'Login to Book'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Equipment Rental */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-teal-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-teal-400 to-purple-500 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
              Premium Equipment Rental
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional-grade gear for the ultimate outdoor experience
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '⛺', name: 'Tents & Shelters', desc: '2-6 person professional tents', price: '$25', gradient: 'from-green-500 to-teal-600' },
              { icon: '🛏️', name: 'Sleep Systems', desc: 'Sleeping bags & comfort pads', price: '$15', gradient: 'from-blue-500 to-purple-600' },
              { icon: '🔥', name: 'Camp Kitchen', desc: 'Stoves, cookware & coolers', price: '$12', gradient: 'from-orange-500 to-red-600' },
            ].map((item, idx) => (
              <div key={idx} className="group bg-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className={`w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">{item.name}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{item.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">{item.price}<span className="text-sm text-gray-500 font-normal">/day</span></span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (requireAuthForCart(item.name, 'equipment', '/equipment')) {
                        navigate('/equipment');
                      }
                    }}
                    className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                  >
                    {isAuthenticated ? 'Rent Now' : 'Login to Rent'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-48 h-48 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
              Adventure Activities
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Guided experiences that create unforgettable memories
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Hiking', emoji: '🥾', price: '$25', difficulty: 'Intermediate', gradient: 'from-green-500 to-emerald-600' },
              { name: 'Fishing', emoji: '🎣', price: '$20', difficulty: 'Easy', gradient: 'from-blue-500 to-cyan-600' },
              { name: 'Kayaking', emoji: '🛶', price: '$30', difficulty: 'Beginner', gradient: 'from-teal-500 to-blue-600' },
              { name: 'Stargazing', emoji: '⭐', price: '$15', difficulty: 'All Levels', gradient: 'from-purple-500 to-indigo-600' }
            ].map((activity, index) => (
              <div key={activity.name} className="group bg-white rounded-2xl shadow-xl p-6 text-center hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`w-16 h-16 bg-gradient-to-br ${activity.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  {activity.emoji}
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">{activity.name}</h3>
                <p className="text-gray-500 text-sm mb-2">{activity.difficulty}</p>
                <p className="text-gray-600 text-sm mb-4">
                  Experience the thrill of outdoor adventures with our guided {activity.name.toLowerCase()} activities.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">{activity.price}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (requireAuthForCart(activity.name, 'activity', '/activities')) {
                        navigate('/activities');
                      }
                    }}
                    className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:from-teal-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                  >
                    {isAuthenticated ? 'Join' : 'Login to Join'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-amber-50 to-orange-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-2xl animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              🔥 Special Offers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Limited-time deals for your next adventure
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Weekend Deal */}
            <div className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                25% OFF
              </div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg mr-4">
                  🌅
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 group-hover:text-amber-600 transition-colors">Weekend Warrior</h3>
                  <p className="text-gray-600">Friday - Sunday bookings</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Book any campsite for a weekend stay and get 25% off! Perfect for short getaways and weekend adventures.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg text-gray-500">Valid until Sept 30</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (isAuthenticated) {
                      navigate('/campsites');
                    } else {
                      toast.info('Please log in to access weekend deals');
                      navigate('/auth?mode=login');
                    }
                  }}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:from-amber-700 hover:to-orange-700 transition-all duration-300 transform hover:scale-105"
                >
                  {isAuthenticated ? 'Book Now' : 'Login to Book'}
                </button>
              </div>
            </div>

            {/* Equipment Bundle */}
            <div className="bg-white rounded-2xl shadow-xl p-8 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                BUNDLE DEAL
              </div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg mr-4">
                  🎒
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">Complete Kit</h3>
                  <p className="text-gray-600">Rent 3+ items, save 20%</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Get everything you need for your trip! Rent any 3 equipment items and automatically save 20% on your total.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg text-gray-500">Auto-applied at checkout</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    if (isAuthenticated) {
                      navigate('/equipment');
                    } else {
                      toast.info('Please log in to access equipment bundles');
                      navigate('/auth?mode=login');
                    }
                  }}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
                >
                  {isAuthenticated ? 'Shop Gear' : 'Login to Shop'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <MessageCircle size={32} className="text-teal-600" />
              <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                Customer Reviews
              </h2>
            </div>
          </div>
          <CampsiteReviews />
        </div>
      </section>

      {/* Blog Preview */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute bottom-10 left-10 w-56 h-56 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-3xl animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <BookOpen size={32} className="text-purple-600" />
              <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                From Our Blog
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Expert tips and inspiring stories from fellow adventurers
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { emoji: '🎒', title: 'Essential Gear for Campers', desc: 'Complete guide to must-have camping equipment', readTime: '5 min read', gradient: 'from-green-500 to-teal-600' },
              { emoji: '🌌', title: 'Top Spots for Stargazing', desc: 'Discover the best dark-sky locations worldwide', readTime: '7 min read', gradient: 'from-indigo-500 to-purple-600' },
              { emoji: '🔥', title: 'Campfire Cooking Ideas', desc: 'Delicious recipes for outdoor cooking', readTime: '4 min read', gradient: 'from-orange-500 to-red-600' },
            ].map((post, idx) => (
              <div key={idx} className="group bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className={`w-16 h-16 bg-gradient-to-br ${post.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  {post.emoji}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">{post.title}</h3>
                <p className="text-gray-600 mb-3 leading-relaxed">{post.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{post.readTime}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = '/blog'; }}
                    className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                  >
                    Read More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-teal-600 via-blue-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-fade-in">
            <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30 mb-6">
              🎆 Start Your Journey
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Ready for Your Next
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Adventure?
              </span>
            </h2>
            <p className="text-xl sm:text-2xl mb-10 max-w-3xl mx-auto text-white/90 leading-relaxed">
              Book your camping experience today and create memories that last a lifetime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="bg-white text-teal-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                🚀 Start Planning Now
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = '/about'; }}
                className="bg-white/20 backdrop-blur-sm text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-all duration-300 border border-white/30 hover:border-white/50"
              >
                📞 Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
