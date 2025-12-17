const express = require('express');
const router = express.Router();

// 1. Importar o Controller
const authController = require('../controllers/authController');

// 2. Importar o Middleware de Proteção (para validar o Token)
const authMiddleware = require('../middlewares/authMiddleware');

// 3. Importar o Rate Limiter (para proteger contra Brute-Force no login)
const { loginLimiter } = require('../middlewares/rateLimitMiddleware');

// --- ROTAS ---

// Login (Com Rate Limit aplicado)
router.post('/login', loginLimiter, authController.login);

// Fluxo de Esqueci Minha Senha (Público)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Troca de Senha (Privado - Requer Token)
// OBS: Aqui usamos 'authMiddleware.protect', pois a função 'protect' está no arquivo de middleware, não no controller.
router.post('/change-password', authMiddleware.protect, authController.changePassword);

module.exports = router;