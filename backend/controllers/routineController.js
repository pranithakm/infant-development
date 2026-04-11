const Routine = require('../models/Routine');
const Infant = require('../models/Infant');
const mongoose = require('mongoose');

// @desc    Get all routines
// @route   GET /api/routines
// @access  Public
exports.getRoutines = async (req, res) => {
  try {
    const routines = await Routine.find({ isActive: true }).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: routines.length,
      data: routines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while fetching routines'
    });
  }
};

// @desc    Get single routine
// @route   GET /api/routines/:id
// @access  Public
exports.getRoutine = async (req, res) => {
  try {
    const routine = await Routine.findById(req.params.id);

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Routine not found'
      });
    }

    res.status(200).json({
      success: true,
      data: routine
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid routine ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching routine'
    });
  }
};

// @desc    Create new routine
// @route   POST /api/routines
// @access  Private/Admin
exports.createRoutine = async (req, res) => {
  try {
    const routine = await Routine.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Routine created successfully',
      data: routine
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while creating routine'
    });
  }
};

// @desc    Create personalized routine for infant
// @route   POST /api/routines/personalized
// @access  Private
exports.createPersonalizedRoutine = async (req, res) => {
  try {
    const { infantId, name, description, category, duration, fromDate, toDate } = req.body;

    // Validate required fields
    if (!infantId) {
      return res.status(400).json({
        success: false,
        message: 'Infant ID is required'
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Routine name is required'
      });
    }

    // Validate infantId
    if (!mongoose.Types.ObjectId.isValid(infantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID format'
      });
    }

    // Find infant and check if user is parent
    const infant = await Infant.findOne({
      _id: infantId,
      'parents.user': req.user.id,
      isActive: true
    });

    if (!infant) {
      return res.status(404).json({
        success: false,
        message: 'Infant not found or access denied'
      });
    }

    // Create personalized routine
    const routineData = {
      name,
      description: description || `Personalized routine for ${name}`,
      category: category || 'personalized',
      duration,
      isPersonalized: true,
      infantId: infantId,
      isActive: true,
      fromDate: fromDate || null,
      toDate: toDate || null,
    };

    const routine = await Routine.create(routineData);

    res.status(201).json({
      success: true,
      message: 'Personalized routine created successfully',
      data: routine
    });
  } catch (error) {
    console.error('Error creating personalized routine:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => {
        if (err.kind === 'maxlength' && err.path === 'name') {
          return 'Routine name is too long. Please use a shorter name (maximum 100 characters).';
        }
        return err.message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A routine with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating personalized routine: ' + (error.message || 'Unknown error')
    });
  }
};

// @desc    Update routine
// @route   PUT /api/routines/:id
// @access  Private/Admin
exports.updateRoutine = async (req, res) => {
  try {
    const routine = await Routine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Routine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Routine updated successfully',
      data: routine
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid routine ID'
      });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating routine'
    });
  }
};

// @desc    Delete routine
// @route   DELETE /api/routines/:id
// @access  Private/Admin
exports.deleteRoutine = async (req, res) => {
  try {
    const routine = await Routine.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Routine not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Routine deleted successfully'
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid routine ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting routine'
    });
  }
};

// @desc    Update infant routine status
// @route   PUT /api/routines/infants/:infantId/date/:date/routine/:routineId
// @access  Private
exports.updateInfantRoutineStatus = async (req, res) => {
  try {
    const { infantId, date, routineId } = req.params;
    const { completed } = req.body;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(infantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(routineId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid routine ID'
      });
    }

    // Validate date format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD'
      });
    }

    // Find infant and check if user is parent
    const infant = await Infant.findOne({
      _id: infantId,
      'parents.user': req.user.id,
      isActive: true
    });

    if (!infant) {
      return res.status(404).json({
        success: false,
        message: 'Infant not found or access denied'
      });
    }

    // Check if routine exists
    const routine = await Routine.findById(routineId);
    if (!routine) {
      return res.status(404).json({
        success: false,
        message: 'Routine not found'
      });
    }

    // Find the date entry in routines array
    let dateEntryIndex = infant.routines.findIndex(entry => entry.date === date);

    if (completed) {
      // Add routine to date entry
      if (dateEntryIndex === -1) {
        // Create new date entry
        infant.routines.push({
          date: date,
          routineIds: [new mongoose.Types.ObjectId(routineId)]
        });
      } else {
        // Add routineId to existing date entry if not already present
        const routineObjectId = new mongoose.Types.ObjectId(routineId);
        const exists = infant.routines[dateEntryIndex].routineIds.some(id => 
          id.toString() === routineObjectId.toString());
        
        if (!exists) {
          infant.routines[dateEntryIndex].routineIds.push(routineObjectId);
        }
      }
    } else {
      // Remove routine from date entry
      if (dateEntryIndex !== -1) {
        const routineObjectId = new mongoose.Types.ObjectId(routineId);
        infant.routines[dateEntryIndex].routineIds = 
          infant.routines[dateEntryIndex].routineIds.filter(id => 
            id.toString() !== routineObjectId.toString());
        
        // If no routines left for this date, remove the entire entry
        if (infant.routines[dateEntryIndex].routineIds.length === 0) {
          infant.routines.splice(dateEntryIndex, 1);
        }
      }
    }

    // Save the infant
    await infant.save();

    res.status(200).json({
      success: true,
      message: `Routine ${completed ? 'completed' : 'unchecked'} successfully`,
      data: infant
    });
  } catch (error) {
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant, routine, or date format'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating routine status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get infant routines for a specific date
// @route   GET /api/routines/infants/:infantId/date/:date
// @access  Private
exports.getInfantRoutinesForDate = async (req, res) => {
  try {
    const { infantId, date } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(infantId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    // Validate date format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Expected YYYY-MM-DD'
      });
    }

    // Find infant and check if user is parent
    const infant = await Infant.findOne({
      _id: infantId,
      'parents.user': req.user.id,
      isActive: true
    });

    if (!infant) {
      return res.status(404).json({
        success: false,
        message: 'Infant not found or access denied'
      });
    }

    // Get all general routines (not personalized or personalized for this infant)
    const allRoutines = await Routine.find({
      isActive: true,
      $or: [
        { isPersonalized: { $ne: true } }, // Routines without isPersonalized field or isPersonalized: false
        { 
          isPersonalized: true,
          infantId: infantId
        }
      ]
    });

    // Filter personalized routines by date range
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);
    const filteredRoutines = allRoutines.filter(routine => {
      if (!routine.isPersonalized) return true; // General routines always show
      // If no date range set, treat as daily (always show)
      if (!routine.fromDate && !routine.toDate) return true;
      const from = routine.fromDate ? new Date(routine.fromDate) : null;
      const to = routine.toDate ? new Date(routine.toDate) : null;
      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(23, 59, 59, 999);
      if (from && queryDate < from) return false;
      if (to && queryDate > to) return false;
      return true;
    });

    // Find routines completed for the specific date
    const dateEntry = infant.routines.find(entry => entry.date === date);
    const completedRoutineIds = dateEntry ? dateEntry.routineIds.map(id => id.toString()) : [];

    // Map all routines with completion status
    const routinesWithStatus = filteredRoutines.map(routine => ({
      ...routine.toObject(),
      completed: completedRoutineIds.includes(routine._id.toString())
    }));

    // Calculate completion percentage based on your requirements:
    // (number of routines in date entry array / total routines in collection) * 100
    const completionPercentage = allRoutines.length > 0 
      ? Math.round((completedRoutineIds.length / allRoutines.length) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: routinesWithStatus,
      summary: {
        totalRoutines: allRoutines.length,
        completedRoutines: completedRoutineIds.length,
        completionPercentage: completionPercentage
      }
    });
  } catch (error) {
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant or date format'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching routines for date',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};