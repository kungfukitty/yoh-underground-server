import { Router } from 'express';
import { db } from '../config/firebaseAdminInit.js';
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

// GET all networks
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('networks').orderBy('name').get();
        const networks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...formatTimestamps(doc.data())
        }));
        res.status(200).json({ message: 'Networks retrieved successfully.', networks });
    } catch (error) {
        console.error('Error retrieving networks:', error);
        res.status(500).json({ message: 'Server error retrieving networks.' });
    }
});

export default router;
