import express from 'express';
import { pool } from '../database.js';

const router = express.Router();

router.get('/matrix', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const [rows] = await pool.execute(`
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

    // Transform data into nested object structure
    const matrixData = {};
    rows.forEach(row => {
      if (!matrixData[row.employee_id]) {
        matrixData[row.employee_id] = {};
      }
      matrixData[row.employee_id][row.date] = {
        hasCheckin: Boolean(row.has_checkin),
        hasCheckout: Boolean(row.has_checkout),
        rating: row.overall_rating
      };
    });

    res.json(matrixData);
  } catch (error) {
    console.error('Error fetching matrix data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
