import admin from 'firebase-admin';

// Get the service account key from environment variables
const FIREBASE_SERVICE_ACCOUNT_KEY = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Check if the environment variable is set and not empty
if (!FIREBASE_SERVICE_ACCOUNT_KEY || FIREBASE_SERVICE_ACCOUNT_KEY.trim() === '') {
  console.error('FATAL ERROR: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or is empty.');
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required for server to start.');
}

let serviceAccount;

try {
  // Parse the JSON string from the environment variable
  serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_KEY);
} catch (error) {
  // If parsing fails, throw an explicit error
  console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Please ensure it is a valid JSON string.');
}

// Initialize the Firebase app if it hasn't been initialized already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Export Firestore and the admin app instance
const db = admin.firestore();
const adminApp = admin;

export { db, adminApp };
