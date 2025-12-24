import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadAvatar, changePassword, deleteAvatar } from '../controllers/userProfile';
import { upload } from '../controllers/upload';

const router = Router();

// Avatar routes
router.post('/avatar', authenticateToken, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', authenticateToken, deleteAvatar);

// Password routes
router.post('/change-password', authenticateToken, changePassword);

export default router;
