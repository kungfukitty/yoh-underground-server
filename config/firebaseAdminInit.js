// config/firebaseAdminInit.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const {
  FB_PROJECT_ID,
  FB_CLIENT_EMAIL,
  FB_PRIVATE_KEY,
  FB_DATABASE_URL
} = process.env;

if (!FB_PROJECT_ID || !FB_CLIENT_EMAIL || !FB_PRIVATE_KEY) {
  console.error('FATAL ERROR: Missing one of FB_PROJECT_ID, FB_CLIENT_EMAIL, or FB_PRIVATE_KEY.');
  throw new Error('Firebase environment variables not set.');
}

// Construct the service account object
const serviceAccount = {
  projectId:   FB_PROJECT_ID,
  clientEmail: FB_CLIENT_EMAIL,
  // Replace literal “\n” strings with real newlines
  privateKey:  FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Initialize Admin SDK and capture the app instance
const adminApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: FB_DATABASE_URL,
});

// Get Firestore from that app
const db = adminApp.firestore();

// Export both for your routes
export { db, adminApp };
