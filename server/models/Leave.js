import { pool } from '../database.js';
import moment from 'moment';
import { ProjectSettings } from './ProjectSettings.js';
import { Attendance } from './Attendance.js';

export class Leave {
  static async applyLeave(employeeId, description) {
    const today = moment().format('YYYY-MM-DD');

    // Check if already applied for leave today
    const [existing] = await pool.execute(
        'SELECT id FROM leaves WHERE employee_id = ? AND date = ?',
        [employeeId, today]
    );

    if (existing.length > 0) {
      throw new Error('Already applied for leave today');
    }

    const [result] = await pool.execute(
        'INSERT INTO leaves (employee_id, date, description) VALUES (?, ?, ?)',
        [employeeId, today, description]
    );
    return result;
  }

  static async getTodayLeave(employeeId) {
    const today = moment().format('YYYY-MM-DD');
    const [rows] = await pool.execute(
        'SELECT * FROM leaves WHERE employee_id = ? AND date = ?',
        [employeeId, today]
    );
    return rows[0];
  }

  static async getEmployeeLeaves(employeeId, limit = 30) {
    const safeLimit = Number(limit);
    if (isNaN(safeLimit) || safeLimit <= 0) {
      throw new Error("Invalid limit provided.");
    }

    const [rows] = await pool.execute(
        `SELECT * FROM leaves 
       WHERE employee_id = ? 
       ORDER BY date DESC 
       LIMIT ${safeLimit}`,
        [employeeId]
    );
    return rows;
  }

  static async getAllLeaves() {
    const [rows] = await pool.execute(`
      SELECT l.*, e.username, e.display_name 
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      ORDER BY l.date DESC
    `);
    return rows;
  }

  static async getLeavesByDate(date) {
    const [rows] = await pool.execute(`
      SELECT l.*, e.username, e.display_name 
      FROM leaves l
      JOIN employees e ON l.employee_id = e.id
      WHERE l.date = ?
    `, [date]);
    return rows;
  }

  static async calculateRemainingLeave(employeeId) {
    try {
      // Get annual leave allowance from settings
      const annualLeaveAllowance = await ProjectSettings.getAnnualLeaveConfig();
      const resetDateStr = await ProjectSettings.getAnnualLeaveResetDate();

      // Parse reset date (MM-DD format)
      const resetDateParts = resetDateStr.split('-');
      const resetMonth = parseInt(resetDateParts[0], 10) - 1; // JS months are 0-indexed
      const resetDay = parseInt(resetDateParts[1], 10);

      // Calculate current leave year start and end dates
      const now = new Date();
      let yearStartDate, yearEndDate;

      // If current date is past reset date this year, the year starts from this year's reset date
      if (now.getMonth() > resetMonth || (now.getMonth() === resetMonth && now.getDate() >= resetDay)) {
        yearStartDate = new Date(now.getFullYear(), resetMonth, resetDay);
        yearEndDate = new Date(now.getFullYear() + 1, resetMonth, resetDay - 1);
      } else {
        // Otherwise the year started from last year's reset date
        yearStartDate = new Date(now.getFullYear() - 1, resetMonth, resetDay);
        yearEndDate = new Date(now.getFullYear(), resetMonth, resetDay - 1);
      }

      // Format dates for SQL query
      const formattedStartDate = moment(yearStartDate).format('YYYY-MM-DD');
      const formattedEndDate = moment(yearEndDate).format('YYYY-MM-DD');

      // Get leaves within the current leave year
      const [leaves] = await pool.execute(`
        SELECT * FROM leaves
        WHERE employee_id = ?
          AND date >= ?
          AND date <= ?
      `, [employeeId, formattedStartDate, formattedEndDate]);

      // Count approved leaves
      const takenLeaves = leaves.length;

      // Get days with no check-in or check-out within the current leave year
      const [incompleteAttendance] = await pool.execute(`
        SELECT COUNT(*) as count
        FROM attendance
        WHERE employee_id = ?
          AND date >= ?
          AND date <= ?
          AND (check_in_time IS NULL OR check_out_time IS NULL)
      `, [employeeId, formattedStartDate, formattedEndDate]);

      const noCheckInOutDays = incompleteAttendance[0]?.count || 0;

      // Calculate remaining leave
      const totalUsed = takenLeaves + parseInt(noCheckInOutDays);
      const remaining = Math.max(0, annualLeaveAllowance - totalUsed);

      return {
        annualLeaveAllowance,
        takenLeaves,
        noCheckInOutDays: parseInt(noCheckInOutDays),
        totalUsed,
        remaining,
        yearStartDate: formattedStartDate,
        yearEndDate: formattedEndDate
      };
    } catch (error) {
      console.error('Error calculating remaining leave:', error);
      throw error;
    }
  }}

