import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- CORS Configuration ---
const allowedOrigins = [
  'https://www.yohunderground.fun',
  'http://www.yohunderground.fun',
  // Include localhost if testing locally:
  // 'http://localhost:5173',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Use CORS middleware
app.use(cors(corsOptions));

// --- Body Parser Middleware ---
app.use(express.json());

// --- Import and Use Routes ---
import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import villaRoutes from './routes/villaRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import networkRoutes from './routes/networkRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import itineraryRoutes from './routes/itineraryRoutes.js';

// Apply API routes
app.use('/api/auth', authRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/villa', villaRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/chats', chatRoutes);
app.use('/api/admin/networks', networkRoutes);
app.use('/api/admin/resources', resourceRoutes);
app.use('/api/admin/itineraries', itineraryRoutes);

// Health check route
app.get('/', (req, res) => {
  res.status(200).send('YOH Underground Server is operational.');
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
