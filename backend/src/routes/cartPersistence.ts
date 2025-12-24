import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    migrateCart
} from '../controllers/cartPersistence';

const router = express.Router();

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
router.get('/', authenticateToken, getCart);

/**
 * @swagger
 * /api/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Item added to cart
 */
router.post('/', authenticateToken, addToCart);

/**
 * @swagger
 * /api/cart/item:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart item updated
 */
router.put('/item', authenticateToken, updateCartItem);

/**
 * @swagger
 * /api/cart/item/{itemId}/{itemType}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *       - in: path
 *         name: itemType
 *         required: true
 *     responses:
 *       200:
 *         description: Item removed from cart
 */
router.delete('/item/:itemId/:itemType', authenticateToken, removeFromCart);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/clear', authenticateToken, clearCart);

/**
 * @swagger
 * /api/cart/migrate:
 *   post:
 *     summary: Migrate cart from localStorage
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *     responses:
 *       200:
 *         description: Cart migrated successfully
 */
router.post('/migrate', authenticateToken, migrateCart);

export default router;
