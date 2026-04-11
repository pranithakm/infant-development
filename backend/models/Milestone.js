const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Milestone name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Cognitive', 'Language', 'Physical', 'Social-Emotional'],
    trim: true
  },
  minMonths: {
    type: Number,
    required: [true, 'Minimum months is required']
  },
  maxMonths: {
    type: Number,
    required: [true, 'Maximum months is required']
  },
  recommendedAge: {
    type: String,
    required: [true, 'Recommended age is required'],
    trim: true
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
milestoneSchema.index({ category: 1, minMonths: 1 });

module.exports = mongoose.model('Milestone', milestoneSchema);