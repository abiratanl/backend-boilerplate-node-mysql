const express = require('express');
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middlewares/rateLimitMiddleware'); // <--- Import Limiter

const router = express.Router();

// Apply Rate Limit to Login
router.post('/login', loginLimiter, authController.login);

// Password Recovery
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;