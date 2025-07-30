const mongoose = require('mongoose');

// This migration adds the annual leave configuration schema
module.exports = {
  async up() {
    try {
      // Create annual leave config schema
      const annualLeaveConfigSchema = new mongoose.Schema({
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

      // Create the model if it doesn't exist
      try {
        mongoose.model('AnnualLeaveConfig', annualLeaveConfigSchema);
        console.log('AnnualLeaveConfig model already exists, skipping creation');
      } catch (e) {
        mongoose.model('AnnualLeaveConfig', annualLeaveConfigSchema);
        console.log('Created AnnualLeaveConfig model');
      }

      // Insert default configuration if none exists
      const AnnualLeaveConfig = mongoose.model('AnnualLeaveConfig');
      const configCount = await AnnualLeaveConfig.countDocuments();
      if (configCount === 0) {
        await AnnualLeaveConfig.create({
          resetDate: '07-16',
          defaultAnnualLeaveAllowance: 14
        });
        console.log('Inserted default annual leave configuration');
      }
      
      console.log('Annual leave config migration completed successfully');
    } catch (error) {
      console.error('Error in annual leave config migration:', error);
      throw error;
    }
  },

  async down() {
    try {
      // Drop the collection if needed for rollback
      await mongoose.connection.dropCollection('annualleaveconfigs');
      console.log('Dropped AnnualLeaveConfig collection');
    } catch (error) {
      console.error('Error in annual leave config rollback migration:', error);
      throw error;
    }
  }
};