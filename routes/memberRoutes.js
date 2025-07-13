// File: routes/memberRoutes.js - UPDATED (Add Connection Routes)

import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import jwt from 'jsonwebtoken';

const router = Router();

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

const checkNdaAccepted = async (req, res, next) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.id).get();
        if (!userDoc.exists || !userDoc.data().isNDAAccepted) {
            return res.status(403).json({ message: 'NDA not accepted. Access denied.' });
        }
        next();
    } catch (error) {
        console.error('Error checking NDA acceptance:', error);
        res.status(500).json({ message: 'Server error checking NDA status.' });
    }
};

// --- NDA Management Route (existing) ---
router.post('/acknowledge-nda', authenticateToken, async (req, res) => {
    console.log("[DEBUG] API call received at /acknowledge-nda endpoint by user:", req.user.id);
    const userId = req.user.id; 
    try {
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) { return res.status(404).json({ message: 'User not found.' }); }
        const userData = userDoc.data();
        if (userData.isNDAAccepted) { return res.status(200).json({ message: 'NDA already acknowledged.', isNDAAccepted: true }); }
        await userDocRef.update({
            isNDAAccepted: true,
            ndaAcceptedAt: adminApp.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`[DEBUG] User ${userId} successfully acknowledged NDA.`);
        res.status(200).json({ message: 'NDA acknowledged successfully.', isNDAAccepted: true });
    } catch (error) {
        console.error('Error acknowledging NDA:', error);
        res.status(500).json({ message: 'Server error during NDA acknowledgment.' });
    }
});

router.get('/nda-status', authenticateToken, async (req, res) => {
    console.log("[DEBUG] API call received at /nda-status endpoint by user:", req.user.id);
    const userId = req.user.id;
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) { return res.status(404).json({ message: 'User not found.' }); }
        const isNDAAccepted = userDoc.data().isNDAAccepted || false;
        const ndaAcceptedAt = userDoc.data().ndaAcceptedAt ? userDoc.data().ndaAcceptedAt.toDate().toISOString() : null;
        res.status(200).json({ message: 'NDA status retrieved successfully.', isNDAAccepted: isNDAAccepted, ndaAcceptedAt: ndaAcceptedAt });
    } catch (error) {
        console.error('Error retrieving NDA status:', error);
        res.status(500).json({ message: 'Server error during NDA status retrieval.' });
    }
});

// --- Personalized Member Profiles Routes (existing) ---
router.get('/profile', authenticateToken, async (req, res) => {
    console.log("[DEBUG] API call received at /profile GET endpoint for user:", req.user.id);
    const userId = req.user.id;
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) { console.log(`[DEBUG] Profile not found for user ID: ${userId}`); return res.status(404).json({ message: 'User profile not found.' }); }
        const userData = userDoc.data();
        const { password, accessCode, ...profileData } = userData; 
        if (profileData.ndaAcceptedAt && typeof profileData.ndaAcceptedAt.toDate === 'function') {
            profileData.ndaAcceptedAt = profileData.ndaAcceptedAt.toDate().toISOString();
        } else {
            profileData.ndaAcceptedAt = null;
        }
        res.status(200).json({ message: 'User profile retrieved successfully.', profile: profileData });
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        res.status(500).json({ message: 'Server error retrieving profile.' });
    }
});

router.put('/profile', authenticateToken, async (req, res) => {
    console.log("[DEBUG] API call received at /profile PUT endpoint for user:", req.user.id);
    const userId = req.user.id;
    const updates = req.body; 
    const disallowedFields = ['email', 'password', 'accessCode', 'isClaimed', 'activatedAt', 'isNDAAccepted', 'ndaAcceptedAt', 'connectionInterests', 'connectionVisibility', 'lastConnectionUpdateAt']; // Updated disallowed fields
    const forbiddenUpdates = Object.keys(updates).filter(field => disallowedFields.includes(field));

    if (forbiddenUpdates.length > 0) {
        return res.status(400).json({ 
            message: `Attempted to update disallowed fields: ${forbiddenUpdates.join(', ')}. Please use dedicated routes for sensitive updates.` 
        });
    }

    try {
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) { console.log(`[DEBUG] Profile not found for user ID: ${userId}`); return res.status(404).json({ message: 'User profile not found.' }); }
        await userDocRef.update(updates);
        console.log(`[DEBUG] User ${userId} profile updated successfully.`);
        res.status(200).json({ message: 'User profile updated successfully.' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
});

// --- NEW: Discreet Connection Facilitator Routes ---

// PUT /api/member/connection-preferences - Update user's connection preferences
router.put('/connection-preferences', authenticateToken, checkNdaAccepted, async (req, res) => {
    console.log("[DEBUG] API call received at /connection-preferences PUT endpoint by user:", req.user.id);
    const userId = req.user.id;
    const { connectionInterests, connectionVisibility } = req.body;

    // Basic validation for connectionInterests (e.g., must be array of strings)
    if (connectionInterests !== undefined && (!Array.isArray(connectionInterests) || !connectionInterests.every(i => typeof i === 'string'))) {
        return res.status(400).json({ message: 'connectionInterests must be an array of strings.' });
    }

    // Basic validation for connectionVisibility
    const allowedVisibilities = ['Visible to all members', 'Visible to members with shared interests', 'Not visible for connections'];
    if (connectionVisibility !== undefined && !allowedVisibilities.includes(connectionVisibility)) {
        return res.status(400).json({ message: 'Invalid connectionVisibility value.' });
    }

    try {
        const userDocRef = db.collection('users').doc(userId);
        const updates: { [key: string]: any } = {
            lastConnectionUpdateAt: adminApp.firestore.FieldValue.serverTimestamp(),
        };

        if (connectionInterests !== undefined) {
            updates.connectionInterests = connectionInterests;
        }
        if (connectionVisibility !== undefined) {
            updates.connectionVisibility = connectionVisibility;
        }
        
        await userDocRef.update(updates);

        res.status(200).json({ message: 'Connection preferences updated successfully.' });

    } catch (error) {
        console.error('Error updating connection preferences:', error);
        res.status(500).json({ message: 'Server error updating connection preferences.' });
    }
});

// GET /api/members/discover - Discover other members based on preferences
router.get('/discover', authenticateToken, checkNdaAccepted, async (req, res) => {
    console.log("[DEBUG] API call received at /discover GET endpoint by user:", req.user.id);
    const currentUserId = req.user.id;

    try {
        const currentUserDoc = await db.collection('users').doc(currentUserId).get();
        if (!currentUserDoc.exists) {
            return res.status(404).json({ message: 'Current user profile not found.' });
        }
        const currentUserData = currentUserDoc.data();
        const currentUserInterests = currentUserData.connectionInterests || [];

        const membersRef = db.collection('users');
        let query: FirebaseFirestore.Query = membersRef;

        // Filter out the current user
        // Note: Firestore doesn't allow inequality filters on multiple fields, nor 'not-equal' filters directly on ID
        // So we'll filter by ID after fetching, or try to optimize the query for 'visible' members.

        const snapshot = await query.get(); // Fetch all (or a reasonable limit) to filter in code
        const discoverableMembers: Partial<UserData>[] = [];

        snapshot.forEach(doc => {
            const memberId = doc.id;
            const memberData = doc.data();

            // Skip current user
            if (memberId === currentUserId) {
                return;
            }

            // Apply visibility rules
            if (memberData.connectionVisibility === 'Not visible for connections') {
                return; // Skip members who don't want to be visible
            }

            // Check NDA acceptance for discoverable members (ensure they are active, vetted members)
            if (!memberData.isNDAAccepted) {
                return; // Only show members who have accepted NDA
            }

            // Filter by shared interests if necessary
            if (memberData.connectionVisibility === 'Visible to members with shared interests') {
                const memberInterests = memberData.connectionInterests || [];
                const hasSharedInterest = currentUserInterests.some(interest => memberInterests.includes(interest));
                if (!hasSharedInterest) {
                    return; // Skip if no shared interests and visibility is restricted
                }
            }

            // Exclude sensitive information
            const { password, accessCode, isClaimed, activatedAt, isNDAAccepted, ndaAcceptedAt, email, ...discoverableProfile } = memberData;

            discoverableMembers.push({
                id: memberId,
                name: discoverableProfile.name, // Ensure name is included
                status: discoverableProfile.status, // Ensure status is included
                connectionInterests: discoverableProfile.connectionInterests || [],
                // Add any other non-sensitive fields you want to display
            });
        });

        res.status(200).json({
            message: 'Discoverable members retrieved successfully.',
            members: discoverableMembers
        });

    } catch (error) {
        console.error('Error discovering members:', error);
        res.status(500).json({ message: 'Server error discovering members.' });
    }
});


export default router;
