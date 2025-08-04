// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { db } from '../config/firebaseAdminInit.js';

dotenv.config();

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

export const checkAdmin = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (userDoc.exists && userDoc.data().isAdmin) {
      return next();
    }
    return res.status(403).json({
      message: 'Admin access required'
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};

export const checkNdaAccepted = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (userDoc.exists && userDoc.data().isNDAAccepted) {
      return next();
    }
    return res.status(403).json({
      message: 'NDA acceptance required'
    });
  } catch (error) {
    console.error('Error checking NDA status:', error);
    return res.status(500).json({
      message: 'Internal server error'
    });
  }
};
