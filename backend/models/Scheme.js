const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
    trim: true
  },
  'State/Scope': {
    type: String,
    required: true,
    trim: true
  },
  Type: {
    type: String,
    trim: true
  },
  'Eligibility / Target Group': {
    type: String,
    trim: true
  },
  Objective: {
    type: String,
    trim: true
  },
  Benefits: {
    type: String,
    trim: true
  },
  Description: {
    type: String,
    trim: true
  },
  'Official Link': {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'schemes' // Explicitly specify collection name
});

module.exports = mongoose.model('Scheme', schemeSchema);
