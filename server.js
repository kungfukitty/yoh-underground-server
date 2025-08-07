// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Initialize Firebase Admin & Firestore
import './config/firebaseAdminInit.js';

dotenv.config();
const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────────
// FIX: In production, you should restrict this to your frontend's domain.
// For example: app.use(cors({ origin: 'https://your-frontend-app.com' }));
app.use(cors());

// ─── BODY PARSERS ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ─── ROUTES ────────────────────────────────────────────────────────────────────
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

// FIX: Added a generic error handler for any unhandled errors in the routes.
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'An internal server error occurred.' });
});


// ─── EXPORT FOR VERCEL ─────────────────────────────────────────────────────────
export default app;
