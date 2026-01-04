const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { protect } = require('../middlewares/authMiddleware'); 

// Lista todas as lojas
router.get('/', protect, storeController.getAllStores);

// BUSCA UMA LOJA ESPECÍFICA (Adicione esta linha)
router.get('/:id', storeController.getStoreById); 

module.exports = router;