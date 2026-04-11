'use strict';

const express = require('express');
const router = express.Router();
const { predictHealth, getModelStatus, trainModel, batchPredict } = require('../controllers/healthController');
const { protect } = require('../middleware/auth');

// Public routes (for testing and integration)
router.get('/status', getModelStatus);
router.post('/predict', predictHealth);
router.post('/batch-predict', batchPredict);
router.post('/train', trainModel);

module.exports = router;
