import { pool } from '../database.js';
import moment from 'moment';

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
}
