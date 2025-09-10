import express from 'express';
import {
  addToCart,
  getCartSummary,
  processCheckout,
  validateCartItems
} from '../controllers/cart';
import { authenticateToken } from '../middleware/auth';
import { body } from 'express-validator';

const router = express.Router();

// Validation rules
const addToCartValidation = [
  body('type').isIn(['campsite', 'activity', 'equipment']).withMessage('Invalid item type'),
  body('itemId').notEmpty().withMessage('Item ID is required')
];

const checkoutValidation = [
  body('items').isArray({ min: 1 }).withMessage('Cart items are required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required')
];

// Add item to cart
router.post('/add', authenticateToken, addToCartValidation, addToCart);

// Get cart summary
router.post('/summary', authenticateToken, getCartSummary);

// Validate cart items
router.post('/validate', authenticateToken, validateCartItems);

// Process checkout
router.post('/checkout', authenticateToken, checkoutValidation, processCheckout);

export default router;
