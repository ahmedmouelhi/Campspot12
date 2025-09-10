import mongoose, { Schema, Document } from 'mongoose';

export interface ICampingSite extends Document {
  name: string;
  location: string;
  price: number;
  rating: number;
  description: string;
  features: string[];
  image?: string;
  capacity: number;
  availability: 'available' | 'limited' | 'unavailable';
  type: 'tent' | 'rv' | 'cabin' | 'glamping';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  images: string[];
  reviews: {
    user: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    date: Date;
  }[];
  status: 'active' | 'inactive';
}

const CampingSiteSchema: Schema = new Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  description: { type: String, required: true },
  features: [{ type: String }],
  image: { type: String },
  capacity: { type: Number, required: true },
  availability: {
    type: String,
    enum: ['available', 'limited', 'unavailable'],
    default: 'available'
  },
  type: { type: String, enum: ['tent', 'rv', 'cabin', 'glamping'], required: true },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String }
  },
  images: [{ type: String }],
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true },
    comment: { type: String },
    date: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: true
});

export default mongoose.model<ICampingSite>('CampingSite', CampingSiteSchema);
