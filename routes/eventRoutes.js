// File: routes/eventRoutes.js

import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js'; // Import db and adminApp
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware to protect routes (re-using from memberRoutes or authRoutes)
// This ensures only authenticated users can access event-related actions
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

// Middleware to check NDA acceptance (optional, but good for exclusive access)
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

// --- Event Routes ---

// GET /api/events - Get a list of upcoming events
router.get('/', authenticateToken, checkNdaAccepted, async (req, res) => {
    console.log("[DEBUG] API call received at /events GET endpoint.");
    try {
        const eventsRef = db.collection('events');
        // Fetch events that are upcoming (date is in the future)
        const snapshot = await eventsRef
            .where('date', '>=', adminApp.firestore.Timestamp.now())
            .orderBy('date', 'asc')
            .get();

        const events = [];
        snapshot.forEach(doc => {
            const eventData = doc.data();
            events.push({
                id: doc.id,
                ...eventData,
                date: eventData.date ? eventData.date.toDate().toISOString() : null, // Convert Timestamp to ISO string
                // Optionally, hide internal fields like maxCapacity or attendees if not needed on frontend directly
            });
        });

        res.status(200).json({
            message: 'Events retrieved successfully.',
            events: events
        });

    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Server error fetching events.' });
    }
});

// POST /api/events/:eventId/rsvp - RSVP to an event
router.post('/:eventId/rsvp', authenticateToken, checkNdaAccepted, async (req, res) => {
    const eventId = req.params.eventId;
    const userId = req.user.id;
    console.log(`[DEBUG] API call received for RSVP to event ${eventId} by user ${userId}.`);

    try {
        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        const eventData = eventDoc.data();
        const attendees = eventData.attendees || [];
        const maxCapacity = eventData.maxCapacity;

        if (attendees.includes(userId)) {
            return res.status(400).json({ message: 'Already RSVPd for this event.' });
        }

        if (maxCapacity && attendees.length >= maxCapacity) {
            return res.status(400).json({ message: 'Event is full.' });
        }

        // Atomically add userId to attendees array
        await eventRef.update({
            attendees: adminApp.firestore.FieldValue.arrayUnion(userId)
        });

        res.status(200).json({ message: 'RSVP successful!' });

    } catch (error) {
        console.error('Error processing RSVP:', error);
        res.status(500).json({ message: 'Server error processing RSVP.' });
    }
});

// DELETE /api/events/:eventId/rsvp - Cancel RSVP for an event
router.delete('/:eventId/rsvp', authenticateToken, checkNdaAccepted, async (req, res) => {
    const eventId = req.params.eventId;
    const userId = req.user.id;
    console.log(`[DEBUG] API call received for canceling RSVP to event ${eventId} by user ${userId}.`);

    try {
        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        const eventData = eventDoc.data();
        const attendees = eventData.attendees || [];

        if (!attendees.includes(userId)) {
            return res.status(400).json({ message: 'Not RSVPd for this event.' });
        }

        // Atomically remove userId from attendees array
        await eventRef.update({
            attendees: adminApp.firestore.FieldValue.arrayRemove(userId)
        });

        res.status(200).json({ message: 'RSVP canceled successfully!' });

    } catch (error) {
        console.error('Error canceling RSVP:', error);
        res.status(500).json({ message: 'Server error canceling RSVP.' });
    }
});


export default router;
