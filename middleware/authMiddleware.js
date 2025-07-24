import jwt from 'jsonwebtoken';
import { db } from '../config/firebaseAdminInit.js';

/**
 * Middleware to authenticate a JWT token.
 * Verifies the token and attaches the user payload to the request object.
 */
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT verification failed:", err.message);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; // Attach user payload (e.g., { id: '...', iat: ..., exp: ... })
        next();
    });
};

/**
 * Middleware to check if the authenticated user is an admin.
 * Must be used after authenticateToken.
 */
export const checkAdmin = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }
    
    try {
        const userDoc = await db.collection('users').doc(req.user.id).get();
        if (!userDoc.exists || !userDoc.data().isAdmin) {
            return res.status(403).json({ message: 'Admin access required.' });
        }
        next();
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({ message: 'Server error checking admin status.' });
    }
};


/**
 * Middleware to check if the authenticated user has accepted the NDA.
 * Must be used after authenticateToken.
 */
export const checkNdaAccepted = async (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }

    try {
        const userDoc = await db.collection('users').doc(req.user.id).get();
        if (!userDoc.exists || !userDoc.data().isNDAAccepted) {
            return res.status(403).json({ message: 'Access denied. NDA must be accepted.' });
        }
        next();
    } catch (error) {
        console.error('Error checking NDA acceptance:', error);
        res.status(500).json({ message: 'Server error checking NDA status.' });
    }
};
