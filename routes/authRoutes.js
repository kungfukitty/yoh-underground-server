import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../config/firebaseAdminInit.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// FIX: Recommendation: Implement rate limiting to prevent brute-force attacks.
// import rateLimit from 'express-rate-limit';
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10, // limit each IP to 10 requests per windowMs
//   message: 'Too many login attempts from this IP, please try again after 15 minutes'
// });
// router.post('/login', loginLimiter, async (req, res) => { ... });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const snap = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const userDoc = snap.docs[0];
    const userData = userDoc.data();

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: userDoc.id,
      isAdmin: userData.isAdmin || false,
      isNDAAccepted: userData.isNDAAccepted || false
    };
    
    // FIX: The JWT expiration is now configurable via an environment variable.
    const expiresIn = process.env.JWT_EXPIRATION || '1h';
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
