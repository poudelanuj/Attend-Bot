import express from 'express';
import { Attendance } from '../models/Attendance.js';
import { pool } from '../database.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const stats = await Attendance.getAttendanceStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/kpis', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    const thisYear = new Date().getFullYear();

    // Today's KPIs
    const [todayStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT e.id) as total_employees,
        COUNT(DISTINCT CASE WHEN a.check_in_time IS NOT NULL THEN a.employee_id END) as today_checkins,
        COUNT(DISTINCT CASE WHEN a.check_out_time IS NOT NULL THEN a.employee_id END) as today_checkouts,
        COUNT(DISTINCT l.employee_id) as today_leaves,
        AVG(a.overall_rating) as today_avg_rating,
        AVG(CASE WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL 
            THEN TIMESTAMPDIFF(HOUR, a.check_in_time, a.check_out_time) END) as today_avg_hours
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id AND DATE(a.date) = ?
      LEFT JOIN leaves l ON e.id = l.employee_id AND DATE(l.date) = ?
      WHERE e.is_active = 1
    `, [today, today]);

    // This month's KPIs
    const [monthStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT a.employee_id) as active_employees,
        COUNT(DISTINCT CASE WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL 
              THEN CONCAT(a.employee_id, '-', a.date) END) as completed_days,
        COUNT(DISTINCT l.employee_id) as employees_on_leave,
        COUNT(DISTINCT CONCAT(l.employee_id, '-', l.date)) as total_leave_days,
        AVG(a.overall_rating) as month_avg_rating,
        AVG(CASE WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL 
            THEN TIMESTAMPDIFF(HOUR, a.check_in_time, a.check_out_time) END) as month_avg_hours
      FROM attendance a
      LEFT JOIN leaves l ON DATE_FORMAT(l.date, '%Y-%m') = ?
      WHERE DATE_FORMAT(a.date, '%Y-%m') = ?
    `, [thisMonth, thisMonth]);

    // This year's KPIs
    const [yearStats] = await pool.execute(`
      SELECT 
        COUNT(DISTINCT a.employee_id) as active_employees,
        COUNT(DISTINCT CASE WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL 
              THEN CONCAT(a.employee_id, '-', a.date) END) as completed_days,
        COUNT(DISTINCT l.employee_id) as employees_on_leave,
        COUNT(DISTINCT CONCAT(l.employee_id, '-', l.date)) as total_leave_days,
        AVG(a.overall_rating) as year_avg_rating,
        AVG(CASE WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL 
            THEN TIMESTAMPDIFF(HOUR, a.check_in_time, a.check_out_time) END) as year_avg_hours
      FROM attendance a
      LEFT JOIN leaves l ON YEAR(l.date) = ?
      WHERE YEAR(a.date) = ?
    `, [thisYear, thisYear]);

    res.json({
      today: todayStats[0],
      month: monthStats[0],
      year: yearStats[0]
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/today-records', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [records] = await pool.execute(`
      SELECT 
        e.id,
        e.username,
        e.display_name,
        a.check_in_time,
        a.check_out_time,
        a.today_plan,
        a.yesterday_task,
        a.current_status,
        a.work_from,
        a.accomplishments,
        a.blockers,
        a.tomorrow_priorities,
        a.overall_rating,
        CASE 
          WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL 
          THEN ROUND(TIMESTAMPDIFF(MINUTE, a.check_in_time, a.check_out_time) / 60.0, 1)
          ELSE NULL 
        END as hours_worked
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id AND DATE(a.date) = ?
      WHERE e.is_active = 1
      ORDER BY e.username
    `, [today]);

    res.json(records);
  } catch (error) {
    console.error('Error fetching today records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/checkin-status', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [statusData] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NULL THEN 1 ELSE 0 END) as checked_in_only,
        SUM(CASE WHEN a.check_in_time IS NULL THEN 1 ELSE 0 END) as not_checked_in
      FROM employees e
      LEFT JOIN attendance a ON e.id = a.employee_id AND DATE(a.date) = ?
      WHERE e.is_active = 1
    `, [today]);

    res.json(statusData[0]);
  } catch (error) {
    console.error('Error fetching checkin status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/employee-leave-summary', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get annual leave config
    const [configRows] = await pool.execute(
      'SELECT setting_value FROM project_settings WHERE setting_key = "annual_leave_days"'
    );
    const annualLeaveAllocation = configRows[0] ? parseInt(configRows[0].setting_value) : 20;

    // Get leave usage per employee
    const [leaveUsage] = await pool.execute(`
      SELECT 
        e.id,
        e.username,
        e.display_name,
        COUNT(l.id) as leaves_taken,
        ? - COUNT(l.id) as leaves_remaining
      FROM employees e
      LEFT JOIN leaves l ON e.id = l.employee_id AND YEAR(l.date) = ?
      WHERE e.is_active = 1
      GROUP BY e.id, e.username, e.display_name
      ORDER BY e.username
    `, [annualLeaveAllocation, currentYear]);

    res.json({
      annualLeaveAllocation,
      currentYear,
      employees: leaveUsage
    });
  } catch (error) {
    console.error('Error fetching employee leave summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;