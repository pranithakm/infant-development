const express = require('express');
const { protect, admin } = require('../middleware/auth');
const {
  getMilestones,
  getMilestone,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  initializeMilestones
} = require('../controllers/milestoneController');

const router = express.Router();

// Public routes
router.route('/')
  .get(getMilestones);

router.route('/initialize')
  .post(initializeMilestones);

router.route('/:id')
  .get(getMilestone);

// Protected routes (admin only for create/update/delete)
router.use(protect);

router.route('/')
  .post(admin, createMilestone);

router.route('/:id')
  .put(admin, updateMilestone)
  .delete(admin, deleteMilestone);

module.exports = router;