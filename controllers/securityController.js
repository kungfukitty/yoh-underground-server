import { db, adminApp } from '../config/firebaseAdminInit.js';

// Helper to format timestamps
const formatTimestamps = (data) => {
    const formatted = { ...data };
    for (const key in formatted) {
        if (formatted[key] && typeof formatted[key].toDate === 'function') {
            formatted[key] = formatted[key].toDate().toISOString();
        }
    }
    return formatted;
};

// --- Log Retrieval Functions ---

export const getLoginLogs = async (req, res) => {
    try {
        const snapshot = await db.collection('loginLogs').orderBy('timestamp', 'desc').limit(100).get();
        const logs = snapshot.docs.map(doc => formatTimestamps(doc.data()));
        res.status(200).json({ message: 'Login logs retrieved.', logs });
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving login logs.' });
    }
};

export const getAdminActions = async (req, res) => {
    try {
        const snapshot = await db.collection('adminActions').orderBy('timestamp', 'desc').limit(100).get();
        const logs = snapshot.docs.map(doc => formatTimestamps(doc.data()));
        res.status(200).json({ message: 'Admin actions retrieved.', logs });
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving admin actions.' });
    }
};

// --- Privacy Tools ---

export const exportUserData = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'User email is required.' });

    try {
        const userSnapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        if (userSnapshot.empty) return res.status(404).json({ message: 'User not found.' });
        
        const userDoc = userSnapshot.docs[0];
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // You can expand this to fetch data from other collections like referrals, villas, etc.
        const userExport = {
            profile: userData,
            // Example: referrals: await getUserReferrals(userId)
        };

        res.status(200).json({ message: 'User data exported successfully.', userData: userExport });
    } catch (error) {
        res.status(500).json({ message: 'Server error exporting user data.' });
    }
};

export const deleteUserData = async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: 'User ID is required.' });

    try {
        // This is a destructive operation. In a real app, you might "soft delete"
        // by setting an `isDeleted` flag instead.
        
        // Delete the user from Firebase Authentication
        await adminApp.auth().deleteUser(userId);

        // Delete the user's Firestore document
        await db.collection('users').doc(userId).delete();
        
        // You would also delete associated data in other collections here.

        res.status(200).json({ message: 'User data deleted successfully.' });
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        res.status(500).json({ message: 'Server error deleting user data.' });
    }
};
