const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vaccination name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  daysFromBirth: {
    type: Number,
    required: [true, 'Days from birth is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  administration: {
    type: String,
    required: [true, 'Administration method is required']
  },
  protection: {
    type: String,
    required: [true, 'Protection info is required']
  },
  sideEffects: {
    type: [String],
    default: []
  },
  dosage: {
    type: String,
    default: 'Single dose'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vaccination', vaccinationSchema);
