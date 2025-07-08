import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import authRoutes from './authRoutes.js';

// --- Corrected method for loading JSON in ES Modules ---
import { readFileSync } from 'fs';
const serviceAccount = JSON.parse(readFileSync('./yoh-underground-firebase-adminsdk-fbsvc-5f9002319c.json'));

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
// Define which origins are allowed to connect to this server.
const allowedOrigins = [
    'http://localhost:56612',      // Your local development frontend
    'http://yohunderground.fun',   // Deployed frontend
    'https://yohunderground.fun',
    'http://www.yohunderground.fun',  // **FIX**: Added the 'www' subdomain
    'https://www.yohunderground.fun'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
};

// Initialize Firebase Admin SDK
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error.message);
}

// Use the CORS options middleware
app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ message: "YOH Underground Server is operational." });
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
