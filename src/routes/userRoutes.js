const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/authMiddleware'); // <--- Import Middleware

const router = express.Router();

// Apply protection to all routes below this line
router.use(protect);

// Routes definitions
router.get('/', restrictTo('admin'), userController.getAllUsers); // Only Admin can list all
router.get('/:id', userController.getUserById);
router.post('/', restrictTo('admin'), userController.createUser); // Only Admin can create
router.put('/:id', userController.updateUser);
router.delete('/:id', restrictTo('admin'), userController.deleteUser);

module.exports = router;