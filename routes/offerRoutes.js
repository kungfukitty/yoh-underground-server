const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');

// Create a new offer
router.post('/create', offerController.createOffer);

// Get all offers
router.get('/', offerController.getAllOffers);

// Get offer by ID
router.get('/:id', offerController.getOfferById);

// Update offer
router.put('/:id', offerController.updateOffer);

// Delete offer
router.delete('/:id', offerController.deleteOffer);

module.exports = router;
