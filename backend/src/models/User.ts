import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's hashed password
 *         name:
 *           type: string
 *           description: User's full name
 *         avatar:
 *           type: string
 *           description: URL to user's avatar image
 *         location:
 *           type: string
 *           description: User's location
 *         bio:
 *           type: string
 *           description: User's biography
 *         phone:
 *           type: string
 *           description: User's phone number
 *         instagramUrl:
 *           type: string
 *           description: User's Instagram profile URL (required)
 *         preferences:
 *           type: object
 *           properties:
 *             preferredSites:
 *               type: array
 *               items:
 *                 type: string
 *             equipment:
 *               type: array
 *               items:
 *                 type: string
 *             notifications:
 *               type: object
 *               properties:
 *                 email:
 *                   type: boolean
 *                 sms:
 *                   type: boolean
 *                 app:
 *                   type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export interface IUser extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  location?: string;
  bio?: string;
  phone?: string;
  instagramUrl: string;
  role: 'user' | 'admin';
  registrationDate: Date;
  lastLogin?: Date;
  isActive: boolean;
  preferences?: {
    notifications: boolean;
    location: boolean;
    preferredSites?: string[];
    equipment?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    location: {
      type: String,
    },
    bio: {
      type: String,
    },
    phone: {
      type: String,
    },
    instagramUrl: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/(www\.)?instagram\.com\/.+/.test(v);
        },
        message: 'Please provide a valid Instagram profile URL'
      }
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    preferences: {
      notifications: { type: Boolean, default: true },
      location: { type: Boolean, default: false },
      preferredSites: [String],
      equipment: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (this: IUser, next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);
