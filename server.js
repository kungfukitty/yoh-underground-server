import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
// **FIX**: Changed the import syntax for authRoutes to be more explicit.
import { default as authRoutes } from './authRoutes.js';

dotenv.config();

// --- Read the service account from the environment variable ---
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!serviceAccountString) {
    console.error('FATAL ERROR: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
    process.exit(1); // Exit if the key is not found
}
const serviceAccount = JSON.parse(serviceAccountString);

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
