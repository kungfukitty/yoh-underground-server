const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');

// Create a new referral
router.post('/create', referralController.createReferral);

// Get all referrals
router.get('/', referralController.getAllReferrals);

// Get referral by ID
router.get('/:id', referralController.getReferralById);

// Update referral
router.put('/:id', referralController.updateReferral);

// Delete referral
router.delete('/:id', referralController.deleteReferral);

module.exports = router;
