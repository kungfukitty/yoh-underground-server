import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
// This import requires the JSON key file to be in the `api` directory as well.
// For better security, consider using Vercel Environment Variables for this.
import serviceAccount from './yoh-underground-firebase-adminsdk-fbsvc-5f9002319c.json' assert { type: 'json' };

// UPDATE: Corrected the import path. The .js extension is required with ES modules.
import authRoutes from './authRoutes.js';

dotenv.config();

const app = express();

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  try {
      admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
      console.error("Error initializing Firebase Admin SDK:", error.message);
  }
}

app.use(cors());
app.use(express.json());

// This is a test route to ensure the server is responding.
app.get('/api', (req, res) => {
    res.status(200).json({ message: "YOH Underground Server is operational." });
});

// Use your authentication routes, correctly prefixed
app.use('/api/auth', authRoutes);

// UPDATE: Removed app.listen(). Vercel handles this automatically.
// UPDATE: Added the required export for Vercel.
export default app;
