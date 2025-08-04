// File: config/firebaseAdminInit.js - Corrected

import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage'; // Import Storage

const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON; // Consistent variable name
const databaseURL = process.env.FIREBASE_DATABASE_URL; // Add database URL env var

let initializedAuth;
let initializedDb;
let initializedStorage; 

// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
  if (!serviceAccountJsonString) {
    console.error("FATAL: FIREBASE_SERVICE_ACCOUNT_JSON is NOT set or is empty! Cannot initialize Firebase Admin SDK.");
    process.exit(1); 
  }
  if (!databaseURL) { // Check for database URL
    console.error("FATAL: FIREBASE_DATABASE_URL is NOT set! Cannot initialize Firebase Admin SDK.");
    process.exit(1); 
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJsonString); 

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: databaseURL, 
    });
    console.log("Firebase Admin SDK initialized successfully.");

    initializedAuth = app.auth();
    initializedDb = app.firestore();
    initializedStorage = new Storage({
      projectId: serviceAccount.project_id, 
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key, 
      }
    }).bucket(`${serviceAccount.project_id}.appspot.com`); 
    console.log("Firebase Storage initialized successfully.");

  } catch (error) {
    console.error("FATAL: Error initializing Firebase Admin SDK or Storage:", error.message);
    console.error("Please ensure FIREBASE_SERVICE_ACCOUNT_JSON is a valid JSON string and FIREBASE_DATABASE_URL is set.");
    process.exit(1); 
  }
} else {
  // If app is already initialized, get the existing app instance
  const app = admin.app();
  console.log("Firebase Admin SDK already initialized.");
  initializedAuth = app.auth();
  initializedDb = app.firestore();
  // Re-initialize storage using existing app context if needed, ensure serviceAccountJsonString is available
  const serviceAccount = JSON.parse(serviceAccountJsonString); 
  initializedStorage = new Storage({
      projectId: serviceAccount.project_id,
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      }
    }).bucket(`${serviceAccount.project_id}.appspot.com`);
}

// Export all necessary instances
export const adminApp = admin; // Export the admin object itself
export const auth = initializedAuth;
export const db = initializedDb;
export const bucket = initializedStorage;
