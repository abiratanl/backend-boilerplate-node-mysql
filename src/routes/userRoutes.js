const express = require('express');
const UserController = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const upload = require('../config/multer');

const router = express.Router();

// All routes below are protected
router.use(protect);

router.patch(
  '/avatar',
  upload.single('avatar'), // Middleware que processa a imagem
  UserController.updateAvatar
);

// --- Current User Routes (MUST BE BEFORE /:id) ---
router.get('/me', UserController.getMe);
router.put('/me', UserController.updateMe);


// --- Admin / Generic Routes ---
router.get('/', restrictTo('admin'), UserController.getAllUsers);
router.get('/:id', UserController.getUserById); // If /me was below this, express would think 'me' is an id
router.post('/', restrictTo('admin'), UserController.createUser);
router.put('/:id', restrictTo('admin'), UserController.updateUser);
router.delete('/:id', restrictTo('admin'), UserController.deleteUser);

module.exports = router;
