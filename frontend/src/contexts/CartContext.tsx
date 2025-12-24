import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import CartServiceDB, { CartItem } from '../services/cartServiceDB';

interface CartContextType {
  cart: CartItem[];
  items: CartItem[];  // Alias for cart for backward compatibility
  cartCount: number;
  cartTotal: number;
  addCampsite: (campsite: any, checkIn: string, checkOut: string, guests: number) => Promise<boolean>;
  addActivity: (activity: any, date: string, time: string, participants: number) => Promise<boolean>;
  addEquipment: (equipment: any, rentalStart: string, rentalEnd: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalPrice: () => number;  // Alias for cartTotal as method
  isDateAvailable: (itemType: 'campsite' | 'activity' | 'equipment', itemId: string, startDate: string, endDate?: string) => boolean;
  getBookingSummary: () => any;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);

  const cartService = CartServiceDB.getInstance();

  useEffect(() => {
    // Load initial cart state
    updateCartState();

    // Subscribe to cart changes
    const unsubscribe = cartService.subscribe(() => {
      updateCartState();
    });

    return unsubscribe;
  }, []);

  const updateCartState = () => {
    const cartItems = cartService.getCart();
    const count = cartService.getItemCount();
    const total = cartService.getTotal();

    setCart(cartItems);
    setCartCount(count);
    setCartTotal(total);
  };

  const checkAuthentication = () => {
    const user = localStorage.getItem('campspot_user');
    const token = localStorage.getItem('campspot_token');
    return !!(user && token);
  };

  const requireAuth = (action: string) => {
    if (!checkAuthentication()) {
      toast.error(`Please log in to add items to your cart`);
      // Store intent to redirect after login
      sessionStorage.setItem('add_to_cart_redirect', 'true');
      // Navigate to login
      const currentPath = window.location.pathname;
      sessionStorage.setItem('redirect_after_login', currentPath);
      window.location.href = '/profile';
      return false;
    }
    return true;
  };

  const addCampsite = async (campsite: any, checkIn: string, checkOut: string, guests: number): Promise<boolean> => {
    if (!requireAuth('add campsite')) return false;
    await cartService.addCampsite(campsite, checkIn, checkOut, guests);
    return true;
  };

  const addActivity = async (activity: any, date: string, time: string, participants: number): Promise<boolean> => {
    if (!requireAuth('add activity')) return false;
    await cartService.addActivity(activity, date, time, participants);
    return true;
  };

  const addEquipment = async (equipment: any, rentalStart: string, rentalEnd: string, quantity: number): Promise<boolean> => {
    if (!requireAuth('add equipment')) return false;
    await cartService.addEquipment(equipment, rentalStart, rentalEnd, quantity);
    return true;
  };

  const removeItem = async (itemId: string) => {
    await cartService.removeItem(itemId);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    await cartService.updateQuantity(itemId, quantity);
  };

  const clearCart = async () => {
    await cartService.clearCart();
  };

  const isDateAvailable = (itemType: 'campsite' | 'activity' | 'equipment', itemId: string, startDate: string, endDate?: string) => {
    return cartService.isDateAvailable(itemType, itemId, startDate, endDate);
  };

  const getBookingSummary = () => {
    return cartService.getBookingSummary();
  };

  const getTotalPrice = () => {
    return cartTotal;
  };

  const value: CartContextType = {
    cart,
    items: cart,  // Alias for backward compatibility
    cartCount,
    cartTotal,
    addCampsite,
    addActivity,
    addEquipment,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    isDateAvailable,
    getBookingSummary
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
