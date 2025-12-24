import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
    itemId: string;
    itemType: 'campsite' | 'activity' | 'equipment';
    name: string;
    price: number;
    quantity: number;
    date?: string;
    endDate?: string;
    guests?: number;
    participants?: number;
    time?: string;
    image?: string;
}

export interface ICart extends Document {
    userId: mongoose.Types.ObjectId;
    items: ICartItem[];
    createdAt: Date;
    updatedAt: Date;
}

const CartItemSchema = new Schema({
    itemId: {
        type: String,
        required: true
    },
    itemType: {
        type: String,
        enum: ['campsite', 'activity', 'equipment'],
        required: true
    },
    type: {
        type: String,
        enum: ['campsite', 'activity', 'equipment'],
        required: false  // Optional for backward compatibility
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    date: String,
    endDate: String,
    guests: Number,
    participants: Number,
    time: String,
    image: String
}, { _id: false, strict: false }); // strict: false allows additional fields

const CartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [CartItemSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
CartSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.model<ICart>('Cart', CartSchema);
