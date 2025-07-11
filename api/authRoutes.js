import { Router } from 'express';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Helper function to generate a JWT
const generateToken = (userId) => {
    // Ensure you have JWT_SECRET set in your environment variables on Vercel
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Route to claim an access code and set a password
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
            accessCode: admin.firestore.FieldValue.delete(), // Remove the access code after use
            activatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({ message: 'Account activated successfully.' });

    } catch (error) {
        console.error('Error claiming access code:', error);
        res.status(500).json({ message: 'Server error during account activation.' });
    }
});

// Route for user login
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
        // Do not send the password hash back to the client
        const { password: _, ...userPayload } = userData;

        res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: userId, ...userPayload }
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

export default router;
