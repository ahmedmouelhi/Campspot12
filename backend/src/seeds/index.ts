import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import CampingSite from '../models/CampingSite';
import Activity from '../models/Activity';
import BlogPost from '../models/BlogPost';
import Equipment from '../models/Equipment';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/camping-app';

// Sample data
const sampleUsers = [
  {
    email: 'admin@campspot.com',
    password: 'Admin123@',
    name: 'Admin User',
    instagramUrl: 'https://instagram.com/campspot_admin',
    role: 'admin',
    registrationDate: new Date(),
    isActive: true,
    preferences: {
      notifications: true,
      location: true
    }
  },
  {
    email: 'john.doe@example.com',
    password: 'Password123@',
    name: 'John Doe',
    instagramUrl: 'https://instagram.com/johndoe_camper',
    role: 'user',
    registrationDate: new Date(),
    isActive: true,
    preferences: {
      notifications: true,
      location: false
    }
  }
];

const sampleCampsites = [
  {
    name: 'Mountain View Camp',
    location: 'Rocky Mountains',
    price: 45,
    rating: 4.8,
    description: 'Stunning mountain views with hiking trails nearby',
    features: ['WiFi', 'Bathrooms', 'Fire Pits', 'Hiking Trails'],
    image: '🏔️',
    capacity: 6,
    availability: 'available',
    type: 'tent',
    status: 'active'
  },
  {
    name: 'Lakeside Retreat',
    location: 'Blue Lake',
    price: 35,
    rating: 4.6,
    description: 'Peaceful lakeside camping with water activities',
    features: ['Lake Access', 'Boat Rental', 'Bathrooms', 'Picnic Tables'],
    image: '🏞️',
    capacity: 4,
    availability: 'available',
    type: 'cabin',
    status: 'active'
  },
  {
    name: 'Forest Haven',
    location: 'Pine Forest',
    price: 40,
    rating: 4.7,
    description: 'Deep forest experience with wildlife watching',
    features: ['Secluded', 'Wildlife Viewing', 'Hiking Trails', 'Fire Pits'],
    image: '🌲',
    capacity: 8,
    availability: 'limited',
    type: 'rv',
    status: 'active'
  }
];

const sampleActivities = [
  {
    name: 'Mountain Hiking',
    icon: '🥾',
    description: 'Explore scenic mountain trails with guided tours',
    duration: '4-8 hours',
    difficulty: 'Intermediate',
    price: 25,
    category: 'Hiking',
    maxParticipants: 12,
    equipment: ['Hiking boots', 'Backpack', 'Water bottle'],
    rating: 0,
    reviews: [],
    images: [],
    status: 'active'
  },
  {
    name: 'Lake Fishing',
    icon: '🎣',
    description: 'Peaceful fishing in crystal clear mountain lakes',
    duration: '3-6 hours',
    difficulty: 'Easy',
    price: 20,
    category: 'Fishing',
    maxParticipants: 8,
    equipment: ['Fishing rod', 'Bait', 'Fishing license'],
    rating: 0,
    reviews: [],
    images: [],
    status: 'active'
  },
  {
    name: 'Kayaking Adventure',
    icon: '🛶',
    description: 'Navigate through calm waters and discover hidden coves',
    duration: '2-4 hours',
    difficulty: 'Beginner',
    price: 30,
    category: 'Water Sports',
    maxParticipants: 10,
    equipment: ['Kayak', 'Paddle', 'Life jacket'],
    rating: 0,
    reviews: [],
    images: [],
    status: 'active'
  }
];

const sampleEquipment = [
  {
    name: 'Professional Tent (4-person)',
    category: 'Shelter',
    price: 25,
    period: 'day',
    description: 'Waterproof tent suitable for all weather conditions',
    features: ['Waterproof', '4-person capacity', 'Easy setup', 'Includes stakes'],
    image: '⛺',
    availability: 'Available',
    quantity: 15,
    condition: 'Excellent',
    status: 'active',
    specifications: {
      weight: '3.2kg',
      dimensions: '240x210x130cm',
      material: 'Ripstop Nylon',
      capacity: '4 persons'
    },
    maintenance: {},
    rentalHistory: [],
    reviews: [],
    rating: 0
  },
  {
    name: 'Sleeping Bag (Winter)',
    category: 'Sleeping',
    price: 15,
    period: 'day',
    description: 'High-quality sleeping bag rated for -10°C',
    features: ['Winter rated', 'Compact', 'Comfortable', 'Water resistant'],
    image: '🛏️',
    availability: 'Available',
    quantity: 20,
    condition: 'Good',
    status: 'active',
    specifications: {
      weight: '1.8kg',
      dimensions: '220x80cm',
      material: 'Down filled',
      capacity: '1 person'
    },
    maintenance: {},
    rentalHistory: [],
    reviews: [],
    rating: 0
  },
  {
    name: 'Portable Gas Stove',
    category: 'Cooking',
    price: 12,
    period: 'day',
    description: 'Lightweight camping stove with gas cartridge',
    features: ['Lightweight', 'Wind resistant', 'Includes gas', 'Easy ignition'],
    image: '🔥',
    availability: 'Limited',
    quantity: 8,
    condition: 'Excellent',
    status: 'active',
    specifications: {
      weight: '0.8kg',
      dimensions: '15x12x8cm',
      material: 'Aluminum',
      capacity: '2.5kW'
    },
    maintenance: {},
    rentalHistory: [],
    reviews: [],
    rating: 0
  }
];

const sampleBlogPosts = [
  {
    title: 'Essential Camping Gear for Beginners',
    excerpt: 'Everything you need to know about camping equipment for your first outdoor adventure.',
    content: 'Starting your camping journey can be overwhelming with so much gear available. This comprehensive guide covers the essential items every beginner needs to have a safe and enjoyable outdoor experience...',
    category: 'Gear Guide',
    readTime: '5 min read',
    image: '🎒',
    published: true,
    tags: ['camping', 'gear', 'beginners'],
    slug: 'essential-camping-gear-for-beginners'
  },
  {
    title: 'Best Camping Spots for Stargazing',
    excerpt: 'Discover the most spectacular locations for astronomical observations during your camping trip.',
    content: 'The night sky offers incredible views when you escape light pollution. Here are our top picks for stargazing campsites across different regions...',
    category: 'Destinations',
    readTime: '7 min read',
    image: '🌌',
    published: true,
    tags: ['stargazing', 'destinations', 'night'],
    slug: 'best-camping-spots-for-stargazing'
  }
];

async function seedDatabase() {
  try {
    // Prevent seeding in production
    if (process.env.NODE_ENV === 'production') {
      console.log('🚫 Seeding is disabled in production environment');
      console.log('⚠️  This prevents accidental data loss in production');
      return;
    }
    
    console.log('🌱 Starting database seeding...');
    console.log('⚠️  WARNING: This will clear all existing data!');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      CampingSite.deleteMany({}),
      Activity.deleteMany({}),
      BlogPost.deleteMany({}),
      Equipment.deleteMany({})
    ]);

    // Seed Users
    console.log('👥 Seeding users...');
    const users = await User.create(sampleUsers);
    console.log(`✅ Created ${users.length} users`);

    // Seed Campsites
    console.log('🏕️ Seeding campsites...');
    const campsites = await CampingSite.create(sampleCampsites);
    console.log(`✅ Created ${campsites.length} campsites`);

    // Seed Activities
    console.log('🎯 Seeding activities...');
    const activities = await Activity.create(sampleActivities);
    console.log(`✅ Created ${activities.length} activities`);

    // Seed Equipment
    console.log('🎒 Seeding equipment...');
    const equipment = await Equipment.create(sampleEquipment);
    console.log(`✅ Created ${equipment.length} equipment items`);

    // Seed Blog Posts (with admin user as author)
    console.log('📝 Seeding blog posts...');
    const adminUser = users.find(user => user.role === 'admin');
    const blogPostsWithAuthor = sampleBlogPosts.map(post => ({
      ...post,
      author: adminUser?._id,
      date: new Date(),
      views: 0,
      likes: [],
      comments: [],
      seo: {
        keywords: post.tags
      }
    }));
    const blogPosts = await BlogPost.create(blogPostsWithAuthor);
    console.log(`✅ Created ${blogPosts.length} blog posts`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏕️ Campsites: ${campsites.length}`);
    console.log(`   🎯 Activities: ${activities.length}`);
    console.log(`   🎒 Equipment: ${equipment.length}`);
    console.log(`   📝 Blog Posts: ${blogPosts.length}`);
    
    console.log('\n🔐 Admin Credentials:');
    console.log('   Email: admin@campspot.com');
    console.log('   Password: Admin123@');
    console.log('\n👤 Test User Credentials:');
    console.log('   Email: john.doe@example.com');
    console.log('   Password: Password123@');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
}

// Run seeding
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;
