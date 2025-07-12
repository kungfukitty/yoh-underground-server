// File: config/firebaseAdminInit.js
import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage'; // Import Storage API for explicit bucket operations


const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET; // New: Get storage bucket name from environment variables


let initializedAuth;
let initializedDb;
let initializedStorage; // New: Storage instance variable


// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
  if (!serviceAccountJsonString) {
    console.error("FATAL: FIREBASE_SERVICE_ACCOUNT_JSON is NOT set! Cannot initialize Firebase Admin SDK.");
    process.exit(1);
  }
  if (!storageBucketName) {
    console.error("FATAL: FIREBASE_STORAGE_BUCKET is NOT set! Cannot initialize Firebase Storage.");
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJsonString);
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL, // Optional: if you use Realtime Database
      storageBucket: storageBucketName // New: Initialize storageBucket in admin app config
    });
    console.log("Firebase Admin SDK initialized successfully.");

    initializedAuth = app.auth();
    initializedDb = app.firestore();
    // Initialize Storage using the @google-cloud/storage client library
    initializedStorage = new Storage({
      projectId: serviceAccount.project_id, // Get project ID from service account JSON
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key.replace(/\\n/g, '\n'), // Replace escaped newlines
      }
    }).bucket(storageBucketName); // Specify the bucket to work with
    console.log("Firebase Storage initialized successfully.");

  } catch (error) {
    console.error("FATAL: Error initializing Firebase Admin SDK or Storage:", error.message);
    console.error("Please ensure FIREBASE_SERVICE_ACCOUNT_JSON is valid JSON and FIREBASE_STORAGE_BUCKET is set.");
    process.exit(1);
  }
} else {
  // If an app is already initialized (e.g., on a warm start in Vercel), retrieve its services
  const app = admin.app();
  console.log("Firebase Admin SDK already initialized.");
  initializedAuth = app.auth();
  initializedDb = app.firestore();
  // Re-initialize Storage explicitly for consistency if app was already initialized
  const serviceAccount = JSON.parse(serviceAccountJsonString); // Re-parse for project ID
  initializedStorage = new Storage({
      projectId: serviceAccount.project_id,
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
      }
    }).bucket(storageBucketName);
}

// Export the initialized auth, db, and storage instances for use in other modules
export const auth = initializedAuth;
export const db = initializedDb;
export const bucket = initializedStorage; // New: Export the bucket instance
