// File: controllers/authController.js

import jwt from 'jsonwebtoken';
import { db } from '../config/firebaseAdminInit.js';

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (!userData.password || userData.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: userDoc.id, email: userData.email, isAdmin: userData.isAdmin || false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = {
      id: userDoc.id,
      email: userData.email,
      name: userData.name || '',
      isAdmin: userData.isAdmin || false,
      isNDAAccepted: userData.isNDAAccepted || false,
      connectionInterests: userData.connectionInterests || [],
      connectionVisibility: userData.connectionVisibility || '',
      lastConnectionUpdateAt: userData.lastConnectionUpdateAt || ''
    };

    return res.status(200).json({ token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};