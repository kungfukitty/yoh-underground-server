import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import authRoutes from './authRoutes.js';

dotenv.config();

const app = express();

// --- Secure Firebase Initialization for Vercel ---
try {
  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error.message);
  if (error.message.includes('FIREBASE_SERVICE_ACCOUNT')) {
      console.error("HINT: Ensure the FIREBASE_SERVICE_ACCOUNT_JSON environment variable is set correctly in your Vercel project settings.");
  }
}

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.get('/api', (req, res) => {
    res.status(200).json({ message: "YOH Underground Server is operational." });
});

app.use('/api/auth', authRoutes);

// --- Vercel Export ---
export default app;
