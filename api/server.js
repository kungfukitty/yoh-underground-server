import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import authRoutes from './authRoutes.js';

dotenv.config();

const app = express();

// --- Secure Firebase Initialization for Vercel ---
// This code reads the service account details from an environment variable.
try {
  // Check if the app is already initialized to prevent errors during hot-reloads
  if (!admin.apps.length) {
    // Parse the service account JSON from the environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error.message);
  // You can add more detailed logging here if needed
  if (error.message.includes('FIREBASE_SERVICE_ACCOUNT')) {
      console.error("HINT: Ensure the FIREBASE_SERVICE_ACCOUNT environment variable is set correctly in your Vercel project settings.");
  }
}

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
// A test route to confirm the server is running
app.get('/api', (req, res) => {
    res.status(200).json({ message: "YOH Underground Server is operational." });
});

// Your authentication routes are prefixed with /api/auth
app.use('/api/auth', authRoutes);

// --- Vercel Export ---
// This line is crucial. It exports the Express app for Vercel to use as a serverless function.
// The app.listen() method has been removed as Vercel handles this automatically.
export default app;
