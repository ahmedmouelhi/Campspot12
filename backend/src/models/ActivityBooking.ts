import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityBooking extends Document {
    user: mongoose.Types.ObjectId;
    activity: mongoose.Types.ObjectId;
    date: Date;
    time: string;
    participants: number;
    totalPrice: number;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    adminNotes?: string;
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    rejectionReason?: string;
    cancelledAt?: Date;
    specialRequests?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ActivityBookingSchema: Schema = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        activity: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Activity',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        time: {
            type: String,
            required: true,
        },
        participants: {
            type: Number,
            required: true,
            min: 1,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
            default: 'pending',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'refunded'],
            default: 'pending',
        },
        adminNotes: {
            type: String,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        approvedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
        },
        cancelledAt: {
            type: Date,
        },
        specialRequests: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Add indexes
ActivityBookingSchema.index({ date: 1 });
ActivityBookingSchema.index({ user: 1, status: 1 });
ActivityBookingSchema.index({ activity: 1, status: 1 });

export default mongoose.model<IActivityBooking>('ActivityBooking', ActivityBookingSchema);
