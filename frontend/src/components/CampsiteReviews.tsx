import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, MapPin, Calendar } from 'lucide-react';

interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  title: string;
  comment: string;
  campsite: string;
  date: string;
  verified: boolean;
  helpful: number;
  images?: string[];
}

interface CampsiteReviewsProps {
  className?: string;
}

const CampsiteReviews: React.FC<CampsiteReviewsProps> = ({ className = '' }) => {
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const reviews: Review[] = [
    {
      id: '1',
      userName: 'Sarah Johnson',
      userAvatar: '👩‍🦰',
      rating: 5,
      title: 'Perfect Mountain Getaway!',
      comment: 'Mountain View Camp exceeded all our expectations! The views were absolutely breathtaking, especially at sunrise. The facilities were clean and well-maintained. The hiking trails nearby were fantastic for all skill levels. Will definitely be back!',
      campsite: 'Mountain View Camp',
      date: 'August 2024',
      verified: true,
      helpful: 24,
      images: ['🏔️', '🌅', '⛺']
    },
    {
      id: '2',
      userName: 'Mike Chen',
      userAvatar: '👨‍💼',
      rating: 5,
      title: 'Peaceful Lake Experience',
      comment: 'Lakeside Retreat was the perfect escape from city life. Woke up to the sound of gentle waves and birds singing. The fishing was excellent - caught several bass! The staff was incredibly helpful and friendly. Highly recommend for families.',
      campsite: 'Lakeside Retreat',
      date: 'July 2024',
      verified: true,
      helpful: 19,
      images: ['🏞️', '🎣', '🐟']
    },
    {
      id: '3',
      userName: 'Emily Davis',
      userAvatar: '👩‍🎓',
      rating: 4,
      title: 'Great for Nature Lovers',
      comment: 'Forest Haven is a true wilderness experience! Saw deer right at our campsite and heard owls at night. The forest trails are well-marked and beautiful. Only minor issue was limited cell service, but that\'s actually a plus for disconnecting!',
      campsite: 'Forest Haven',
      date: 'June 2024',
      verified: true,
      helpful: 15,
      images: ['🌲', '🦌', '🦉']
    },
    {
      id: '4',
      userName: 'David Rodriguez',
      userAvatar: '👨‍👩‍👧‍👦',
      rating: 5,
      title: 'Amazing Family Trip',
      comment: 'Took the whole family to Mountain View Camp and it was incredible! Kids loved the adventure playground and the evening campfire stories. The camp store had everything we forgot to bring. Rangers were super knowledgeable about local wildlife.',
      campsite: 'Mountain View Camp',
      date: 'August 2024',
      verified: true,
      helpful: 32,
      images: ['👨‍👩‍👧‍👦', '🔥', '🏕️']
    },
    {
      id: '5',
      userName: 'Jessica Wong',
      userAvatar: '👩‍💻',
      rating: 4,
      title: 'Romantic Weekend Retreat',
      comment: 'Perfect spot for a romantic getaway! Lakeside Retreat offered privacy and stunning sunset views. The canoe rental was a nice touch. Restaurant recommendations from staff were spot-on. Will return for our anniversary!',
      campsite: 'Lakeside Retreat',
      date: 'September 2024',
      verified: true,
      helpful: 18,
      images: ['💕', '🛶', '🌅']
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        className={index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
      />
    ));
  };

  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const currentReview = reviews[currentReviewIndex];
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className={`bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-3xl font-bold text-gray-800 mb-2">What Our Campers Say</h3>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="flex">
            {renderStars(Math.round(averageRating))}
          </div>
          <span className="text-lg font-semibold text-gray-700">{averageRating.toFixed(1)}</span>
          <span className="text-gray-500">({reviews.length} reviews)</span>
        </div>
        <p className="text-gray-600">Real experiences from real adventurers</p>
      </div>

      {/* Featured Review */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 relative">
        <div className="absolute top-4 right-4 text-teal-200">
          <Quote size={32} />
        </div>
        
        <div className="flex items-start space-x-4 mb-4">
          <div className="text-4xl">{currentReview.userAvatar}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-bold text-gray-800">{currentReview.userName}</h4>
              {currentReview.verified && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Verified Stay
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex">
                {renderStars(currentReview.rating)}
              </div>
              <span className="text-sm text-gray-500">• {currentReview.date}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin size={14} className="mr-1" />
              {currentReview.campsite}
            </div>
          </div>
        </div>

        <h5 className="font-semibold text-gray-800 mb-2">{currentReview.title}</h5>
        <p className="text-gray-700 leading-relaxed mb-4">{currentReview.comment}</p>
        
        {/* Review Images */}
        {currentReview.images && (
          <div className="flex space-x-2 mb-4">
            {currentReview.images.map((emoji, index) => (
              <span key={index} className="text-2xl p-2 bg-gray-50 rounded-lg">
                {emoji}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{currentReview.helpful} people found this helpful</span>
          <div className="flex space-x-2">
            <button
              onClick={prevReview}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span>{currentReviewIndex + 1} of {reviews.length}</span>
            <button
              onClick={nextReview}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Review Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">⭐</div>
          <div className="text-2xl font-bold text-teal-600">{averageRating.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-2xl font-bold text-teal-600">
            {reviews.filter(r => r.verified).length}
          </div>
          <div className="text-sm text-gray-600">Verified Reviews</div>
        </div>
        
        <div className="bg-white rounded-lg p-4 text-center">
          <div className="text-2xl mb-2">👥</div>
          <div className="text-2xl font-bold text-teal-600">{reviews.length}</div>
          <div className="text-sm text-gray-600">Happy Campers</div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-6">
        <p className="text-gray-600 mb-3">Join thousands of satisfied campers!</p>
        <button className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors">
          Read All Reviews
        </button>
      </div>
    </div>
  );
};

export default CampsiteReviews;
