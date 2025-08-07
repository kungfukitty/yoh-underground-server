import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import { authenticateToken, checkNdaAccepted } from '../middleware/authMiddleware.js';

const router = Router();

// All event routes require a user to be authenticated and to have accepted the NDA.
router.use(authenticateToken, checkNdaAccepted);

const formatEventTimestamps = (data) => {
    return {
        ...data,
        date: data.date?.toDate().toISOString() || null,
        createdAt: data.createdAt?.toDate().toISOString() || null,
        updatedAt: data.updatedAt?.toDate().toISOString() || null,
    };
};

// GET all upcoming events
router.get('/', async (req, res) => {
    try {
        const eventsRef = db.collection('events');
        const snapshot = await eventsRef
            .where('date', '>=', new Date())
            .orderBy('date', 'asc')
            .get();

        const events = snapshot.docs.map(doc => ({
            id: doc.id,
            ...formatEventTimestamps(doc.data())
        }));

        res.status(200).json({ message: 'Upcoming events retrieved successfully.', events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Server error fetching events.' });
    }
});

// POST to RSVP for an event
router.post('/:eventId/rsvp', async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.id;
    const eventRef = db.collection('events').doc(eventId);

    try {
        // FIX: Using a Firestore transaction to prevent a race condition
        // where two users might RSVP for the last spot simultaneously.
        await db.runTransaction(async (transaction) => {
            const eventDoc = await transaction.get(eventRef);

            if (!eventDoc.exists) {
                // Throw an error to abort the transaction.
                throw new Error('Event not found.');
            }

            const eventData = eventDoc.data();
            const attendees = eventData.attendees || [];

            if (attendees.includes(userId)) {
                // This will be caught and sent as a 409 response.
                throw new Error('Already RSVPd.');
            }

            if (eventData.maxCapacity && attendees.length >= eventData.maxCapacity) {
                // This will be caught and sent as a 409 response.
                throw new Error('Event is full.');
            }
            
            transaction.update(eventRef, {
                attendees: adminApp.firestore.FieldValue.arrayUnion(userId)
            });
        });

        res.status(200).json({ message: 'RSVP successful!' });
    } catch (error) {
        console.error(`Error processing RSVP for event ${eventId}:`, error);
        if (error.message === 'Event not found.') {
            return res.status(404).json({ message: 'Event not found.' });
        }
        if (error.message === 'Already RSVPd.') {
            return res.status(409).json({ message: 'You have already RSVPd for this event.' });
        }
        if (error.message === 'Event is full.') {
            return res.status(409).json({ message: 'This event is currently full.' });
        }
        res.status(500).json({ message: 'Server error processing RSVP.' });
    }
});

// DELETE to cancel an RSVP for an event
router.delete('/:eventId/rsvp', async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.id;

    try {
        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        const attendees = eventDoc.data().attendees || [];
        if (!attendees.includes(userId)) {
            return res.status(400).json({ message: 'You are not RSVPd for this event.' });
        }

        await eventRef.update({
            attendees: adminApp.firestore.FieldValue.arrayRemove(userId)
        });

        res.status(200).json({ message: 'RSVP canceled successfully.' });
    } catch (error) {
        console.error(`Error canceling RSVP for event ${eventId}:`, error);
        res.status(500).json({ message: 'Server error canceling RSVP.' });
    }
});

export default router;
