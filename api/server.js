import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin';

// It's better to import the service account key directly from the JSON file.
// Make sure the path is correct for your project structure.
import serviceAccount from './yoh-underground-firebase-adminsdk-fbsvc-5f9002319c.json' assert { type: 'json' };

import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error.message);
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ message: "YOH Underground Server is operational." });
});

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
