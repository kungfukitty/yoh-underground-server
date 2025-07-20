// File: server.js - Final Review: OK

console.log("SERVER START: Entering server.js execution.");
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Import all necessary components from firebaseAdminInit.js
import { auth, db, bucket, adminApp } from './config/firebaseAdminInit.js'; 


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

console.log("DEBUG: Server starting...");

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    console.error("FATAL: JWT_SECRET is NOT set!");
    process.exit(1);
} else {
    console.log("DEBUG: JWT_SECRET is set (length:", jwtSecret.length, ")");
}

// CORS Configuration
const corsOptions = {
    origin: 'http://www.yohunderground.fun', // Explicitly allow your frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow common HTTP methods
    credentials: true, // Allow cookies to be sent with requests (if any are used)
    optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 200
};
app.use(cors(corsOptions));

app.use(express.json());


app.get('/', (req, res) => {
    res.status(200).json({
        message: "YOH Underground Server is operational.",
        status: "OK",
        timestamp: new Date().toISOString(),
        envCheck: "See logs for Firebase initialization status (from firebaseAdminInit.js)."
    });
});

// Authentication Routes
import authRoutes from './routes/authRoutes.js';
app.use('/api/auth', authRoutes);

// Member-specific Routes (NDA Management, Profile, Connection Preferences)
import memberRoutes from './routes/memberRoutes.js';
app.use('/api/member', memberRoutes);

// Event Routes (Curated Event Calendar)
import eventRoutes from './routes/eventRoutes.js';
app.use('/api/events', eventRoutes);

// Admin Routes (Itineraries, Chats, Networks, etc.)
import adminRoutes from './routes/adminRoutes.js';
app.use('/api/admin', adminRoutes);


// For local development
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// For Vercel deployment, export the app instance
export default app;
