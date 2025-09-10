// Comprehensive data seeding script
const API_BASE_URL = 'http://localhost:5000/api';

// Admin credentials for authentication
const ADMIN_CREDENTIALS = {
    email: 'admin@campspot.com',
    password: 'admin123'
};

let authToken = null;

// Helper function to authenticate
async function authenticate() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ADMIN_CREDENTIALS),
        });
        
        const result = await response.json();
        
        if (response.ok && result.success && result.data?.token) {
            authToken = result.data.token;
            console.log('🔐 Authentication successful');
            return true;
        } else {
            console.error('❌ Authentication failed:', result.message);
            return false;
        }
    } catch (error) {
        console.error('❌ Authentication error:', error);
        return false;
    }
}

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null) {
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        }
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || `API error: ${response.status}`);
        }
        
        return result;
    } catch (error) {
        console.error(`Error with ${method} ${endpoint}:`, error);
        throw error;
    }
}

// Sample data
const campsites = [
    {
        name: 'Mountain View Paradise',
        location: 'Rocky Mountains, Colorado',
        price: 45,
        rating: 4.8,
        description: 'Breathtaking mountain views with premium hiking trails and pristine wilderness access',
        features: ['WiFi', 'Bathrooms', 'Fire Pits', 'Hiking Trails', 'Mountain Views', 'Pet Friendly'],
        image: '🏔️',
        images: [],
        capacity: 6,
        availability: 'available',
        type: 'tent',
        status: 'active'
    },
    {
        name: 'Lakeside Luxury Retreat',
        location: 'Crystal Lake, Montana',
        price: 65,
        rating: 4.9,
        description: 'Luxury lakeside camping with private beach access and water sports',
        features: ['Lake Access', 'Private Beach', 'Boat Rental', 'Bathrooms', 'Electricity', 'Hot Showers'],
        image: '🏞️',
        images: [],
        capacity: 4,
        availability: 'available',
        type: 'cabin',
        status: 'active'
    },
    {
        name: 'Forest Haven Sanctuary',
        location: 'Redwood Forest, California',
        price: 40,
        rating: 4.7,
        description: 'Secluded forest camping among ancient redwoods with wildlife viewing',
        features: ['Secluded', 'Wildlife Viewing', 'Old Growth Trees', 'Fire Pits', 'Quiet Hours'],
        image: '🌲',
        images: [],
        capacity: 8,
        availability: 'limited',
        type: 'glamping',
        status: 'active'
    },
    {
        name: 'Desert Oasis Camp',
        location: 'Mojave Desert, Nevada',
        price: 35,
        rating: 4.5,
        description: 'Unique desert camping experience with stunning sunset views',
        features: ['Stargazing', 'Desert Views', 'Solar Power', 'Water Station', 'Shade Structures'],
        image: '🏜️',
        images: [],
        capacity: 4,
        availability: 'available',
        type: 'tent',
        status: 'active'
    },
    {
        name: 'Coastal Cliff Camping',
        location: 'Big Sur, California',
        price: 55,
        rating: 4.6,
        description: 'Dramatic coastal views with direct ocean access and whale watching',
        features: ['Ocean Views', 'Whale Watching', 'Beach Access', 'Bathrooms', 'Picnic Tables'],
        image: '🌊',
        images: [],
        capacity: 6,
        availability: 'available',
        type: 'rv',
        status: 'active'
    }
];

const activities = [
    {
        name: 'Expert Mountain Hiking',
        icon: '🥾',
        description: 'Challenging mountain trails with professional guides and safety equipment included',
        duration: '6-8 hours',
        difficulty: 'Advanced',
        price: 35,
        category: 'Hiking',
        maxParticipants: 8,
        equipment: ['Professional hiking boots', 'GPS device', 'Emergency kit', 'Trekking poles'],
        images: [],
        location: 'Rocky Mountains',
        status: 'active'
    },
    {
        name: 'Beginner Rock Climbing',
        icon: '🧗',
        description: 'Learn basic rock climbing techniques in a safe, controlled environment',
        duration: '4 hours',
        difficulty: 'Beginner',
        price: 45,
        category: 'Climbing',
        maxParticipants: 6,
        equipment: ['Climbing harness', 'Helmet', 'Climbing shoes', 'Safety ropes'],
        images: [],
        location: 'Rocky Mountains',
        status: 'active'
    },
    {
        name: 'Lake Fishing Experience',
        icon: '🎣',
        description: 'Peaceful fishing in pristine mountain lakes with equipment provided',
        duration: '4-6 hours',
        difficulty: 'Easy',
        price: 25,
        category: 'Fishing',
        maxParticipants: 10,
        equipment: ['Fishing rod', 'Tackle box', 'Bait', 'Fishing license'],
        images: [],
        location: 'Crystal Lake',
        status: 'active'
    },
    {
        name: 'Whitewater Rafting',
        icon: '🚣',
        description: 'Thrilling whitewater rafting adventure for experienced paddlers',
        duration: '5 hours',
        difficulty: 'Advanced',
        price: 65,
        category: 'Water Sports',
        maxParticipants: 12,
        equipment: ['Raft', 'Paddle', 'Life jacket', 'Helmet', 'Wetsuit'],
        images: [],
        location: 'Rapids River',
        status: 'active'
    },
    {
        name: 'Wildlife Photography',
        icon: '📸',
        description: 'Guided wildlife photography tour in natural habitats',
        duration: '3-4 hours',
        difficulty: 'Easy',
        price: 40,
        category: 'Photography',
        maxParticipants: 8,
        equipment: ['Camera (optional)', 'Telephoto lens', 'Tripod', 'Camouflage gear'],
        images: [],
        location: 'Redwood Forest',
        status: 'active'
    },
    {
        name: 'Kayaking Adventure',
        icon: '🛶',
        description: 'Explore calm waters and hidden coves with provided kayaks',
        duration: '3-4 hours',
        difficulty: 'Beginner',
        price: 30,
        category: 'Water Sports',
        maxParticipants: 15,
        equipment: ['Kayak', 'Paddle', 'Life jacket', 'Dry bag'],
        images: [],
        location: 'Crystal Lake',
        status: 'active'
    }
];

const equipment = [
    {
        name: 'Professional Tent (4-person)',
        category: 'Shelter',
        price: 25,
        period: 'day',
        description: 'Waterproof tent suitable for all weather conditions with easy setup',
        features: ['Waterproof', '4-person capacity', 'Easy setup', 'Includes stakes', 'Rainfly included'],
        image: '⛺',
        availability: 'Available',
        quantity: 15,
        condition: 'Excellent',
        status: 'active'
    },
    {
        name: 'Winter Sleeping Bag (-10°C)',
        category: 'Sleeping',
        price: 15,
        period: 'day',
        description: 'High-quality sleeping bag rated for extreme cold weather',
        features: ['Winter rated', 'Compact', 'Comfortable', 'Water resistant', 'Down insulation'],
        image: '🛏️',
        availability: 'Available',
        quantity: 20,
        condition: 'Good',
        status: 'active'
    },
    {
        name: 'Portable Gas Stove',
        category: 'Cooking',
        price: 12,
        period: 'day',
        description: 'Lightweight camping stove with gas cartridge included',
        features: ['Lightweight', 'Wind resistant', 'Includes gas', 'Easy ignition', 'Adjustable flame'],
        image: '🔥',
        availability: 'Limited',
        quantity: 8,
        condition: 'Excellent',
        status: 'active'
    },
    {
        name: 'Hiking Backpack (60L)',
        category: 'Storage',
        price: 18,
        period: 'day',
        description: 'Large capacity hiking backpack with multiple compartments',
        features: ['60L capacity', 'Padded straps', 'Rain cover', 'Multiple pockets', 'Hydration compatible'],
        image: '🎒',
        availability: 'Available',
        quantity: 25,
        condition: 'Excellent',
        status: 'active'
    },
    {
        name: 'Folding Camping Chair',
        category: 'Furniture',
        price: 8,
        period: 'day',
        description: 'Lightweight foldable camping chair with cup holder',
        features: ['Lightweight', 'Foldable', 'Cup holder', 'Carrying bag', 'Weather resistant'],
        image: '🪑',
        availability: 'Available',
        quantity: 30,
        condition: 'Good',
        status: 'active'
    },
    {
        name: 'LED Headlamp',
        category: 'Lighting',
        price: 5,
        period: 'day',
        description: 'LED headlamp with adjustable brightness and long battery life',
        features: ['LED light', 'Adjustable beam', 'Long battery life', 'Weather resistant', 'Red light mode'],
        image: '💡',
        availability: 'Available',
        quantity: 40,
        condition: 'Excellent',
        status: 'active'
    },
    {
        name: 'Camping Cookware Set',
        category: 'Cooking',
        price: 20,
        period: 'day',
        description: 'Complete camping cookware set for 4 people with cleaning supplies',
        features: ['Pots and pans', 'Plates and bowls', 'Cutlery', 'Cleaning supplies', 'Compact storage'],
        image: '🍳',
        availability: 'Available',
        quantity: 12,
        condition: 'Good',
        status: 'active'
    },
    {
        name: 'Water Filter System',
        category: 'Safety',
        price: 10,
        period: 'day',
        description: 'Advanced portable water filtration system for safe drinking water',
        features: ['Removes bacteria', 'Fast filtering', 'Compact design', 'Long filter life', 'Easy maintenance'],
        image: '💧',
        availability: 'Available',
        quantity: 18,
        condition: 'Excellent',
        status: 'active'
    }
];

const blogPosts = [
    {
        title: 'Complete Camping Gear Guide for 2024',
        excerpt: 'Everything you need to know about essential camping equipment and gear for your outdoor adventures.',
        content: 'Camping gear has evolved significantly in recent years. This comprehensive guide covers all the essential equipment you need for a successful camping trip, from basic necessities to advanced gear that can enhance your outdoor experience. We cover tents, sleeping systems, cooking equipment, safety gear, and much more...',
        author: 'Admin User',
        category: 'Gear Guide',
        readTime: '8 min read',
        image: '🎒',
        published: true,
        tags: ['camping', 'gear', 'guide', '2024']
    },
    {
        title: 'Top 10 Stargazing Locations',
        excerpt: 'Discover the most spectacular dark sky locations perfect for astronomical observations.',
        content: 'Light pollution is the enemy of stargazing, which is why these remote camping locations offer some of the clearest night skies in the country. From desert landscapes to mountain peaks, these locations provide incredible opportunities for amateur astronomers and casual star watchers alike...',
        author: 'Admin User',
        category: 'Destinations',
        readTime: '6 min read',
        image: '🌌',
        published: true,
        tags: ['stargazing', 'astronomy', 'destinations', 'night sky']
    },
    {
        title: 'Safety First: Wilderness Camping Tips',
        excerpt: 'Essential safety guidelines and tips for camping in remote wilderness areas.',
        content: 'Wilderness camping offers unparalleled freedom and connection with nature, but it also requires careful preparation and respect for the environment. This guide covers everything from wildlife safety to navigation, emergency preparedness, and Leave No Trace principles...',
        author: 'Admin User',
        category: 'Safety',
        readTime: '10 min read',
        image: '🚨',
        published: true,
        tags: ['safety', 'wilderness', 'preparation', 'emergency']
    },
    {
        title: 'Family Camping: Making It Fun for Everyone',
        excerpt: 'Tips and tricks for successful family camping trips with children of all ages.',
        content: 'Family camping can create lifelong memories, but it requires special planning when children are involved. From choosing the right campsite to packing entertainment and ensuring safety, this guide helps make family camping trips enjoyable for parents and kids alike...',
        author: 'Admin User',
        category: 'Family',
        readTime: '7 min read',
        image: '👨‍👩‍👧‍👦',
        published: true,
        tags: ['family', 'children', 'camping', 'tips']
    }
];

// Seeding functions
async function seedCampsites() {
    console.log('🏕️ Seeding campsites...');
    for (const campsite of campsites) {
        try {
            const result = await apiRequest('/camping-sites', 'POST', campsite);
            console.log(`✅ Added campsite: ${campsite.name}`);
        } catch (error) {
            console.error(`❌ Failed to add campsite: ${campsite.name}`, error.message);
        }
    }
}

async function seedActivities() {
    console.log('🎯 Seeding activities...');
    for (const activity of activities) {
        try {
            const result = await apiRequest('/activities', 'POST', activity);
            console.log(`✅ Added activity: ${activity.name}`);
        } catch (error) {
            console.error(`❌ Failed to add activity: ${activity.name}`, error.message);
        }
    }
}

async function seedEquipment() {
    console.log('📦 Seeding equipment...');
    for (const item of equipment) {
        try {
            const result = await apiRequest('/equipment', 'POST', item);
            console.log(`✅ Added equipment: ${item.name}`);
        } catch (error) {
            console.error(`❌ Failed to add equipment: ${item.name}`, error.message);
        }
    }
}

async function seedBlogPosts() {
    console.log('📝 Seeding blog posts...');
    
    // First, get the admin user ID
    let adminUserId = null;
    try {
        const usersResponse = await apiRequest('/admin/users', 'GET');
        const adminUser = usersResponse.data?.find(user => user.email === 'admin@campspot.com');
        if (adminUser) {
            adminUserId = adminUser._id;
        }
    } catch (error) {
        console.error('⚠️ Could not fetch admin user ID, skipping blog posts');
        return;
    }
    
    if (!adminUserId) {
        console.error('⚠️ Admin user not found, skipping blog posts');
        return;
    }
    
    for (const post of blogPosts) {
        try {
            // Replace string author with actual user ObjectId
            const postData = {
                ...post,
                author: adminUserId
            };
            const result = await apiRequest('/blog', 'POST', postData);
            console.log(`✅ Added blog post: ${post.title}`);
        } catch (error) {
            console.error(`❌ Failed to add blog post: ${post.title}`, error.message);
        }
    }
}

// Main seeding function
async function seedDatabase() {
    console.log('🚀 Starting database seeding...');
    
    try {
        // Check if backend is running
        await apiRequest('/health');
        console.log('✅ Backend is running and healthy');
        
        // Authenticate as admin
        const isAuthenticated = await authenticate();
        if (!isAuthenticated) {
            console.log('⚠️ Warning: Authentication failed. Some endpoints may not work.');
            console.log('💡 Tip: Make sure admin user exists or create one through the app first.');
        }
        
        // Seed all data types
        await seedCampsites();
        await seedActivities();
        await seedEquipment();
        await seedBlogPosts();
        
        console.log('🎉 Database seeding completed successfully!');
        console.log('📊 You can now check the admin dashboard for all the new data.');
        
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        console.log('🔧 Make sure the backend server is running on port 5000');
    }
}

// Run the seeding
seedDatabase();
