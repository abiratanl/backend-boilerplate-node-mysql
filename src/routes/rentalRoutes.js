const express = require('express');
const router = express.Router();
const rentalController = require('../controllers/rentalController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', rentalController.getAllRentals);
router.get('/:id', rentalController.getRentalById);
router.post('/', rentalController.createRental);

// Futuro: Rota para dar baixa no pagamento
// router.post('/:id/payments', rentalController.addPayment);

module.exports = router;