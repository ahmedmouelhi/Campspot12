import React, { useEffect, useState } from 'react';

interface ScrollingBackgroundProps {
  className?: string;
  speed?: number;
}

const ScrollingBackground: React.FC<ScrollingBackgroundProps> = ({ 
  className = '', 
  speed = 50 
}) => {
  const [scrollY, setScrollY] = useState(0);

  // Beautiful camping destinations from around the world
  const destinations = [
    {
      name: 'Banff National Park',
      country: 'Canada',
      emoji: '🏔️',
      colors: ['from-blue-400', 'via-teal-500', 'to-green-400']
    },
    {
      name: 'Patagonia',
      country: 'Chile',
      emoji: '🌨️',
      colors: ['from-gray-400', 'via-blue-500', 'to-indigo-600']
    },
    {
      name: 'Yellowstone',
      country: 'USA',
      emoji: '🌋',
      colors: ['from-yellow-400', 'via-orange-500', 'to-red-500']
    },
    {
      name: 'Swiss Alps',
      country: 'Switzerland',
      emoji: '⛰️',
      colors: ['from-white', 'via-blue-300', 'to-green-500']
    },
    {
      name: 'Norwegian Fjords',
      country: 'Norway',
      emoji: '🌊',
      colors: ['from-blue-500', 'via-teal-400', 'to-green-400']
    },
    {
      name: 'Sahara Desert',
      country: 'Morocco',
      emoji: '🏜️',
      colors: ['from-yellow-300', 'via-orange-400', 'to-red-400']
    },
    {
      name: 'Amazon Rainforest',
      country: 'Brazil',
      emoji: '🌳',
      colors: ['from-green-400', 'via-emerald-500', 'to-green-600']
    },
    {
      name: 'Aurora Borealis',
      country: 'Iceland',
      emoji: '🌌',
      colors: ['from-purple-400', 'via-green-400', 'to-blue-500']
    },
    {
      name: 'Great Barrier Reef',
      country: 'Australia',
      emoji: '🐠',
      colors: ['from-cyan-400', 'via-blue-400', 'to-teal-500']
    },
    {
      name: 'Mount Fuji',
      country: 'Japan',
      emoji: '🗻',
      colors: ['from-pink-300', 'via-purple-400', 'to-blue-500']
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Animated Background Orbs */}
      <div className="absolute inset-0">
        {destinations.map((destination, index) => {
          const delay = index * 2;
          const translateY = (scrollY * speed) / 100;
          const rotateSpeed = 0.1 + (index * 0.05);
          
          return (
            <div
              key={destination.name}
              className="absolute opacity-10 animate-pulse"
              style={{
                left: `${10 + (index % 3) * 30}%`,
                top: `${20 + (index % 4) * 20}%`,
                transform: `translateY(${translateY + delay * 10}px) rotate(${scrollY * rotateSpeed}deg)`,
                animationDelay: `${delay}s`,
                animationDuration: `${6 + index}s`
              }}
            >
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${destination.colors.join(' ')} blur-sm`} />
            </div>
          );
        })}
      </div>

      {/* Floating Destination Cards */}
      <div className="absolute inset-0 pointer-events-none">
        {destinations.map((destination, index) => {
          const isEven = index % 2 === 0;
          const translateY = (scrollY * speed) / 200;
          const delay = index * 0.5;
          
          return (
            <div
              key={`card-${destination.name}`}
              className={`absolute opacity-20 ${
                isEven ? 'animate-float' : 'animate-float-delayed'
              }`}
              style={{
                left: `${5 + (index % 4) * 22}%`,
                top: `${10 + (index % 5) * 18}%`,
                transform: `translateY(${translateY + delay * 20}px)`,
                animationDelay: `${delay}s`
              }}
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                <div className="text-4xl mb-2 text-center">{destination.emoji}</div>
                <div className="text-sm font-bold text-white text-center">
                  {destination.name}
                </div>
                <div className="text-xs text-white/80 text-center">
                  {destination.country}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Particle Effect */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            key={`particle-${index}`}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/40" />
    </div>
  );
};

export default ScrollingBackground;
