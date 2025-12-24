import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiService from '../services/apiService';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  instagramUrl?: string;
  role?: 'user' | 'admin';
  preferences?: {
    notifications: boolean;
    location: boolean;
  };
  createdAt?: string;
}

interface Booking {
  id: string;
  type: 'campsite' | 'activity' | 'equipment';
  name: string;
  date: string;
  endDate?: string;
  price: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'approved' | 'rejected';
  location?: string;
  image?: string;
  cancelledAt?: string;     // Timestamp when booking was cancelled
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
  register: (name: string, email: string, password: string, instagramUrl: string, navigate?: (path: string) => void) => Promise<boolean>;
  logout: (navigate?: (path: string) => void) => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  addBooking: (booking: Omit<Booking, 'id'>) => void;
  cancelBooking: (bookingId: string) => void;
  fetchBackendBookings: () => Promise<void>;
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

      // Clear old localStorage bookings (no longer used - we fetch from database)
      localStorage.removeItem('campspot_bookings');

      // If we have both user and token, validate with backend
      if (savedUser && savedToken) {
        try {
          const parsedUser = JSON.parse(savedUser);
          apiService.setToken(savedToken);

          // Validate token with backend
          const response = await apiService.getProfile();
          if (response.success && response.data) {
            setUser(parsedUser);
            // Fetch backend bookings after successful token validation
            await fetchBackendBookingsInternal();
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
      // REMOVED: No longer loading bookings from localStorage to prevent cache issues
      // Bookings will always be fetched fresh from the backend
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

  // REMOVED: No longer saving bookings to localStorage to prevent cache issues
  // Bookings are now always fetched fresh from the backend on login/page load

  const login = async (email: string, password: string, navigate?: (path: string) => void): Promise<boolean> => {
    try {
      const response = await apiService.login(email, password);

      if (response.success && response.data && response.data.user) {
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          instagramUrl: response.data.user.instagramUrl,
          role: response.data.user.role,
          preferences: response.data.user.preferences
        };

        setUser(userData);

        // Fetch backend bookings after successful login
        await fetchBackendBookingsInternal();

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

          // Check if user was trying to checkout and redirect them back
          const shouldRedirectToCheckout = sessionStorage.getItem('checkout_redirect');
          if (shouldRedirectToCheckout === 'true') {
            sessionStorage.removeItem('checkout_redirect');
            setTimeout(() => {
              if (navigate) {
                navigate('/checkout');
                toast.info('Redirecting you to checkout to complete your booking...');
              }
            }, 1500);
          }

          // Check if user was trying to add items to cart
          const shouldRedirectAfterAddToCart = sessionStorage.getItem('add_to_cart_redirect');
          const redirectPath = sessionStorage.getItem('redirect_after_login');
          if (shouldRedirectAfterAddToCart === 'true' && redirectPath) {
            sessionStorage.removeItem('add_to_cart_redirect');
            sessionStorage.removeItem('redirect_after_login');
            setTimeout(() => {
              if (navigate) {
                navigate(redirectPath);
                toast.info('Welcome back! You can now add items to your cart.');
              }
            }, 1500);
          }

          // Check if user was trying to make a booking
          const bookingIntent = sessionStorage.getItem('booking_intent');
          if (bookingIntent) {
            try {
              const intent = JSON.parse(bookingIntent);
              sessionStorage.removeItem('booking_intent');
              setTimeout(() => {
                if (navigate) {
                  navigate(intent.page);
                  toast.info(`Welcome back! You can now book ${intent.item.name}.`);
                }
              }, 1500);
            } catch (e) {
              // Invalid booking intent data, ignore
              sessionStorage.removeItem('booking_intent');
            }
          }
        }

        return true;
      }

      return false;
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string, instagramUrl: string, navigate?: (path: string) => void): Promise<boolean> => {
    try {
      const response = await apiService.register(name, email, password, instagramUrl);

      if (response.success && response.data && response.data.user) {
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          instagramUrl: response.data.user.instagramUrl,
          role: response.data.user.role || 'user',
          preferences: response.data.user.preferences
        };

        setUser(userData);
        toast.success('Account created successfully! Welcome to CampSpot!');

        // Initialize empty bookings for new user
        setBookings([]);

        // Check for booking intent first
        const bookingIntent = sessionStorage.getItem('booking_intent');
        if (bookingIntent) {
          try {
            const intent = JSON.parse(bookingIntent);
            sessionStorage.removeItem('booking_intent');
            setTimeout(() => {
              if (navigate) {
                navigate(intent.page);
                toast.info(`Welcome to CampSpot! You can now book ${intent.item.name}.`);
              }
            }, 1500);
          } catch (e) {
            // Invalid booking intent data, ignore
            sessionStorage.removeItem('booking_intent');
          }
        } else {
          // Redirect regular users to home page to browse campsites if no booking intent
          if (navigate && userData.role === 'user') {
            setTimeout(() => {
              navigate('/');
            }, 1500);
          }
        }

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
    localStorage.removeItem('campspot_bookings'); // Clear any cached bookings
    localStorage.removeItem('campspot_token');
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
          instagramUrl: response.data.user.instagramUrl,
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

  const fetchBackendBookingsInternal = async () => {
    try {
      // Fetch campsite bookings
      const campsiteResponse = await apiService.getBookings();
      const campsiteBookings = campsiteResponse.success && campsiteResponse.data
        ? campsiteResponse.data.map((booking: any) => ({
          id: booking._id,
          type: 'campsite' as const,
          name: booking.campingSite?.name || 'Unknown Campsite',
          date: new Date(booking.startDate).toLocaleDateString(),
          endDate: new Date(booking.endDate).toLocaleDateString(),
          price: booking.totalPrice,
          status: booking.status === 'approved' ? 'approved' as const :
            booking.status === 'pending' ? 'pending' as const :
              booking.status === 'rejected' ? 'rejected' as const :
                booking.status === 'completed' ? 'completed' as const : 'cancelled' as const,
          location: booking.campingSite?.location || 'Unknown Location',
          guests: booking.guests,
          nights: Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))
        }))
        : [];

      // Fetch activity bookings
      let activityBookings: any[] = [];
      try {
        const activityResponse = await apiService.getUserActivityBookings();
        if (activityResponse.success && activityResponse.data) {
          activityBookings = activityResponse.data.map((booking: any) => ({
            id: booking._id,
            type: 'activity' as const,
            name: booking.activity?.name || 'Unknown Activity',
            date: new Date(booking.date).toLocaleDateString(),
            time: booking.time || 'N/A',
            price: booking.totalPrice,
            status: booking.status === 'approved' ? 'approved' as const :
              booking.status === 'pending' ? 'pending' as const :
                booking.status === 'rejected' ? 'rejected' as const :
                  booking.status === 'completed' ? 'completed' as const : 'cancelled' as const,
            participants: booking.participants
          }));
        }
      } catch (error) {
        // Activity bookings not available - silently continue
      }

      // Fetch equipment bookings
      let equipmentBookings: any[] = [];
      try {
        const equipmentResponse = await apiService.getUserEquipmentBookings();
        if (equipmentResponse.success && equipmentResponse.data) {
          equipmentBookings = equipmentResponse.data.map((booking: any) => ({
            id: booking._id,
            type: 'equipment' as const,
            name: booking.equipment?.name || 'Unknown Equipment',
            date: new Date(booking.startDate).toLocaleDateString(),
            endDate: new Date(booking.endDate).toLocaleDateString(),
            price: booking.totalPrice,
            status: booking.status === 'approved' ? 'approved' as const :
              booking.status === 'pending' ? 'pending' as const :
                booking.status === 'rejected' ? 'rejected' as const :
                  booking.status === 'completed' ? 'completed' as const : 'cancelled' as const,
            quantity: booking.quantity,
            days: Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))
          }));
        }
      } catch (error) {
        // Equipment bookings not available - silently continue
      }

      // Combine all bookings
      const allBookings = [...campsiteBookings, ...activityBookings, ...equipmentBookings];
      setBookings(allBookings);
    } catch (error) {
      // Don't fallback to localStorage - show empty bookings if backend fails
      // This prevents showing stale/incorrect booking data
      setBookings([]);
    }
  };

  const fetchBackendBookings = async () => {
    await fetchBackendBookingsInternal();
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      // Call backend API to cancel booking
      const response = await apiService.cancelBooking(bookingId);

      if (response.success) {
        // Update local state
        setBookings(prev =>
          prev.map(booking =>
            booking.id === bookingId
              ? { ...booking, status: 'cancelled' as const }
              : booking
          )
        );
        toast.success('Booking cancelled successfully');

        // Refresh bookings from backend
        await fetchBackendBookings();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel booking');
      throw error;
    }
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
      fetchBackendBookings,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
