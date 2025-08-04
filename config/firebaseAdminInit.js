// config/firebaseAdminInit.js
import admin from 'firebase-admin';
import { Storage } from '@google-cloud/storage';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!serviceAccountString) {
  console.error('FATAL: FIREBASE_SERVICE_ACCOUNT_KEY is not set!');
  process.exit(1);
}
if (!databaseURL) {
  console.error('FATAL: FIREBASE_DATABASE_URL is not set!');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountString);
} catch (err) {
  console.error('FATAL: Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY:', err.message);
  process.exit(1);
}

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

const auth = app.auth();
const db = app.firestore();
const bucket = new Storage({
  projectId: serviceAccount.project_id,
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key.replace(/\\n/g, '\n')
  }
}).bucket(`${serviceAccount.project_id}.appspot.com`);
console.log('✅ Firebase Storage initialized.');

export const adminApp = app; // Export the initialized app as adminApp
export { auth, db, bucket };
