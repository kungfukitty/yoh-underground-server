// File: routes/authRoutes.js
import { Router } from 'express';
// Import adminApp and db from the initialized Firebase Admin SDK
import { adminApp, db } from '../config/firebaseAdminInit.js'; // <-- UPDATED IMPORT
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// Helper function to generate a JWT (no changes needed here)
const generateToken = (userId) => {
    console.log("[DEBUG] Generating JWT for user:", userId);
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Route to claim an access code and set a password
router.post('/claim-code', async (req, res) => {
    console.log("[DEBUG] API call received at /claim-code endpoint.");
    // const db = admin.firestore(); // THIS LINE IS NOW REDUNDANT AND WRONG - `db` is imported above
    const { accessCode, password } = req.body;

    if (!accessCode || !password) {
        return res.status(400).json({ message: 'Access code and password are required.' });
    }

    try {
        const usersRef = db.collection('users'); // `db` is now correctly imported
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
            accessCode: adminApp.firestore.FieldValue.delete(), // <-- UPDATED: Use adminApp for FieldValue
            activatedAt: adminApp.firestore.FieldValue.serverTimestamp(), // <-- UPDATED: Use adminApp for FieldValue
        });

        res.status(200).json({ message: 'Account activated successfully.' });

    } catch (error) {
        console.error('Error claiming access code:', error);
        res.status(500).json({ message: 'Server error during account activation.' });
    }
});

// Route for user login (no changes needed here, as `db` was already correctly used)
router.post('/login', async (req, res) => {
    console.log("[DEBUG] API call received at /login endpoint.");
    // const db = admin.firestore(); // THIS LINE IS NOW REDUNDANT AND WRONG - `db` is imported above
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        console.log("[DEBUG] Querying Firestore for email:", email);
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).limit(1).get();

        if (snapshot.empty) {
            console.log("[DEBUG] No user found for email:", email);
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        let userId, userData;
        snapshot.forEach(doc => {
            userId = doc.id;
            userData = doc.data();
        });
        console.log("[DEBUG] User found:", userId);

        if (!userData.password) {
            console.log("[DEBUG] User has no password, account not activated.");
            return res.status(401).json({ message: 'Account not yet activated.' });
        }

        console.log("[DEBUG] Comparing passwords...");
        const isMatch = await bcrypt.compare(password, userData.password);

        if (!isMatch) {
            console.log("[DEBUG] Password comparison failed.");
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        console.log("[DEBUG] Passwords match. Generating token.");
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
