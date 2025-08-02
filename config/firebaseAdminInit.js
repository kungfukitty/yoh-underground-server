import admin from 'firebase-admin';

const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!raw) {
  console.error('FATAL: FIREBASE_SERVICE_ACCOUNT_KEY is missing');
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
  const msg =
    'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Provide the Firebase service account JSON via this environment variable.';
  console.error(msg);
  throw new Error(msg);
}

let creds;
try {
  creds = JSON.parse(raw);
} catch (err) {
  console.error('Invalid JSON in FIREBASE_SERVICE_ACCOUNT_KEY:', err);
  throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(creds),
  });
}

export const db = admin.firestore();
export const adminApp = admin;
