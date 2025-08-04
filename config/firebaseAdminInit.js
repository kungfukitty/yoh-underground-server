// config/firebaseAdminInit.js
import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

// Read either the combined JSON string or discrete FB_ vars
const serviceAccountJsonString =
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
  process.env.FB_SERVICE_ACCOUNT_JSON;

const databaseURL =
  process.env.FIREBASE_DATABASE_URL ||
  process.env.FB_DATABASE_URL;

// Validate required env vars
if (!serviceAccountJsonString) {
  console.error(
    'FATAL: FIREBASE_SERVICE_ACCOUNT_JSON or FB_SERVICE_ACCOUNT_JSON is not set!'
  );
  process.exit(1);
}
if (!databaseURL) {
  console.error('FATAL: FIREBASE_DATABASE_URL or FB_DATABASE_URL is not set!');
  process.exit(1);
}

// Parse the service account JSON
let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountJsonString);
} catch (err) {
  console.error(
    'FATAL: Invalid JSON in service account string:',
    err.message
  );
  process.exit(1);
}

// Initialize Admin SDK (only once)
let app;
if (!admin.apps.length) {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
  });
  console.log('✅ Firebase Admin SDK initialized.');
} else {
  app = admin.app();
  console.log('🔄 Firebase Admin SDK already initialized.');
}

// Grab Auth and Firestore
const auth = app.auth();
const db   = app.firestore();

// Initialize Storage bucket
let bucket;
try {
  bucket = new Storage({
    projectId: serviceAccount.project_id,
    credentials: {
      client_email: serviceAccount.client_email,
      private_key:  serviceAccount.private_key.replace(/\\n/g, '\n')
    }
  }).bucket(`${serviceAccount.project_id}.appspot.com`);
  console.log('✅ Firebase Storage initialized.');
} catch (err) {
  console.error('FATAL: Error initializing Firebase Storage:', err.message);
  process.exit(1);
}

// Export everything
export const adminApp = admin;
export { auth, db, bucket };
