import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { generateToken } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/apiResponse';
import NotificationService from '../services/notificationService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, instagramUrl } = req.body;

    // Validate required fields
    if (!email || !password || !name || !instagramUrl) {
      return res.status(400).json(errorResponse('All fields including Instagram URL are required'));
    }

    // Validate Instagram URL format
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/.+/;
    if (!instagramRegex.test(instagramUrl)) {
      return res.status(400).json(errorResponse('Please provide a valid Instagram profile URL'));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(errorResponse('Email already exists'));
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      instagramUrl,
      role: 'user',
      registrationDate: new Date(),
      isActive: true,
      preferences: {
        notifications: true,
        location: false,
        preferredSites: [],
        equipment: [],
      },
    });

    await user.save();
    const token = generateToken(user._id.toString());

    // Trigger notifications for new user
    try {
      // Send welcome notification to the new user
      await NotificationService.notifyWelcomeUser(user._id.toString(), user);
      
      // Notify admins about new user registration
      await NotificationService.notifyAdminsNewUser(user);
    } catch (notificationError) {
      console.error('Failed to send user registration notifications:', notificationError);
      // Don't fail the registration if notification fails
    }

    res.status(201).json(successResponse({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        instagramUrl: user.instagramUrl,
        role: user.role,
        preferences: user.preferences
      },
      token
    }, 'Account created successfully'));
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(422).json({
        success: false,
        error: 'Validation failed',
        message: 'Validation failed',
        details: errors
      });
    }
    res.status(400).json(errorResponse('Error creating user'));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json(errorResponse('Invalid credentials'));
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json(errorResponse('Invalid credentials'));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    const token = generateToken(user._id.toString());

    res.json(successResponse({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        instagramUrl: user.instagramUrl,
        role: user.role,
        preferences: user.preferences
      },
      token
    }, 'Login successful'));
  } catch (error) {
    res.status(400).json(errorResponse('Error logging in'));
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    res.json(successResponse(user, 'Profile retrieved successfully'));
  } catch (error) {
    res.status(400).json(errorResponse('Error fetching profile'));
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    'name',
    'avatar',
    'location',
    'bio',
    'phone',
    'instagramUrl',
    'preferences',
  ];

  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json(errorResponse('Invalid updates'));
  }

  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json(errorResponse('User not found'));
    }

    updates.forEach((update) => {
      (user as any)[update] = req.body[update];
    });

    await user.save();
    res.json(successResponse(user, 'Profile updated successfully'));
  } catch (error) {
    res.status(400).json(errorResponse('Error updating profile'));
  }
};
