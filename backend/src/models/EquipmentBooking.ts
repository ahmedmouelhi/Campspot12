import mongoose, { Schema, Document } from 'mongoose';

export interface IEquipmentBooking extends Document {
    user: mongoose.Types.ObjectId;
    equipment: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    quantity: number;
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

const EquipmentBookingSchema: Schema = new Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        equipment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment',
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        quantity: {
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
EquipmentBookingSchema.index({ startDate: 1, endDate: 1 });
EquipmentBookingSchema.index({ user: 1, status: 1 });
EquipmentBookingSchema.index({ equipment: 1, status: 1 });

export default mongoose.model<IEquipmentBooking>('EquipmentBooking', EquipmentBookingSchema);
