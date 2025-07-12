// File: routes/memberRoutes.js

import { Router } from 'express';
import { db } from '../config/firebaseAdminInit.js'; // Import Firestore instance
import jwt from 'jsonwebtoken'; // For token verification

const router = Router();

// Middleware to protect routes - similar to what you have in authRoutes for token validation
// This ensures only authenticated users can access member-specific actions
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("[DEBUG] JWT verification failed:", err.message);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; // Attach user payload from token
        next();
    });
};

// --- NDA Management Route ---
router.post('/acknowledge-nda', authenticateToken, async (req, res) => {
    console.log("[DEBUG] API call received at /acknowledge-nda endpoint by user:", req.user.id);
    
    const userId = req.user.id; // User ID from authenticated token

    try {
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            console.log(`[DEBUG] User document not found for ID: ${userId}`);
            return res.status(404).json({ message: 'User not found.' });
        }

        const userData = userDoc.data();

        if (userData.isNDAAccepted) {
            console.log(`[DEBUG] User ${userId} has already accepted NDA.`);
            return res.status(200).json({ message: 'NDA already acknowledged.', isNDAAccepted: true });
        }

        // Update user document to mark NDA as accepted
        await userDocRef.update({
            isNDAAccepted: true,
            ndaAcceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        console.log(`[DEBUG] User ${userId} successfully acknowledged NDA.`);
        res.status(200).json({ message: 'NDA acknowledged successfully.', isNDAAccepted: true });

    } catch (error) {
        console.error('Error acknowledging NDA:', error);
        res.status(500).json({ message: 'Server error during NDA acknowledgment.' });
    }
});

// Route to get NDA status (can be used by frontend to check if NDA needs signing)
router.get('/nda-status', authenticateToken, async (req, res) => {
    console.log("[DEBUG] API call received at /nda-status endpoint by user:", req.user.id);
    
    const userId = req.user.id;

    try {
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isNDAAccepted = userDoc.data().isNDAAccepted || false;
        const ndaAcceptedAt = userDoc.data().ndaAcceptedAt ? userDoc.data().ndaAcceptedAt.toDate().toISOString() : null;

        res.status(200).json({
            message: 'NDA status retrieved successfully.',
            isNDAAccepted: isNDAAccepted,
            ndaAcceptedAt: ndaAcceptedAt
        });

    } catch (error) {
        console.error('Error retrieving NDA status:', error);
        res.status(500).json({ message: 'Server error during NDA status retrieval.' });
    }
});


export default router;
