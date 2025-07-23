import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * Generates a JWT for a given user ID.
 * @param {string} userId - The user's unique ID.
 * @param {boolean} isAdmin - The user's admin status.
 * @returns {string|null} The generated token or null if the secret is missing.
 */
const generateToken = (userId, isAdmin = false) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
        return null;
    }
    return jwt.sign({ id: userId, isAdmin }, secret, { expiresIn: '7d' });
};

// Route to claim an access code and set a password
router.post('/claim-code', async (req, res) => {
    const { accessCode, password } = req.body;

    if (!accessCode || !password) {
        return res.status(400).json({ message: 'Access code and password are required.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('accessCode', '==', accessCode).limit(1).get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Invalid or expired access code.' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (userData.isClaimed) {
            return res.status(400).json({ message: 'Access code has already been used.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await userDoc.ref.update({
            password: hashedPassword,
            isClaimed: true,
            accessCode: adminApp.firestore.FieldValue.delete(),
            activatedAt: adminApp.firestore.FieldValue.serverTimestamp(),
        });

        const token = generateToken(userDoc.id, userData.isAdmin || false);
        if (!token) {
            return res.status(500).json({ message: 'Server configuration error: Could not generate token.' });
        }

        res.status(200).json({
            message: 'Account activated successfully.',
            token,
            user: {
                id: userDoc.id,
                name: userData.name,
                email: userData.email,
                isAdmin: userData.isAdmin || false
            }
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
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (!userData.isClaimed || !userData.password) {
            return res.status(401).json({ message: 'Account not yet activated. Please use your access code.' });
        }

        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken(userDoc.id, userData.isAdmin || false);
        if (!token) {
            return res.status(500).json({ message: 'Server configuration error: Could not generate token.' });
        }

        // Exclude sensitive data from the response
        const { password: _, accessCode: __, ...userProfile } = userData;

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: {
                id: userDoc.id,
                ...userProfile
            }
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

export default router;
