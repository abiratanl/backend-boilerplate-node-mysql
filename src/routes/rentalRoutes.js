const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', rentalController.getAllRentals);
router.get('/:id', rentalController.getRentalById);
router.post('/', rentalController.createRental);


// Operational Actions
router.post('/:id/return', rentalController.returnRental);
router.post('/:id/cancel', rentalController.cancelRental);

module.exports = router;