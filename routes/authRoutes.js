import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// --- Helper function to log login attempts ---
const logLoginAttempt = async (email, status, req) => {
    try {
        await db.collection('loginLogs').add({
            email: email,
            status: status,
            ip: req.ip || req.connection.remoteAddress,
            device: req.headers['user-agent'] || 'Unknown',
            timestamp: adminApp.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Failed to write login log:', error);
    }
};

const generateToken = (userId, isAdmin = false) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('FATAL ERROR: JWT_SECRET is not defined.');
        return null;
    }
    return jwt.sign({ id: userId, isAdmin }, secret, { expiresIn: '7d' });
};

// Route to claim an access code
router.post('/claim-code', async (req, res) => {
    const { accessCode, password } = req.body;

    if (!accessCode || !password) {
        return res.status(400).json({ message: 'Access code and password are required.' });
    }

    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('accessCode', '==', accessCode).limit(1).get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Invalid access code.' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (userData.isClaimed) {
            return res.status(400).json({ message: 'This access code has already been claimed.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await usersRef.doc(userDoc.id).update({
            password: hashedPassword,
            isClaimed: true,
            activatedAt: adminApp.firestore.FieldValue.serverTimestamp(),
        });

        const token = generateToken(userDoc.id, userData.isAdmin || false);
        if (!token) {
            return res.status(500).json({ message: 'Server configuration error.' });
        }
        
        const { password: _, accessCode: __, ...userProfile } = userData;


        res.status(200).json({
            message: 'Account activated successfully.',
            token,
            user: { id: userDoc.id, ...userProfile }
        });

    } catch (error) {
        console.error('Error claiming access code:', error);
        res.status(500).json({ message: 'Server error during account activation.' });
    }
});

// Route for user login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();

        if (snapshot.empty) {
            await logLoginAttempt(email, 'failed', req); // Log failed attempt
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (!userData.isClaimed || !userData.password) {
            await logLoginAttempt(email, 'failed', req); // Log failed attempt
            return res.status(401).json({ message: 'Account not yet activated.' });
        }

        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            await logLoginAttempt(email, 'failed', req); // Log failed attempt
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        await logLoginAttempt(email, 'success', req); // Log successful attempt

        const token = generateToken(userDoc.id, userData.isAdmin || false);
        if (!token) {
            return res.status(500).json({ message: 'Server configuration error.' });
        }

        const { password: _, accessCode: __, ...userProfile } = userData;

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: userDoc.id, ...userProfile }
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

export default router;
