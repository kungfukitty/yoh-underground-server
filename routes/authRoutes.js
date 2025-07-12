import express from 'express';
// REMOVED: import admin from 'firebase-admin'; // Firebase Admin SDK is now imported from init file
// NEW: Import auth and db from the centralized init file
import { auth, db } from '../config/firebaseAdminInit.js'; // <-- Adjust path if 'config' is elsewhere relative to 'routes'
import jwt from 'jsonwebtoken';

const router = express.Router();

// 'auth' and 'db' are now guaranteed to be initialized instances
// because firebaseAdminInit.js handles the initialization logic.

// --- Login Route ---
router.post('/login', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'Firebase ID Token is required.' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const email = decodedToken.email;

    console.log(`User ${uid} logged in via Firebase.`);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set. Cannot issue custom JWT.");
      return res.status(500).json({ message: 'Server configuration error.' });
    }

    const customPayload = {
      uid: uid,
      email: email,
    };
    const customJwt = jwt.sign(customPayload, jwtSecret, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Login successful',
      uid: uid,
      customToken: customJwt,
      email: email
    });

  } catch (error) {
    console.error('Login error:', error.message);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ message: 'Authentication failed: ID Token expired. Please reauthenticate.' });
    }
    if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-credential') {
      return res.status(401).json({ message: 'Authentication failed: Invalid ID Token.' });
    }
    return res.status(500).json({ message: 'Internal server error during login.', error: error.message });
  }
});

// --- Signup Route ---
router.post('/signup', async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName || null,
      emailVerified: false,
      disabled: false,
    });

    console.log(`Successfully created new user: ${userRecord.uid}`);
    res.status(201).json({
      message: 'User created successfully',
      uid: userRecord.uid,
      email: userRecord.email,
    });

  } catch (error) {
    console.error('Signup error:', error.message);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ message: 'Password is too weak. Must be at least 6 characters.' });
    }
    return res.status(500).json({ message: 'Internal server error during signup.', error: error.message });
  }
});

// --- Claim Access Code Route ---
router.post('/claim', async (req, res) => {
  const { accessCode, password } = req.body;

  if (!accessCode || !password) {
    return res.status(400).json({ message: 'Access code and password are required.' });
  }

  try {
    // 1. Validate Access Code
    const accessCodeRef = db.collection('access_codes').doc(accessCode);
    const doc = await accessCodeRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Invalid or expired access code.' });
    }

    const codeData = doc.data();
    if (codeData.used) {
      return res.status(409).json({ message: 'Access code already used.' });
    }
    if (codeData.expiresAt && codeData.expiresAt.toDate() < new Date()) {
        return res.status(404).json({ message: 'Invalid or expired access code.' });
    }

    const email = codeData.email;
    if (!email) {
        console.error(`Access code ${accessCode} has no associated email.`);
        return res.status(500).json({ message: 'Access code is malformed or missing associated user data.' });
    }

    // 2. Create User (or handle existing user)
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: email,
        password: password,
        emailVerified: false,
        disabled: false,
      });
      console.log(`New user created via access code: ${userRecord.uid}`);
    } catch (createError) {
      if (createError.code === 'auth/email-already-exists') {
        return res.status(409).json({ message: 'Account already exists for this access code. Please log in.' });
      } else if (createError.code === 'auth/weak-password') {
        return res.status(400).json({ message: 'Password is too weak. Must be at least 6 characters.' });
      } else if (createError.code === 'auth/invalid-email') {
        return res.status(400).json({ message: 'Invalid email associated with access code.' });
      }
      console.error('Error creating user during claim:', createError.message);
      return res.status(500).json({ message: 'Failed to create user during claim process.' });
    }

    // 3. Mark Access Code as Used
    await accessCodeRef.update({
      used: true,
      usedByUid: userRecord.uid,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Access code ${accessCode} claimed successfully by ${userRecord.uid}.`);

    // 4. Create and return a custom JWT for immediate login
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not set. Cannot issue custom JWT after claim.");
      return res.status(200).json({ message: 'Access code activated successfully. Please log in.', uid: userRecord.uid, email: userRecord.email });
    }

    const customPayload = {
      uid: userRecord.uid,
      email: userRecord.email,
    };
    const customJwt = jwt.sign(customPayload, jwtSecret, { expiresIn: '1h' });

    res.status(200).json({
      message: 'Access code activated successfully!',
      uid: userRecord.uid,
      email: userRecord.email,
      customToken: customJwt,
    });

  } catch (error) {
    console.error('Claim access code error:', error.message);
    return res.status(500).json({ message: 'An unexpected error occurred during access code activation.', error: error.message });
  }
});

export default router;
