// File: config/firebaseAdminInit.js

import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const encodedServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!encodedServiceAccount) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT is not set.");
}

const serviceAccount = JSON.parse(
  Buffer.from(encodedServiceAccount, 'base64').toString('utf8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

export { admin, db };
