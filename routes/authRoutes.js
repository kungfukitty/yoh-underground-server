import { Router } from 'express';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

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
            console.log(`[DEBUG] Query for accessCode "${accessCode}" found no documents.`);
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
        res.status(200).json({ message: 'Account activated successfully.', token });

    } catch (error) {
        console.error('Error claiming access code:', error);
        res.status(500).json({ message: 'Server error during account activation.' });
    }
});

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
