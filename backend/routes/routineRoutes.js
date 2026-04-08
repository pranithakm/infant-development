const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getRoutines,
  getRoutine,
  createRoutine,
  createPersonalizedRoutine,
  updateRoutine,
  deleteRoutine,
  updateInfantRoutineStatus,
  getInfantRoutinesForDate
} = require('../controllers/routineController');

const router = express.Router();

// Public routes
router.route('/')
  .get(getRoutines)
  .post(protect, createRoutine);

// Personalized routine route
router.route('/personalized')
  .post(protect, createPersonalizedRoutine);

router.route('/:id')
  .get(getRoutine)
  .put(protect, updateRoutine)
  .delete(protect, deleteRoutine);

// Protected routes for infant routine tracking
router.route('/infants/:infantId/date/:date')
  .get(protect, getInfantRoutinesForDate);

router.route('/infants/:infantId/date/:date/routine/:routineId')
  .put(protect, updateInfantRoutineStatus);

module.exports = router;