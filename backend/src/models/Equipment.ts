import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEquipment extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  name: string;
  category: string;
  price: number;
  period: 'hour' | 'day' | 'week';
  description: string;
  features: string[];
  image: string;
  imageId?: string;
  imageUrl?: string;
  availability: 'Available' | 'Limited' | 'Unavailable';
  quantity: number;
  condition: 'Excellent' | 'Good' | 'Fair';
  specifications: {
    weight?: string;
    dimensions?: string;
    material?: string;
    capacity?: string;
    brand?: string;
    model?: string;
  };
  maintenance: {
    lastService?: Date;
    nextService?: Date;
    notes?: string;
  };
  rentalHistory: {
    user: Types.ObjectId;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'completed' | 'cancelled';
    totalPrice: number;
  }[];
  reviews: {
    user: Types.ObjectId;
    rating: number;
    comment: string;
    date: Date;
  }[];
  rating: number;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: Date;
  updatedAt: Date;
  updateRating(): void;
}

const EquipmentSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    period: {
      type: String,
      enum: ['hour', 'day', 'week'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    features: [{
      type: String,
      trim: true,
    }],
    image: {
      type: String,
      required: true,
    },
    imageId: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    availability: {
      type: String,
      enum: ['Available', 'Limited', 'Unavailable'],
      default: 'Available',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    condition: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair'],
      required: true,
    },
    specifications: {
      weight: String,
      dimensions: String,
      material: String,
      capacity: String,
      brand: String,
      model: String,
    },
    maintenance: {
      lastService: Date,
      nextService: Date,
      notes: String,
    },
    rentalHistory: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
      status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active',
      },
      totalPrice: {
        type: Number,
        required: true,
      },
    }],
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
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Update availability based on quantity
EquipmentSchema.pre('save', function(this: IEquipment, next) {
  if (this.isModified('quantity')) {
    if (this.quantity === 0) {
      this.availability = 'Unavailable';
    } else if (this.quantity <= 5) {
      this.availability = 'Limited';
    } else {
      this.availability = 'Available';
    }
  }
  next();
});

// Update rating when reviews change
EquipmentSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
  } else {
    const sum = this.reviews.reduce((acc: number, review: any) => acc + review.rating, 0);
    this.rating = Number((sum / this.reviews.length).toFixed(1));
  }
};

// Indexes
EquipmentSchema.index({ category: 1, availability: 1 });
EquipmentSchema.index({ condition: 1 });
EquipmentSchema.index({ price: 1 });
EquipmentSchema.index({ rating: -1 });
EquipmentSchema.index({ status: 1 });
EquipmentSchema.index({ name: 'text', description: 'text' });

export default mongoose.model<IEquipment>('Equipment', EquipmentSchema);
