import express from 'express';
import { sendNotification } from '../controllers/notificationsController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', protect, adminOnly, sendNotification);

export default router;
