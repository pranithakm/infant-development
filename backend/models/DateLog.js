const mongoose = require('mongoose');

const dateLogSchema = new mongoose.Schema({
  infant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Infant',
    required: [true, 'Infant reference is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  activities: [{
    type: {
      type: String,
      required: [true, 'Activity type is required'],
      enum: ['milestone', 'growth', 'medical', 'note', 'custom', 'special_occasion']
    },
    description: {
      type: String,
      required: [true, 'Activity description is required']
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'activities.type' // References the model based on activity type
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed // Additional data specific to the activity
    }
  }],
  anniversary: {
    type: {
      type: String,
      enum: ['birth_month', 'milestone_anniversary']
    },
    description: String,
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'anniversary.type'
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
dateLogSchema.index({ infant: 1, date: -1 });
dateLogSchema.index({ 'activities.type': 1 });

module.exports = mongoose.model('DateLog', dateLogSchema);