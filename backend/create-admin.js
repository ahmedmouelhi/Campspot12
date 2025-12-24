const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/camping-app';

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  instagramUrl: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  registrationDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  preferences: {
    notifications: { type: Boolean, default: true },
    location: { type: Boolean, default: false },
    preferredSites: [String],
    equipment: [String],
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Delete existing admin user if exists
    await User.deleteOne({ email: 'superadmin@campspot.com' });
    console.log('🧹 Removed existing superadmin user');

    // Create new admin user
    const adminUser = new User({
      email: 'superadmin@campspot.com',
      password: 'Admin123@',
      name: 'Super Admin',
      instagramUrl: 'https://instagram.com/superadmin',
      role: 'admin'
    });

    await adminUser.save();
    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: superadmin@campspot.com');
    console.log('🔐 Password: Admin123@');
    console.log('👑 Role: admin');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

createAdmin();