import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import authRoutes from './authRoutes.js';

// --- Final Fix: Read the service account from the secret file path ---
import { readFileSync } from 'fs';
const serviceAccountPath = '/etc/secrets/firebase_key.json';
let serviceAccount;

try {
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath));
} catch (error) {
    console.error('FATAL ERROR: Could not read or parse the Firebase service account file.', error);
    process.exit(1); // Exit if the key cannot be read
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
