// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Initialize env
dotenv.config();

// Firebase Admin (via your existing init file)
import './config/firebaseAdminInit.js';

const app = express();

// — very permissive CORS (for now) —
app.use(cors({ origin: true, credentials: true }));
app.options('*', cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health-check endpoint
app.get('/api/ping', (req, res) => {
  return res.json({ ok: true, time: new Date().toISOString() });
});

// Mount your existing routers
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

// All under /api
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/chat',       chatRoutes);
app.use('/api/events',     eventRoutes);
app.use('/api/itineraries',itineraryRoutes);
app.use('/api/members',    memberRoutes);
app.use('/api/network',    networkRoutes);
app.use('/api/referrals',  referralRoutes);
app.use('/api/resources',  resourceRoutes);
app.use('/api/security',   securityRoutes);
app.use('/api/villas',     villaRoutes);

// Fallback 404 for anything else
app.use((req, res) => res.status(404).json({ message: 'Not Found' }));

// Start listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
