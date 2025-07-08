import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { default as authRoutes } from './authRoutes.js';

import { readFileSync } from 'fs';
const serviceAccountPath = '/etc/secrets/firebase_key.json';
let serviceAccount;

try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath));
} catch (error) {
    console.warn('Could not read secret file, trying environment variable...');
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountString) {
        console.error('FATAL ERROR: Firebase credentials not found in secret file or environment variable.');
        process.exit(1);
    }
    serviceAccount = JSON.parse(serviceAccountString);
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// --- Initialize Firebase Admin SDK ---
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
}

// --- CORS Configuration FIX ---
// This is a more permissive setting to ensure the connection works.
// It allows requests from any origin.
app.use(cors()); 
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ message: "YOH Underground Server is operational." });
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
