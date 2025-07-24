import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import Firebase Admin SDK initialization
import { db, adminApp } from './config/firebaseAdminInit.js';

// --- Import All Your Routes ---
import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import villaRoutes from './routes/villaRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import securityRoutes from './routes/securityRoutes.js';

// Admin-Specific Routes
import adminUserRoutes from './routes/userRoutes.js';
import adminItineraryRoutes from './routes/itineraryRoutes.js';
import adminChatRoutes from './routes/chatRoutes.js';
import adminNetworkRoutes from './routes/networkRoutes.js';
import adminResourceRoutes from './routes/resourceRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
const allowedOrigins = [
  'http://www.yohunderground.fun',
  'https://www.yohunderground.fun'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      callback(new Error(msg), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// --- API Routes ---
app.get('/api', (req, res) => {
  res.status(200).json({
    message: "YOH Underground Server is operational.",
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

// Mount all application routes with the /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/villas', villaRoutes);
app.use('/api/referrals', referralRoutes);

// Mount all admin routes with the /api prefix
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/itineraries', adminItineraryRoutes);
app.use('/api/admin/chats', adminChatRoutes);
app.use('/api/admin/networks', adminNetworkRoutes);
app.use('/api/admin/resources', adminResourceRoutes);
app.use('/api/admin/security', securityRoutes);

// --- Error Handling ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

// --- Server Initialization for Local Development ---
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// --- Export for Vercel ---
export default app;
