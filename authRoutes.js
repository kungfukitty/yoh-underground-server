import { Router } from 'express';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// This function generates a JSON Web Token for an authenticated user.
const generateToken = (userId) => {
    // Ensure the JWT_SECRET is available
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
        // In a real application, you might want to throw an error or handle this differently
        return null;
    }
    return jwt.sign({ id: userId }, secret, { expiresIn: '24h' });
};

// Route for activating a new account with an access code.
router.post('/claim-code', async (req, res) => {
    const db = admin.firestore();
    const { accessCode, password } = req.body;

    if (!accessCode || !password) {
        return res.status(400).json({ message: 'Access code and password are required.' });
    }

    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('accessCode', '==', accessCode).limit(1).get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Invalid or expired access code.' });
        }

        let userId, userData;
        snapshot.forEach(doc => {
            userId = doc.id;
            userData = doc.data();
        });

        if (userData.isClaimed) {
            return res.status(400).json({ message: 'Access code has already been used.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userDocRef = usersRef.doc(userId);
        await userDocRef.update({
            password: hashedPassword,
            isClaimed: true,
            accessCode: admin.firestore.FieldValue.delete(),
            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const token = generateToken(userId);
        if (!token) {
            return res.status(500).json({ message: 'Server configuration error: Could not generate token.' });
        }
        res.status(200).json({ message: 'Account activated successfully.', token });

    } catch (error) {
        console.error('Error claiming access code:', error);
        res.status(500).json({ message: 'Server error during account activation.' });
    }
});

// Route for logging in an existing user.
router.post('/login', async (req, res) => {
    const db = admin.firestore();
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

        let userId, userData;
        snapshot.forEach(doc => {
            userId = doc.id;
            userData = doc.data();
        });

        if (!userData.password) {
            return res.status(401).json({ message: 'Account not yet activated.' });
        }

        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken(userId);
        if (!token) {
            return res.status(500).json({ message: 'Server configuration error: Could not generate token.' });
        }
        res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: userId, name: userData.name, email: userData.email }
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

export default router;
