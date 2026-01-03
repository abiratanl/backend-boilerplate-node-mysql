const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// 1. Importando com o nome CORRETO (protect)
const { protect } = require('../middlewares/authMiddleware'); 

// 2. Rota GET /stores (Agora protegida com o 'protect')
// Só quem tem token válido consegue ver a lista
router.get('/', protect, storeController.getAllStores);

module.exports = router;