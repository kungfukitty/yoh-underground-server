import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

// Load .env into process.env
dotenv.config();

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   process.env.FB_PROJECT_ID,
    clientEmail: process.env.FB_CLIENT_EMAIL,
    // PRIVATE_KEY must have literal '\n' for line breaks
    privateKey:  process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL: process.env.FB_DATABASE_URL,
});

const app = express();

// CORS setup
const allowedOrigins = (process.env.ALLOWED_ORIGINS ||
  'https://www.yohunderground.fun,https://your-freehostia-domain.freehostia.com'
)
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS origin not allowed: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
}));
app.options('*', cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import your route modules
import authRoutes      from './routes/authRoutes.js';
import userRoutes      from './routes/userRoutes.js';
import chatRoutes      from './routes/chatRoutes.js';
import eventRoutes     from './routes/eventRoutes.js';
import itineraryRoutes from './routes/itineraryRoutes.js';
import memberRoutes    from './routes/memberRoutes.js';
import villaRoutes     from './routes/villaRoutes.js';
import securityRoutes  from './routes/securityRoutes.js';

// Mount routes under /api
app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/chat',       chatRoutes);
app.use('/api/events',     eventRoutes);
app.use('/api/itineraries',itineraryRoutes);
app.use('/api/members',    memberRoutes);
app.use('/api/villas',     villaRoutes);
app.use('/api/security',   securityRoutes);

// Healthcheck endpoint
app.get('/api/ping', (req, res) =>
  res.json({ ok: true, message: 'pong' })
);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 API server listening on port ${PORT}`)
);
