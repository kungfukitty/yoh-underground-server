import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; // Keep dotenv even though Vercel handles envs
import admin from 'firebase-admin'; // Keep for structure, but won't be used

dotenv.config(); // Still good practice locally, Vercel provides envs directly
const app = express();
const PORT = process.env.PORT || 5000;

// --- TEMPORARY DEBUGGING START ---
console.log("DEBUG: Server starting...");

const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
const jwtSecret = process.env.JWT_SECRET;

if (!encodedServiceAccount) {
    console.error("FATAL: FIREBASE_SERVICE_ACCOUNT is NOT set!");
    process.exit(1); // Exit early if critical env is missing
} else {
    console.log("DEBUG: FIREBASE_SERVICE_ACCOUNT is set (length:", encodedServiceAccount.length, ")");
    try {
        // Attempt to decode and parse to confirm it's valid, but don't init Firebase yet
        const decodedAccount = Buffer.from(encodedServiceAccount, 'base64').toString('utf8');
        const parsedAccount = JSON.parse(decodedAccount);
        console.log("DEBUG: Service Account JSON parsed successfully. Project ID:", parsedAccount.project_id);
    } catch (parseError) {
        console.error("FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT JSON!", parseError.message);
        process.exit(1); // Exit if parsing fails
    }
}

if (!jwtSecret) {
    console.error("FATAL: JWT_SECRET is NOT set!");
    process.exit(1); // Exit early if critical env is missing
} else {
    console.log("DEBUG: JWT_SECRET is set (length:", jwtSecret.length, ")");
}

// Temporarily skip Firebase Admin SDK initialization to isolate env variable issue
// try {
//   admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
//   console.log("Firebase Admin SDK initialized successfully.");
// } catch (error) {
//   console.error("Error initializing Firebase Admin SDK:", error.message);
//   console.log("Please ensure you have a valid FIREBASE_SERVICE_ACCOUNT (Base64 encoded) environment variable.");
//   process.exit(1);
// }
// --- TEMPORARY DEBUGGING END ---


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    message: "YOH Underground Server is operational (DEBUGGING MODE).",
    status: "OK",
    timestamp: new Date().toISOString(),
    envCheck: "See logs for details." // Indicate env check in logs
  });
});

// Temporarily remove authRoutes to simplify startup
// import authRoutes from './routes/authRoutes.js';
// app.use('/auth', authRoutes);


// For local development
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// For Vercel deployment, export the app instance
export default app;
