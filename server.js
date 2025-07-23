import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import { authenticateToken, checkAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// All routes in this file are for admins and require authentication.
router.use(authenticateToken, checkAdmin);

// Utility to format timestamps
const formatTimestamps = (data) => {
    const formatted = { ...data };
    for (const key in formatted) {
        if (formatted[key] && typeof formatted[key].toDate === 'function') {
            formatted[key] = formatted[key].toDate().toISOString();
        }
    }
    return formatted;
};

// GET all users
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('users').orderBy('name').get();
        const users = snapshot.docs.map(doc => {
            const { password, accessCode, ...userData } = doc.data();
            return { id: doc.id, ...formatTimestamps(userData) };
        });
        res.status(200).json({ message: 'Users retrieved successfully.', users });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Server error retrieving users.' });
    }
});

// PUT to update a user
router.put('/:userId', async (req, res) => {
    const { userId } = req.params;
    const updates = req.body;

    delete updates.password;
    delete updates.accessCode;

    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'User not found.' });
        }

        await userRef.update({ ...updates, updatedAt: adminApp.firestore.FieldValue.serverTimestamp() });
        res.status(200).json({ message: 'User updated successfully.' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error updating user.' });
    }
});

export default router;
