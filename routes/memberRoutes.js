import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import { authenticateToken, checkNdaAccepted } from '../middleware/authMiddleware.js';

const router = Router();

// All routes in this file require a valid token, so we apply the middleware at the router level.
router.use(authenticateToken);

// Route to acknowledge the NDA
router.post('/acknowledge-nda', async (req, res) => {
    const userId = req.user.id; // Use the authenticated user's ID
    try {
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (userDoc.data().isNDAAccepted) {
            return res.status(200).json({ message: 'NDA already acknowledged.', isNDAAccepted: true });
        }

        await userDocRef.update({
            isNDAAccepted: true,
            ndaAcceptedAt: adminApp.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({ message: 'NDA acknowledged successfully.', isNDAAccepted: true });
    } catch (error) {
        console.error('Error acknowledging NDA:', error);
        res.status(500).json({ message: 'Server error during NDA acknowledgment.' });
    }
});

// Route to get the current user's NDA status
router.get('/nda-status', async (req, res) => {
    const userId = req.user.id; // Use the authenticated user's ID
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const userData = userDoc.data();
        res.status(200).json({
            isNDAAccepted: userData.isNDAAccepted || false,
            ndaAcceptedAt: userData.ndaAcceptedAt?.toDate().toISOString() || null
        });
    } catch (error) {
        console.error('Error retrieving NDA status:', error);
        res.status(500).json({ message: 'Server error retrieving NDA status.' });
    }
});

// Route to get the current user's profile
router.get('/profile', async (req, res) => {
    const userId = req.user.id;
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User profile not found.' });
        }
        const { password, accessCode, ...profileData } = userDoc.data();
        res.status(200).json({ message: 'User profile retrieved successfully.', profile: profileData });
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        res.status(500).json({ message: 'Server error retrieving profile.' });
    }
});

// Route to update the current user's profile
router.put('/profile', async (req, res) => {
    const userId = req.user.id;
    const updates = req.body;

    const disallowedFields = [
        'email', 'password', 'accessCode', 'isClaimed', 'isAdmin',
        'activatedAt', 'isNDAAccepted', 'ndaAcceptedAt'
    ];
    for (const field of disallowedFields) {
        if (updates.hasOwnProperty(field)) {
            delete updates[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    try {
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.update(updates);
        res.status(200).json({ message: 'User profile updated successfully.' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error updating profile.' });
    }
});

// --- Routes requiring NDA acceptance ---
router.use(checkNdaAccepted);

// Route to update connection preferences
router.put('/connection-preferences', async (req, res) => {
    const userId = req.user.id;
    const { connectionInterests, connectionVisibility } = req.body;

    const updates = { lastConnectionUpdateAt: adminApp.firestore.FieldValue.serverTimestamp() };

    if (connectionInterests !== undefined) {
        if (!Array.isArray(connectionInterests) || !connectionInterests.every(i => typeof i === 'string')) {
            return res.status(400).json({ message: 'connectionInterests must be an array of strings.' });
        }
        updates.connectionInterests = connectionInterests;
    }

    if (connectionVisibility !== undefined) {
        const allowedVisibilities = ['Visible to all members', 'Visible to members with shared interests', 'Not visible for connections'];
        if (!allowedVisibilities.includes(connectionVisibility)) {
            return res.status(400).json({ message: 'Invalid connectionVisibility value.' });
        }
        updates.connectionVisibility = connectionVisibility;
    }

    try {
        const userDocRef = db.collection('users').doc(userId);
        await userDocRef.update(updates);
        res.status(200).json({ message: 'Connection preferences updated successfully.' });
    } catch (error) {
        console.error('Error updating connection preferences:', error);
        res.status(500).json({ message: 'Server error updating connection preferences.' });
    }
});

// Route to discover other members
router.get('/discover', async (req, res) => {
    const currentUserId = req.user.id;
    try {
        const currentUserDoc = await db.collection('users').doc(currentUserId).get();
        if (!currentUserDoc.exists) {
            return res.status(404).json({ message: 'Current user profile not found.' });
        }
        const currentUserData = currentUserDoc.data();
        const currentUserInterests = currentUserData.connectionInterests || [];

        const snapshot = await db.collection('users').where('isNDAAccepted', '==', true).get();
        const discoverableMembers = [];

        snapshot.forEach(doc => {
            if (doc.id === currentUserId) return;

            const memberData = doc.data();
            let canBeDiscovered = false;

            switch (memberData.connectionVisibility) {
                case 'Visible to all members':
                    canBeDiscovered = true;
                    break;
                case 'Visible to members with shared interests':
                    const memberInterests = memberData.connectionInterests || [];
                    if (currentUserInterests.some(interest => memberInterests.includes(interest))) {
                        canBeDiscovered = true;
                    }
                    break;
            }

            if (canBeDiscovered) {
                discoverableMembers.push({
                    id: doc.id,
                    name: memberData.name || 'N/A',
                    status: memberData.status || 'N/A',
                    connectionInterests: memberData.connectionInterests || [],
                });
            }
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
