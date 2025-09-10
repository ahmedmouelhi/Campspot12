import React from 'react';

const About = () => {
  const stats = [
    { number: '1000+', label: 'Happy Campers' },
    { number: '50+', label: 'Camping Sites' },
    { number: '20+', label: 'Activities' },
    { number: '5', label: 'Years Experience' }
  ];

  const team = [
    { name: 'Sarah Johnson', role: 'Founder & CEO', image: '👩‍💼' },
    { name: 'Mike Wilson', role: 'Adventure Guide', image: '🧑‍🦲' },
    { name: 'Emma Davis', role: 'Customer Success', image: '👩‍🦰' },
    { name: 'Tom Brown', role: 'Operations Manager', image: '👨‍💼' }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">About CampSpot</h1>
          <p className="text-xl max-w-3xl mx-auto">
            We're passionate about connecting people with nature through unforgettable camping experiences. 
            Since 2019, we've been creating memories that last a lifetime.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-800">Our Mission</h2>
              <p className="text-gray-600 mb-4">
                At CampSpot, we believe that spending time in nature is essential for wellbeing and happiness. 
                Our mission is to make outdoor adventures accessible to everyone, regardless of experience level.
              </p>
              <p className="text-gray-600 mb-4">
                We carefully curate camping locations that offer the perfect balance of adventure and comfort, 
                ensuring every guest can disconnect from the digital world and reconnect with nature.
              </p>
              <p className="text-gray-600">
                From beginners taking their first camping trip to experienced adventurers seeking new challenges, 
                we provide the tools, guidance, and support needed for an amazing outdoor experience.
              </p>
            </div>
            <div className="h-96 bg-gradient-to-br from-green-400 to-teal-600 rounded-xl flex items-center justify-center">
              <span className="text-6xl">🏕️</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Our Impact</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-teal-600 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                  {member.image}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-xl font-semibold mb-2">Sustainability</h3>
              <p>We protect the environment and promote responsible camping practices.</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p>We build connections between people and foster a sense of adventure.</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-2">Excellence</h3>
              <p>We strive for the highest quality in everything we do.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
