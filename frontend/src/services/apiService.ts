// API Service to connect frontend to backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
console.log('🔧 API Service Initialized:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_BASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV
});

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('campspot_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retries: number = 3): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('🌐 API Request:', { API_BASE_URL, endpoint, url });
    const controller = new AbortController();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    }

    // Set timeout
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 401) {
          this.clearToken();
          throw new Error('Authentication failed. Please log in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Insufficient permissions.');
        }
        if (response.status === 404) {
          throw new Error('Resource not found.');
        }
        if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        
        throw new Error(data.error || data.message || `API request failed with status ${response.status}`);
      }

      return data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle network errors with retry logic
      if (error.name === 'AbortError') {
        if (retries > 0) {
          // Request timeout, retrying
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          return this.request<T>(endpoint, options, retries - 1);
        }
        throw new Error('Request timed out. Please check your connection and ensure the backend server is running.');
      }
      
      if (error.message.includes('fetch') || error.name === 'TypeError') {
        if (retries > 0) {
          // Network error, retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.request<T>(endpoint, options, retries - 1);
        }
        throw new Error(`Network error: Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend is running on port 5000.`);
      }
      
      throw error;
    }
  }

  // Get auth token
  getToken() {
    return this.token;
  }

  // Set auth token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('campspot_token', token);
  }

  // Clear auth token
  clearToken() {
    this.token = null;
    localStorage.removeItem('campspot_token');
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async register(name: string, email: string, password: string) {
    const response = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (response.success && response.data && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getCurrentUser() {
    return this.request<any>('/auth/profile');
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  async updateProfile(updates: any) {
    return this.request<any>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Campsites endpoints
  async getCampsites(params: any = {}) {
    try {
      // Add cache-busting parameter
      const paramsWithCacheBust = {
        ...params,
        _t: Date.now() // Cache-busting timestamp
      };
      const queryString = new URLSearchParams(paramsWithCacheBust).toString();
      return await this.request<any>(`/camping-sites/search${queryString ? `?${queryString}` : ''}`);
    } catch (error) {
      // Search endpoint failed, trying alternative approach
      // Fallback: try to get campsites without search endpoint
      try {
        return await this.request<any>('/camping-sites');
      } catch (fallbackError) {
        // Both campsite endpoints failed
        // Return a mock successful response with empty data
        return {
          success: false,
          data: [],
          message: 'Unable to load campsites'
        };
      }
    }
  }

  async getCampsiteById(id: string) {
    return this.request<any>(`/camping-sites/${id}`);
  }

  async checkCampsiteAvailability(id: string, startDate: string, endDate: string) {
    return this.request<any>(`/camping-sites/${id}/availability?startDate=${startDate}&endDate=${endDate}`);
  }

  // Activities endpoints
  async getActivities(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request<any>(`/activities${queryString ? `?${queryString}` : ''}`);
  }

  async getActivityById(id: string) {
    return this.request<any>(`/activities/${id}`);
  }

  async getActivityCategories() {
    return this.request<any>('/activities/categories');
  }

  async createActivity(activityData: any) {
    return this.request<any>('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  async updateActivity(id: string, activityData: any) {
    return this.request<any>(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(activityData),
    });
  }

  async deleteActivity(id: string) {
    return this.request<any>(`/activities/${id}`, {
      method: 'DELETE',
    });
  }

  // Equipment endpoints
  async getEquipment(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request<any>(`/equipment${queryString ? `?${queryString}` : ''}`);
  }

  async getEquipmentById(id: string) {
    return this.request<any>(`/equipment/${id}`);
  }

  async getEquipmentCategories() {
    return this.request<any>('/equipment/categories');
  }

  async createEquipment(equipmentData: any) {
    return this.request<any>('/equipment', {
      method: 'POST',
      body: JSON.stringify(equipmentData),
    });
  }

  async updateEquipment(id: string, equipmentData: any) {
    return this.request<any>(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(equipmentData),
    });
  }

  async deleteEquipment(id: string) {
    return this.request<any>(`/equipment/${id}`, {
      method: 'DELETE',
    });
  }

  // Blog endpoints
  async getBlogPosts(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request<any>(`/blog${queryString ? `?${queryString}` : ''}`);
  }

  async getBlogPost(id: string) {
    return this.request<any>(`/blog/${id}`);
  }

  async getBlogCategories() {
    return this.request<any>('/blog/categories');
  }

  async createBlogPost(postData: any) {
    return this.request<any>('/blog', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async updateBlogPost(id: string, postData: any) {
    return this.request<any>(`/blog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(postData),
    });
  }

  async deleteBlogPost(id: string) {
    return this.request<any>(`/blog/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints
  async getDashboardStats() {
    return this.request<any>('/admin/dashboard/stats');
  }

  async getRecentActivities() {
    return this.request<any>('/admin/dashboard/activities');
  }

  async getRevenueAnalytics(period: string = '30d') {
    return this.request<any>(`/admin/analytics/revenue?period=${period}`);
  }

  async getUserAnalytics() {
    return this.request<any>('/admin/analytics/users');
  }

  // Cart endpoints
  async addToCart(itemData: any) {
    return this.request<any>('/cart/add', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async getCartSummary(items: any[]) {
    return this.request<any>('/cart/summary', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  }

  async processCheckout(checkoutData: any) {
    return this.request<any>('/cart/checkout', {
      method: 'POST',
      body: JSON.stringify(checkoutData),
    });
  }

  // Bookings endpoints
  async getBookings() {
    return this.request<any>('/bookings');
  }

  async createBooking(bookingData: any) {
    return this.request<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async checkBookingAvailability(campingSiteId: string, checkInDate: string, checkOutDate: string) {
    return this.request<any>('/bookings/check-availability', {
      method: 'POST',
      body: JSON.stringify({ campingSiteId, checkInDate, checkOutDate }),
    });
  }

  // File upload endpoints
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('image', file);

    return this.request<any>('/upload/single', {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  // Health check
  async healthCheck() {
    return this.request<any>('/health');
  }

  // Additional CRUD endpoints for admin features
  async createCampsite(campsiteData: any) {
    return this.request<any>('/camping-sites', {
      method: 'POST',
      body: JSON.stringify(campsiteData),
    });
  }

  async updateCampsite(id: string, campsiteData: any) {
    return this.request<any>(`/camping-sites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(campsiteData),
    });
  }

  async deleteCampsite(id: string) {
    return this.request<any>(`/camping-sites/${id}`, {
      method: 'DELETE',
    });
  }

  // User management endpoints (for admin)
  async getUsers() {
    return this.request<any>('/admin/users');
  }

  async createUser(userData: any) {
    return this.request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request<any>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request<any>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }
}

export default new ApiService();
