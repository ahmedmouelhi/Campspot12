import express from 'express';
import {
  upload,
  uploadSingleImage,
  uploadMultipleImages,
  deleteUploadedFile,
  getFileInfo,
  listUploadedFiles
} from '../controllers/upload';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Serve uploaded files statically
router.use('/files', express.static('uploads'));

// Upload single image
router.post('/single', authenticateToken, upload.single('image'), uploadSingleImage);

// Upload multiple images
router.post('/multiple', authenticateToken, upload.array('images', 10), uploadMultipleImages);

// Get file info
router.get('/info/:filename', authenticateToken, getFileInfo);

// List all uploaded files (admin only)
router.get('/list', authenticateToken, requireAdmin, listUploadedFiles);

// Delete uploaded file (admin only)
router.delete('/:filename', authenticateToken, requireAdmin, deleteUploadedFile);

export default router;
