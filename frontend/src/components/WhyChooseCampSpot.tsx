import React, { useState, useEffect } from 'react';
import { Shield, Star, Clock, MapPin, Headphones, Award, ChevronLeft, ChevronRight } from 'lucide-react';

interface Feature {
  id: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgGradient: string;
}

const WhyChooseCampSpot: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const features: Feature[] = [
    {
      id: 1,
      icon: <Shield size={28} />,
      title: "100% Secure Booking",
      description: "Your reservations and payments are protected with bank-level security. Book with confidence knowing your data is safe.",
      color: "text-emerald-600",
      bgGradient: "from-emerald-100 to-teal-100"
    },
    {
      id: 2,
      icon: <Star size={28} />,
      title: "Premium Campsites",
      description: "Hand-picked locations with verified reviews. Each campsite meets our high standards for cleanliness and amenities.",
      color: "text-yellow-600",
      bgGradient: "from-yellow-100 to-orange-100"
    },
    {
      id: 3,
      icon: <Clock size={28} />,
      title: "Instant Confirmation",
      description: "Get immediate booking confirmation via email and SMS. No waiting, no uncertainty - just instant peace of mind.",
      color: "text-blue-600",
      bgGradient: "from-blue-100 to-indigo-100"
    },
    {
      id: 4,
      icon: <MapPin size={28} />,
      title: "Nationwide Network",
      description: "Access to 10,000+ campsites across the country. From mountain retreats to beachfront spots - we've got you covered.",
      color: "text-purple-600",
      bgGradient: "from-purple-100 to-pink-100"
    },
    {
      id: 5,
      icon: <Headphones size={28} />,
      title: "24/7 Support",
      description: "Round-the-clock customer service from real camping enthusiasts. We're here to help make your trip perfect.",
      color: "text-teal-600",
      bgGradient: "from-teal-100 to-cyan-100"
    },
    {
      id: 6,
      icon: <Award size={28} />,
      title: "Best Price Guarantee",
      description: "Find the same campsite for less elsewhere? We'll match the price and give you an extra 10% off your next booking.",
      color: "text-red-600",
      bgGradient: "from-red-100 to-rose-100"
    }
  ];

  const itemsPerSlide = 3;
  const totalSlides = Math.ceil(features.length / itemsPerSlide);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, 4000);

    return () => clearInterval(interval);
  }, [totalSlides, isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const getCurrentSlideFeatures = () => {
    const startIndex = currentSlide * itemsPerSlide;
    return features.slice(startIndex, startIndex + itemsPerSlide);
  };

  return (
    <div className="py-16 bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-teal-200 to-blue-300 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-purple-200 to-pink-300 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Why Choose CampSpot?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Join over 100,000 happy campers who trust CampSpot for their outdoor adventures. 
            Discover what makes us the #1 choice for camping enthusiasts nationwide.
          </p>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Navigation Buttons */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); prevSlide(); }}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-20 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <ChevronLeft size={24} className="text-gray-600 group-hover:text-teal-600" />
          </button>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); nextSlide(); }}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-20 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group"
          >
            <ChevronRight size={24} className="text-gray-600 group-hover:text-teal-600" />
          </button>

          {/* Slides */}
          <div className="overflow-hidden rounded-2xl">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                    {features.slice(slideIndex * itemsPerSlide, (slideIndex + 1) * itemsPerSlide).map((feature, index) => (
                      <div
                        key={feature.id}
                        className={`bg-gradient-to-br ${feature.bgGradient} p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group cursor-pointer border border-white/50 backdrop-blur-sm`}
                        style={{
                          animationDelay: `${index * 150}ms`
                        }}
                      >
                        <div className={`${feature.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-gray-900">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed group-hover:text-gray-700">
                          {feature.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slide Indicators */}
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToSlide(index); }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-gradient-to-r from-teal-500 to-blue-600 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { number: "100K+", label: "Happy Campers", icon: "👥" },
            { number: "10K+", label: "Campsites", icon: "🏕️" },
            { number: "4.9★", label: "Average Rating", icon: "⭐" },
            { number: "24/7", label: "Support", icon: "🎧" }
          ].map((stat, index) => (
            <div 
              key={index} 
              className="text-center p-6 bg-white/70 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-white/50 backdrop-blur-sm"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-1">
                {stat.number}
              </div>
              <div className="text-sm font-medium text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-teal-600 to-blue-600 rounded-2xl p-8 shadow-2xl">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Start Your Adventure?
            </h3>
            <p className="text-teal-100 text-lg mb-6 max-w-2xl mx-auto">
              Join thousands of satisfied campers and discover your perfect outdoor getaway today.
            </p>
            <button 
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = '/campsites'; }}
              className="bg-white text-teal-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-teal-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              🌟 Start Exploring Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhyChooseCampSpot;
