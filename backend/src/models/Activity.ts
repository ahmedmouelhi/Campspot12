import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IActivity extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  name: string;
  icon: string;
  description: string;
  duration: string;
  difficulty: 'Easy' | 'Beginner' | 'Intermediate' | 'Advanced';
  price: number;
  category: string;
  maxParticipants: number;
  equipment: string[];
  rating?: number;
  reviews: {
    user: Types.ObjectId;
    rating: number;
    comment: string;
    date: Date;
  }[];
  images: string[];
  location?: string;
  schedule?: {
    startTime: string;
    endTime: string;
    days: string[];
  }[];
  status: 'active' | 'inactive' | 'full';
  createdAt: Date;
  updatedAt: Date;
  updateRating(): void;
}

const ActivitySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    maxParticipants: {
      type: Number,
      required: true,
      min: 1,
    },
    equipment: [{
      type: String,
    }],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    }],
    images: [{
      type: String,
    }],
    location: {
      type: String,
    },
    schedule: [{
      startTime: String,
      endTime: String,
      days: [String],
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'full'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Update rating when reviews change
ActivitySchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
  } else {
    const sum = this.reviews.reduce((acc: number, review: any) => acc + review.rating, 0);
    this.rating = Number((sum / this.reviews.length).toFixed(1));
  }
};

// Indexes
ActivitySchema.index({ category: 1, status: 1 });
ActivitySchema.index({ difficulty: 1 });
ActivitySchema.index({ price: 1 });
ActivitySchema.index({ rating: -1 });

export default mongoose.model<IActivity>('Activity', ActivitySchema);
