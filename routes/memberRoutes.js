import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';

const router = Router();

// GET /api/member/nda-status
router.get('/nda-status', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const userRef = db.collection('users');
        const snapshot = await userRef.where('email', '==', email).limit(1).get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const userData = snapshot.docs[0].data();
        const ndaSigned = userData.ndaSigned || false;

        res.status(200).json({ signed: ndaSigned });
    } catch (error) {
        console.error('Error fetching NDA status:', error);
        res.status(500).json({ message: 'Server error fetching NDA status.' });
    }
});

// POST /api/member/acknowledge-nda
router.post('/acknowledge-nda', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const userRef = db.collection('users');
        const snapshot = await userRef.where('email', '==', email).limit(1).get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const userDoc = snapshot.docs[0];

        await userDoc.ref.update({
            ndaSigned: true,
            ndaAcknowledgedAt: adminApp.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: 'NDA acknowledged successfully.' });
    } catch (error) {
        console.error('Error acknowledging NDA:', error);
        res.status(500).json({ message: 'Server error acknowledging NDA.' });
    }
});

export default router;
