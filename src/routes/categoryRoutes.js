const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect } = require('../middlewares/authMiddleware');

// Public Routes (or protected routes, depending on the rule. We'll leave public reading for the catalog)
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected Routes (Only logged-in users can create/edit)
router.post('/', protect, categoryController.createCategory);
router.put('/:id', protect, categoryController.updateCategory);
router.delete('/:id', protect, categoryController.deleteCategory);

module.exports = router;