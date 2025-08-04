// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Initialize Firebase Admin & Firestore
import './config/firebaseAdminInit.js';

dotenv.config();
const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    'http://www.yohunderground.fun',
    'https://yoh-underground.vercel.app',
    'http://localhost:3000'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Apply CORS middleware to all routes
app.use(cors(corsOptions));

// Explicitly handle preflight requests for all routes
app.options('*', cors(corsOptions));


// ─── BODY PARSERS ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ─── ROUTES ────────────────────────────────────────────────────────────────────
// Vercel's vercel.json handles the /api prefix. We remove it from the routes here.
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import itineraryRoutes from './routes/itineraryRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import villaRoutes from './routes/villaRoutes.js';

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/chat', chatRoutes);
app.use('/events', eventRoutes);
app.use('/itineraries', itineraryRoutes);
app.use('/members', memberRoutes);
app.use('/network', networkRoutes);
app.use('/referrals', referralRoutes);
app.use('/resources', resourceRoutes);
app.use('/security', securityRoutes);
app.use('/villas', villaRoutes);

// 404 handler for anything else. This should be the last middleware.
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// ─── EXPORT FOR VERCEL ─────────────────────────────────────────────────────────
export default app;
