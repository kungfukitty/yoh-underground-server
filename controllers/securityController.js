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

export const getAccessLogs = async (req, res) => {
    try {
        // This is a placeholder. You would need to create a collection for access logs.
        // For now, it returns an empty array.
        const snapshot = await db.collection('accessLogs').orderBy('timestamp', 'desc').limit(100).get();
        const logs = snapshot.docs.map(doc => formatTimestamps(doc.data()));
        res.status(200).json({ message: 'Access logs retrieved.', logs });
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving access logs.' });
    }
};

export const getPermissionChanges = async (req, res) => {
    try {
        // This is a placeholder. You would need to create a collection for permission changes.
        // For now, it returns an empty array.
        const snapshot = await db.collection('permissionChanges').orderBy('timestamp', 'desc').limit(100).get();
        const logs = snapshot.docs.map(doc => formatTimestamps(doc.data()));
        res.status(200).json({ message: 'Permission changes retrieved.', logs });
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving permission changes.' });
    }
};

export const getAlerts = async (req, res) => {
    try {
        // This is a placeholder. You would need to create a collection for alerts.
        // For now, it returns an empty array.
        const snapshot = await db.collection('alerts').orderBy('timestamp', 'desc').limit(100).get();
        const alerts = snapshot.docs.map(doc => formatTimestamps(doc.data()));
        res.status(200).json({ message: 'Alerts retrieved.', alerts });
    } catch (error) {
        res.status(500).json({ message: 'Server error retrieving alerts.' });
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
        const referralsSnapshot = await db.collection('referrals').where('referrerId', '==', userId).get();
        const referrals = referralsSnapshot.docs.map(doc => doc.data());

        const userExport = {
            profile: userData,
            referrals: referrals,
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
        // This is a "soft delete"
        await db.collection('users').doc(userId).update({
            isDeleted: true,
            deletedAt: adminApp.firestore.FieldValue.serverTimestamp()
        });
        
        // You might also want to disable the user in Firebase Auth instead of deleting
        await adminApp.auth().updateUser(userId, {
            disabled: true
        });


        res.status(200).json({ message: 'User data has been soft-deleted and the account disabled.' });
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        res.status(500).json({ message: 'Server error deleting user data.' });
    }
};
