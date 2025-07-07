import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
// Corrected: The import path for authRoutes no longer includes the non-existent 'routes' folder.
import authRoutes from './authRoutes.js';

// --- Corrected method for loading JSON in ES Modules ---
import { readFileSync } from 'fs';
const serviceAccount = JSON.parse(readFileSync('./yoh-underground-firebase-adminsdk-fbsvc-5f9002319c.json'));

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS Configuration ---
const allowedOrigins = [
    'http://localhost:56612',
    'http://yohunderground.fun',
    'https://yohunderground.fun'
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
