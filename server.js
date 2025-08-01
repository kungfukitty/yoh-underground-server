import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import { adminApp } from './config/firebaseAdminInit.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing
app.use(express.json());

// CORS setup
const allowed = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowed.includes(origin)) return cb(null, true);
    cb(new Error(`CORS Blocked: ${origin}`));
  },
  credentials: true,
}));
app.options('*', cors());

// Mount auth routes
app.use('/api/auth', authRouter);

// Fallback
app.use('*', (req, res) => res.status(404).json({
  message: 'Route not found',
}));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
