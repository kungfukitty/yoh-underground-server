// File: routes/adminRoutes.js - UPDATED (Add Network Routes)

import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import jwt from 'jsonwebtoken';

const router = Router();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("[DEBUG] JWT verification failed:", err.message);
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; 
        next();
    });
};

const checkAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const userDoc = await db.collection('users').doc(req.user.id).get();
        if (!userDoc.exists || !userDoc.data().isAdmin) {
            return res.status(403).json({ message: 'Admin access required.' });
        }
        next();
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({ message: 'Server error checking admin status.' });
    }
};


// --- Admin Itinerary Management Routes (existing) ---

router.post('/itineraries', authenticateToken, checkAdmin, async (req, res) => {
    console.log("[DEBUG] API call received at /admin/itineraries POST endpoint.");
    const { userId, name, description, startDate, endDate, status = 'Draft', details } = req.body;

    if (!userId || !name || !startDate || !endDate || !details || !Array.isArray(details)) {
        return res.status(400).json({ message: 'Missing required itinerary fields (userId, name, startDate, endDate, details).' });
    }

    try {
        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
            return res.status(400).json({ message: 'Invalid start or end date format.' });
        }

        const validatedDetails = details.map(activity => {
            const activityDate = new Date(activity.date);
            if (isNaN(activityDate.getTime()) || !activity.description || !activity.location) {
                throw new Error('Invalid itinerary activity details format.');
            }
            return {
                ...activity,
                date: adminApp.firestore.Timestamp.fromDate(activityDate)
            };
        });

        const newItinerary = {
            userId,
            name,
            description: description || '',
            startDate: adminApp.firestore.Timestamp.fromDate(parsedStartDate),
            endDate: adminApp.firestore.Timestamp.fromDate(parsedEndDate),
            status,
            details: validatedDetails,
            createdAt: adminApp.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.id
        };

        const docRef = await db.collection('itineraries').add(newItinerary);
        res.status(201).json({ message: 'Itinerary created successfully.', id: docRef.id });

    } catch (error) {
        console.error('Error creating itinerary:', error);
        res.status(500).json({ message: error.message || 'Server error creating itinerary.' });
    }
});

router.get('/itineraries', authenticateToken, checkAdmin, async (req, res) => {
    console.log("[DEBUG] API call received at /admin/itineraries GET endpoint.");
    const { userId } = req.query;

    try {
        let query = db.collection('itineraries');
        if (userId) {
            query = query.where('userId', '==', userId);
        }

        const snapshot = await query.get();
        const itineraries = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            itineraries.push({
                id: doc.id,
                ...data,
                startDate: data.startDate?.toDate().toISOString() || null,
                endDate: data.endDate?.toDate().toISOString() || null,
                createdAt: data.createdAt?.toDate().toISOString() || null,
                updatedAt: data.updatedAt?.toDate().toISOString() || null,
                details: data.details ? data.details.map(detail => ({
                    ...detail,
                    date: detail.date?.toDate().toISOString() || null
                })) : []
            });
        });

        res.status(200).json({ message: 'Itineraries retrieved successfully.', itineraries });

    } catch (error) {
        console.error('Error retrieving itineraries:', error);
        res.status(500).json({ message: 'Server error retrieving itineraries.' });
    }
});

router.get('/itineraries/:id', authenticateToken, checkAdmin, async (req, res) => {
    console.log("[DEBUG] API call received at /admin/itineraries/:id GET endpoint.");
    const itineraryId = req.params.id;

    try {
        const doc = await db.collection('itineraries').doc(itineraryId).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Itinerary not found.' });
        }

        const data = doc.data();
        const itinerary = {
            id: doc.id,
            ...data,
            startDate: data.startDate?.toDate().toISOString() || null,
            endDate
