import { toast } from 'react-toastify';
import apiService from './apiService';

export type CartItemType = 'campsite' | 'activity' | 'equipment';

export interface CartItem {
    id: string;
    itemId: string;
    itemType: CartItemType;
    type: CartItemType;
    name: string;
    price: number;
    totalPrice: number;
    image?: string;
    quantity: number;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    nights?: number;
    date?: string;
    time?: string;
    participants?: number;
    startDate?: string;
    endDate?: string;
    rentalStart?: string;
    rentalEnd?: string;
    rentalDays?: number;
    days?: number;
    location?: string;
    originalItem: any;
}

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

class CartServiceDB {
    private static instance: CartServiceDB;
    private cart: CartItem[] = [];
    private listeners: (() => void)[] = [];
    private isLoading: boolean = false;
    private isMigrated: boolean = false;

    private constructor() {
        this.initializeCart();
    }

    public static getInstance(): CartServiceDB {
        if (!CartServiceDB.instance) {
            CartServiceDB.instance = new CartServiceDB();
        }
        return CartServiceDB.instance;
    }

    private async initializeCart() {
        // Check if user is authenticated
        const token = localStorage.getItem('campspot_token');
        if (!token) {
            // Not logged in, load from localStorage temporarily
            this.loadFromLocalStorage();
            return;
        }

        // Check if migration is needed
        const migrated = localStorage.getItem('cart_migrated');
        if (!migrated) {
            await this.migrateFromLocalStorage();
        } else {
            await this.fetchFromBackend();
        }
    }

    private loadFromLocalStorage() {
        const saved = localStorage.getItem('campspot_cart');
        if (saved) {
            try {
                this.cart = JSON.parse(saved);
                this.notifyListeners();
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
                this.cart = [];
            }
        }
    }

    private async migrateFromLocalStorage() {
        const saved = localStorage.getItem('campspot_cart');
        if (!saved) {
            // No cart to migrate, just fetch from backend
            await this.fetchFromBackend();
            localStorage.setItem('cart_migrated', 'true');
            return;
        }

        try {
            const localCart = JSON.parse(saved);
            if (localCart.length === 0) {
                await this.fetchFromBackend();
                localStorage.setItem('cart_migrated', 'true');
                return;
            }

            // Migrate to backend
            console.log('🔄 Migrating cart from localStorage to database...');
            const response = await apiService.request<ApiResponse<{ items: CartItem[] }>>('/cart/db/migrate', {
                method: 'POST',
                body: JSON.stringify({ items: localCart })
            });

            if (response.success && response.data) {
                this.cart = response.data.items || [];
                localStorage.setItem('cart_migrated', 'true');
                localStorage.removeItem('campspot_cart'); // Clear old cart
                this.notifyListeners();
                toast.success('Cart synced to your account!');
                console.log('✅ Cart migration complete');
            }
        } catch (error) {
            console.error('Error migrating cart:', error);
            // Fallback to localStorage
            this.loadFromLocalStorage();
        }
    }

    private async fetchFromBackend() {
        try {
            this.isLoading = true;
            const response = await apiService.request<ApiResponse<{ items: CartItem[] }>>('/cart/db');

            if (response.success && response.data) {
                this.cart = response.data.items || [];
                this.notifyListeners();
            }
        } catch (error) {
            console.error('Error fetching cart from backend:', error);
        } finally {
            this.isLoading = false;
        }
    }

    public subscribe(callback: () => void): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(listener => listener !== callback);
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener());
    }

    private async syncToBackend() {
        const token = localStorage.getItem('campspot_token');
        if (!token) {
            // Not logged in, save to localStorage as fallback
            localStorage.setItem('campspot_cart', JSON.stringify(this.cart));
            return;
        }

        // Sync to backend happens automatically through API calls
        // No need to manually sync since each operation calls the backend
    }

    public async addCampsite(campsite: any, checkIn: string, checkOut: string, guests: number): Promise<void> {
        const nights = this.calculateNights(checkIn, checkOut);
        const totalPrice = campsite.price * nights;

        const cartItem: CartItem = {
            id: `campsite-${campsite.id}-${checkIn}-${checkOut}`,
            itemId: campsite.id,
            itemType: 'campsite',
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

        await this.addToCart(cartItem);
    }

    public async addActivity(activity: any, date: string, time: string, participants: number): Promise<void> {
        const totalPrice = activity.price * participants;

        const cartItem: CartItem = {
            id: `activity-${activity.id}-${date}-${time}`,
            itemId: activity.id,
            itemType: 'activity',
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

        await this.addToCart(cartItem);
    }

    public async addEquipment(equipment: any, rentalStart: string, rentalEnd: string, quantity: number): Promise<void> {
        const rentalDays = this.calculateRentalDays(rentalStart, rentalEnd);
        let unitPrice = equipment.price;

        if (equipment.period === 'hour' && rentalDays > 0) {
            unitPrice = equipment.price * 24 * rentalDays;
        } else if (equipment.period === 'week' && rentalDays < 7) {
            unitPrice = (equipment.price / 7) * rentalDays;
        } else if (equipment.period === 'day') {
            unitPrice = equipment.price * rentalDays;
        }

        const totalPrice = unitPrice * quantity;

        const cartItem: CartItem = {
            id: `equipment-${equipment.id}-${rentalStart}-${rentalEnd}`,
            itemId: equipment.id,
            itemType: 'equipment',
            type: 'equipment',
            name: `${equipment.name} (${rentalDays} day${rentalDays > 1 ? 's' : ''})`,
            price: totalPrice,
            totalPrice: totalPrice,
            image: equipment.image || equipment.imageUrl,
            quantity,
            startDate: rentalStart,
            endDate: rentalEnd,
            rentalStart,
            rentalEnd,
            rentalDays,
            days: rentalDays,
            location: equipment.category,
            originalItem: equipment
        };

        await this.addToCart(cartItem);
    }

    private async addToCart(item: CartItem): Promise<void> {
        const token = localStorage.getItem('campspot_token');

        if (!token) {
            // Not logged in, use localStorage
            const existingIndex = this.cart.findIndex(cartItem => cartItem.id === item.id);
            if (existingIndex !== -1) {
                this.cart[existingIndex] = item;
                toast.info('Updated item in cart');
            } else {
                this.cart.push(item);
                toast.success(`${item.name} added to cart!`);
            }
            localStorage.setItem('campspot_cart', JSON.stringify(this.cart));
            this.notifyListeners();
            return;
        }

        // Add to backend
        try {
            const response = await apiService.request<ApiResponse<{ items: CartItem[] }>>('/cart/db', {
                method: 'POST',
                body: JSON.stringify(item)
            });

            if (response.success && response.data) {
                this.cart = response.data.items || [];
                this.notifyListeners();
                toast.success(`${item.name} added to cart!`);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add item to cart');
        }
    }

    public async removeItem(itemId: string): Promise<void> {
        const item = this.cart.find(item => item.id === itemId);
        const token = localStorage.getItem('campspot_token');

        if (!token) {
            // Not logged in, use localStorage
            this.cart = this.cart.filter(item => item.id !== itemId);
            localStorage.setItem('campspot_cart', JSON.stringify(this.cart));
            this.notifyListeners();
            if (item) {
                toast.success(`${item.name} removed from cart`);
            }
            return;
        }

        // Remove from backend
        try {
            const cartItem = this.cart.find(i => i.id === itemId);
            if (!cartItem) return;

            const response = await apiService.request<ApiResponse<{ items: CartItem[] }>>(`/cart/db/item/${cartItem.itemId}/${cartItem.itemType}`, {
                method: 'DELETE'
            });

            if (response.success && response.data) {
                this.cart = response.data.items || [];
                this.notifyListeners();
                if (item) {
                    toast.success(`${item.name} removed from cart`);
                }
            }
        } catch (error) {
            console.error('Error removing from cart:', error);
            toast.error('Failed to remove item from cart');
        }
    }

    public async updateQuantity(itemId: string, quantity: number): Promise<void> {
        if (quantity <= 0) {
            await this.removeItem(itemId);
            return;
        }

        const token = localStorage.getItem('campspot_token');
        const cartItem = this.cart.find(item => item.id === itemId);
        if (!cartItem) return;

        if (!token) {
            // Not logged in, use localStorage
            const itemIndex = this.cart.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                const oldQuantity = this.cart[itemIndex].quantity;
                const pricePerUnit = this.cart[itemIndex].price / oldQuantity;
                this.cart[itemIndex].quantity = quantity;
                this.cart[itemIndex].price = pricePerUnit * quantity;
                localStorage.setItem('campspot_cart', JSON.stringify(this.cart));
                this.notifyListeners();
            }
            return;
        }

        // Update on backend
        try {
            const response = await apiService.request<ApiResponse<{ items: CartItem[] }>>('/cart/db/item', {
                method: 'PUT',
                body: JSON.stringify({
                    itemId: cartItem.itemId,
                    itemType: cartItem.itemType,
                    quantity
                })
            });

            if (response.success && response.data) {
                this.cart = response.data.items || [];
                this.notifyListeners();
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
            toast.error('Failed to update quantity');
        }
    }

    public getCart(): CartItem[] {
        return [...this.cart];
    }

    public getTotal(): number {
        return this.cart.reduce((total, item) => total + item.price, 0);
    }

    public getItemCount(): number {
        return this.cart.reduce((count, item) => count + item.quantity, 0);
    }

    public async clearCart(): Promise<void> {
        const token = localStorage.getItem('campspot_token');

        if (!token) {
            // Not logged in, use localStorage
            this.cart = [];
            localStorage.setItem('campspot_cart', JSON.stringify(this.cart));
            this.notifyListeners();
            toast.success('Cart cleared');
            return;
        }

        // Clear on backend
        try {
            const response = await apiService.request<ApiResponse>('/cart/db/clear', {
                method: 'DELETE'
            });

            if (response.success) {
                this.cart = [];
                this.notifyListeners();
                toast.success('Cart cleared');
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
            toast.error('Failed to clear cart');
        }
    }

    public async refreshCart(): Promise<void> {
        await this.fetchFromBackend();
    }

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
        return Math.max(1, days);
    }

    public isDateAvailable(itemType: CartItemType, itemId: string, startDate: string, endDate?: string): boolean {
        const conflictingItems = this.cart.filter(item => {
            if (item.type !== itemType || item.originalItem.id !== itemId) {
                return false;
            }

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

    public getBookingSummary() {
        return {
            campsites: this.cart.filter(item => item.type === 'campsite'),
            activities: this.cart.filter(item => item.type === 'activity'),
            equipment: this.cart.filter(item => item.type === 'equipment'),
            subtotal: this.getTotal(),
            tax: this.getTotal() * 0.1,
            total: this.getTotal() * 1.1
        };
    }
}

export default CartServiceDB;
