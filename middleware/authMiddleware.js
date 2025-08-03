import jwt from 'jsonwebtoken';
import { db } from '../config/firebaseAdminInit.js';

// Lightweight replacement for express-async-handler.  It wraps an async
// route/middleware function and forwards any rejected promise to Express'
// error handler.  This avoids the need for an external dependency that
// was causing the deployment build to fail when the package was missing.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

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
});
