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
      throw new Error('You have already applied for leave today');
    }
    
    // Check if already checked in or out today
    const [attendance] = await pool.execute(
      'SELECT check_in_time, check_out_time FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );
    
    if (attendance.length > 0 && (attendance[0].check_in_time || attendance[0].check_out_time)) {
      throw new Error('Cannot apply for leave after check-in or check-out');
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
    const [rows] = await pool.execute(
      'SELECT * FROM leaves WHERE employee_id = ? ORDER BY date DESC LIMIT ?',
      [employeeId, limit]
    );
    return rows;
  }
}