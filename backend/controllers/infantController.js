const Infant = require('../models/Infant');
const Milestone = require('../models/Milestone');
const User = require('../models/User');
const DateLog = require('../models/DateLog');

// @desc    Get all infants for logged in parent
// @route   GET /api/infants
// @access  Private
exports.getInfants = async (req, res) => {
  try {
    const infants = await Infant.find({ 
      'parents.user': req.user.id,
      isActive: true 
    })
    .populate('milestones.milestoneId', 'name category recommendedAge minMonths maxMonths')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: infants.length,
      data: infants
    });
  } catch (error) {
    console.error('Get infants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching infants'
    });
  }
};

// @desc    Get single infant
// @route   GET /api/infants/:id
// @access  Private
exports.getInfant = async (req, res) => {
  try {
    // Check if the ID is "new" (used in frontend routes but not a valid ObjectId)
    if (req.params.id === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    const infant = await Infant.findOne({
      _id: req.params.id,
      'parents.user': req.user.id,
      isActive: true
    })
    .populate('milestones.milestoneId', 'name category description recommendedAge minMonths maxMonths');

    if (!infant) {
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: infant
    });
  } catch (error) {
    console.error('Get infant error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching infant'
    });
  }
};

// @desc    Create new infant
// @route   POST /api/infants
// @access  Private
exports.createInfant = async (req, res) => {
  try {
    const { name, dateOfBirth, gender, birthWeight, birthLength, birthHeadCircumference, medicalInfo, avatar } = req.body;

    // Get all milestones to initialize the infant's milestones array
    const milestones = await Milestone.find({}, '_id');
    
    // Create milestones array with default status
    const infantMilestones = milestones.map(milestone => ({
      milestoneId: milestone._id,
      status: 'Not Started'
    }));

    // Initialize growth data array with birth measurements
    const growthData = [];
    if (birthWeight || birthLength || birthHeadCircumference) {
      growthData.push({
        date: dateOfBirth,
        height: birthLength,
        weight: birthWeight,
        headCircumference: birthHeadCircumference
      });
    }

    // Initialize calendar activities array
    const calendarActivities = [];

    // Create infant
    const infant = await Infant.create({
      name,
      dateOfBirth,
      gender,
      birthWeight,
      birthLength,
      birthHeadCircumference,
      currentHeight: birthLength,
      currentWeight: birthWeight,
      currentHeadCircumference: birthHeadCircumference,
      growthData,
      calendarActivities,
      medicalInfo,
      avatar,
      parents: [{
        user: req.user.id,
        relationship: 'Parent',
        isPrimary: true
      }],
      milestones: infantMilestones
    });

    // Populate milestone details for response
    const populatedInfant = await Infant.findById(infant._id)
      .populate('milestones.milestoneId', 'name category recommendedAge');

    res.status(201).json({
      success: true,
      message: 'Infant created successfully',
      data: populatedInfant
    });
  } catch (error) {
    console.error('Create infant error:', error);
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
      message: 'Server error while creating infant'
    });
  }
};

// @desc    Update milestone status
// @route   PUT /api/infants/:id/milestones/:milestoneId
// @access  Private
exports.updateMilestoneStatus = async (req, res) => {
  try {
    // Check if the ID is "new" (used in frontend routes but not a valid ObjectId)
    if (req.params.id === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    const { id: infantId, milestoneId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Not Started', 'Emerging', 'Developing', 'Achieved', 'Mastered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        validStatuses
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
        message: 'Infant not found'
      });
    }

    // Find the milestone in the infant's milestones array
    const milestoneIndex = infant.milestones.findIndex(
      m => m.milestoneId.toString() === milestoneId
    );

    if (milestoneIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found for this infant'
      });
    }

    // Get the previous status
    const previousStatus = infant.milestones[milestoneIndex].status;

    // Update the milestone status
    infant.milestones[milestoneIndex].status = status;
    
    // Save the infant
    await infant.save();

    // Log the activity if status changed to Achieved or Mastered
    if ((status === 'Achieved' || status === 'Mastered') && 
        (previousStatus !== 'Achieved' && previousStatus !== 'Mastered')) {
      
      // Get milestone details
      const milestone = await Milestone.findById(milestoneId);
      
      // Add calendar activity with proper date handling (avoiding timezone issues)
      const today = new Date();
      // Create date without time component in local timezone
      const activityDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Format date as YYYY-MM-DD string for consistent comparison
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const todayString = formatDate(activityDate);
      
      // Check if we already have an activity for today
      const existingActivityIndex = infant.calendarActivities.findIndex(activity => {
        const activityDateString = formatDate(new Date(activity.date));
        return activityDateString === todayString && 
               activity.type === 'milestone' &&
               activity.activity === milestone.name;
      });
      
      if (existingActivityIndex === -1) {
        // Add new activity
        infant.calendarActivities.push({
          date: activityDate,
          activity: milestone.name,
          type: 'milestone',
          status: status
        });
      } else {
        // Update existing activity
        infant.calendarActivities[existingActivityIndex].status = status;
      }
      
      await infant.save();
    }

    // Populate milestone details for response
    const populatedInfant = await Infant.findById(infant._id)
      .populate('milestones.milestoneId', 'name category recommendedAge');

    res.status(200).json({
      success: true,
      message: 'Milestone status updated successfully',
      data: populatedInfant
    });
  } catch (error) {
    console.error('Update milestone status error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant or milestone ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating milestone status'
    });
  }
};

// @desc    Get calendar activities for an infant
// @route   GET /api/infants/:id/calendar
// @access  Private
exports.getCalendarActivities = async (req, res) => {
  try {
    // Check if the ID is "new" (used in frontend routes but not a valid ObjectId)
    if (req.params.id === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    const infant = await Infant.findOne({
      _id: req.params.id,
      'parents.user': req.user.id,
      isActive: true
    });

    if (!infant) {
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }

    // Get current calendar activities
    let calendarActivities = [...infant.calendarActivities];

    // Generate celebration wishes (without reminders)
    const birthDate = new Date(infant.dateOfBirth);
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Calculate infant age in months
    let ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12;
    ageInMonths -= birthDate.getMonth();
    ageInMonths += today.getMonth();
    
    // Adjust for day in month
    if (today.getDate() < birthDate.getDate()) {
      ageInMonths--;
    }
    
    // Add celebration for date of birth (0 months)
    calendarActivities.push({
      date: birthDate,
      activity: `Birthday Celebration! 🎉`,
      type: 'special_occasion',
      values: {
        occasion: 'celebration',
        ageInMonths: 0
      }
    });
    
    // Add monthly celebrations for the first year, then every 6 months after that
    const maxAgeInMonths = 36; // Up to 3 years
    
    for (let months = 1; months <= maxAgeInMonths; months++) {
      // For first year (1-12 months): monthly celebrations
      // After first year (13-36 months): every 6 months
      if (months <= 12 || (months > 12 && months % 6 === 0)) {
        const celebrationDate = new Date(birthDate);
        celebrationDate.setMonth(birthDate.getMonth() + months);
        
        calendarActivities.push({
          date: celebrationDate,
          activity: `${months}${getOrdinalSuffix(months)} Month Celebration! 🎉`,
          type: 'special_occasion',
          values: {
            occasion: 'celebration',
            ageInMonths: months
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      data: calendarActivities
    });
  } catch (error) {
    console.error('Get calendar activities error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching calendar activities'
    });
  }
};

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(number) {
  if (number > 3 && number < 21) return 'th';
  switch (number % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

// @desc    Delete infant (soft delete)
// @route   DELETE /api/infants/:id
// @access  Private
exports.deleteInfant = async (req, res) => {
  try {
    // Check if the ID is "new" (used in frontend routes but not a valid ObjectId)
    if (req.params.id === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    const infant = await Infant.findOneAndUpdate(
      {
        _id: req.params.id,
        'parents.user': req.user.id
      },
      { isActive: false },
      { new: true }
    );

    if (!infant) {
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Infant deleted successfully'
    });
  } catch (error) {
    console.error('Delete infant error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting infant'
    });
  }
};