import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf, Users, Award, Shield, CheckCircle, Star, MapPin,
  Linkedin, Heart, Target, Zap, Clock, Mail, ArrowRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';

const About = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const stats = [
    {
      number: '1000+',
      label: 'Happy Campers',
      subtitle: 'Join thousands of satisfied adventurers',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      number: '500+',
      label: 'Premium Campsites',
      subtitle: 'Handpicked and verified locations',
      icon: MapPin,
      gradient: 'from-green-500 to-teal-600'
    },
    {
      number: '50+',
      label: 'Outdoor Activities',
      subtitle: 'Guided experiences for all levels',
      icon: Zap,
      gradient: 'from-orange-500 to-red-600'
    },
    {
      number: '5',
      label: 'Years of Excellence',
      subtitle: 'Trusted since 2019',
      icon: Award,
      gradient: 'from-purple-500 to-pink-600'
    }
  ];

  const differentiators = [
    {
      icon: Leaf,
      title: 'Curated Eco-Friendly Sites',
      description: 'Every campsite is verified for sustainability. We partner only with locations that follow Leave No Trace principles.',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: Target,
      title: 'All-in-One Booking',
      description: 'Book campsites, activities, and equipment in one seamless experience. No need to juggle multiple platforms.',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Users,
      title: 'Expert Guidance',
      description: '24/7 support from certified outdoor professionals. Get help planning, during your trip, and everything in between.',
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      icon: CheckCircle,
      title: 'Verified Quality',
      description: 'Every location is personally inspected by our team. We ensure safety, cleanliness, and unforgettable experiences.',
      gradient: 'from-orange-500 to-red-600'
    }
  ];

  const testimonials = [
    {
      name: 'Jennifer M.',
      location: 'Seattle, WA',
      rating: 5,
      text: 'CampSpot made our family camping trip unforgettable. The site was pristine and the equipment rental was seamless!',
      avatar: 'JM'
    },
    {
      name: 'David L.',
      location: 'Portland, OR',
      rating: 5,
      text: 'As a first-time camper, I was nervous. The 24/7 support team guided me through everything. Highly recommend!',
      avatar: 'DL'
    },
    {
      name: 'Sarah & Tom K.',
      location: 'Denver, CO',
      rating: 5,
      text: "We've used CampSpot for 5 trips now. The curated locations are always stunning and well-maintained.",
      avatar: 'SK'
    }
  ];

  const trustBadges = [
    { icon: Shield, text: 'Secure Bookings' },
    { icon: CheckCircle, text: 'Verified Campsites' },
    { icon: Award, text: 'Award-Winning Service' },
    { icon: Leaf, text: 'Eco-Certified Partner' }
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      bio: '15+ years outdoor industry experience. Passionate about sustainable tourism.',
      favoriteCampsite: 'Yosemite Valley',
      location: 'San Francisco, CA',
      image: 'https://ui-avatars.com/api/?name=Sarah+Johnson&size=200&background=0D8ABC&color=fff'
    },
    {
      name: 'Mike Wilson',
      role: 'Head Adventure Guide',
      bio: 'Certified wilderness guide. Led 200+ camping expeditions across North America.',
      favoriteCampsite: 'Grand Canyon',
      location: 'Denver, CO',
      image: 'https://ui-avatars.com/api/?name=Mike+Wilson&size=200&background=10B981&color=fff'
    },
    {
      name: 'Emma Davis',
      role: 'Customer Success Lead',
      bio: 'Dedicated to ensuring every camper has an amazing experience.',
      favoriteCampsite: 'Lake Tahoe',
      location: 'Portland, OR',
      image: 'https://ui-avatars.com/api/?name=Emma+Davis&size=200&background=F59E0B&color=fff'
    },
    {
      name: 'Tom Brown',
      role: 'Operations Manager',
      bio: 'Logistics expert ensuring seamless bookings and equipment delivery.',
      favoriteCampsite: 'Zion National Park',
      location: 'Salt Lake City, UT',
      image: 'https://ui-avatars.com/api/?name=Tom+Brown&size=200&background=8B5CF6&color=fff'
    }
  ];

  const values = [
    {
      icon: Leaf,
      title: 'Sustainability',
      description: 'We protect the environment and promote responsible camping practices.',
      example: '100% of our sites follow Leave No Trace principles',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: Heart,
      title: 'Community',
      description: 'We build connections between people and foster a sense of adventure.',
      example: 'Join 10,000+ members in our camping community',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We strive for the highest quality in everything we do.',
      example: '4.9/5 average rating from verified campers',
      gradient: 'from-purple-500 to-pink-600'
    }
  ];

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubscribing(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/newsletter/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, source: 'about-page' })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('🎉 ' + data.message);
        setEmail('');
      } else {
        toast.error(data.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please check your connection and try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const scrollToTeam = () => {
    document.getElementById('team-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white">
      {/* Hero Section with Background Image */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/hero-bg.jpg"
            alt="Camping background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-teal-900/90 via-blue-900/80 to-purple-900/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-20">
          <div className="animate-fade-in">
            <span className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/30 mb-6">
              🌍 About CampSpot
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">
                Connecting Adventurers
              </span>
              <br />
              <span className="bg-gradient-to-r from-teal-200 to-blue-200 bg-clip-text text-transparent">
                with Nature
              </span>
            </h1>
            <p className="text-xl sm:text-2xl mb-10 max-w-3xl mx-auto text-white/90 leading-relaxed">
              Since 2019, we've been creating unforgettable outdoor experiences for thousands of campers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/campsites')}
                className="inline-flex items-center justify-center bg-gradient-to-r from-teal-500 to-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-teal-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                🏕️ Explore Campsites
                <ArrowRight className="ml-2" size={20} />
              </button>
              <button
                onClick={scrollToTeam}
                className="inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-all duration-300 border border-white/30 hover:border-white/50"
              >
                👥 Meet Our Team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              What Makes CampSpot Different
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're not just another booking platform—we're your complete outdoor adventure partner
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {differentiators.map((item, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <item.icon className="text-white" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-teal-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center justify-center space-x-3 text-gray-700">
                <badge.icon className="text-teal-600" size={24} />
                <span className="font-semibold text-sm sm:text-base">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section with Image */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
                Our Mission
              </h2>
              <p className="text-gray-600 mb-4 text-lg leading-relaxed">
                At CampSpot, we believe that spending time in nature is essential for wellbeing and happiness.
                Our mission is to make outdoor adventures accessible to everyone, regardless of experience level.
              </p>
              <p className="text-gray-600 mb-4 text-lg leading-relaxed">
                We carefully curate camping locations that offer the perfect balance of adventure and comfort,
                ensuring every guest can disconnect from the digital world and reconnect with nature.
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                From beginners taking their first camping trip to experienced adventurers seeking new challenges,
                we provide the tools, guidance, and support needed for an amazing outdoor experience.
              </p>
            </div>
            <div className="h-96 rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/campsite-2.jpg"
                alt="Camping experience"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                onError={(e) => {
                  // Fallback to gradient if image fails
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.className = 'h-96 bg-gradient-to-br from-green-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl';
                    parent.innerHTML = '<span class="text-8xl">🏕️</span>';
                  }
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              What Our Campers Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real experiences from real adventurers
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-yellow-500 fill-current" size={20} />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Our Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Numbers that tell our story
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-100"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <stat.icon className="text-white" size={28} />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-lg font-semibold text-gray-800 mb-2">{stat.label}</div>
                <div className="text-sm text-gray-500">{stat.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team-section" className="py-20 bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Passionate outdoor enthusiasts dedicated to your adventure
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105"
              >
                <div className="relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-teal-600 transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-teal-600 font-semibold mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {member.bio}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Heart className="mr-2 text-red-500" size={16} />
                      <span className="font-medium">Favorite:</span>
                      <span className="ml-1">{member.favoriteCampsite}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="mr-2 text-blue-500" size={16} />
                      <span>{member.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-100"
              >
                <div className={`w-20 h-20 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  <value.icon className="text-white" size={36} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-teal-600 transition-colors">
                  {value.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {value.description}
                </p>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-teal-600 font-semibold">
                    {value.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-br from-teal-600 via-blue-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-white rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Mail className="w-16 h-16 mx-auto mb-6 text-white/90" />
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">Stay Connected</h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Get camping tips, exclusive deals, and new location updates delivered to your inbox
          </p>
          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 rounded-xl text-gray-800 focus:outline-none focus:ring-4 focus:ring-white/30 text-lg"
                disabled={subscribing}
              />
              <button
                type="submit"
                disabled={subscribing}
                className="bg-white text-teal-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

export default About;
