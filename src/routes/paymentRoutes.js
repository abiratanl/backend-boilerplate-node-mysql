const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

// Registrar pagamento
router.post('/', paymentController.createPayment);

// Ver histórico de pagamentos de um aluguel
router.get('/rental/:rentalId', paymentController.getPaymentsByRental);

module.exports = router;
