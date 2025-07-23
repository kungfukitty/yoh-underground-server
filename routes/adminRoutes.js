import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import { authenticateToken, checkAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// All routes in this file require the user to be an authenticated admin.
router.use(authenticateToken, checkAdmin);

// --- Utility Functions ---

/**
 * Converts Firestore Timestamps in an object to ISO strings.
 * @param {object} data - The object containing Firestore Timestamps.
 * @returns {object} - The object with converted timestamps.
 */
const formatTimestamps = (data) => {
    const formatted = { ...data };
    for (const key in formatted) {
        if (formatted[key] && typeof formatted[key].toDate === 'function') {
            formatted[key] = formatted[key].toDate().toISOString();
        }
    }
    return formatted;
};


// --- User Management Routes ---

// GET all users
router.get('/users', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => {
            const { password, accessCode, ...userData } = doc.data();
            return {
                id: doc.id,
                ...formatTimestamps(userData)
            };
        });
        res.status(200).json({ message: 'Users retrieved successfully.', users });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Server error retrieving users.' });
    }
});

// GET a single user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const userDoc = await db.collection('users').doc(req.params.id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const { password, accessCode, ...userData } = userDoc.data();
        res.status(200).json({
            message: 'User retrieved successfully.',
            user: { id: userDoc.id, ...formatTimestamps(userData) }
        });
    } catch (error) {
        console.error('Error getting user by ID:', error);
        res.status(500).json({ message: 'Server error retrieving user.' });
    }
});

// POST to create a new user
router.post('/users', async (req, res) => {
    const { email, name, isAdmin = false } = req.body;
    if (!email || !name) {
        return res.status(400).json({ message: 'Email and name are required.' });
    }

    try {
        // Check if user with that email already exists
        const existingUser = await db.collection('users').where('email', '==', email).get();
        if (!existingUser.empty) {
            return res.status(409).json({ message: 'A user with this email already exists.' });
        }

        // Generate a simple, temporary access code
        const accessCode = Math.random().toString(36).substring(2, 10).toUpperCase();

        const newUser = {
            email,
            name,
            isAdmin,
            accessCode,
            isClaimed: false,
            isNDAAccepted: false,
            createdAt: adminApp.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.id,
        };

        const docRef = await db.collection('users').add(newUser);
        res.status(201).json({
            message: 'User created successfully. Please provide the access code to the user.',
            userId: docRef.id,
            accessCode: accessCode
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error creating user.' });
    }
});

// PUT to update a user
router.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Admins should not update passwords or access codes here.
    delete updates.password;
    delete updates.accessCode;

    try {
        const userRef = db.collection('users').doc(id);
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


// --- Itinerary Management Routes ---

router.post('/itineraries', async (req, res) => {
    const { userId, name, startDate, endDate, details } = req.body;
    if (!userId || !name || !startDate || !endDate || !details) {
        return res.status(400).json({ message: 'Missing required itinerary fields.' });
    }
    try {
        const newItinerary = {
            userId,
            name,
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

router.get('/itineraries', async (req, res) => {
    try {
        let query = db.collection('itineraries');
        if (req.query.userId) {
            query = query.where('userId', '==', req.query.userId);
        }
        const snapshot = await query.get();
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

// ... other admin routes for Itineraries, Chats, Networks, Resources can be added here following the same pattern ...

export default router;
