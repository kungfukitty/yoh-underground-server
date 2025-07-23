import { Router } from 'express';
import { db, adminApp } from '../config/firebaseAdminInit.js';
import { authenticateToken, checkAdmin } from '../middleware/authMiddleware.js';
import { customAlphabet } from 'nanoid';

const router = Router();

// Helper to generate a unique, human-readable code
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

// === Member-Facing Routes ===
router.use(authenticateToken);

// POST /api/referrals/invite
// A member invites a new candidate.
router.post('/invite', async (req, res) => {
    const referrerId = req.user.id;
    const { referredName, referredEmail } = req.body;

    if (!referredName || !referredEmail) {
        return res.status(400).json({ message: 'The referred person\'s name and email are required.' });
    }

    const usersRef = db.collection('users');
    const referralsRef = db.collection('referrals');

    try {
        const existingUserSnapshot = await usersRef.where('email', '==', referredEmail).limit(1).get();
        if (!existingUserSnapshot.empty) {
            return res.status(409).json({ message: 'This person is already a member or has been invited.' });
        }

        const accessCode = generateCode();

        const newUserRef = await usersRef.add({
            name: referredName,
            email: referredEmail,
            accessCode: accessCode,
            isClaimed: false,
            isNDAAccepted: false,
            createdAt: adminApp.firestore.FieldValue.serverTimestamp(),
            referredBy: referrerId,
        });

        const referralRef = await referralsRef.add({
            referrerId: referrerId,
            referredUserId: newUserRef.id,
            referredName: referredName,
            referredEmail: referredEmail,
            status: 'Invited', // This is the first stage of the vetting process
            rewardStatus: 'Pending',
            createdAt: adminApp.firestore.FieldValue.serverTimestamp(),
            updatedAt: adminApp.firestore.FieldValue.serverTimestamp(),
        });

        res.status(201).json({
            message: 'Invitation sent successfully.',
            referralId: referralRef.id,
            accessCode: accessCode
        });

    } catch (error) {
        console.error('Error creating referral invitation:', error);
        res.status(500).json({ message: 'Server error while sending invitation.' });
    }
});

// GET /api/referrals/my-referrals
// Gets the list of referrals made by the currently logged-in member.
router.get('/my-referrals', async (req, res) => {
    const referrerId = req.user.id;
    try {
        const snapshot = await db.collection('referrals').where('referrerId', '==', referrerId).orderBy('createdAt', 'desc').get();
        const referrals = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).json({ message: 'Your referrals retrieved successfully.', referrals });
    } catch (error) {
        console.error('Error fetching member referrals:', error);
        res.status(500).json({ message: 'Server error retrieving your referrals.' });
    }
});


// === Admin-Facing Routes ===
const adminRouter = Router();
adminRouter.use(authenticateToken, checkAdmin);

// GET /api/referrals/admin/
// Gets all referrals for the admin dashboard.
adminRouter.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('referrals').orderBy('createdAt', 'desc').get();
        const referrals = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).json({ message: 'All referrals retrieved successfully.', referrals });
    } catch (error) {
        console.error('Admin error fetching referrals:', error);
        res.status(500).json({ message: 'Server error retrieving referrals.' });
    }
});

// PUT /api/referrals/admin/:referralId/status
// Admin updates the status of a referral, which doubles as the onboarding tracker.
adminRouter.put('/:referralId/status', async (req, res) => {
    const { referralId } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    // --- UPDATED: Includes all vetting stages ---
    const allowedStatuses = [
        'Invited',
        'Application Submitted',
        'Under Review',
        'Interview Scheduled',
        'Approved',
        'Rejected'
    ];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: 'A valid status from the vetting process is required.' });
    }

    const referralRef = db.collection('referrals').doc(referralId);

    try {
        const referralDoc = await referralRef.get();
        if (!referralDoc.exists) {
            return res.status(404).json({ message: 'Referral not found.' });
        }

        await referralRef.update({
            status: status,
            updatedAt: adminApp.firestore.FieldValue.serverTimestamp()
        });
        
        await referralRef.collection('adminActions').add({
            adminId: adminId,
            action: `Changed status to ${status}`,
            timestamp: adminApp.firestore.FieldValue.serverTimestamp()
        });

        if (status === 'Approved') {
            // TODO: Implement reward creation logic
        }

        res.status(200).json({ message: `Onboarding status updated to ${status}.` });

    } catch (error) {
        console.error('Admin error updating referral status:', error);
        res.status(500).json({ message: 'Server error updating referral status.' });
    }
});

router.use('/admin', adminRouter);

export default router;
