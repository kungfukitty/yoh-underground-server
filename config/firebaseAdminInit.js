import admin from 'firebase-admin';

const { FIREBASE_SERVICE_ACCOUNT_KEY } = process.env;

if (!FIREBASE_SERVICE_ACCOUNT_KEY) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.');
}

let serviceAccount: admin.ServiceAccount;

try {
  serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_KEY);
} catch (error) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON.');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const adminApp = admin;

export { db, adminApp };
