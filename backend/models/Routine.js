const mongoose = require('mongoose');

const routineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Routine name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['feeding', 'sleep', 'hygiene', 'play', 'health', 'development', 'other', 'personalized']
  },
  recommendedFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'as_needed']
  },
  duration: {
    type: Number, // in minutes
    min: [1, 'Duration must be at least 1 minute']
  },
  isPersonalized: {
    type: Boolean,
    default: false
  },
  infantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Infant'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  fromDate: {
    type: Date,
    default: null
  },
  toDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better query performance
routineSchema.index({ category: 1 });
routineSchema.index({ isActive: 1 });
routineSchema.index({ infantId: 1 });
routineSchema.index({ isPersonalized: 1 });

module.exports = mongoose.model('Routine', routineSchema);