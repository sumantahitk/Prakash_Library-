import express from 'express';
import { loginUser, registerUser, changePassword } from '../controllers/authController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again after 15 minutes." }
});

const router = express.Router();

router.post('/login', loginLimiter, loginUser);
router.post('/register', protect, adminOnly, registerUser);
router.put('/change-password', protect, changePassword);

export default router;
