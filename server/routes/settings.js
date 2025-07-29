import express from 'express';
import { pool } from '../database.js';

const router = express.Router();

// Get project settings
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM project_settings ORDER BY setting_key'
    );
    
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = {
        value: row.setting_value,
        description: row.description,
        updated_at: row.updated_at
      };
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project start date
router.put('/project_start_date', async (req, res) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    await pool.execute(
      'UPDATE project_settings SET setting_value = ?, updated_at = NOW() WHERE setting_key = ?',
      [date, 'project_start_date']
    );

    res.json({ message: 'Project start date updated successfully' });
  } catch (error) {
    console.error('Error updating project start date:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;