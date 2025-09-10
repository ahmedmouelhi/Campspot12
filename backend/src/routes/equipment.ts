import express from 'express';
import {
  getEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  addEquipmentReview,
  getEquipmentCategories,
  checkEquipmentAvailability,
  getEquipmentStats
} from '../controllers/equipment';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { body } from 'express-validator';

const router = express.Router();

// Validation rules
const equipmentValidation = [
  body('name').notEmpty().withMessage('Equipment name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('period').isIn(['hour', 'day', 'week']).withMessage('Invalid period'),
  body('description').notEmpty().withMessage('Description is required'),
  body('condition').isIn(['Excellent', 'Good', 'Fair']).withMessage('Invalid condition'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
];

const reviewValidation = [
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').notEmpty().withMessage('Comment is required')
];

// Get all equipment
router.get('/', getEquipment);

// Get equipment categories
router.get('/categories', getEquipmentCategories);

// Get equipment statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, getEquipmentStats);

// Get equipment by ID
router.get('/:id', getEquipmentById);

// Check equipment availability
router.get('/:id/availability', checkEquipmentAvailability);

// Create equipment (admin only)
router.post('/', authenticateToken, requireAdmin, equipmentValidation, createEquipment);

// Update equipment (admin only)
router.put('/:id', authenticateToken, requireAdmin, equipmentValidation, updateEquipment);

// Delete equipment (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteEquipment);

// Add review to equipment (authenticated users)
router.post('/:id/reviews', authenticateToken, reviewValidation, addEquipmentReview);

export default router;
