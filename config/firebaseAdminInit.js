import admin from 'firebase-admin';

const serviceAccountJsonString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let initializedAuth;
let initializedDb;

// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
  if (!serviceAccountJsonString) {
    console.error("FATAL: FIREBASE_SERVICE_ACCOUNT_JSON is NOT set! Cannot initialize Firebase Admin SDK.");
    process.exit(1); // Exit if critical env is missing
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJsonString);
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      // Add other configurations if needed, e.g., databaseURL, storageBucket
    });
    console.log("Firebase Admin SDK initialized successfully.");

    initializedAuth = app.auth();
    initializedDb = app.firestore();
  } catch (error) {
    console.error("FATAL: Error initializing Firebase Admin SDK:", error.message);
    console.error("Please ensure FIREBASE_SERVICE_ACCOUNT_JSON is a valid JSON string.");
    process.exit(1); // Exit if initialization fails
  }
} else {
  // If an app is already initialized (e.g., on a warm start), retrieve its services
  const app = admin.app();
  console.log("Firebase Admin SDK already initialized.");
  initializedAuth = app.auth();
  initializedDb = app.firestore();
}

// Export the initialized auth and db instances
export const auth = initializedAuth;
export const db = initializedDb;
