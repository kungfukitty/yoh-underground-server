// File: routes/adminRoutes.js - UPDATED (Add Chat Routes)

import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware to authenticate token
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

// Middleware to check if the authenticated user is an administrator
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

// POST /api/admin/itineraries - Create a new itinerary
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

// GET /api/admin/itineraries - Retrieve all itineraries (or by userId)
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

// GET /api/admin/itineraries/:id - Retrieve a specific itinerary
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
            endDate: data.endDate?.toDate().toISOString() || null,
            createdAt: data.createdAt?.toDate().toISOString() || null,
            updatedAt: data.updatedAt?.toDate().toISOString() || null,
            details: data.details ? data.details.map(detail => ({
                ...detail,
                date: detail.date?.toDate().toISOString() || null
            })) : []
        };

        res.status(200).json({ message: 'Itinerary retrieved successfully.', itinerary });

    } catch (error) {
        console.error('Error retrieving itinerary by ID:', error);
        res.status(500).json({ message: 'Server error retrieving itinerary.' });
    }
});

// PUT /api/admin/itineraries/:id - Update an itinerary
router.put('/itineraries/:id', authenticateToken, checkAdmin, async (req, res) => {
    console.log("[DEBUG] API call received at /admin/itineraries/:id PUT endpoint.");
    const itineraryId = req.params.id;
    const updates = req.body;

    try {
        const itineraryRef = db.collection('itineraries').doc(itineraryId);
        const itineraryDoc = await itineraryRef.get();

        if (!itineraryDoc.exists) {
            return res.status(404).json({ message: 'Itinerary not found.' });
        }

        if (updates.startDate) {
            const parsedDate = new Date(updates.startDate);
            if (isNaN(parsedDate.getTime())) return res.status(400).json({ message: 'Invalid startDate format.' });
            updates.startDate = adminApp.firestore.Timestamp.fromDate(parsedDate);
        }
        if (updates.endDate) {
            const parsedDate = new Date(updates.endDate);
            if (isNaN(parsedDate.getTime())) return res.status(400).json({ message: 'Invalid endDate format.' });
            updates.endDate = adminApp.firestore.Timestamp.fromDate(parsedDate);
        }
        if (updates.details && Array.isArray(updates.details)) {
            updates.details = updates.details.map(activity => {
                if (activity.date) {
                    const activityDate = new Date(activity.date);
                    if (isNaN(activityDate.getTime())) throw new Error('Invalid activity date format in details.');
                    return { ...activity, date: adminApp.firestore.Timestamp.fromDate(activityDate) };
                }
                return activity;
            });
        }
        
        updates.updatedAt = adminApp.firestore.FieldValue.serverTimestamp();

        await itineraryRef.update(updates);
        res.status(200).json({ message: 'Itinerary updated successfully.' });

    } catch (error) {
        console.error('Error updating itinerary:', error);
        res.status(500).json({ message: error.message || 'Server error updating itinerary.' });
    }
});

// DELETE /api/admin/itineraries/:id - Delete an itinerary
router.delete('/itineraries/:id', authenticateToken, checkAdmin, async (req, res) => {
    console.log("[DEBUG] API call received at /admin/itineraries/:id DELETE endpoint.");
    const itineraryId = req.params.id;

    try {
        await db.collection('itineraries').doc(itineraryId).delete();
        res.status(200).json({ message: 'Itinerary deleted successfully.' });
    } catch (error) {
        console.error('Error deleting itinerary:', error);
        res.status(500).json({ message: 'Server error deleting itinerary.' });
    }
});


// --- NEW: Admin Chat Management Routes ---

// POST /api/admin/chats - Create a new chat log
router.post('/chats', authenticateToken, checkAdmin, async (req, res) => {
    console.log("[DEBUG] API call received at /admin/chats POST endpoint.");
    const { userIds, messages, itineraryId, subject, status = 'Open' } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ message: 'Missing required chat fields (userIds, messages).' });
    }

    try {
        // Basic validation for messages: ensure senderId, text, and timestamp are present
        const validatedMessages = messages.map(message => {
            const messageTimestamp = new Date(message.timestamp);
            if (isNaN(messageTimestamp.getTime()) || !message.senderId || !message.text) {
                throw new Error('Invalid chat message format.');
            }
            return {
                ...message,
                timestamp: adminApp.firestore.Timestamp.fromDate(messageTimestamp)
            };
        });

        const newChatLog = {
            userIds,
            messages: validatedMessages,
            itineraryId: itineraryId || null,
            subject: subject || null,
            status,
            createdAt: adminApp.firestore.FieldValue.serverTimestamp(),
            lastActivityAt: adminApp.firestore.FieldValue.serverTimestamp(),
            createdBy: req.user.id // Admin user ID who created the chat
        };

        const docRef = await db.collection('chatLogs').add(newChatLog);
        res.status(201).json({ message: 'Chat log created successfully.', id: docRef.id });

    } catch (error) {
        console.error('Error creating chat log:', error);
        res.status(500).json({ message: error.message || 'Server error creating chat log.' });
    }
});

// GET /api/admin/chats - Retrieve all chat logs (with filters)
router.get('/chats', authenticateToken, checkAdmin, async (req, res) => {
    console.log("[DEBUG] API call received at /admin/chats GET endpoint.");
    const { userId, status, itineraryId } = req.query; // Optional filters

    try {
        let query = db.collection('chatLogs');

        if (userId) {
            query = query.where('userIds', 'array-contains', userId);
        }
        if (status) {
            query = query.where('status', '==', status);
        }
        if (itineraryId) {
            query = query.where('itineraryId', '==', itineraryId);
        }

        const snapshot = await query.orderBy('lastActivityAt', 'desc').get();
        const chatLogs = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            chatLogs.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate().toISOString() || null,
                lastActivityAt: data.lastActivityAt?.toDate().toISOString() || null,
                messages: data.messages ? data.messages.map(message => ({
                    ...message,
                    timestamp: message.timestamp?.toDate().toISOString() || null
                })) : []
            });
        });

        res.status(200).json({ message: 'Chat logs retrieved successfully.', chatLogs });

    } catch (error) {
        console.error('Error retrieving chat logs:', error);
        res.status(500).json({ message: 'Server error retrieving chat logs.' });
    }
});

// GET /api/admin/chats/:id - Retrieve a specific chat log
router.get('/chats/:id', authenticateToken, checkAdmin, async (req, res) => {
    console.log("[DEBUG] API call received at /admin/chats/:id GET endpoint.");
    const chatId = req.params.id;

    try {
        const doc = await db.collection('chatLogs').doc(chatId).get();

        if (!doc.exists) {
            return res.status(404).json({ message: 'Chat log not found.' });
        }

        const data = doc.data();
        const chatLog = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString() || null,
            lastActivityAt: data.lastActivityAt?.toDate().toISOString() || null,
            messages: data.messages ? data.messages.map(message => ({
                ...message,
                timestamp: message.timestamp?.toDate().toISOString() || null
            })) : []
        };

        res.status(200).json({ message: 'Chat log retrieved successfully.', chatLog });

    } catch (error) {
        console.error('Error retrieving chat log by ID:', error);
        res.status(500).json({ message: 'Server error retrieving chat log.' });
    }
});

// PUT /api/admin/chats/:id - Update a chat log (e.g., add messages, change status)
router.put('/chats/:id', authenticateToken, checkAdmin, async (req, res) => {
    console.log("[DEBUG] API call received at /admin/chats/:id PUT endpoint.");
    const chatId = req.params.id;
    const updates = req.body;

    try {
        const chatLogRef = db.collection('chatLogs').doc(chatId);
        const chatLogDoc = await chatLogRef.get();

        if (!chatLogDoc.exists) {
            return res.status(404).json({ message: 'Chat log not found.' });
        }

        // Handle adding new messages
        if (updates.messages && Array.isArray(updates.messages)) {
            // Fetch current messages to append to them
            const currentMessages = chatLogDoc.data().messages || [];
            const newMessages = updates.messages.map(message => {
                const messageTimestamp = new Date(message.timestamp);
                if (isNaN(messageTimestamp.getTime()) || !message.senderId || !message.text) {
                    throw new Error('Invalid new message format.');
                }
                return {
                    ...message,
                    timestamp: adminApp.firestore.Timestamp.fromDate(messageTimestamp)
                };
            });
            updates.messages = [...currentMessages, ...newMessages]; // Append new messages
        }

        // Update lastActivityAt timestamp
        updates.lastActivityAt = adminApp.firestore.FieldValue.serverTimestamp();

        await chatLogRef.update(updates);
        res.status(200).json({ message: 'Chat log updated successfully.' });

    } catch (error) {
        console.error('Error updating chat log:', error);
        res.status(500).json({ message: error.message || 'Server error updating chat log.' });
    }
});

// DELETE /api/admin/chats/:id - Delete a chat log
router.delete('/chats/:id', authenticateToken, checkAdmin, async (req, res) => {
    console.log("[DEBUG] API call received at /admin/chats/:id DELETE endpoint.");
    const chatId = req.params.id;

    try {
        await db.collection('chatLogs').doc(chatId).delete();
        res.status(200).json({ message: 'Chat log deleted successfully.' });
    } catch (error) {
        console.error('Error deleting chat log:', error);
        res.status(500).json({ message: 'Server error deleting chat log.' });
    }
});


export default router;
