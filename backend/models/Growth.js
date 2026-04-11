const mongoose = require('mongoose');

const growthSchema = new mongoose.Schema({
  infant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Infant',
    required: [true, 'Infant reference is required']
  },
  date: {
    type: Date,
    required: [true, 'Measurement date is required']
  },
  height: {
    type: Number,
    min: [0, 'Height must be positive']
  },
  weight: {
    type: Number,
    min: [0, 'Weight must be positive']
  },
  headCircumference: {
    type: Number,
    min: [0, 'Head circumference must be positive']
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for better query performance
growthSchema.index({ infant: 1, date: -1 });

module.exports = mongoose.model('Growth', growthSchema);