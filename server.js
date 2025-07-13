// File: server.js - UPDATED (Add Event Routes)

console.log("SERVER START: Entering server.js execution.");
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { auth, db, bucket, adminApp } from './config/firebaseAdminInit.js'; // Ensure 'adminApp' is imported


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// --- Server Startup Debugging & JWT Secret Check ---
console.log("DEBUG: Server starting...");

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    console.error("FATAL: JWT_SECRET is NOT set!");
    process.exit(1);
} else {
    console.log("DEBUG: JWT_SECRET is set (length:", jwtSecret.length, ")");
}
// --- END Server Startup Debugging & JWT Secret Check ---


app.use(cors());
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

// Member-specific Routes
import memberRoutes from './routes/memberRoutes.js';
app.use('/api/member', memberRoutes);

// NEW: Event Routes
import eventRoutes from './routes/eventRoutes.js'; // Import the new event routes
app.use('/api/events', eventRoutes); // Mount event routes under /api/events


// For local development
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// For Vercel deployment, export the app instance
export default app;
