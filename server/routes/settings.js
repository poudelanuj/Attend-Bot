import express from 'express';
import { ProjectSettings } from '../models/ProjectSettings.js';

const router = express.Router();

// Get project settings
router.get('/', async (req, res) => {
  try {
    const settings = await ProjectSettings.getSettings();
    res.json(settings || { start_date: null });
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

export default router;
