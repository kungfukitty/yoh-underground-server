// File: config/firebaseAdminInit.js
import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage'; 

// Use the correct environment variable name as specified by the user
const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON; 


let initializedAuth;
let initializedDb;
let initializedStorage; 


// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
  if (!serviceAccountJsonString) {
    console.error("FATAL: FIREBASE_SERVICE_ACCOUNT_JSON is NOT set or is empty! Cannot initialize Firebase Admin SDK.");
    process.exit(1);
  }

  try {
    // Parse the JSON string directly
    const serviceAccount = JSON.parse(serviceAccountJsonString); 

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL, // Optional: if you use Realtime Database
    });
    console.log("Firebase Admin SDK initialized successfully.");

    initializedAuth = app.auth();
    initializedDb = app.firestore();
    
    // Initialize Storage using the @google-cloud/storage client library
    initializedStorage = new Storage({
      projectId: serviceAccount.project_id, // Get project ID directly from the parsed serviceAccount object
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key, // private_key should be correctly formatted after JSON.parse
      }
    }).bucket(`${serviceAccount.project_id}.appspot.com`); // Explicitly target the default bucket using project_id
    console.log("Firebase Storage initialized successfully.");

  } catch (error) {
    console.error("FATAL: Error initializing Firebase Admin SDK or Storage:", error.message);
    console.error("Please ensure FIREBASE_SERVICE_ACCOUNT_JSON is a valid JSON string.");
    process.exit(1);
  }
} else {
  // If an app is already initialized, retrieve its services
  const app = admin.app();
  console.log("Firebase Admin SDK already initialized.");
  initializedAuth = app.auth();
  initializedDb = app.firestore();
  
  // Re-initialize Storage for consistency if app was already initialized
  const serviceAccount = JSON.parse(serviceAccountJsonString);
  initializedStorage = new Storage({
      projectId: serviceAccount.project_id,
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      }
    }).bucket(`${serviceAccount.project_id}.appspot.com`);
}

// Export the initialized auth, db, and storage instances for use in other modules
export const auth = initializedAuth;
export const db = initializedDb;
export const bucket = initializedStorage;
