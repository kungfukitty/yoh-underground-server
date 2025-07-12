console.log("SERVER START: Entering server.js execution.");
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import admin from 'firebase-admin'; // Ensure firebase-admin is installed: npm install firebase-admin

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// --- Firebase Admin SDK Initialization ---
console.log("DEBUG: Server starting...");

const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON; // Expecting raw JSON string
const jwtSecret = process.env.JWT_SECRET; // Still need JWT_SECRET if used elsewhere

if (!serviceAccountJsonString) {
    console.error("FATAL: FIREBASE_SERVICE_ACCOUNT_JSON is NOT set!");
    process.exit(1); // Exit early if critical env is missing
} else {
    console.log("DEBUG: FIREBASE_SERVICE_ACCOUNT_JSON is set (length:", serviceAccountJsonString.length, ")");
    try {
        const serviceAccount = JSON.parse(serviceAccountJsonString); // Parse the raw JSON string
        console.log("DEBUG: Service Account JSON parsed successfully. Project ID:", serviceAccount.project_id);

        // Initialize Firebase Admin SDK
        if (!admin.apps.length) {
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            console.log("Firebase Admin SDK initialized successfully.");
        } else {
            console.log("Firebase Admin SDK already initialized.");
        }

    } catch (parseError) {
        console.error("FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT_JSON! Make sure it is a valid JSON string.", parseError.message);
        process.exit(1); // Exit if parsing fails
    }
}

if (!jwtSecret) {
    console.error("FATAL: JWT_SECRET is NOT set!");
    process.exit(1); // Exit early if critical env is missing
} else {
    console.log("DEBUG: JWT_SECRET is set (length:", jwtSecret.length, ")");
}
// --- END Firebase Admin SDK Initialization ---


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({
        message: "YOH Underground Server is operational.",
        status: "OK",
        timestamp: new Date().toISOString(),
        envCheck: "See logs for Firebase initialization status."
    });
});

// Authentication Routes - Adjusted to correctly match /api/auth path
import authRoutes from './routes/authRoutes.js'; // Ensure this path is correct: ./routes/authRoutes.js
app.use('/api/auth', authRoutes); // <-- THIS LINE IS FIXED to include '/api' prefix


// For local development
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// For Vercel deployment, export the app instance
export default app;
