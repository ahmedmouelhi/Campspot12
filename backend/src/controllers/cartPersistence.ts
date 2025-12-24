import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Cart from '../models/Cart';
import Logger from '../utils/logger';

// Get user's cart
export const getCart = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;

        let cart = await Cart.findOne({ userId });

        // Create empty cart if doesn't exist
        if (!cart) {
            cart = await Cart.create({ userId, items: [] });
        }

        res.json({
            success: true,
            data: cart
        });
    } catch (error: any) {
        Logger.error('Error fetching cart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch cart',
            error: error.message
        });
    }
};

// Add item to cart
export const addToCart = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;
        const item = req.body;

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = await Cart.create({ userId, items: [item] });
        } else {
            // Check if item already exists
            const existingItemIndex = cart.items.findIndex(
                (i: any) => i.itemId === item.itemId && i.itemType === item.itemType
            );

            if (existingItemIndex > -1) {
                // Update quantity if item exists
                cart.items[existingItemIndex].quantity += item.quantity || 1;
            } else {
                // Add new item
                cart.items.push(item);
            }

            await cart.save();
        }

        Logger.info(`Item added to cart for user ${userId}`);

        res.json({
            success: true,
            data: cart
        });
    } catch (error: any) {
        Logger.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item to cart',
            error: error.message
        });
    }
};

// Update cart item quantity
export const updateCartItem = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;
        const { itemId, itemType, quantity } = req.body;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const itemIndex = cart.items.findIndex(
            (i: any) => i.itemId === itemId && i.itemType === itemType
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();

        res.json({
            success: true,
            data: cart
        });
    } catch (error: any) {
        Logger.error('Error updating cart item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart item',
            error: error.message
        });
    }
};

// Remove item from cart
export const removeFromCart = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;
        const { itemId, itemType } = req.params;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = cart.items.filter(
            (i: any) => !(i.itemId === itemId && i.itemType === itemType)
        );

        await cart.save();

        Logger.info(`Item removed from cart for user ${userId}`);

        res.json({
            success: true,
            data: cart
        });
    } catch (error: any) {
        Logger.error('Error removing from cart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove item from cart',
            error: error.message
        });
    }
};

// Clear entire cart
export const clearCart = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = [];
        await cart.save();

        Logger.info(`Cart cleared for user ${userId}`);

        res.json({
            success: true,
            data: cart
        });
    } catch (error: any) {
        Logger.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart',
            error: error.message
        });
    }
};

// Migrate cart from localStorage
export const migrateCart = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!._id;
        const { items } = req.body;

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cart data'
            });
        }

        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = await Cart.create({ userId, items });
        } else {
            // Merge with existing cart
            items.forEach((newItem: any) => {
                const existingItemIndex = cart!.items.findIndex(
                    (i: any) => i.itemId === newItem.itemId && i.itemType === newItem.itemType
                );

                if (existingItemIndex > -1) {
                    cart!.items[existingItemIndex].quantity += newItem.quantity || 1;
                } else {
                    cart!.items.push(newItem);
                }
            });

            await cart.save();
        }

        Logger.info(`Cart migrated for user ${userId} with ${items.length} items`);

        res.json({
            success: true,
            data: cart,
            message: 'Cart migrated successfully'
        });
    } catch (error: any) {
        Logger.error('Error migrating cart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to migrate cart',
            error: error.message
        });
    }
};
