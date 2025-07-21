
import { auth, db } from '../config/firebaseAdminInit.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not defined in environment variables.');
  process.exit(1);
}

// POST /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Query Firestore for user with matching email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Check if password matches (plaintext comparison for now)
    if (userData.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: userDoc.id, email: userData.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    // Return user data (excluding password)
    const { password: _, ...safeUser } = userData;

    res.status(200).json({
      token,
      user: {
        id: userDoc.id,
        ...safeUser
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
