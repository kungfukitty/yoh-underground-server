// File: config/firebaseAdminInit.js
import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage'; 

const serviceAccountJsonBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64; 
const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET; 


let initializedAuth;
let initializedDb;
let initializedStorage; 


// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
  if (!serviceAccountJsonBase64) {
    console.error("FATAL: FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 is NOT set! Cannot initialize Firebase Admin SDK.");
    process.exit(1);
  }
  if (!storageBucketName) {
    console.error("FATAL: FIREBASE_STORAGE_BUCKET is NOT set! Cannot initialize Firebase Storage.");
    process.exit(1);
  }

  try {
    // Decode the Base64 string back into a JSON string
    const serviceAccountJson = Buffer.from(serviceAccountJsonBase64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson); // Parse the JSON string into an object

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL, // Optional: if you use Realtime Database
      storageBucket: storageBucketName 
    });
    console.log("Firebase Admin SDK initialized successfully.");

    initializedAuth = app.auth();
    initializedDb = app.firestore();
    // Initialize Storage using the @google-cloud/storage client library
    initializedStorage = new Storage({
      projectId: serviceAccount.project_id, // Get project ID directly from the parsed serviceAccount object
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key, // The private_key will now have correct newlines after JSON.parse
      }
    }).bucket(storageBucketName); 
    console.log("Firebase Storage initialized successfully.");

  } catch (error) {
    console.error("FATAL: Error initializing Firebase Admin SDK or Storage:", error.message);
    console.error("Please ensure FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 is a valid Base64 encoded JSON string and FIREBASE_STORAGE_BUCKET is set.");
    process.exit(1);
  }
} else {
  // If an app is already initialized, retrieve its services
  const app = admin.app();
  console.log("Firebase Admin SDK already initialized.");
  initializedAuth = app.auth();
  initializedDb = app.firestore();
  // Decode for existing app path as well for consistency
  const serviceAccountJson = Buffer.from(serviceAccountJsonBase64, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(serviceAccountJson);
  initializedStorage = new Storage({
      projectId: serviceAccount.project_id,
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      }
    }).bucket(storageBucketName);
}

// Export the initialized auth, db, and storage instances for use in other modules
export const auth = initializedAuth;
export const db = initializedDb;
export const bucket = initializedStorage; // <--- ENSURE THIS LINE IS PRESENT AND UNCOMMENTED!
