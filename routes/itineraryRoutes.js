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

// POST to create an itinerary
router.post('/', async (req, res) => {
    const { userId, name, startDate, endDate, details } = req.body;
    if (!userId || !name || !startDate || !endDate || !details) {
        return res.status(400).json({ message: 'Missing required itinerary fields.' });
    }
    try {
        const newItinerary = {
            userId, name,
            description: req.body.description || '',
            startDate: adminApp.firestore.Timestamp.fromDate(new Date(startDate)),
            endDate: adminApp.firestore.Timestamp.fromDate(new Date(endDate)),
            status: req.body.status || 'Draft',
            details: details.map(d => ({ ...d, date: adminApp.firestore.Timestamp.fromDate(new Date(d.date)) })),
            createdAt: adminApp.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.id
        };
        const docRef = await db.collection('itineraries').add(newItinerary);
        res.status(201).json({ message: 'Itinerary created successfully.', id: docRef.id });
    } catch (error) {
        console.error('Error creating itinerary:', error);
        res.status(500).json({ message: 'Server error creating itinerary.' });
    }
});

// GET all itineraries
router.get('/', async (req, res) => {
    try {
        let query = db.collection('itineraries');
        if (req.query.userId) {
            query = query.where('userId', '==', req.query.userId);
        }
        const snapshot = await query.orderBy('startDate', 'desc').get();
        const itineraries = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...formatTimestamps(data),
                details: data.details.map(d => ({ ...d, date: d.date.toDate().toISOString() }))
            };
        });
        res.status(200).json({ message: 'Itineraries retrieved successfully.', itineraries });
    } catch (error) {
        console.error('Error retrieving itineraries:', error);
        res.status(500).json({ message: 'Server error retrieving itineraries.' });
    }
});

export default router;
