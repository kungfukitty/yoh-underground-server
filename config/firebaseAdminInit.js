import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

const {
  FB_PROJECT_ID,
  FB_CLIENT_EMAIL,
  FB_PRIVATE_KEY,
  FB_DATABASE_URL,
} = process.env;

if (!FB_PROJECT_ID || !FB_CLIENT_EMAIL || !FB_PRIVATE_KEY) {
  console.error('❌ Missing Firebase env-vars');
  throw new Error('Firebase environment variables not set.');
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId:   FB_PROJECT_ID,
    clientEmail: FB_CLIENT_EMAIL,
    privateKey:  FB_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL: FB_DATABASE_URL,
});

export const db = admin.firestore();
