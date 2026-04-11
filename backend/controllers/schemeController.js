const Scheme = require('../models/Scheme');

// @desc    Get all schemes
// @route   GET /api/schemes
// @access  Public
exports.getSchemes = async (req, res) => {
  try {
    const schemes = await Scheme.find().sort({ Name: 1 });
    res.status(200).json({
      success: true,
      count: schemes.length,
      data: schemes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// @desc    Get single scheme
// @route   GET /api/schemes/:id
// @access  Public
exports.getScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        error: 'Scheme not found'
      });
    }

    res.status(200).json({
      success: true,
      data: scheme
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};
