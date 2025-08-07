// server.js
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
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
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

// --- Start Server for Render
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
