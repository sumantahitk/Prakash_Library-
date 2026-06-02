import express from 'express';
import dns from 'dns';

// Fix for Node 18+ hanging on IPv6 connections (Cloudinary timeout fix)
dns.setDefaultResultOrder('ipv4first');
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes.js';
import studentsRoutes from './routes/studentsRoutes.js';
import paymentsRoutes from './routes/paymentsRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationsRoutes from './routes/notificationsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { initCronJobs } from './cron/scheduler.js';

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files (profile photos)
app.use('/uploads', express.static('uploads'));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // Increased to 1000 to prevent false positives during normal app usage
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests from this IP, please try again after 5 minutes" }
});
app.use('/api', limiter);

// Basic Route
app.get('/', (req, res) => {
  res.send('Prakash Library API is running...');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("EXPRESS ERROR:", err);
  res.status(500).json({ message: err.message, stack: err.stack });
});

// Initialize Cron Jobs
initCronJobs();

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
