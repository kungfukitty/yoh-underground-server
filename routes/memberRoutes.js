// File: routes/memberRoutes.js - UPDATED (Import adminApp)

import { Router } from 'express';
// Import db AND adminApp from the initialized Firebase Admin SDK
import { db, adminApp } from '../config/firebaseAdminInit.js'; // <-- UPDATED IMPORT: Added adminApp
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware to protect routes (already existing)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("[DEBUG] JWT verification failed:", err.message);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; 
        next();
    });
};

// --- NDA Management Route ---
router.post('/acknowledge-nda', authenticateToken, async (req, res) => {
    console.log("[DEBUG] API call received at /acknowledge-nda endpoint by user:", req.user.id);
    
    const userId = req.user.id; 

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
            ndaAcceptedAt: adminApp.firestore.FieldValue.serverTimestamp(), // Correctly using adminApp
        });

        console.log(`[DEBUG] User ${userId} successfully acknowledged NDA.`);
        res.status(200).json({ message: 'NDA acknowledged successfully.', isNDAAccepted: true });

    } catch (error) {
        console.error('Error acknowledging NDA:', error);
        res.status(500).json({ message: 'Server error during NDA acknowledgment.' });
    }
});

// Route to get NDA status (already existing)
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

// --- Personalized Member Profiles Routes (existing) ---
// Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
    console.log("[DEBUG] API call received at /profile GET endpoint for user:", req.user.id);
    const userId = req.user.id;

    try {
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            console.log(`[DEBUG] Profile not found for user ID: ${userId}`);
            return res.status(404).json({ message: 'User profile not found.' });
        }

        const userData = userDoc.data();

        const { password, accessCode, ...profileData } = userData; 

        res.status(200).json({
            message: 'User profile retrieved successfully.',
            profile: profileData
        });

    } catch (error) {
        console.error('Error retrieving user profile:', error);
        res.status(500).json({ message: 'Server error retrieving profile.' });
    }
});

// Update User Profile
router.put('/profile', authenticateToken, async (req, res) => {
    console.log("[DEBUG] API call received at /profile PUT endpoint for user:", req.user.id);
    const userId = req.user.id;
    const updates = req.body; 

    const disallowedFields = ['email', 'password', 'accessCode', 'isClaimed', 'activatedAt', 'isNDAAccepted', 'ndaAcceptedAt'];
    const forbiddenUpdates = Object.keys(updates).filter(field => disallowedFields.includes(field));

    if (forbiddenUpdates.length > 0) {
        return res.status(400).json({ 
            message: `Attempted to update disallowed fields: ${forbiddenUpdates.join(', ')}. Please use dedicated routes for sensitive updates.` 
        });
    }

    try {
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            console.log(`[DEBUG] Profile not found for user ID: ${userId}`);
            return res.status(404).json({ message: 'User profile not found.' });
        }

        await userDocRef.update(updates);

        console.log(`[DEBUG] User ${userId} profile updated successfully.`);
        res.status(200).json({ message: 'User profile updated successfully.' });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
});

export default router;
