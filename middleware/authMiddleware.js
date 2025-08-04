// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token      = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

export const checkAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

// ─── NEW: NDA middleware ───────────────────────────────────────────────────────
export const checkNdaAccepted = (req, res, next) => {
  // If you track NDA acceptance in the JWT payload:
  // if (req.user && req.user.ndaAccepted) return next();
  // Otherwise, we'll allow everyone through for now:
  next();
};
