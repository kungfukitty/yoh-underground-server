// File: middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { db } from '../config/firebaseAdminInit.js';

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to authenticate a user's JWT token.
 */
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Authentication token is required.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            isAdmin: decoded.isAdmin || false,
            isNDAAccepted: decoded.isNDAAccepted || false,
        };
        next();
    } catch (err) {
        console.error('Token verification failed:', err);
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

/**
 * Middleware to check if the authenticated user is an admin.
 * Must be used after authenticateToken.
 */
export const checkAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin privileges are required.' });
    }
};

/**
 * Middleware to check if the authenticated user has accepted the NDA.
 * Must be used after authenticateToken.
 */
export const checkNdaAccepted = (req, res, next) => {
    if (req.user && req.user.isNDAAccepted) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. You must accept the NDA to proceed.' });
    }
};
