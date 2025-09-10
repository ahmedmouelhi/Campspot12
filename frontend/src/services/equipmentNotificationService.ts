import { toast } from 'react-toastify';

// Define Equipment interface locally since it's not in a shared service
interface Equipment {
  _id?: string;
  id?: string;
  name: string;
  category: string;
  price: number;
  period: string;
  description: string;
  features: string[] | string;
  image: string;
  imageId?: string;
  imageUrl?: string;
  availability: 'Available' | 'Limited' | 'Unavailable';
  quantity: number;
  condition: 'Excellent' | 'Good' | 'Fair';
}

export interface EquipmentAvailabilityChange {
  equipmentId: string;
  equipmentName: string;
  previousAvailability: Equipment['availability'];
  newAvailability: Equipment['availability'];
  timestamp: string;
  quantity?: number;
}

export interface NotificationSubscriber {
  id: string;
  userId?: string;
  name?: string;
  email?: string;
  notificationTypes: ('availability_change' | 'low_stock' | 'out_of_stock' | 'back_in_stock')[];
  isActive: boolean;
  preferences?: {
    lowStock: boolean;
    outOfStock: boolean;
    backInStock: boolean;
    availabilityChanges: boolean;
  };
}

export interface NotificationHistoryItem {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  equipment?: Equipment;
  previousAvailability?: string;
  newAvailability?: string;
}

class EquipmentNotificationService {
  private static instance: EquipmentNotificationService;
  private subscribers: NotificationSubscriber[] = [];
  private availabilityHistory: EquipmentAvailabilityChange[] = [];

  public static getInstance(): EquipmentNotificationService {
    if (!EquipmentNotificationService.instance) {
      EquipmentNotificationService.instance = new EquipmentNotificationService();
    }
    return EquipmentNotificationService.instance;
  }

  // Subscribe to notifications
  public subscribe(subscriber: NotificationSubscriber): void {
    const existingIndex = this.subscribers.findIndex(s => s.id === subscriber.id);
    if (existingIndex !== -1) {
      this.subscribers[existingIndex] = subscriber;
    } else {
      this.subscribers.push(subscriber);
    }
    this.saveSubscribers();
    
    toast.success('Successfully subscribed to equipment notifications!');
  }

  // Unsubscribe from notifications
  public unsubscribe(subscriberId: string): void {
    this.subscribers = this.subscribers.filter(s => s.id !== subscriberId);
    this.saveSubscribers();
    
    toast.info('Unsubscribed from equipment notifications.');
  }

  // Check for availability changes and notify subscribers
  public checkAvailabilityChange(previousEquipment: Equipment, newEquipment: Equipment): void {
    console.log('🔍 Checking availability change:', {
      previousAvailability: previousEquipment.availability,
      newAvailability: newEquipment.availability,
      previousQuantity: previousEquipment.quantity,
      newQuantity: newEquipment.quantity,
      equipmentName: newEquipment.name
    });
    
    if (previousEquipment.availability !== newEquipment.availability || 
        previousEquipment.quantity !== newEquipment.quantity) {
      
      const change: EquipmentAvailabilityChange = {
        equipmentId: newEquipment.id,
        equipmentName: newEquipment.name,
        previousAvailability: previousEquipment.availability,
        newAvailability: newEquipment.availability,
        timestamp: new Date().toISOString(),
        quantity: newEquipment.quantity
      };

      console.log('📢 Equipment availability changed, creating notification:', change);
      this.addToHistoryEnhanced(change);
      this.notifySubscribers(change);
    } else {
      console.log('ℹ️ No availability change detected');
    }
  }

  // Notify about equipment availability changes
  private notifySubscribers(change: EquipmentAvailabilityChange): void {
    const activeSubscribers = this.subscribers.filter(s => s.isActive);
    
    console.log(`🔔 Notifying ${activeSubscribers.length} active subscribers about change:`, change);
    
    if (activeSubscribers.length === 0) {
      console.warn('⚠️ No active subscribers found to notify');
    }
    
    activeSubscribers.forEach(subscriber => {
      console.log(`📧 Sending notification to subscriber: ${subscriber.email || subscriber.id}`);
      this.sendNotificationToSubscriber(subscriber, change);
    });
  }

  // Send notification to individual subscriber
  private sendNotificationToSubscriber(subscriber: NotificationSubscriber, change: EquipmentAvailabilityChange): void {
    const { equipmentName, previousAvailability, newAvailability, quantity } = change;
    
    // Check if subscriber wants this type of notification
    let shouldNotify = false;
    let notificationType: string = '';
    let message: string = '';
    let toastType: 'success' | 'warning' | 'error' | 'info' = 'info';

    if (previousAvailability === 'Available' && newAvailability === 'Limited') {
      if (subscriber.notificationTypes.includes('low_stock')) {
        shouldNotify = true;
        notificationType = 'Low Stock Alert';
        message = `⚠️ ${equipmentName} is now in limited stock (${quantity} left)`;
        toastType = 'warning';
      }
    } else if (previousAvailability !== 'Unavailable' && newAvailability === 'Unavailable') {
      if (subscriber.notificationTypes.includes('out_of_stock')) {
        shouldNotify = true;
        notificationType = 'Out of Stock Alert';
        message = `❌ ${equipmentName} is now out of stock`;
        toastType = 'error';
      }
    } else if (previousAvailability === 'Unavailable' && (newAvailability === 'Available' || newAvailability === 'Limited')) {
      if (subscriber.notificationTypes.includes('back_in_stock')) {
        shouldNotify = true;
        notificationType = 'Back in Stock';
        message = `✅ ${equipmentName} is back in stock!`;
        toastType = 'success';
      }
    } else if (subscriber.notificationTypes.includes('availability_change')) {
      shouldNotify = true;
      notificationType = 'Availability Update';
      message = `📦 ${equipmentName} availability changed: ${previousAvailability} → ${newAvailability}`;
      toastType = 'info';
    }

    if (shouldNotify) {
      // Show toast notification
      toast[toastType](message, {
        autoClose: 8000,
        position: 'top-right'
      });

      // Log notification (in real app, this would send email/push notification)
      console.log(`📧 Notification sent to ${subscriber.email || subscriber.id}:`, {
        type: notificationType,
        message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Add change to history
  private addToHistory(change: EquipmentAvailabilityChange): void {
    this.availabilityHistory.unshift(change);
    // Keep only last 100 changes
    if (this.availabilityHistory.length > 100) {
      this.availabilityHistory = this.availabilityHistory.slice(0, 100);
    }
    this.saveHistory();
  }

  // Get notification history
  public getNotificationHistory(): EquipmentAvailabilityChange[] {
    this.loadHistory();
    return [...this.availabilityHistory];
  }

  // Get active subscribers count
  public getActiveSubscribersCount(): number {
    return this.subscribers.filter(s => s.isActive).length;
  }

  // Get all subscribers (admin only)
  public getAllSubscribers(): NotificationSubscriber[] {
    this.loadSubscribers();
    return [...this.subscribers];
  }

  // Bulk notify about equipment changes (useful for admin operations)
  public notifyBulkChanges(changes: EquipmentAvailabilityChange[]): void {
    if (changes.length === 0) return;

    changes.forEach(change => {
      this.addToHistoryEnhanced(change);
    });

    // Show summary notification
    toast.info(`📦 ${changes.length} equipment items have been updated`, {
      autoClose: 6000
    });

    // Notify subscribers about bulk changes
    const activeSubscribers = this.subscribers.filter(s => s.isActive);
    if (activeSubscribers.length > 0) {
      toast.info(`🔔 Notifying ${activeSubscribers.length} subscribers about equipment updates`, {
        autoClose: 4000
      });
    }
  }

  // Initialize default admin subscriber
  public initializeAdminSubscriber(): void {
    const adminSubscriber: NotificationSubscriber = {
      id: 'admin-default',
      userId: 'admin',
      email: 'admin@campspot.com',
      notificationTypes: ['availability_change', 'low_stock', 'out_of_stock', 'back_in_stock'],
      isActive: true
    };

    const existingAdmin = this.subscribers.find(s => s.id === 'admin-default');
    if (!existingAdmin) {
      this.subscribers.push(adminSubscriber);
      this.saveSubscribers();
    }
  }

  // Storage methods
  private saveSubscribers(): void {
    localStorage.setItem('equipment_notification_subscribers', JSON.stringify(this.subscribers));
  }

  private loadSubscribers(): void {
    const saved = localStorage.getItem('equipment_notification_subscribers');
    if (saved) {
      this.subscribers = JSON.parse(saved);
    }
  }

  private saveHistory(): void {
    localStorage.setItem('equipment_availability_history', JSON.stringify(this.availabilityHistory));
  }

  private loadHistory(): void {
    const saved = localStorage.getItem('equipment_availability_history');
    if (saved) {
      this.availabilityHistory = JSON.parse(saved);
    }
  }

  // Initialize service
  public initialize(): void {
    console.log('🚀 Initializing EquipmentNotificationService...');
    this.loadSubscribers();
    this.loadHistory();
    this.initializeAdminSubscriber();
    console.log(`✅ Service initialized with ${this.subscribers.length} subscribers and ${this.availabilityHistory.length} history items`);
  }

  // Create notification preferences for users
  public createUserNotificationPreferences(userId: string, email: string): NotificationSubscriber {
    return {
      id: `user-${userId}`,
      userId,
      email,
      notificationTypes: ['out_of_stock', 'back_in_stock'],
      isActive: true
    };
  }

  // Quick methods for common notifications
  public notifyLowStock(equipment: Equipment): void {
    const change: EquipmentAvailabilityChange = {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      previousAvailability: 'Available',
      newAvailability: 'Limited',
      timestamp: new Date().toISOString(),
      quantity: equipment.quantity
    };
    
    this.addToHistoryEnhanced(change);
    this.notifySubscribers(change);
  }

  public notifyOutOfStock(equipment: Equipment): void {
    const change: EquipmentAvailabilityChange = {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      previousAvailability: equipment.availability === 'Limited' ? 'Limited' : 'Available',
      newAvailability: 'Unavailable',
      timestamp: new Date().toISOString(),
      quantity: 0
    };
    
    this.addToHistoryEnhanced(change);
    this.notifySubscribers(change);
  }

  public notifyBackInStock(equipment: Equipment): void {
    const change: EquipmentAvailabilityChange = {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      previousAvailability: 'Unavailable',
      newAvailability: equipment.availability,
      timestamp: new Date().toISOString(),
      quantity: equipment.quantity
    };
    
    this.addToHistoryEnhanced(change);
    this.notifySubscribers(change);
  }

  // Method expected by demo component - convert subscriber for UI display
  public getSubscribers(): NotificationSubscriber[] {
    this.loadSubscribers();
    return [...this.subscribers].map(sub => ({
      ...sub,
      name: sub.name || sub.email?.split('@')[0] || sub.id
    }));
  }

  // Enhanced subscribe method for demo component
  public subscribeWithPreferences(subscriber: {
    id: string;
    email: string;
    name: string;
    preferences: {
      lowStock: boolean;
      outOfStock: boolean;
      backInStock: boolean;
      availabilityChanges: boolean;
    };
  }): void {
    const notificationTypes: ('availability_change' | 'low_stock' | 'out_of_stock' | 'back_in_stock')[] = [];
    
    if (subscriber.preferences.availabilityChanges) notificationTypes.push('availability_change');
    if (subscriber.preferences.lowStock) notificationTypes.push('low_stock');
    if (subscriber.preferences.outOfStock) notificationTypes.push('out_of_stock');
    if (subscriber.preferences.backInStock) notificationTypes.push('back_in_stock');

    this.subscribe({
      id: subscriber.id,
      name: subscriber.name,
      email: subscriber.email,
      notificationTypes,
      isActive: true,
      preferences: subscriber.preferences
    });
  }

  // Method to get notification history in format expected by demo
  public getNotificationHistoryForDemo(): NotificationHistoryItem[] {
    this.loadHistory();
    this.loadNotificationHistory();
    
    // Convert availability changes to notification format
    return this.availabilityHistory.map((change, index) => {
      let type = 'availability_change';
      let title = 'Availability Change';
      let message = `${change.equipmentName} availability changed: ${change.previousAvailability} → ${change.newAvailability}`;
      
      if (change.previousAvailability === 'Available' && change.newAvailability === 'Limited') {
        type = 'low_stock';
        title = 'Low Stock Alert';
        message = `${change.equipmentName} is now in limited stock`;
      } else if (change.newAvailability === 'Unavailable') {
        type = 'out_of_stock';
        title = 'Out of Stock';
        message = `${change.equipmentName} is now out of stock`;
      } else if (change.previousAvailability === 'Unavailable' && (change.newAvailability === 'Available' || change.newAvailability === 'Limited')) {
        type = 'back_in_stock';
        title = 'Back in Stock';
        message = `${change.equipmentName} is back in stock!`;
      }
      
      return {
        id: `${change.equipmentId}-${index}`,
        type,
        title,
        message,
        timestamp: change.timestamp,
        previousAvailability: change.previousAvailability,
        newAvailability: change.newAvailability,
        equipment: {
          id: change.equipmentId,
          name: change.equipmentName
        } as Equipment
      };
    });
  }

  // Storage methods for notification history
  private notificationHistory: NotificationHistoryItem[] = [];
  
  private saveNotificationHistory(): void {
    localStorage.setItem('equipment_notification_history', JSON.stringify(this.notificationHistory));
  }

  private loadNotificationHistory(): void {
    const saved = localStorage.getItem('equipment_notification_history');
    if (saved) {
      try {
        this.notificationHistory = JSON.parse(saved);
      } catch (e) {
        this.notificationHistory = [];
      }
    }
  }

  // Clear all equipment notifications
  public clearAllNotifications(): void {
    this.notificationHistory = [];
    this.availabilityHistory = [];
    this.saveNotificationHistory();
    this.saveHistory();
  }

  // Override addToHistory to also save notification format
  private addToHistoryEnhanced(change: EquipmentAvailabilityChange): void {
    // Add to availability history
    this.availabilityHistory.unshift(change);
    if (this.availabilityHistory.length > 100) {
      this.availabilityHistory = this.availabilityHistory.slice(0, 100);
    }
    this.saveHistory();

    // Also add to notification history format
    let type = 'availability_change';
    let title = 'Availability Change';
    let message = `${change.equipmentName} availability changed: ${change.previousAvailability} → ${change.newAvailability}`;
    
    if (change.previousAvailability === 'Available' && change.newAvailability === 'Limited') {
      type = 'low_stock';
      title = 'Low Stock Alert';
      message = `${change.equipmentName} is now in limited stock`;
    } else if (change.newAvailability === 'Unavailable') {
      type = 'out_of_stock';
      title = 'Out of Stock';
      message = `${change.equipmentName} is now out of stock`;
    } else if (change.previousAvailability === 'Unavailable' && (change.newAvailability === 'Available' || change.newAvailability === 'Limited')) {
      type = 'back_in_stock';
      title = 'Back in Stock';
      message = `${change.equipmentName} is back in stock!`;
    }

    const notification: NotificationHistoryItem = {
      id: `${change.equipmentId}-${Date.now()}`,
      type,
      title,
      message,
      timestamp: change.timestamp,
      previousAvailability: change.previousAvailability,
      newAvailability: change.newAvailability,
      equipment: {
        id: change.equipmentId,
        name: change.equipmentName
      } as Equipment
    };

    this.notificationHistory.unshift(notification);
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }
    this.saveNotificationHistory();
  }
}

export default EquipmentNotificationService;
