import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import jwt from 'jsonwebtoken';

const router = Router();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication token required.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

const checkAdmin = async (req, res, next) => {
    try {
        const userDoc = await db.collection('users').doc(req.user.id).get();
        if (!userDoc.exists || !userDoc.data().isAdmin) {
            return res.status(403).json({ message: 'Admin access required.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error checking admin status.' });
    }
};

// Create a booking
router.post('/', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { memberId, villaName, checkIn, checkOut, status = 'Pending', notes } = req.body;
        if (!memberId || !villaName || !checkIn || !checkOut) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        const booking = {
            memberId,
            villaName,
            checkIn: adminApp.firestore.Timestamp.fromDate(new Date(checkIn)),
            checkOut: adminApp.firestore.Timestamp.fromDate(new Date(checkOut)),
            status,
            notes: notes || '',
            createdBy: req.user.id,
            createdAt: adminApp.firestore.FieldValue.serverTimestamp(),
            updatedAt: adminApp.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('villaBookings').add(booking);
        res.status(201).json({ id: docRef.id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all bookings
router.get('/', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const snapshot = await db.collection('villaBookings').get();
        const bookings = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                checkIn: data.checkIn?.toDate().toISOString(),
                checkOut: data.checkOut?.toDate().toISOString(),
                createdAt: data.createdAt?.toDate().toISOString(),
                updatedAt: data.updatedAt?.toDate().toISOString()
            };
        });
        res.json({ bookings });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get booking by ID
router.get('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const doc = await db.collection('villaBookings').doc(req.params.id).get();
        if (!doc.exists) return res.status(404).json({ message: 'Booking not found.' });
        const data = doc.data();
        res.json({
            id: doc.id,
            ...data,
            checkIn: data.checkIn?.toDate().toISOString(),
            checkOut: data.checkOut?.toDate().toISOString(),
            createdAt: data.createdAt?.toDate().toISOString(),
            updatedAt: data.updatedAt?.toDate().toISOString()
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update booking
router.put('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const updates = req.body;
        if (updates.checkIn) {
            updates.checkIn = adminApp.firestore.Timestamp.fromDate(new Date(updates.checkIn));
        }
        if (updates.checkOut) {
            updates.checkOut = adminApp.firestore.Timestamp.fromDate(new Date(updates.checkOut));
        }
        updates.updatedAt = adminApp.firestore.FieldValue.serverTimestamp();
        await db.collection('villaBookings').doc(req.params.id).update(updates);
        res.json({ message: 'Booking updated.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete booking
router.delete('/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        await db.collection('villaBookings').doc(req.params.id).delete();
        res.json({ message: 'Booking deleted.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;