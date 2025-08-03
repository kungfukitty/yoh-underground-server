import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './config/firebaseAdminInit.js'; // your Firebase init

dotenv.config();

const app = express();

// — CORS — allow your FreeHostia origin(s)
const ALLOWED_ORIGINS = [
  'https://www.yohunderground.fun',
  'http://www.yohunderground.fun',
  'https://yohunderground.fun',
  'http://yohunderground.fun'
];

app.use(cors({
  origin: (origin, callback) => {
    // allow tools like curl or Postman (no origin)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health‐check
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
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

// 404 for everything else under /api
app.use('/api/*', (req, res) => res.status(404).json({ message: 'API route not found' }));

// **DO NOT** call app.listen(); instead export your app for Vercel
export default app;
