// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// FIX: Added 'helmet' for security headers, which is a production best practice.
import helmet from 'helmet';


// Initialize Firebase Admin & Firestore
import './config/firebaseAdminInit.js';

dotenv.config();
const app = express();

// ─── MIDDLEWARE ────────────────────────────────────────────────────────────────
// FIX: Added helmet to set secure HTTP headers.
app.use(helmet()); 
// FIX: In production, you should restrict CORS to your frontend's domain.
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// ─── ROUTES ────────────────────────────────────────────────────────────────────
// FIX: Added a /api prefix to all routes for better organization.
// Your Render rewrite/redirect rules should point to /api.
const apiRouter = express.Router();
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

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/events', eventRoutes);
apiRouter.use('/itineraries', itineraryRoutes);
apiRouter.use('/members', memberRoutes);
apiRouter.use('/network', networkRoutes);
apiRouter.use('/referrals', referralRoutes);
apiRouter.use('/resources', resourceRoutes);
apiRouter.use('/security', securityRoutes);
apiRouter.use('/villas', villaRoutes);

app.use('/api', apiRouter);


// 404 handler for anything else.
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
});

// Generic error handler.
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'An internal server error occurred.' });
});

// ─── START SERVER FOR RENDER ───────────────────────────────────────────────────
// FIX: This section replaces 'export default app' for compatibility with Render.
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
