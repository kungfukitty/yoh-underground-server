// config/firebaseAdminInit.js
import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

// Pull in the same env-vars you already have in Vercel:
const {
  FB_PROJECT_ID,
  FB_CLIENT_EMAIL,
  FB_PRIVATE_KEY,
  FB_DATABASE_URL
} = process.env;

if (!FB_PROJECT_ID || !FB_CLIENT_EMAIL || !FB_PRIVATE_KEY) {
  console.error(
    'FATAL ERROR: Missing one of FB_PROJECT_ID, FB_CLIENT_EMAIL, or FB_PRIVATE_KEY.'
  );
  throw new Error('Firebase environment variables not set.');
}

const serviceAccount = {
  projectId: FB_PROJECT_ID,
  clientEmail: FB_CLIENT_EMAIL,
  privateKey: FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: FB_DATABASE_URL,
});

const db = admin.firestore();
const adminApp = admin;

export { db, adminApp };
