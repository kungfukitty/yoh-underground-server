// File: yoh-underground-server/server.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';

// Initialize Firebase Admin & Firestore
import './config/firebaseAdminInit.js';

dotenv.config();
const app = express();

// --- Middleware
app.use(helmet());

// --- CORRECT CORS CONFIGURATION FOR RENDER ---
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
// Example for Render:
// In Render dashboard, set CORS_ORIGINS to something like:
// https://yohunderground.fun,https://www.yohunderground.fun,http://localhost:5173


const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    // and requests from our allowed origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('This origin is not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// This is crucial for handling the browser's "preflight" requests
app.options('*', cors(corsOptions));
// --- END CORS CONFIGURATION ---


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health Check
app.get('/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// --- Routes
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

// --- Error Handlers
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'An internal server error occurred.' });
});

// --- Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
