const Scheme = require('../models/Scheme');

// Get all schemes
exports.getAllSchemes = async (req, res) => {
  try {
    const schemes = await Scheme.find().sort({ name: 1 });
    res.json(schemes);
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({ message: 'Server error while fetching schemes' });
  }
};

// Get a specific scheme by ID
exports.getSchemeById = async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) {
      return res.status(404).json({ message: 'Scheme not found' });
    }
    res.json(scheme);
  } catch (error) {
    console.error('Error fetching scheme:', error);
    res.status(500).json({ message: 'Server error while fetching scheme' });
  }
};

// Create a new scheme (for admin use)
exports.createScheme = async (req, res) => {
  try {
    const {
      name,
      stateScope,
      type,
      eligibility,
      objective,
      benefits,
      description,
      officialLink
    } = req.body;

    const scheme = new Scheme({
      name,
      stateScope,
      type,
      eligibility,
      objective,
      benefits,
      description,
      officialLink
    });

    const savedScheme = await scheme.save();
    res.status(201).json(savedScheme);
  } catch (error) {
    console.error('Error creating scheme:', error);
    res.status(500).json({ message: 'Server error while creating scheme' });
  }
};

// Update a scheme (for admin use)
exports.updateScheme = async (req, res) => {
  try {
    const {
      name,
      stateScope,
      type,
      eligibility,
      objective,
      benefits,
      description,
      officialLink
    } = req.body;

    const scheme = await Scheme.findByIdAndUpdate(
      req.params.id,
      {
        name,
        stateScope,
        type,
        eligibility,
        objective,
        benefits,
        description,
        officialLink
      },
      { new: true, runValidators: true }
    );

    if (!scheme) {
      return res.status(404).json({ message: 'Scheme not found' });
    }

    res.json(scheme);
  } catch (error) {
    console.error('Error updating scheme:', error);
    res.status(500).json({ message: 'Server error while updating scheme' });
  }
};

// Delete a scheme (for admin use)
exports.deleteScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findByIdAndDelete(req.params.id);

    if (!scheme) {
      return res.status(404).json({ message: 'Scheme not found' });
    }

    res.json({ message: 'Scheme deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheme:', error);
    res.status(500).json({ message: 'Server error while deleting scheme' });
  }
};