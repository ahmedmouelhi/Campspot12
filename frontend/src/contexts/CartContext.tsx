import React, { createContext, useContext, useEffect, useState } from 'react';
import CartService, { CartItem } from '../services/cartService';

interface CartContextType {
  cart: CartItem[];
  items: CartItem[];  // Alias for cart for backward compatibility
  cartCount: number;
  cartTotal: number;
  addCampsite: (campsite: any, checkIn: string, checkOut: string, guests: number) => void;
  addActivity: (activity: any, date: string, time: string, participants: number) => void;
  addEquipment: (equipment: any, rentalStart: string, rentalEnd: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;  // Alias for cartTotal as method
  isDateAvailable: (itemType: 'campsite' | 'activity' | 'equipment', itemId: string, startDate: string, endDate?: string) => boolean;
  getBookingSummary: () => any;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  
  const cartService = CartService.getInstance();

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

  const addCampsite = (campsite: any, checkIn: string, checkOut: string, guests: number) => {
    cartService.addCampsite(campsite, checkIn, checkOut, guests);
  };

  const addActivity = (activity: any, date: string, time: string, participants: number) => {
    cartService.addActivity(activity, date, time, participants);
  };

  const addEquipment = (equipment: any, rentalStart: string, rentalEnd: string, quantity: number) => {
    cartService.addEquipment(equipment, rentalStart, rentalEnd, quantity);
  };

  const removeItem = (itemId: string) => {
    cartService.removeItem(itemId);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    cartService.updateQuantity(itemId, quantity);
  };

  const clearCart = () => {
    cartService.clearCart();
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
