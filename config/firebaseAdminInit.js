import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import dotenv from 'dotenv';

dotenv.config();

let app;
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountString) {
    console.error("FATAL: FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set.");
    process.exit(1);
}

try {
    const serviceAccount = JSON.parse(serviceAccountString);

    if (!admin.apps.length) {
        app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            storageBucket: `${serviceAccount.project_id}.appspot.com`
        });
        console.log("Firebase Admin SDK initialized successfully.");
    } else {
        app = admin.app();
        console.log("Firebase Admin SDK already initialized.");
    }
} catch (error) {
    console.error("FATAL: Error parsing FIREBASE_SERVICE_ACCOUNT_JSON or initializing Firebase Admin SDK.", error);
    process.exit(1);
}

// Export initialized services
export const db = admin.firestore();
export const auth = admin.auth();
export const bucket = getStorage().bucket();
export const adminApp = admin; // Export the admin namespace itself for things like FieldValue
