import { toast } from 'react-toastify';

export type CartItemType = 'campsite' | 'activity' | 'equipment';

export interface CartItem {
  id: string;
  type: CartItemType;
  name: string;
  price: number;
  totalPrice: number; // Total price for this item
  image?: string;
  quantity: number;
  // Booking specific details
  checkIn?: string; // For campsites
  checkOut?: string; // For campsites  
  guests?: number; // For campsites
  nights?: number; // For campsites
  date?: string; // For activities
  time?: string; // For activities
  participants?: number; // For activities
  startDate?: string; // For equipment (alias for rentalStart)
  endDate?: string; // For equipment (alias for rentalEnd)
  rentalStart?: string; // For equipment
  rentalEnd?: string; // For equipment
  rentalDays?: number; // For equipment
  days?: number; // For equipment (alias for rentalDays)
  location?: string; // Item location
  // Original item data
  originalItem: any;
}

class CartService {
  private static instance: CartService;
  private cart: CartItem[] = [];
  private listeners: (() => void)[] = [];

  private constructor() {
    this.loadCart();
  }

  public static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  // Subscribe to cart changes
  public subscribe(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  private saveCart(): void {
    localStorage.setItem('campspot_cart', JSON.stringify(this.cart));
  }

  private loadCart(): void {
    const saved = localStorage.getItem('campspot_cart');
    if (saved) {
      try {
        this.cart = JSON.parse(saved);
      } catch (error) {
        console.error('Error loading cart:', error);
        this.cart = [];
      }
    }
  }

  // Add campsite to cart
  public addCampsite(campsite: any, checkIn: string, checkOut: string, guests: number): void {
    const nights = this.calculateNights(checkIn, checkOut);
    const totalPrice = campsite.price * nights;

    const cartItem: CartItem = {
      id: `campsite-${campsite.id}-${checkIn}-${checkOut}`,
      type: 'campsite',
      name: `${campsite.name} (${nights} night${nights > 1 ? 's' : ''})`,
      price: totalPrice,
      totalPrice: totalPrice,
      image: campsite.image,
      quantity: 1,
      checkIn,
      checkOut,
      guests,
      nights,
      location: campsite.location,
      originalItem: campsite
    };

    this.addToCart(cartItem);
  }

  // Add activity to cart
  public addActivity(activity: any, date: string, time: string, participants: number): void {
    const totalPrice = activity.price * participants;

    const cartItem: CartItem = {
      id: `activity-${activity.id}-${date}-${time}`,
      type: 'activity',
      name: `${activity.name} (${participants} participant${participants > 1 ? 's' : ''})`,
      price: totalPrice,
      totalPrice: totalPrice,
      image: activity.icon,
      quantity: 1,
      date,
      time,
      participants,
      location: activity.category,
      originalItem: activity
    };

    this.addToCart(cartItem);
  }

  // Add equipment to cart
  public addEquipment(equipment: any, rentalStart: string, rentalEnd: string, quantity: number): void {
    const rentalDays = this.calculateRentalDays(rentalStart, rentalEnd);
    let unitPrice = equipment.price;
    
    // Adjust price based on rental period
    if (equipment.period === 'hour' && rentalDays > 0) {
      unitPrice = equipment.price * 24 * rentalDays; // Convert hourly to daily
    } else if (equipment.period === 'week' && rentalDays < 7) {
      unitPrice = (equipment.price / 7) * rentalDays; // Convert weekly to daily
    } else if (equipment.period === 'day') {
      unitPrice = equipment.price * rentalDays;
    }

    const totalPrice = unitPrice * quantity;

    const cartItem: CartItem = {
      id: `equipment-${equipment.id}-${rentalStart}-${rentalEnd}`,
      type: 'equipment',
      name: `${equipment.name} (${rentalDays} day${rentalDays > 1 ? 's' : ''})`,
      price: totalPrice,
      totalPrice: totalPrice,
      image: equipment.image || equipment.imageUrl,
      quantity,
      startDate: rentalStart, // Alias
      endDate: rentalEnd,     // Alias
      rentalStart,
      rentalEnd,
      rentalDays,
      days: rentalDays,       // Alias
      location: equipment.category,
      originalItem: equipment
    };

    this.addToCart(cartItem);
  }

  private addToCart(item: CartItem): void {
    // Check if item already exists (same item with same dates/details)
    const existingIndex = this.cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingIndex !== -1) {
      // Update existing item
      this.cart[existingIndex] = item;
      toast.info('Updated item in cart');
    } else {
      // Add new item
      this.cart.push(item);
      toast.success(`${item.name} added to cart!`);
    }

    this.saveCart();
    this.notifyListeners();
  }

  // Remove item from cart
  public removeItem(itemId: string): void {
    const item = this.cart.find(item => item.id === itemId);
    this.cart = this.cart.filter(item => item.id !== itemId);
    this.saveCart();
    this.notifyListeners();
    
    if (item) {
      toast.success(`${item.name} removed from cart`);
    }
  }

  // Update item quantity
  public updateQuantity(itemId: string, quantity: number): void {
    const itemIndex = this.cart.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      if (quantity <= 0) {
        this.removeItem(itemId);
      } else {
        const item = this.cart[itemIndex];
        const oldQuantity = item.quantity;
        const pricePerUnit = item.price / oldQuantity;
        
        item.quantity = quantity;
        item.price = pricePerUnit * quantity;
        
        this.saveCart();
        this.notifyListeners();
      }
    }
  }

  // Get cart items
  public getCart(): CartItem[] {
    return [...this.cart];
  }

  // Get cart total
  public getTotal(): number {
    return this.cart.reduce((total, item) => total + item.price, 0);
  }

  // Get cart item count
  public getItemCount(): number {
    return this.cart.reduce((count, item) => count + item.quantity, 0);
  }

  // Clear cart
  public clearCart(): void {
    this.cart = [];
    this.saveCart();
    this.notifyListeners();
    toast.success('Cart cleared');
  }

  // Helper functions
  private calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateRentalDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, days); // At least 1 day
  }

  // Validation helpers
  public isDateAvailable(itemType: CartItemType, itemId: string, startDate: string, endDate?: string): boolean {
    // Check if dates conflict with existing bookings
    const conflictingItems = this.cart.filter(item => {
      if (item.type !== itemType || item.originalItem.id !== itemId) {
        return false;
      }

      // Check date conflicts based on item type
      if (itemType === 'campsite') {
        const existingStart = new Date(item.checkIn!);
        const existingEnd = new Date(item.checkOut!);
        const newStart = new Date(startDate);
        const newEnd = new Date(endDate!);
        
        return (newStart < existingEnd && newEnd > existingStart);
      } else if (itemType === 'equipment') {
        const existingStart = new Date(item.rentalStart!);
        const existingEnd = new Date(item.rentalEnd!);
        const newStart = new Date(startDate);
        const newEnd = new Date(endDate!);
        
        return (newStart < existingEnd && newEnd > existingStart);
      } else if (itemType === 'activity') {
        return item.date === startDate;
      }

      return false;
    });

    return conflictingItems.length === 0;
  }

  // Get booking summary for checkout
  public getBookingSummary() {
    const summary = {
      campsites: this.cart.filter(item => item.type === 'campsite'),
      activities: this.cart.filter(item => item.type === 'activity'),  
      equipment: this.cart.filter(item => item.type === 'equipment'),
      subtotal: this.getTotal(),
      tax: this.getTotal() * 0.1, // 10% tax
      total: this.getTotal() * 1.1
    };

    return summary;
  }
}

export default CartService;
