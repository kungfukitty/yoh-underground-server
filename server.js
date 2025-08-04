// server.js
import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';

// Initialize Firebase Admin & Firestore
import './config/firebaseAdminInit.js';

dotenv.config();
const app = express();

// ─── CORS ──────────────────────────────────────────────────────────────────────
// Temporarily wide open; once we verify connectivity we’ll lock this down to your FreeHostia origin.
app.use(cors({
  origin: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
app.options('*', cors());

// ─── BODY PARSERS ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ─── ROUTES ────────────────────────────────────────────────────────────────────
import authRoutes      from './routes/authRoutes.js';
import userRoutes      from './routes/userRoutes.js';
import chatRoutes      from './routes/chatRoutes.js';
import eventRoutes     from './routes/eventRoutes.js';
import itineraryRoutes from './routes/itineraryRoutes.js';
import memberRoutes    from './routes/memberRoutes.js';
import networkRoutes   from './routes/networkRoutes.js';
import referralRoutes  from './routes/referralRoutes.js';
import resourceRoutes  from './routes/resourceRoutes.js';
import securityRoutes  from './routes/securityRoutes.js';
import villaRoutes     from './routes/villaRoutes.js';

app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/chat',        chatRoutes);
app.use('/api/events',      eventRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/members',     memberRoutes);
app.use('/api/network',     networkRoutes);
app.use('/api/referrals',   referralRoutes);
app.use('/api/resources',   resourceRoutes);
app.use('/api/security',    securityRoutes);
app.use('/api/villas',      villaRoutes);

// 404 handler for anything else under /api
app.use('/api/*', (req, res) =>
  res.status(404).json({ message: 'API route not found' })
);

// ─── EXPORT FOR VERCEL ─────────────────────────────────────────────────────────
export default app;
