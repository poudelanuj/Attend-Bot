import express from 'express';
import { pool } from '../database.js';

const router = express.Router();

router.get('/matrix', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Get attendance data
    const [attendanceRows] = await pool.execute(`
      SELECT 
        a.employee_id,
        DATE_FORMAT(a.date, '%Y-%m-%d') as date,
        a.check_in_time IS NOT NULL as has_checkin,
        a.check_out_time IS NOT NULL as has_checkout,
        a.overall_rating
      FROM attendance a
      WHERE a.date BETWEEN ? AND ?
      ORDER BY a.employee_id, a.date
    `, [startDate, endDate]);

    // Get leave data
    const [leaveRows] = await pool.execute(`
      SELECT 
        l.employee_id,
        DATE_FORMAT(l.date, '%Y-%m-%d') as date,
        l.description
      FROM leaves l
      WHERE l.date BETWEEN ? AND ?
      ORDER BY l.employee_id, l.date
    `, [startDate, endDate]);

    // Get holidays
    const [holidayRows] = await pool.execute(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m-%d') as date,
        name,
        description
      FROM holidays
      WHERE date BETWEEN ? AND ?
    `, [startDate, endDate]);

    // Get project start date
    const [settingsRows] = await pool.execute(`
      SELECT setting_value FROM project_settings WHERE setting_key = 'project_start_date'
    `);
    const projectStartDate = settingsRows[0]?.setting_value || startDate;

    // Transform data into nested object structure
    const matrixData = {};
    attendanceRows.forEach(row => {
      if (!matrixData[row.employee_id]) {
        matrixData[row.employee_id] = {};
      }
      matrixData[row.employee_id][row.date] = {
        type: 'attendance',
        hasCheckin: Boolean(row.has_checkin),
        hasCheckout: Boolean(row.has_checkout),
        rating: row.overall_rating
      };
    });

    // Add leave data
    leaveRows.forEach(row => {
      if (!matrixData[row.employee_id]) {
        matrixData[row.employee_id] = {};
      }
      matrixData[row.employee_id][row.date] = {
        type: 'leave',
        description: row.description
      };
    });

    // Create holidays map
    const holidays = {};
    holidayRows.forEach(row => {
      holidays[row.date] = {
        name: row.name,
        description: row.description
      };
    });

    res.json({
      attendance: matrixData,
      holidays: holidays,
      projectStartDate: projectStartDate
    });
  } catch (error) {
    console.error('Error fetching matrix data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
