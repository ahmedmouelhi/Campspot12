import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

class WebSocketService {
    private static instance: WebSocketService;
    private socket: Socket | null = null;
    private connected: boolean = false;

    private constructor() { }

    public static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    public connect(userId?: string): void {
        if (this.socket && this.connected) {
            console.log('WebSocket already connected');
            return;
        }

        const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected:', this.socket?.id);
            this.connected = true;

            // Join user-specific room if userId provided
            if (userId) {
                this.socket?.emit('join:user', userId);
            }
        });

        this.socket.on('disconnect', () => {
            console.log('❌ WebSocket disconnected');
            this.connected = false;
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
        });
    }

    public joinAdminRoom(): void {
        if (this.socket && this.connected) {
            this.socket.emit('join:admin');
            console.log('Joined admin room');
        }
    }

    public onBookingUpdated(callback: (booking: any) => void): void {
        if (this.socket) {
            this.socket.on('booking:updated', (booking) => {
                console.log('📦 Booking updated:', booking);
                callback(booking);
            });
        }
    }

    public onBookingApproved(callback: (booking: any) => void): void {
        if (this.socket) {
            this.socket.on('booking:approved', (booking) => {
                console.log('✅ Booking approved:', booking);
                toast.success('Your booking has been approved!');
                callback(booking);
            });
        }
    }

    public onBookingRejected(callback: (booking: any) => void): void {
        if (this.socket) {
            this.socket.on('booking:rejected', (booking) => {
                console.log('❌ Booking rejected:', booking);
                toast.error('Your booking has been rejected');
                callback(booking);
            });
        }
    }

    public onBookingCancelled(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('booking:cancelled', (data) => {
                console.log('🚫 Booking cancelled:', data);
                callback(data);
            });
        }
    }

    public onAdminBookingUpdate(callback: (data: any) => void): void {
        if (this.socket) {
            this.socket.on('booking:admin-update', (data) => {
                console.log('🔔 Admin booking update:', data);
                callback(data);
            });
        }
    }

    public onNewBooking(callback: (booking: any) => void): void {
        if (this.socket) {
            this.socket.on('booking:new', (booking) => {
                console.log('🆕 New booking:', booking);
                toast.info('New booking received!');
                callback(booking);
            });
        }
    }

    public disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            console.log('WebSocket disconnected manually');
        }
    }

    public isConnected(): boolean {
        return this.connected;
    }
}

export default WebSocketService;
