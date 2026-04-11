const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getDateLogs,
  getDateActivities,
  logActivity,
  getAnniversaries
} = require('../controllers/dateLogController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes
router.route('/infant/:infantId')
  .get(getDateLogs);

router.route('/infant/:infantId/date/:date')
  .get(getDateActivities);

router.route('/log')
  .post(logActivity);

router.route('/infant/:infantId/anniversaries')
  .get(getAnniversaries);

module.exports = router;