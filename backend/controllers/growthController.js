const Growth = require('../models/Growth');
const Infant = require('../models/Infant');
const DateLog = require('../models/DateLog');

// @desc    Get all growth measurements for an infant
// @route   GET /api/growth/infant/:infantId
// @access  Private
exports.getGrowthMeasurements = async (req, res) => {
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

    const measurements = await Growth.find({ infant: req.params.infantId })
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: measurements.length,
      data: measurements
    });
  } catch (error) {
    console.error('Get growth measurements error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid infant ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while fetching growth measurements'
    });
  }
};

// @desc    Add a new growth measurement
// @route   POST /api/growth
// @access  Private
exports.addGrowthMeasurement = async (req, res) => {
  try {
    const { infantId, date, height, weight, headCircumference, notes } = req.body;

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

    // Create growth measurement
    const growth = await Growth.create({
      infant: infantId,
      date,
      height,
      weight,
      headCircumference,
      notes
    });

    // Update the growthData array in the infant schema
    infant.growthData = infant.growthData || [];
    infant.growthData.push({
      date,
      height,
      weight,
      headCircumference
    });
    
    // Update current values
    if (height) infant.currentHeight = height;
    if (weight) infant.currentWeight = weight;
    if (headCircumference) infant.currentHeadCircumference = headCircumference;
    
    await infant.save();

    // Log the activity in the calendarActivities field with improved date handling
    const parsedDate = new Date(date);
    // Create date without time component in local timezone
    const activityDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
    
    // Format date as YYYY-MM-DD string for consistent comparison
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const activityDateString = formatDate(activityDate);
    
    // Check if we already have a growth activity for this date
    const existingActivityIndex = infant.calendarActivities.findIndex(activity => {
      const existingActivityDateString = formatDate(new Date(activity.date));
      return existingActivityDateString === activityDateString && 
             activity.type === 'growth';
    });
    
    if (existingActivityIndex === -1) {
      // Add new activity
      infant.calendarActivities.push({
        date: activityDate,
        activity: 'Growth measurement added',
        type: 'growth',
        values: {
          height,
          weight,
          headCircumference
        }
      });
    } else {
      // Update existing activity
      infant.calendarActivities[existingActivityIndex].values = {
        height,
        weight,
        headCircumference
      };
    }
    
    await infant.save();

    res.status(201).json({
      success: true,
      message: 'Growth measurement added successfully',
      data: growth
    });
  } catch (error) {
    console.error('Add growth measurement error:', error);
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
      message: 'Server error while adding growth measurement'
    });
  }
};

// @desc    Update a growth measurement
// @route   PUT /api/growth/:id
// @access  Private
exports.updateGrowthMeasurement = async (req, res) => {
  try {
    // Check if the ID is "new" (used in frontend routes but not a valid ObjectId)
    if (req.params.id === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid growth measurement ID'
      });
    }

    const { date, height, weight, headCircumference, notes } = req.body;

    // Find growth measurement and check if it belongs to user's infant
    let growth = await Growth.findById(req.params.id).populate('infant');

    if (!growth) {
      return res.status(404).json({
        success: false,
        message: 'Growth measurement not found'
      });
    }

    // Check if infant belongs to user
    const infant = await Infant.findOne({
      _id: growth.infant._id,
      'parents.user': req.user.id,
      isActive: true
    });

    if (!infant) {
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }

    // Update growth measurement
    growth = await Growth.findByIdAndUpdate(
      req.params.id,
      { date, height, weight, headCircumference, notes },
      {
        new: true,
        runValidators: true
      }
    );

    // Update the growthData array in the infant schema
    const growthDataIndex = infant.growthData.findIndex(item => 
      new Date(item.date).getTime() === new Date(growth.date).getTime()
    );
    
    if (growthDataIndex !== -1) {
      // Update existing entry
      infant.growthData[growthDataIndex] = {
        date: growth.date,
        height: growth.height,
        weight: growth.weight,
        headCircumference: growth.headCircumference
      };
    } else {
      // Add new entry
      infant.growthData = infant.growthData || [];
      infant.growthData.push({
        date: growth.date,
        height: growth.height,
        weight: growth.weight,
        headCircumference: growth.headCircumference
      });
    }
    
    // Update current values
    if (growth.height) infant.currentHeight = growth.height;
    if (growth.weight) infant.currentWeight = growth.weight;
    if (growth.headCircumference) infant.currentHeadCircumference = growth.headCircumference;
    
    await infant.save();

    res.status(200).json({
      success: true,
      message: 'Growth measurement updated successfully',
      data: growth
    });
  } catch (error) {
    console.error('Update growth measurement error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid growth measurement ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while updating growth measurement'
    });
  }
};

// @desc    Delete a growth measurement
// @route   DELETE /api/growth/:id
// @access  Private
exports.deleteGrowthMeasurement = async (req, res) => {
  try {
    // Check if the ID is "new" (used in frontend routes but not a valid ObjectId)
    if (req.params.id === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Invalid growth measurement ID'
      });
    }

    // Find growth measurement and check if it belongs to user's infant
    let growth = await Growth.findById(req.params.id).populate('infant');

    if (!growth) {
      return res.status(404).json({
        success: false,
        message: 'Growth measurement not found'
      });
    }

    // Check if infant belongs to user
    const infant = await Infant.findOne({
      _id: growth.infant._id,
      'parents.user': req.user.id,
      isActive: true
    });

    if (!infant) {
      return res.status(404).json({
        success: false,
        message: 'Infant not found'
      });
    }

    // Delete growth measurement
    await Growth.findByIdAndDelete(req.params.id);

    // Remove from growthData array in infant schema
    infant.growthData = infant.growthData.filter(item => 
      new Date(item.date).getTime() !== new Date(growth.date).getTime()
    );
    
    await infant.save();

    res.status(200).json({
      success: true,
      message: 'Growth measurement deleted successfully'
    });
  } catch (error) {
    console.error('Delete growth measurement error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid growth measurement ID'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting growth measurement'
    });
  }
};