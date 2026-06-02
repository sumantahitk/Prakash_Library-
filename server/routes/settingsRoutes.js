import express from 'express';
import { getSettings, updateSettings, updatePin, updateAdminPhoto } from '../controllers/settingsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, adminOnly, getSettings)
  .put(protect, adminOnly, updateSettings);

router.put('/pin', protect, adminOnly, updatePin);
router.post('/admin-photo', protect, adminOnly, upload.single('profilePhoto'), updateAdminPhoto);

export default router;
