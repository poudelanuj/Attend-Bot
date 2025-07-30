import express from 'express';
import { ProjectSettings } from '../models/ProjectSettings.js';
import { pool } from '../database.js';

const router = express.Router();

// Get project settings
router.get('/', async (req, res) => {
  try {
    const settings = await ProjectSettings.getSettings();

    // Get annual leave settings
    const annualLeaveDays = await ProjectSettings.getAnnualLeaveConfig();
    const annualLeaveResetDate = await ProjectSettings.getAnnualLeaveResetDate();
    const projectStartDate = await ProjectSettings.getProjectStartDate();
    res.json({
      ...(settings || { start_date: null }),
      annualLeaveDays,
      annualLeaveResetDate,
      projectStartDate
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project start date
router.put('/start-date', async (req, res) => {
  try {
    const { startDate } = req.body;

    if (!startDate) {
      return res.status(400).json({ message: 'Start date is required' });
    }

    await ProjectSettings.updateStartDate(startDate);
    res.json({ message: 'Start date updated successfully' });
  } catch (error) {
    console.error('Error updating start date:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update annual leave configuration
router.put('/', async (req, res) => {
  try {
    const { days, resetDate, projectStartDate } = req.body;

    if (days === undefined && resetDate === undefined && projectStartDate === undefined) {
      return res.status(400).json({ message: 'Either days or resetDate must be provided' });
    }

    if (days !== undefined) {
      const numDays = parseInt(days);
      if (isNaN(numDays) || numDays < 0) {
        return res.status(400).json({ message: 'Days must be a positive number' });
      }
      await ProjectSettings.updateAnnualLeaveConfig(numDays);
    }

    if (resetDate !== undefined) {
      try {
        await ProjectSettings.updateAnnualLeaveResetDate(resetDate);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    if (projectStartDate !== undefined) {
      try {
        await ProjectSettings.updateStartDate(projectStartDate);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
