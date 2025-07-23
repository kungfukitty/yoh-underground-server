// File: config/firebaseAdminInit.js - FINAL CORRECTED (Ensure Initialization)

import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage'; 

const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON; 
const databaseURL = process.env.FIREBASE_DATABASE_URL;


let initializedAuth;
let initializedDb;
let initializedStorage; 


// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
  if (!serviceAccountJsonString) {
    console.error("FATAL: FIREBASE_SERVICE_ACCOUNT_JSON is NOT set or is empty! Cannot initialize Firebase Admin SDK.");
    process.exit(1); // Exit process if critical env var is missing
  }
  if (!databaseURL) {
    console.error("FATAL: FIREBASE_DATABASE_URL is NOT set! Cannot initialize Firebase Admin SDK.");
    process.exit(1); // Exit process if critical env var is missing
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
    process.exit(1); // Exit process if initialization fails
  }
} else {
  // If app is already initialized (e.g., during hot-reloading in dev), get the existing app
  const app = admin.app();
  console.log("Firebase Admin SDK already initialized.");
  initializedAuth = app.auth();
  initializedDb = app.firestore();
  // Re-initialize storage using existing app context
  const serviceAccount = JSON.parse(serviceAccountJsonString); // serviceAccountJsonString should be available from top scope
  initializedStorage = new Storage({
      projectId: serviceAccount.project_id,
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      }
    }).bucket(`${serviceAccount.project_id}.appspot.com`);
}

// Export the initialized auth, db, storage, AND admin instances for use in other modules
export const adminApp = admin; 
export const auth = initializedAuth;
export const db = initializedDb;
export const bucket = initializedStorage;
