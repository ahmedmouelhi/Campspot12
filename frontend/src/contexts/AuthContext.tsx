import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role?: 'user' | 'admin';
  preferences?: {
    notifications: boolean;
    location: boolean;
  };
}

interface Booking {
  id: string;
  type: 'campsite' | 'activity' | 'equipment';
  name: string;
  date: string;
  endDate?: string;
  price: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  location?: string;
  image?: string;
  // Additional properties for enhanced booking details
  guests?: number;          // For campsite bookings
  nights?: number;          // For campsite bookings
  time?: string;            // For activity bookings  
  participants?: number;    // For activity bookings
  quantity?: number;        // For equipment bookings
  days?: number;           // For equipment bookings
}

interface AuthContextType {
  user: User | null;
  bookings: Booking[];
  login: (email: string, password: string, navigate?: (path: string) => void) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: (navigate?: (path: string) => void) => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id'>) => void;
  cancelBooking: (bookingId: string) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Load user from localStorage and validate token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('campspot_user');
      const savedToken = localStorage.getItem('campspot_token');
      const savedBookings = localStorage.getItem('campspot_bookings');
      
      // If we have both user and token, validate with backend
      if (savedUser && savedToken) {
        try {
          const parsedUser = JSON.parse(savedUser);
          apiService.setToken(savedToken);
          
          // Validate token with backend
          const response = await apiService.getProfile();
          if (response.success && response.data) {
            setUser(parsedUser);
          } else {
            // Token is invalid, clear everything
            localStorage.removeItem('campspot_user');
            localStorage.removeItem('campspot_token');
            apiService.clearToken();
          }
        } catch (error) {
          // Token validation failed, clear everything
          localStorage.removeItem('campspot_user');
          localStorage.removeItem('campspot_token');
          apiService.clearToken();
        }
      } else if (savedUser) {
        // User data without token, clear it
        localStorage.removeItem('campspot_user');
      }
      
      // Load bookings regardless of auth status
      if (savedBookings) {
        try {
          setBookings(JSON.parse(savedBookings));
        } catch (error) {
          // Invalid saved bookings data, clear it
          localStorage.removeItem('campspot_bookings');
        }
      }
    };
    
    initializeAuth();
  }, []);

  // Save user to localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('campspot_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('campspot_user');
    }
  }, [user]);

  // Save bookings to localStorage when bookings change
  useEffect(() => {
    localStorage.setItem('campspot_bookings', JSON.stringify(bookings));
  }, [bookings]);

  const login = async (email: string, password: string, navigate?: (path: string) => void): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password);
      
      if (response.success && response.data && response.data.user) {
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role,
          preferences: response.data.user.preferences
        };
        
        setUser(userData);
        
        // Show success message
        if (response.data.user.role === 'admin') {
          toast.success('Welcome Admin! Redirecting to admin dashboard...');
          // Auto-redirect to admin dashboard
          if (navigate) {
            setTimeout(() => {
              navigate('/admin');
            }, 1500);
          }
        } else {
          toast.success('Welcome back! You have been successfully logged in.');
        }
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.register(name, email, password);
      
      if (response.success && response.data && response.data.user) {
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role || 'user',
          preferences: response.data.user.preferences
        };
        
        setUser(userData);
        toast.success('Account created successfully! Welcome to CampSpot!');
        return true;
      }
      
      return false;
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
      return false;
    }
  };

  const logout = (navigate?: (path: string) => void) => {
    setUser(null);
    setBookings([]);
    apiService.clearToken();
    localStorage.removeItem('campspot_user');
    localStorage.removeItem('campspot_bookings');
    toast.info('You have been logged out successfully.');
    
    // Redirect to home page after logout
    if (navigate) {
      setTimeout(() => {
        navigate('/');
      }, 500); // Small delay to show the toast message
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Only show success message if not coming from API call
      // (API calls handle their own success messages)
      if (!updates.preferences || Object.keys(updates).length > 1) {
        toast.success('Profile updated successfully!');
      }
    }
  };

  const addBooking = (booking: Omit<Booking, 'id'>) => {
    const newBooking: Booking = {
      ...booking,
      id: Date.now().toString(),
    };
    setBookings(prev => [newBooking, ...prev]);
    toast.success(`${booking.name} has been booked successfully!`);
  };

  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      // Use the same login function but check for admin role in response
      const response = await apiService.login(email, password);
      
      if (response.success && response.data && response.data.user && response.data.user.role === 'admin') {
        const adminData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role,
          preferences: response.data.user.preferences
        };
        
        setUser(adminData);
        toast.success('Welcome Admin! You have full access to the system.');
        return true;
      } else if (response.success && response.data && response.data.user && response.data.user.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        return false;
      } else {
        toast.error('Invalid admin credentials.');
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || 'Admin login failed. Please try again.');
      return false;
    }
  };

  const cancelBooking = (bookingId: string) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' as const }
          : booking
      )
    );
    toast.info('Booking has been cancelled.');
  };

  return (
    <AuthContext.Provider value={{
      user,
      bookings,
      login,
      adminLogin,
      register,
      logout,
      updateProfile,
      addBooking,
      cancelBooking,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
