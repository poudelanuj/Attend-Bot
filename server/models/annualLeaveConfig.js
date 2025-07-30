const mongoose = require('mongoose');

const AnnualLeaveConfigSchema = new mongoose.Schema({
  resetDate: {
    type: String,
    default: '07-16', // July 16th format MM-DD
    required: true,
  },
  defaultAnnualLeaveAllowance: {
    type: Number,
    default: 14,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the updatedAt field
AnnualLeaveConfigSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AnnualLeaveConfig', AnnualLeaveConfigSchema);