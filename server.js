// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// This import runs your Firebase init code above:
import './config/firebaseAdminInit.js';

dotenv.config();

const app = express();

//—CORS (allow only your real front-end origins)—
const allowedOrigins = [
  'https://www.yohunderground.fun',
  'http://www.yohunderground.fun',
  'https://yohunderground.fun',
  'http://yohunderground.fun'
  // add more if you have staging URLs here
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS']
}));
app.options('*', cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount your routes
import authRoutes      from './routes/authRoutes.js';
import userRoutes      from './routes/userRoutes.js';
import chatRoutes      from './routes/chatRoutes.js';
import eventRoutes     from './routes/eventRoutes.js';
import itineraryRoutes from './routes/itineraryRoutes.js';
import memberRoutes    from './routes/memberRoutes.js';
import villaRoutes     from './routes/villaRoutes.js';
import securityRoutes  from './routes/securityRoutes.js';

app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/chat',       chatRoutes);
app.use('/api/events',     eventRoutes);
app.use('/api/itineraries',itineraryRoutes);
app.use('/api/members',    memberRoutes);
app.use('/api/villas',     villaRoutes);
app.use('/api/security',   securityRoutes);

// Health check (verify it’s live)
app.get('/api/ping', (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 API server listening on port ${PORT}`)
);
