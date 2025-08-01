import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { db } from '../config/firebaseAdminInit.js';

// Verify token and attach user payload
export const authenticateToken = (req, res, next) => {
  const header = req.headers['authorization'];
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// Combined check for admin & NDA
export const requirePrivileges = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated.' });

  const doc = await db.collection('users').doc(userId).get();
  if (!doc.exists) return res.status(404).json({ message: 'User not found.' });

  const data = doc.data();
  if (!data.isAdmin) return res.status(403).json({ message: 'Admin access required.' });
  if (!data.isNDAAccepted) {
    return res.status(403).json({ message: 'Access denied. NDA must be accepted.' });
  }

  // attach full user record if needed
  req.userRecord = data;
  next();
