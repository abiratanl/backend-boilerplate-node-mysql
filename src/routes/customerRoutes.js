const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer); // Esta chamará o softDelete no Model
router.delete('/:id/hard', customerController.hardDeleteCustomer);

// Futuramente: Adicionar rotas para adicionar/remover endereços específicos
// router.post('/:id/addresses', customerController.addAddress);
// router.delete('/addresses/:addressId', customerController.removeAddress);

module.exports = router;