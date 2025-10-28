const DateLog = require('../models/DateLog');
const Infant = require('../models/Infant');
const Milestone = require('../models/Milestone');
const Growth = require('../models/Growth');

// @desc    Get all date logs for an infant
// @route   GET /api/dates/infant/:infantId
// @access  Private
exports.getDateLogs = async (req, res) => {
  try {
    // Check if the infantId is "new" (used in frontend routes but not a valid ObjectId)
    if (req.params.infantId === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    // Check if infant belongs to user
    const infant = await Infant.findOne({
      _id: req.params.infantId,
      'parents.user': req.user.id,
      isActive: true
    });

    if (!infant) {
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }

    const dateLogs = await DateLog.find({ infant: req.params.infantId })
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: dateLogs.length,
      data: dateLogs
    });
  } catch (error) {
    console.error('Get date logs error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching date logs'
    });
  }
};

// @desc    Get activities for a specific date
// @route   GET /api/dates/infant/:infantId/date/:date
// @access  Private
exports.getDateActivities = async (req, res) => {
  try {
    const { infantId, date } = req.params;
    
    // Check if the infantId is "new" (used in frontend routes but not a valid ObjectId)
    if (infantId === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    // Check if infant belongs to user
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

    // Parse the date string to a Date object
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Find date log for the specific date
    const dateLog = await DateLog.findOne({ 
      infant: infantId, 
      date: {
        $gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(parsedDate.setHours(23, 59, 59, 999))
      }
    });

    if (!dateLog) {
      return res.status(200).json({
        success: true,
        data: {
          date: parsedDate,
          activities: [],
          anniversary: null
        }
      });
    }

    res.status(200).json({
      success: true,
      data: dateLog
    });
  } catch (error) {
    console.error('Get date activities error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID or date format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching date activities'
    });
  }
};

// @desc    Create or update date log when activities happen
// @route   POST /api/dates/log
// @access  Private
exports.logActivity = async (req, res) => {
  try {
    const { infantId, date, activity } = req.body;

    // Check if the infantId is "new" (used in frontend routes but not a valid ObjectId)
    if (infantId === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    // Check if infant belongs to user
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

    // Parse the date string to a Date object
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Set time to start of day for consistent date matching
    const dateForQuery = new Date(parsedDate.setHours(0, 0, 0, 0));

    // Find existing date log or create new one
    let dateLog = await DateLog.findOne({ 
      infant: infantId, 
      date: dateForQuery
    });

    if (!dateLog) {
      dateLog = new DateLog({
        infant: infantId,
        date: dateForQuery,
        activities: []
      });
    }

    // Add the new activity
    dateLog.activities.push(activity);

    // Save the date log
    await dateLog.save();

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: dateLog
    });
  } catch (error) {
    console.error('Log activity error:', error);
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
      message: 'Server error while logging activity'
    });
  }
};

// @desc    Generate anniversary information for an infant
// @route   GET /api/dates/infant/:infantId/anniversaries
// @access  Private
exports.getAnniversaries = async (req, res) => {
  try {
    const { infantId } = req.params;
    
    // Check if the infantId is "new" (used in frontend routes but not a valid ObjectId)
    if (infantId === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }

    // Check if infant belongs to user
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

    // Get all date logs for the infant to identify milestone anniversaries
    const dateLogs = await DateLog.find({ infant: infantId });
    
    // Get infant's birth date
    const birthDate = new Date(infant.dateOfBirth);
    
    // Calculate upcoming anniversaries (birth months)
    const anniversaries = [];
    const today = new Date();
    
    // Add monthly anniversaries
    for (let i = 1; i <= 36; i++) { // Up to 3 years
      const anniversaryDate = new Date(birthDate);
      anniversaryDate.setMonth(birthDate.getMonth() + i);
      
      if (anniversaryDate > today) break;
      
      anniversaries.push({
        date: anniversaryDate,
        type: 'birth_month',
        description: `${i}${getOrdinalSuffix(i)} month anniversary`
      });
    }
    
    // Add milestone anniversaries from date logs
    dateLogs.forEach(log => {
      log.activities.forEach(activity => {
        if (activity.type === 'milestone' && activity.metadata && activity.metadata.achievedDate) {
          const achievedDate = new Date(activity.metadata.achievedDate);
          const monthsDiff = monthDiff(achievedDate, today);
          
          // Add yearly anniversaries (12 months, 24 months, etc.)
          for (let i = 1; i <= 3; i++) { // Up to 3 years of anniversaries
            const anniversaryMonths = i * 12;
            if (monthsDiff >= anniversaryMonths) {
              const anniversaryDate = new Date(achievedDate);
              anniversaryDate.setMonth(achievedDate.getMonth() + anniversaryMonths);
              
              anniversaries.push({
                date: anniversaryDate,
                type: 'milestone_anniversary',
                description: `${anniversaryMonths} months since ${activity.description}`
              });
            }
          }
        }
      });
    });

    res.status(200).json({
      success: true,
      data: anniversaries
    });
  } catch (error) {
    console.error('Get anniversaries error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching anniversaries'
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

// Helper function to calculate month difference between two dates
function monthDiff(dateFrom, dateTo) {
  return dateTo.getMonth() - dateFrom.getMonth() + 
    (12 * (dateTo.getFullYear() - dateFrom.getFullYear()));
}