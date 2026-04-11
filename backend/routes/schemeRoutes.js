const express = require('express');
const router = express.Router();
const { getSchemes, getScheme } = require('../controllers/schemeController');

router
  .route('/')
  .get(getSchemes);

router
  .route('/:id')
  .get(getScheme);

module.exports = router;
