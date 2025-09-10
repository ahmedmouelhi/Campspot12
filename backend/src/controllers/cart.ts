import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import CampingSite from '../models/CampingSite';
import Activity from '../models/Activity';
import Equipment from '../models/Equipment';
import Booking from '../models/Booking';
import Logger from '../utils/logger';
import NotificationService from '../services/notificationService';

export interface CartItem {
  id: string;
  type: 'campsite' | 'activity' | 'equipment';
  name: string;
  price: number;
  totalPrice: number;
  image?: string;
  quantity: number;
  // Booking specific details
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  nights?: number;
  date?: string;
  time?: string;
  participants?: number;
  startDate?: string;
  endDate?: string;
  rentalDays?: number;
  location?: string;
  originalItem: any;
}

// Add item to cart
export const addToCart = async (req: AuthRequest, res: Response) => {
  try {
    const { type, itemId, ...itemDetails } = req.body;
    const userId = req.user?.id;

    let item: any;
    let cartItem: CartItem;

    switch (type) {
      case 'campsite':
        item = await CampingSite.findById(itemId);
        if (!item) {
          return res.status(404).json({
            success: false,
            error: 'Campsite not found'
          });
        }

        const { checkIn, checkOut, guests } = itemDetails;
        const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
        
        cartItem = {
          id: `campsite-${itemId}-${checkIn}-${checkOut}`,
          type: 'campsite',
          name: `${item.name} (${nights} night${nights > 1 ? 's' : ''})`,
          price: item.price * nights,
          totalPrice: item.price * nights,
          image: item.image,
          quantity: 1,
          checkIn,
          checkOut,
          guests,
          nights,
          location: item.location,
          originalItem: item
        };
        break;

      case 'activity':
        item = await Activity.findById(itemId);
        if (!item) {
          return res.status(404).json({
            success: false,
            error: 'Activity not found'
          });
        }

        const { date, time, participants } = itemDetails;
        
        cartItem = {
          id: `activity-${itemId}-${date}-${time}`,
          type: 'activity',
          name: `${item.name} (${participants} participant${participants > 1 ? 's' : ''})`,
          price: item.price * participants,
          totalPrice: item.price * participants,
          image: item.icon,
          quantity: 1,
          date,
          time,
          participants,
          location: item.category,
          originalItem: item
        };
        break;

      case 'equipment':
        item = await Equipment.findById(itemId);
        if (!item) {
          return res.status(404).json({
            success: false,
            error: 'Equipment not found'
          });
        }

        const { startDate, endDate, quantity } = itemDetails;
        const rentalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
        let unitPrice = item.price;

        // Adjust price based on rental period
        if (item.period === 'hour' && rentalDays > 0) {
          unitPrice = item.price * 24 * rentalDays;
        } else if (item.period === 'week' && rentalDays < 7) {
          unitPrice = (item.price / 7) * rentalDays;
        } else if (item.period === 'day') {
          unitPrice = item.price * rentalDays;
        }

        cartItem = {
          id: `equipment-${itemId}-${startDate}-${endDate}`,
          type: 'equipment',
          name: `${item.name} (${rentalDays} day${rentalDays > 1 ? 's' : ''})`,
          price: unitPrice * quantity,
          totalPrice: unitPrice * quantity,
          image: item.image || item.imageUrl,
          quantity,
          startDate,
          endDate,
          rentalDays,
          location: item.category,
          originalItem: item
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid item type'
        });
    }

    res.json({
      success: true,
      data: cartItem,
      message: `${cartItem.name} added to cart!`
    });
  } catch (error) {
    Logger.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart'
    });
  }
};

// Get cart summary for checkout
export const getCartSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body; // Cart items from frontend

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Cart items are required'
      });
    }

    const subtotal = items.reduce((sum: number, item: CartItem) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.1; // 10% tax
    const serviceFee = 2.50; // €2.50 service fee
    const total = subtotal + tax + serviceFee;

    const summary = {
      campsites: items.filter((item: CartItem) => item.type === 'campsite'),
      activities: items.filter((item: CartItem) => item.type === 'activity'),
      equipment: items.filter((item: CartItem) => item.type === 'equipment'),
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      serviceFee,
      total: Math.round(total * 100) / 100,
      currency: 'EUR'
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    Logger.error('Error getting cart summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cart summary'
    });
  }
};

// Process checkout
export const processCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { items, paymentMethod, billingAddress } = req.body;
    const userId = req.user?.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart items are required'
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: CartItem) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.1;
    const serviceFee = 2.50;
    const total = subtotal + tax + serviceFee;

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send payment completion notification
    try {
      await NotificationService.notifyPaymentCompleted(userId, {
        orderId: `order-${Date.now()}`,
        amount: total,
        currency: 'EUR',
        itemCount: items.length,
        items: items.map(item => item.name)
      });
      Logger.info(`Payment completion notification sent to user ${userId}`);
    } catch (notificationError) {
      Logger.error('Failed to send payment completion notification:', notificationError);
    }

    // Create bookings for campsite items (only campsites use the Booking model)
    const bookings = [];
    
    for (const item of items) {
      if (item.type === 'campsite') {
        // Create proper booking document for campsites
        const booking = new Booking({
          user: userId,
          campingSite: item.originalItem._id,
          startDate: new Date(item.checkIn),
          endDate: new Date(item.checkOut),
          guests: item.guests,
          totalPrice: item.totalPrice,
          status: 'confirmed',
          paymentStatus: 'paid'
        });
        await booking.save();
        bookings.push({
          id: (booking._id as any).toString(),
          type: item.type,
          name: item.name,
          price: item.totalPrice,
          status: 'confirmed',
          ...item
        });
      } else {
        // For activities and equipment, just create a simple booking record
        const booking = {
          id: `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          type: item.type,
          itemId: item.originalItem._id,
          name: item.name,
          price: item.totalPrice,
          status: 'confirmed',
          ...item
        };
        bookings.push(booking);
      }
    }

    const orderSummary = {
      orderId: `order-${Date.now()}`,
      items: bookings,
      subtotal,
      tax,
      serviceFee,
      total,
      paymentMethod,
      billingAddress,
      createdAt: new Date().toISOString(),
      status: 'completed'
    };

    res.json({
      success: true,
      data: orderSummary,
      message: 'Checkout completed successfully!'
    });
  } catch (error) {
    Logger.error('Error processing checkout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process checkout'
    });
  }
};

// Validate cart items availability
export const validateCartItems = async (req: AuthRequest, res: Response) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Cart items are required'
      });
    }

    const validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    for (const item of items) {
      switch (item.type) {
        case 'campsite':
          const campsite = await CampingSite.findById(item.originalItem._id);
          if (!campsite) {
            validation.valid = false;
            validation.errors.push(`Campsite ${item.name} is no longer available`);
          } else if (campsite.availability !== 'available') {
            validation.valid = false;
            validation.errors.push(`Campsite ${item.name} is not available`);
          }
          break;

        case 'activity':
          const activity = await Activity.findById(item.originalItem._id);
          if (!activity) {
            validation.valid = false;
            validation.errors.push(`Activity ${item.name} is no longer available`);
          } else if (activity.status !== 'active') {
            validation.valid = false;
            validation.errors.push(`Activity ${item.name} is not available`);
          }
          break;

        case 'equipment':
          const equipment = await Equipment.findById(item.originalItem._id);
          if (!equipment) {
            validation.valid = false;
            validation.errors.push(`Equipment ${item.name} is no longer available`);
          } else if (equipment.availability === 'Unavailable') {
            validation.valid = false;
            validation.errors.push(`Equipment ${item.name} is not available`);
          } else if (equipment.quantity < item.quantity) {
            validation.valid = false;
            validation.errors.push(`Only ${equipment.quantity} ${item.name} available`);
          }
          break;
      }
    }

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    Logger.error('Error validating cart items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate cart items'
    });
  }
};
