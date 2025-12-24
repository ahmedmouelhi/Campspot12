import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import Logger from '../utils/logger';

class SocketService {
    private static instance: SocketService;
    private io: SocketIOServer | null = null;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public initialize(httpServer: HTTPServer): void {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:5173',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.io.on('connection', (socket) => {
            Logger.info(`Client connected: ${socket.id}`);

            // Join user-specific room
            socket.on('join:user', (userId: string) => {
                socket.join(`user:${userId}`);
                Logger.info(`User ${userId} joined their room`);
            });

            // Join admin room
            socket.on('join:admin', () => {
                socket.join('admin');
                Logger.info(`Admin joined admin room`);
            });

            // Handle disconnection
            socket.on('disconnect', () => {
                Logger.info(`Client disconnected: ${socket.id}`);
            });
        });

        Logger.info('Socket.IO server initialized');
    }

    // Emit booking status update to specific user
    public emitBookingUpdate(userId: string, booking: any): void {
        if (this.io) {
            this.io.to(`user:${userId}`).emit('booking:updated', booking);
            Logger.info(`Emitted booking update to user ${userId}`);
        }
    }

    // Emit booking update to all admins
    public emitAdminBookingUpdate(booking: any, action: string): void {
        if (this.io) {
            this.io.to('admin').emit('booking:admin-update', { booking, action });
            Logger.info(`Emitted ${action} to admin room`);
        }
    }

    // Emit new booking to admins
    public emitNewBooking(booking: any): void {
        if (this.io) {
            this.io.to('admin').emit('booking:new', booking);
            Logger.info('Emitted new booking to admin room');
        }
    }

    // Emit booking cancellation
    public emitBookingCancelled(userId: string, bookingId: string): void {
        if (this.io) {
            // Notify user
            this.io.to(`user:${userId}`).emit('booking:cancelled', { bookingId });
            // Notify admins
            this.io.to('admin').emit('booking:admin-update', {
                bookingId,
                action: 'cancelled'
            });
            Logger.info(`Emitted booking cancellation for ${bookingId}`);
        }
    }

    // Emit booking approval
    public emitBookingApproved(userId: string, booking: any): void {
        if (this.io) {
            this.io.to(`user:${userId}`).emit('booking:approved', booking);
            this.io.to('admin').emit('booking:admin-update', {
                booking,
                action: 'approved'
            });
            Logger.info(`Emitted booking approval to user ${userId}`);
        }
    }

    // Emit booking rejection
    public emitBookingRejected(userId: string, booking: any): void {
        if (this.io) {
            this.io.to(`user:${userId}`).emit('booking:rejected', booking);
            this.io.to('admin').emit('booking:admin-update', {
                booking,
                action: 'rejected'
            });
            Logger.info(`Emitted booking rejection to user ${userId}`);
        }
    }

    public getIO(): SocketIOServer | null {
        return this.io;
    }
}

export default SocketService;
