import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- CORS Configuration ---
// Define the specific origins that are allowed to make requests to this server.
const allowedOrigins = [
  'https://www.yohunderground.fun',
  'http://www.yohunderground.fun', // Added to explicitly allow non-secure traffic
  // It's a good practice to include your development origin here as well.
  // 'http://localhost:5173',
];

const corsOptions = {
  // Pass the array of allowed origins to the middleware.
  // The 'cors' package will handle the logic for matching the request origin.
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Use CORS middleware with the defined options
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

// Define the API base path and apply routes
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


// Simple health check route
app.get('/', (req, res) => {
    res.status(200).send('YOH Underground Server is operational.');
});

// --- Start the server ---
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

