
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import authRoutes from './routes/authRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

try {
  const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!encodedServiceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set or is empty.");
  }

  const serviceAccount = JSON.parse(Buffer.from(encodedServiceAccount, 'base64').toString('utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.error("Error initializing Firebase Admin SDK:", error.message);
  console.log("Please ensure you have a valid FIREBASE_SERVICE_ACCOUNT (Base64 encoded) environment variable in Render.");
}

app.use(cors());
app.use(express.json());

// Main welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    message: "YOH Underground Server is operational.",
    status: "OK",
    timestamp: new Date().toISOString()
  });
});

// Mount authentication routes under the '/api/auth' path
app.use('/api/auth', authRoutes);

// For local development
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// For Vercel deployment, export the app instance
export default app;
