import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import { authenticateToken, checkAdmin } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * Helper to format booking data, hiding sensitive fields for non-admins.
 * @param {object} data - The booking data from Firestore.
 * @param {boolean} isAdmin - Flag to determine if sensitive fields should be included.
 * @returns {object} - The formatted booking data.
 */
const formatBookingData = (data, isAdmin = false) => {
    const formattedData = {
        ...data,
        checkIn: data.checkIn?.toDate().toISOString() || null,
        checkOut: data.checkOut?.toDate().toISOString() || null,
        createdAt: data.createdAt?.toDate().toISOString() || null,
        updatedAt: data.updatedAt?.toDate().toISOString() || null,
    };

    if (!isAdmin) {
        delete formattedData.price;
        delete formattedData.propertyContactInfo;
        delete formattedData.createdBy;
    }

    return formattedData;
};

// --- Admin-only routes for managing all bookings ---
const adminRouter = Router();
adminRouter.use(authenticateToken, checkAdmin);

// GET all bookings (for admins)
adminRouter.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('villaBookings').orderBy('checkIn', 'desc').get();
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...formatBookingData(doc.data(), true)
        }));
        res.status(200).json({ message: 'All bookings retrieved successfully.', bookings });
    } catch (error) {
        console.error('Admin error getting all bookings:', error);
        res.status(500).json({ message: 'Server error retrieving bookings.' });
    }
});

// GET a single booking by ID (for admins)
adminRouter.get('/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const doc = await db.collection('villaBookings').doc(bookingId).get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Booking not found.' });
        }
        res.status(200).json({
            message: 'Booking retrieved successfully.',
            booking: { id: doc.id, ...formatBookingData(doc.data(), true) }
        });
    } catch (error) {
        console.error('Admin error getting booking by ID:', error);
        res.status(500).json({ message: 'Server error retrieving booking.' });
    }
});

// POST to create a new booking (for admins)
adminRouter.post('/', async (req, res) => {
    const {
        memberId, villaName, checkIn, checkOut, status = 'Confirmed', notes,
        numberOfGuests, price, paymentStatus, propertyType, propertyContactInfo, propertyRules
    } = req.body;

    if (!memberId || !villaName || !checkIn || !checkOut) {
        return res.status(400).json({ message: 'Missing required fields: memberId, villaName, checkIn, checkOut.' });
    }

    try {
        const newBooking = {
            memberId, villaName, status, notes: notes || '',
            checkIn: adminApp.firestore.Timestamp.fromDate(new Date(checkIn)),
            checkOut: adminApp.firestore.Timestamp.fromDate(new Date(checkOut)),
            numberOfGuests: Number(numberOfGuests) || null,
            price: price || null,
            paymentStatus: paymentStatus || 'Pending',
            propertyType: propertyType || null,
            propertyContactInfo: propertyContactInfo || null,
            propertyRules: propertyRules || '',
            createdBy: req.user.id,
            createdAt: adminApp.firestore.FieldValue.serverTimestamp(),
            updatedAt: adminApp.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('villaBookings').add(newBooking);
        res.status(201).json({ message: 'Booking created successfully.', id: docRef.id });
    } catch (error) {
        console.error('Admin error creating booking:', error);
        res.status(500).json({ message: 'Server error creating booking.' });
    }
});

// PUT to update a booking (for admins)
adminRouter.put('/:bookingId', async (req, res) => {
    const { bookingId } = req.params;
    const updates = { ...req.body };
    
    try {
        const bookingRef = db.collection('villaBookings').doc(bookingId);
        const doc = await bookingRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        if (updates.checkIn) updates.checkIn = adminApp.firestore.Timestamp.fromDate(new Date(updates.checkIn));
        if (updates.checkOut) updates.checkOut = adminApp.firestore.Timestamp.fromDate(new Date(updates.checkOut));
        if (updates.numberOfGuests) updates.numberOfGuests = Number(updates.numberOfGuests);
        updates.updatedAt = adminApp.firestore.FieldValue.serverTimestamp();

        await bookingRef.update(updates);
        res.status(200).json({ message: 'Booking updated successfully.' });
    } catch (error) {
        console.error('Admin error updating booking:', error);
        res.status(500).json({ message: 'Server error updating booking.' });
    }
});

// DELETE a booking (for admins)
adminRouter.delete('/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const bookingRef = db.collection('villaBookings').doc(bookingId);
        
        // Improvement: Check if the document exists before trying to delete
        const doc = await bookingRef.get();
        if (!doc.exists) {
            return res.status(404).json({ message: 'Booking not found.' });
        }

        await bookingRef.delete();
        res.status(200).json({ message: 'Booking deleted successfully.' });
    } catch (error) {
        console.error('Admin error deleting booking:', error);
        res.status(500).json({ message: 'Server error deleting booking.' });
    }
});


// --- Member-facing routes for their own bookings ---
const memberRouter = Router();
memberRouter.use(authenticateToken);

// GET my bookings (for logged-in member)
memberRouter.get('/my-bookings', async (req, res) => {
    const userId = req.user.id;
    try {
        const snapshot = await db.collection('villaBookings')
            .where('memberId', '==', userId)
            .orderBy('checkIn', 'desc')
            .get();
            
        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...formatBookingData(doc.data(), false)
        }));
        res.status(200).json({ message: 'Your bookings retrieved successfully.', bookings });
    } catch (error) {
        console.error('Member error getting their bookings:', error);
        res.status(500).json({ message: 'Server error retrieving your bookings.' });
    }
});

// --- Main Router ---
router.use('/admin', adminRouter);
router.use('/', memberRouter);

export default router;
