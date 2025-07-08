import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
// Use the explicit import syntax for robustness
import { default as authRoutes } from './authRoutes.js';

// --- Read the service account credentials ---
import { readFileSync } from 'fs';
const serviceAccountPath = '/etc/secrets/firebase_key.json';
let serviceAccount;

try {
    // First, try to read from the secret file (recommended for Render)
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath));
} catch (error) {
    // If the secret file fails, fall back to the environment variable
    console.warn('Could not read secret file, trying environment variable...');
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
        console.error('FATAL ERROR: Firebase credentials not found in secret file or environment variable.');
        process.exit(1); // Exit if no credentials can be found
    }
    serviceAccount = JSON.parse(serviceAccountString);
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:56612',
    'http://yohunderground.fun',
    'https://yohunderground.fun',
    'http://www.yohunderground.fun',
    'https://www.yohunderground.fun'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};

// Initialize Firebase Admin SDK
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
}

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ message: "YOH Underground Server is operational." });
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
