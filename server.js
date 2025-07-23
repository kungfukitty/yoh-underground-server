import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import Firebase Admin SDK initialization
// This will automatically initialize Firebase and export the necessary instances
import { db, auth, bucket } from './config/firebaseAdminInit.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import villaRoutes from './routes/villaRoutes.js';
// Note: Offer, Referral, and Security routes were not fully implemented.
// If needed, they can be built out following the pattern of the other route files.

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000', // For local development
    'http://www.yohunderground.fun',
    'https://www.yohunderground.fun'
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// Handle preflight requests across all routes
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json());

// --- API Routes ---

// Main welcome route
app.get('/', (req, res) => {
    res.status(200).json({
        message: "YOH Underground Server is operational.",
        status: "OK",
        timestamp: new Date().toISOString()
    });
});

// Mount application routes
app.use('/api/auth', authRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/villas', villaRoutes);

// --- Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


// --- Server Initialization ---

// This check ensures we only start the listener when running locally
// Vercel handles the server lifecycle automatically
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running locally on http://localhost:${PORT}`);
    });
}

// Export the app instance for Vercel
export default app;
