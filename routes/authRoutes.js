import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebaseAdminInit.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Lookup user in Firestore
  const snap = await db.collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
  if (snap.empty) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const userDoc = snap.docs[0];
  if (userDoc.data().password !== password) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const payload = { id: userDoc.id };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

export default router;
