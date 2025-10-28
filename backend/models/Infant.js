const mongoose = require('mongoose');

const infantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Infant name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['male', 'female', 'other']
  },
  birthWeight: {
    type: Number,
    min: [0, 'Birth weight must be positive']
  },
  birthLength: {
    type: Number,
    min: [0, 'Birth length must be positive']
  },
  birthHeadCircumference: {
    type: Number,
    required: [true, 'Birth head circumference is required'],
    min: [0, 'Birth head circumference must be positive']
  },
  currentHeight: {
    type: Number,
    min: [0, 'Current height must be positive']
  },
  currentWeight: {
    type: Number,
    min: [0, 'Current weight must be positive']
  },
  currentHeadCircumference: {
    type: Number,
    min: [0, 'Current head circumference must be positive']
  },
  growthData: [{
    date: {
      type: Date,
      required: true
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
    }
  }],
  // New calendar activities field
  calendarActivities: [{
    date: {
      type: Date,
      required: true
    },
    activity: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['milestone', 'growth', 'special_occasion']
    },
    status: {
      // For milestones
      type: String,
      enum: ['Not Started', 'Emerging', 'Developing', 'Achieved', 'Mastered']
    },
    values: {
      // For growth measurements
      height: Number,
      weight: Number,
      headCircumference: Number
    }
  }],
  parents: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required'],
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  medicalInfo: {
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
    },
    allergies: [{
      type: String,
      trim: true
    }],
    medications: [{
      type: String,
      trim: true
    }],
    conditions: [{
      type: String,
      trim: true
    }],
    pediatrician: {
      name: String,
      contact: String
    }
  },
  milestones: [{
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
      required: true
    },
    status: {
      type: String,
      enum: ['Not Started', 'Emerging', 'Developing', 'Achieved', 'Mastered'],
      default: 'Not Started'
    }
  }],
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to calculate age in months and days
infantSchema.virtual('ageInMonths').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  
  let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
  months -= birthDate.getMonth();
  months += today.getMonth();
  
  return Math.max(0, months);
});

infantSchema.virtual('ageInDays').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  
  const diffTime = Math.abs(today - birthDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Index for better query performance
infantSchema.index({ 'parents.user': 1 });
infantSchema.index({ isActive: 1 });
infantSchema.index({ 'calendarActivities.date': 1 });

module.exports = mongoose.model('Infant', infantSchema);