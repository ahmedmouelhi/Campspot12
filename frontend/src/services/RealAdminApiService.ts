import { toast } from 'react-toastify';
import apiService from './apiService';

// Data Interfaces matching backend models
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  registrationDate: string;
  lastLogin?: string;
  isActive: boolean;
  instagramUrl?: string;
  preferences?: {
    notifications: boolean;
    location: boolean;
  };
}

export interface Campsite {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  description: string;
  features: string[];
  image?: string;
  images: string[];
  capacity: number;
  availability: 'available' | 'limited' | 'unavailable';
  type: 'tent' | 'rv' | 'cabin' | 'glamping';
  status: 'active' | 'inactive';
}

export interface Activity {
  id: string;
  name: string;
  icon: string;
  description: string;
  duration: string;
  difficulty: 'Easy' | 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  category: string;
  maxParticipants: number;
  equipment: string[];
  rating?: number;
  images: string[];
  location?: string;
  status: 'active' | 'inactive' | 'full';
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  readTime: string;
  image: string;
  published: boolean;
  tags: string[];
  slug: string;
  views: number;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  price: number;
  period: 'hour' | 'day' | 'week';
  description: string;
  features: string[];
  image: string;
  imageId?: string;
  imageUrl?: string;
  availability: 'Available' | 'Limited' | 'Unavailable';
  quantity: number;
  condition: 'Excellent' | 'Good' | 'Fair';
  status: 'active' | 'inactive' | 'maintenance';
}

class RealAdminApiService {
  private static instance: RealAdminApiService;

  public static getInstance(): RealAdminApiService {
    if (!RealAdminApiService.instance) {
      RealAdminApiService.instance = new RealAdminApiService();
    }
    return RealAdminApiService.instance;
  }

  // USERS
  async getUsers(): Promise<User[]> {
    try {
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        return response.data.map((user: any) => ({
          id: user._id || user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          registrationDate: user.registrationDate || user.createdAt,
          lastLogin: user.lastLogin,
          isActive: user.isActive !== false,
          instagramUrl: user.instagramUrl,
          preferences: user.preferences
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // CAMPSITES
  async getCampsites(): Promise<Campsite[]> {
    try {
      const response = await apiService.getCampsites();
      if (response.success && response.data) {
        return response.data.map((site: any) => ({
          id: site._id || site.id,
          name: site.name,
          location: site.location,
          price: site.price,
          rating: site.rating || 0,
          description: site.description,
          features: site.features || [],
          image: site.image,
          images: site.images || [],
          capacity: site.capacity,
          availability: site.availability || 'available',
          type: site.type,
          status: site.status || 'active'
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching campsites:', error);
      return [];
    }
  }

  async addCampsite(campsite: Omit<Campsite, 'id'>): Promise<{ success: boolean, message?: string }> {
    try {
      const response = await apiService.createCampsite(campsite);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Failed to add campsite' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to add campsite' };
    }
  }

  async updateCampsite(id: string, updates: Partial<Campsite>): Promise<{ success: boolean, message?: string }> {
    try {
      const response = await apiService.updateCampsite(id, updates);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Failed to update campsite' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update campsite' };
    }
  }

  async deleteCampsite(id: string): Promise<{ success: boolean, message?: string }> {
    try {
      const response = await apiService.deleteCampsite(id);
      if (response.success) {
        toast.success('Campsite deleted successfully!');
        return { success: true };
      } else {
        toast.error(response.message || 'Failed to delete campsite');
        return { success: false, message: response.message || 'Failed to delete campsite' };
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete campsite');
      return { success: false, message: error.message || 'Failed to delete campsite' };
    }
  }

  // ACTIVITIES
  async getActivities(): Promise<Activity[]> {
    try {
      const response = await apiService.getActivities();
      if (response.success && response.data) {
        return response.data.map((activity: any) => ({
          id: activity._id || activity.id,
          name: activity.name,
          icon: activity.icon,
          description: activity.description,
          duration: activity.duration,
          difficulty: activity.difficulty,
          price: activity.price,
          category: activity.category,
          maxParticipants: activity.maxParticipants,
          equipment: activity.equipment || [],
          rating: activity.rating || 0,
          images: activity.images || [],
          location: activity.location,
          status: activity.status || 'active'
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  async addActivity(activity: Omit<Activity, 'id'>): Promise<{ success: boolean, message?: string }> {
    try {
      const response = await apiService.createActivity(activity);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Failed to add activity' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to add activity' };
    }
  }

  async updateActivity(id: string, updates: Partial<Activity>): Promise<{ success: boolean, message?: string }> {
    try {
      const response = await apiService.updateActivity(id, updates);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Failed to update activity' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update activity' };
    }
  }

  async deleteActivity(id: string): Promise<void> {
    try {
      const response = await apiService.deleteActivity(id);
      if (response.success) {
        toast.success('Activity deleted successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete activity');
    }
  }

  // EQUIPMENT
  async getEquipment(): Promise<Equipment[]> {
    try {
      const response = await apiService.getEquipment();
      if (response.success && response.data) {
        return response.data.map((equipment: any) => ({
          id: equipment._id || equipment.id,
          name: equipment.name,
          category: equipment.category,
          price: equipment.price,
          period: equipment.period,
          description: equipment.description,
          features: equipment.features || [],
          image: equipment.image,
          imageId: equipment.imageId,
          imageUrl: equipment.imageUrl,
          availability: equipment.availability || 'Available',
          quantity: equipment.quantity || 0,
          condition: equipment.condition || 'Good',
          status: equipment.status || 'active'
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }
  }

  async addEquipment(equipment: Omit<Equipment, 'id'>): Promise<{ success: boolean, message?: string }> {
    try {
      const response = await apiService.createEquipment(equipment);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Failed to add equipment' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to add equipment' };
    }
  }

  async updateEquipment(id: string, updates: Partial<Equipment>): Promise<{ success: boolean, message?: string }> {
    try {
      const response = await apiService.updateEquipment(id, updates);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Failed to update equipment' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update equipment' };
    }
  }

  async deleteEquipment(id: string): Promise<void> {
    try {
      const response = await apiService.deleteEquipment(id);
      if (response.success) {
        toast.success('Equipment deleted successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete equipment');
    }
  }

  // BLOG POSTS
  async getBlogPosts(): Promise<BlogPost[]> {
    try {
      const response = await apiService.getBlogPosts();
      if (response.success && response.data) {
        return response.data.map((post: any) => ({
          id: post._id || post.id,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          author: post.author?.name || post.author,
          date: post.date || post.createdAt,
          category: post.category,
          readTime: post.readTime,
          image: post.image,
          published: post.published !== false,
          tags: post.tags || [],
          slug: post.slug,
          views: post.views || 0
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }
  }

  async addBlogPost(post: Omit<BlogPost, 'id'>): Promise<{ success: boolean, message?: string }> {
    try {
      const response = await apiService.createBlogPost(post);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Failed to add blog post' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to add blog post' };
    }
  }

  async updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<{ success: boolean, message?: string }> {
    try {
      const response = await apiService.updateBlogPost(id, updates);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Failed to update blog post' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update blog post' };
    }
  }

  async deleteBlogPost(id: string): Promise<void> {
    try {
      const response = await apiService.deleteBlogPost(id);
      if (response.success) {
        toast.success('Blog post deleted successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete blog post');
    }
  }

  // USER MANAGEMENT METHODS
  async addUser(user: Omit<User, 'id'>): Promise<{ success: boolean, message?: string }> {
    try {
      const response = await apiService.createUser(user);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Failed to add user' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to add user' };
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<{ success: boolean, message?: string }> {
    try {
      const response = await apiService.updateUser(id, updates);
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Failed to update user' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to update user' };
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const response = await apiService.deleteUser(id);
      if (response.success) {
        toast.success('User deleted successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  }

  async toggleUserStatus(id: string): Promise<void> {
    try {
      // Get current user data first
      const users = await this.getUsers();
      const user = users.find(u => u.id === id);
      if (user) {
        await this.updateUser(id, { isActive: !user.isActive });
        toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully!`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle user status');
    }
  }

  // STATISTICS
  async getStatistics() {
    try {
      const [users, campsites, activities, blogPosts, equipment] = await Promise.all([
        this.getUsers(),
        this.getCampsites(),
        this.getActivities(),
        this.getBlogPosts(),
        this.getEquipment()
      ]);

      return {
        users: {
          total: users.length,
          active: users.filter(u => u.isActive).length,
          admins: users.filter(u => u.role === 'admin').length
        },
        campsites: {
          total: campsites.length,
          available: campsites.filter(c => c.availability === 'available').length,
          avgRating: campsites.length > 0 ? campsites.reduce((sum, c) => sum + c.rating, 0) / campsites.length : 0
        },
        activities: {
          total: activities.length,
          avgPrice: activities.length > 0 ? activities.reduce((sum, a) => sum + a.price, 0) / activities.length : 0,
          categories: [...new Set(activities.map(a => a.category))].length
        },
        blog: {
          total: blogPosts.length,
          published: blogPosts.filter(p => p.published).length,
          categories: [...new Set(blogPosts.map(p => p.category))].length
        },
        equipment: {
          total: equipment.length,
          available: equipment.filter(e => e.availability === 'Available').length,
          categories: [...new Set(equipment.map(e => e.category))].length
        }
      };
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return {
        users: { total: 0, active: 0, admins: 0 },
        campsites: { total: 0, available: 0, avgRating: 0 },
        activities: { total: 0, avgPrice: 0, categories: 0 },
        blog: { total: 0, published: 0, categories: 0 },
        equipment: { total: 0, available: 0, categories: 0 }
      };
    }
  }

  // Initialize real data - this adds missing sample data to the database
  async initializeRealData(): Promise<void> {
    try {
      // Check if we need to add sample data
      const stats = await this.getStatistics();

      if (stats.campsites.total === 0) {
        await this.seedCampsites();
      }
      if (stats.activities.total === 0) {
        await this.seedActivities();
      }
      if (stats.equipment.total === 0) {
        await this.seedEquipment();
      }
      if (stats.blog.total === 0) {
        await this.seedBlogPosts();
      }
    } catch (error) {
      console.error('Error initializing real data:', error);
    }
  }

  // Seed methods to add sample data to the real database
  private async seedCampsites(): Promise<void> {
    const sampleCampsites = [
      {
        name: 'Mountain View Camp',
        location: 'Rocky Mountains',
        price: 45,
        rating: 4.8,
        description: 'Stunning mountain views with hiking trails nearby',
        features: ['WiFi', 'Bathrooms', 'Fire Pits', 'Hiking Trails'],
        image: '🏔️',
        images: [],
        capacity: 6,
        availability: 'available' as const,
        type: 'tent' as const,
        status: 'active' as const
      },
      {
        name: 'Lakeside Retreat',
        location: 'Blue Lake',
        price: 35,
        rating: 4.6,
        description: 'Peaceful lakeside camping with water activities',
        features: ['Lake Access', 'Boat Rental', 'Bathrooms', 'Picnic Tables'],
        image: '🏞️',
        images: [],
        capacity: 4,
        availability: 'available' as const,
        type: 'cabin' as const,
        status: 'active' as const
      },
      {
        name: 'Forest Haven',
        location: 'Greenwood Forest',
        price: 40,
        rating: 4.7,
        description: 'Deep forest experience with wildlife watching',
        features: ['Secluded', 'Wildlife Viewing', 'Hiking Trails', 'Fire Pits'],
        image: '🌲',
        images: [],
        capacity: 8,
        availability: 'limited' as const,
        type: 'glamping' as const,
        status: 'active' as const
      }
    ];

    for (const campsite of sampleCampsites) {
      try {
        await this.addCampsite(campsite);
      } catch (error) {
        console.error('Error adding campsite:', error);
      }
    }
  }

  private async seedActivities(): Promise<void> {
    const sampleActivities = [
      {
        name: 'Mountain Hiking Adventure',
        icon: '🥾',
        description: 'Explore scenic mountain trails with expert guides',
        duration: '4-8 hours',
        difficulty: 'Intermediate' as const,
        price: 25,
        category: 'Hiking',
        maxParticipants: 12,
        equipment: ['Hiking boots', 'Backpack', 'Water bottle'],
        images: [],
        location: 'Rocky Mountains',
        status: 'active' as const
      },
      {
        name: 'Lake Fishing Experience',
        icon: '🎣',
        description: 'Peaceful fishing in crystal clear mountain lakes',
        duration: '3-6 hours',
        difficulty: 'Easy' as const,
        price: 20,
        category: 'Fishing',
        maxParticipants: 8,
        equipment: ['Fishing rod', 'Bait', 'Fishing license'],
        images: [],
        location: 'Blue Lake',
        status: 'active' as const
      },
      {
        name: 'Kayaking Adventure',
        icon: '🛶',
        description: 'Navigate through calm waters and discover hidden coves',
        duration: '2-4 hours',
        difficulty: 'Beginner' as const,
        price: 30,
        category: 'Water Sports',
        maxParticipants: 10,
        equipment: ['Kayak', 'Paddle', 'Life jacket'],
        images: [],
        location: 'Blue Lake',
        status: 'active' as const
      }
    ];

    for (const activity of sampleActivities) {
      try {
        await this.addActivity(activity);
      } catch (error) {
        console.error('Error adding activity:', error);
      }
    }
  }

  private async seedEquipment(): Promise<void> {
    const sampleEquipment = [
      {
        name: 'Professional Tent (4-person)',
        category: 'Shelter',
        price: 25,
        period: 'day' as const,
        description: 'Waterproof tent suitable for all weather conditions',
        features: ['Waterproof', '4-person capacity', 'Easy setup', 'Includes stakes'],
        image: '⛺',
        availability: 'Available' as const,
        quantity: 15,
        condition: 'Excellent' as const,
        status: 'active' as const
      },
      {
        name: 'Sleeping Bag (Winter)',
        category: 'Sleeping',
        price: 15,
        period: 'day' as const,
        description: 'High-quality sleeping bag rated for -10°C',
        features: ['Winter rated', 'Compact', 'Comfortable', 'Water resistant'],
        image: '🛏️',
        availability: 'Available' as const,
        quantity: 20,
        condition: 'Good' as const,
        status: 'active' as const
      },
      {
        name: 'Portable Gas Stove',
        category: 'Cooking',
        price: 12,
        period: 'day' as const,
        description: 'Lightweight camping stove with gas cartridge',
        features: ['Lightweight', 'Wind resistant', 'Includes gas', 'Easy ignition'],
        image: '🔥',
        availability: 'Limited' as const,
        quantity: 8,
        condition: 'Excellent' as const,
        status: 'active' as const
      }
    ];

    for (const equipment of sampleEquipment) {
      try {
        await this.addEquipment(equipment);
      } catch (error) {
        console.error('Error adding equipment:', error);
      }
    }
  }

  private async seedBlogPosts(): Promise<void> {
    const samplePosts = [
      {
        title: 'Essential Camping Gear for Beginners',
        excerpt: 'Everything you need to know about camping equipment for your first outdoor adventure.',
        content: 'Starting your camping journey can be overwhelming with so much gear available. This comprehensive guide covers the essential items every beginner needs for a successful and comfortable camping experience. From shelter and sleeping gear to cooking equipment and safety items, we will walk you through each category...',
        author: 'Admin User',
        date: new Date().toISOString(),
        category: 'Gear Guide',
        readTime: '5 min read',
        image: '🎒',
        published: true,
        tags: ['camping', 'gear', 'beginners'],
        slug: 'essential-camping-gear-for-beginners',
        views: 0
      },
      {
        title: 'Best Camping Spots for Stargazing',
        excerpt: 'Discover the most spectacular locations for astronomical observations during your camping trip.',
        content: 'The night sky offers incredible views when you escape light pollution. Here are our top picks for stargazing campsites, complete with tips for the best viewing experiences and what equipment you might need for amateur astronomy while camping...',
        author: 'Admin User',
        date: new Date().toISOString(),
        category: 'Destinations',
        readTime: '7 min read',
        image: '🌌',
        published: true,
        tags: ['stargazing', 'destinations', 'night'],
        slug: 'best-camping-spots-for-stargazing',
        views: 0
      }
    ];

    for (const post of samplePosts) {
      try {
        await this.addBlogPost(post);
      } catch (error) {
        console.error('Error adding blog post:', error);
      }
    }
  }
}

export default RealAdminApiService;
