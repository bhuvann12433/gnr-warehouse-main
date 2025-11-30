// backend/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import equipmentRoutes from './routes/equipment.js';
import statsRoutes from './routes/stats.js';
import invoiceRoutes from './routes/invoices.js';   // ⭐ ADDED

dotenv.config();

const app = express();

// ==========================
// ⭐ FINAL CORS CONFIG
// ==========================
const allowedOrigins = [
  'https://gnr-warehouse-main.vercel.app',
  'https://*.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed.includes('*')) {
          const pattern = new RegExp('^' + allowed.replace('*', '.*') + '$');
          return pattern.test(origin);
        }
        return allowed === origin;
      });

      if (isAllowed) return callback(null, true);
      return callback(new Error(`CORS blocked: Origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
  })
);

app.options('*', cors());

// ==========================
//  MIDDLEWARES
// ==========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
//  ROUTES
// ==========================
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/invoice', invoiceRoutes);   // ⭐ ADDED — FIXES YOUR ISSUE

// ==========================
//  ROOT ROUTE
// ==========================
app.get('/', (req, res) => {
  res.send('🚀 Backend is running — GNR Surgicals API');
});

// ==========================
//  HEALTH CHECK
// ==========================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    env: process.env.NODE_ENV || 'development',
  });
});

// ==========================
//  FRIENDLY CORS ERROR HANDLER
// ==========================
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS blocked',
      message: err.message,
    });
  }
  next(err);
});

export default app;
