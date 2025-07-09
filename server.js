import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import authRoutes from './authRoutes.js';

dotenv.config();

// --- Final Fix: Read the entire service account JSON from a single environment variable ---
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
let serviceAccount;

if (!serviceAccountString) {
    console.error('FATAL ERROR: The FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set or is empty.');
    process.exit(1); // Exit if the variable is not found
}

try {
    serviceAccount = JSON.parse(serviceAccountString);
} catch (error) {
    console.error('FATAL ERROR: Could not parse FIREBASE_SERVICE_ACCOUNT_JSON. Make sure it is a valid JSON string without extra quotes.', error);
    process.exit(1); // Exit if parsing fails
}

// Initialize Firebase Admin SDK only if it hasn't been initialized already.
// This is a best practice for serverless environments.
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
        console.error("Error initializing Firebase Admin SDK:", error);
        process.exit(1);
    }
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ message: "YOH Underground Server is operational." });
});

app.use('/api/auth', authRoutes);

// Export the app for Vercel to use
export default app;
