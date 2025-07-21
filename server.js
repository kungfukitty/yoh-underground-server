// File: server.js - COMPLETE AND UP-TO-DATE (Production Version with CORS fix)

console.log("SERVER START: Entering server.js execution.");
import villaRoutes from './routes/villaRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// --- CORS Configuration FIX ---
// Replace 'http://www.yohunderground.fun' with your actual frontend domain
const corsOptions = {
    origin: 'http://www.yohunderground.fun', // Explicitly allow your frontend domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow common HTTP methods
    credentials: true, // Allow cookies to be sent with requests (if any are used)
    optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 200
};
app.use(cors(corsOptions)); // Apply CORS with specific options
// --- END CORS Configuration FIX ---

app.use(express.json()); // This should come after CORS if you have preflight issues with JSON content-type


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

// Admin Routes (Itineraries, Chats, Networks)
import adminRoutes from './routes/adminRoutes.js';
app.use('/api/admin', adminRoutes);


// For local development
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// For Vercel deployment, export the app instance
export default app;
