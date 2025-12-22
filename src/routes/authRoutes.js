const express = require('express');
const router = express.Router();

// 1. Import the Controller
const authController = require('../controllers/authController');

// 2. Import the Protection Middleware (to validate the Token)
const authMiddleware = require('../middlewares/authMiddleware');

// 3. Import the Rate Limiter (to protect against Brute-Force login attacks)
const { loginLimiter } = require('../middlewares/rateLimitMiddleware');

// --- ROTAS ---

// Login (With Rate Limit applied)
router.post('/login', loginLimiter, authController.login);

// Forgot My Password Flow (Public)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Change Password (Private - Requires Token)
// Note: Here we use 'authMiddleware.protect' because the 'protect' function is in the middleware file, not in the controller.
router.post('/change-password', authMiddleware.protect, authController.changePassword);

module.exports = router;