import express from 'express';
import {
  getBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  addComment,
  toggleLike,
  getBlogCategories,
  getBlogTags,
  getBlogStats
} from '../controllers/blog';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { body } from 'express-validator';

const router = express.Router();

// Validation rules
const blogPostValidation = [
  body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title too long'),
  body('excerpt').notEmpty().withMessage('Excerpt is required').isLength({ max: 300 }).withMessage('Excerpt too long'),
  body('content').notEmpty().withMessage('Content is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('image').optional(),
  body('tags').optional().isArray().withMessage('Tags must be an array')
];

// Validation for partial updates (e.g., toggling published status)
const blogPostUpdateValidation = [
  body('title').optional().isLength({ max: 200 }).withMessage('Title too long'),
  body('excerpt').optional().isLength({ max: 300 }).withMessage('Excerpt too long'),
  body('content').optional(),
  body('category').optional(),
  body('image').optional(),
  body('published').optional().isBoolean().withMessage('Published must be a boolean'),
  body('tags').optional().isArray().withMessage('Tags must be an array')
];

const commentValidation = [
  body('content').notEmpty().withMessage('Comment content is required').isLength({ max: 1000 }).withMessage('Comment too long')
];

// Get all blog posts
router.get('/', getBlogPosts);

// Get blog categories
router.get('/categories', getBlogCategories);

// Get blog tags
router.get('/tags', getBlogTags);

// Get blog statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, getBlogStats);

// Get blog post by ID or slug
router.get('/:id', getBlogPost);

// Create blog post (admin only)
router.post('/', authenticateToken, requireAdmin, blogPostValidation, createBlogPost);

// Update blog post (admin only) - using partial validation
router.put('/:id', authenticateToken, requireAdmin, blogPostUpdateValidation, updateBlogPost);

// Delete blog post (admin only)
router.delete('/:id', authenticateToken, requireAdmin, deleteBlogPost);

// Add comment to blog post
router.post('/:id/comments', authenticateToken, commentValidation, addComment);

// Like/unlike blog post
router.post('/:id/like', authenticateToken, toggleLike);

export default router;
