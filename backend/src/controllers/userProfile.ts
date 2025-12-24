import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Logger from '../utils/logger';
import bcrypt from 'bcryptjs';

// Upload/Update avatar
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        // Construct the avatar URL
        const avatarUrl = `/uploads/${req.file.filename}`;

        // Update user's avatar
        const user = await User.findByIdAndUpdate(
            userId,
            { avatar: avatarUrl },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        Logger.info(`Avatar updated for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            data: {
                avatar: avatarUrl,
                user
            }
        });

    } catch (error: any) {
        Logger.error('Avatar upload error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload avatar'
        });
    }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 6 characters long'
            });
        }

        // Get user with password
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Verify current password
        const isPasswordValid = await user.comparePassword(currentPassword);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = newPassword;
        await user.save();

        Logger.info(`Password changed for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error: any) {
        Logger.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
};

// Delete avatar
export const deleteAvatar = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;

        const user = await User.findByIdAndUpdate(
            userId,
            { $unset: { avatar: 1 } },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        Logger.info(`Avatar deleted for user: ${user.email}`);

        res.json({
            success: true,
            message: 'Avatar deleted successfully',
            data: { user }
        });

    } catch (error: any) {
        Logger.error('Delete avatar error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete avatar'
        });
    }
};
