import express from 'express';
import dns from 'dns';
import { fileURLToPath } from 'url';
import path from 'path';

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

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
// In production the frontend is served from the same origin, so CORS is only needed for local dev
app.use(cors({
  origin: isProduction ? false : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
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

// Basic health-check route (only shown when not serving React)
if (!isProduction) {
  app.get('/', (req, res) => {
    res.send('Prakash Library API is running (dev mode)...');
  });
}

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

// ─── Serve React Frontend in Production ───────────────────────────────────────
if (isProduction) {
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  // Catch-all: send React's index.html for any non-API route (React Router support)
  // Note: app.use() instead of app.get('*') because Express 5 dropped bare wildcard support
  app.use((req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Initialize Cron Jobs
initCronJobs();

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
