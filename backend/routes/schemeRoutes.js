const express = require('express');
const router = express.Router();
const { getAllSchemes, getSchemeById, createScheme, updateScheme, deleteScheme } = require('../controllers/schemeController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAllSchemes);
router.get('/:id', getSchemeById);

// Protected routes (admin only)
router.post('/', protect, createScheme);
router.put('/:id', protect, updateScheme);
router.delete('/:id', protect, deleteScheme);

module.exports = router;