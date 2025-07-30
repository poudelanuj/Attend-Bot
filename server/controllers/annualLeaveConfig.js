const AnnualLeaveConfig = require('../models/annualLeaveConfig');

// Get the current annual leave configuration
exports.getConfig = async (req, res) => {
  try {
    let config = await AnnualLeaveConfig.findOne();
    
    // If no configuration exists, create a default one
    if (!config) {
      config = await AnnualLeaveConfig.create({
        resetDate: '07-16',
        defaultAnnualLeaveAllowance: 14
      });
    }
    
    res.status(200).json(config);
  } catch (error) {
    console.error('Error getting annual leave config:', error);
    res.status(500).json({ message: 'Error getting annual leave configuration', error: error.message });
  }
};

// Update the annual leave configuration
exports.updateConfig = async (req, res) => {
  try {
    const { resetDate, defaultAnnualLeaveAllowance } = req.body;
    
    // Validate inputs
    if (resetDate) {
      // Validate date format (MM-DD)
      const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
      if (!dateRegex.test(resetDate)) {
        return res.status(400).json({ message: 'Invalid reset date format. Use MM-DD format.' });
      }
    }
    
    if (defaultAnnualLeaveAllowance !== undefined && 
        (isNaN(defaultAnnualLeaveAllowance) || defaultAnnualLeaveAllowance < 0)) {
      return res.status(400).json({ message: 'Default annual leave allowance must be a positive number.' });
    }
    
    // Find existing config or create a new one if it doesn't exist
    let config = await AnnualLeaveConfig.findOne();
    
    if (config) {
      config.resetDate = resetDate || config.resetDate;
      config.defaultAnnualLeaveAllowance = defaultAnnualLeaveAllowance !== undefined ? 
        defaultAnnualLeaveAllowance : config.defaultAnnualLeaveAllowance;
      await config.save();
    } else {
      config = await AnnualLeaveConfig.create({
        resetDate: resetDate || '07-16',
        defaultAnnualLeaveAllowance: defaultAnnualLeaveAllowance !== undefined ? 
          defaultAnnualLeaveAllowance : 14
      });
    }
    
    res.status(200).json(config);
  } catch (error) {
    console.error('Error updating annual leave config:', error);
    res.status(500).json({ message: 'Error updating annual leave configuration', error: error.message });
  }
};

// Calculate remaining leave for an employee
exports.calculateRemainingLeave = async (employeeId, attendances) => {
  try {
    const config = await AnnualLeaveConfig.findOne();
    if (!config) {
      throw new Error('Annual leave configuration not found');
    }
    
    // Get total annual leave allowance
    const totalAllowance = config.defaultAnnualLeaveAllowance;
    
    // Count absences (no check-in or check-out)
    const absences = attendances.filter(attendance => 
      !attendance.checkIn || !attendance.checkOut
    ).length;
    
    // Calculate remaining leave
    const remainingLeave = totalAllowance - absences;
    
    return {
      totalAllowance,
      absences,
      remainingLeave: Math.max(0, remainingLeave)
    };
  } catch (error) {
    console.error('Error calculating remaining leave:', error);
    throw error;
  }
};