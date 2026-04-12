const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getInfants,
  getInfant,
  createInfant,
  updateMilestoneStatus,
  updateVaccinationStatus,
  getInfantVaccinations,
  deleteInfant,
  getCalendarActivities
} = require('../controllers/infantController');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes
router.route('/')
  .get(getInfants)
  .post(createInfant);

router.route('/:id')
  .get(getInfant)
  .delete(deleteInfant);

router.route('/:id/milestones/:milestoneId')
  .put(updateMilestoneStatus);

router.route('/:id/vaccinations')
  .get(getInfantVaccinations);

router.route('/:id/vaccinations/:vaccinationId')
  .put(updateVaccinationStatus);

router.route('/:id/calendar')
  .get(getCalendarActivities);

module.exports = router;