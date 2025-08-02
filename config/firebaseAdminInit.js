import admin from 'firebase-admin';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw) {
  console.error('FATAL: FIREBASE_SERVICE_ACCOUNT_KEY is missing');
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
}

let creds;
try {
  creds = JSON.parse(raw);
} catch (err) {
  console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(creds),
  });
}

export const db = admin.firestore();
export const adminApp = admin;
