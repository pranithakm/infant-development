const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getGrowthMeasurements,
  addGrowthMeasurement,
  updateGrowthMeasurement,
  deleteGrowthMeasurement
} = require('../controllers/growthController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes
router.route('/infant/:infantId')
  .get(getGrowthMeasurements);

router.route('/')
  .post(addGrowthMeasurement);

router.route('/:id')
  .put(updateGrowthMeasurement)
  .delete(deleteGrowthMeasurement);

module.exports = router;