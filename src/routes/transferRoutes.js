const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // Todas protegidas

// Listar minhas transferências (A chegar)
router.get('/', transferController.getMyTransfers);

// Iniciar transferência (Pede ID do produto e Loja Destino)
router.post('/request', transferController.requestTransfer);

// Confirmar recebimento (Pede ID da Transferência)
router.post('/receive', transferController.receiveTransfer);

module.exports = router;