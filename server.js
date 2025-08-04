// server.js
import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';
import './config/firebaseAdminInit.js'; // initializes admin & db

dotenv.config();

const app = express();

// CORS: temporarily open to all origins for testing
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health-check
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ────────────────────────────────────────────────────────────────────────────────
// Mount routes (now that userController.js and checkNdaAccepted exist)

// auth login/register
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

// 404 for anything else under /api
app.use('/api/*', (req, res) => res.status(404).json({ message: 'API route not found' }));

// ────────────────────────────────────────────────────────────────────────────────
// **For Vercel**, export the app instead of calling listen()
export default app;
