import { pool } from '../database.js';
import moment from 'moment';

export class Attendance {
  static async checkIn(employeeId, checkInData) {
    const today = moment().format('YYYY-MM-DD');
    const { todayPlan, yesterdayTask, currentStatus, workFrom } = checkInData;
    
    // Check if already checked in today
    const [existing] = await pool.execute(
      'SELECT check_in_time FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );
    
    if (existing.length > 0 && existing[0].check_in_time) {
      throw new Error('Already checked in today');
    }
    
    const [result] = await pool.execute(
      `INSERT INTO attendance (employee_id, date, check_in_time, today_plan, yesterday_task, current_status, work_from)
       VALUES (?, ?, NOW(), ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       check_in_time = NOW(), today_plan = ?, yesterday_task = ?, current_status = ?, work_from = ?`,
      [employeeId, today, todayPlan, yesterdayTask, currentStatus, workFrom, todayPlan, yesterdayTask, currentStatus, workFrom]
    );
    return result;
  }

  static async checkOut(employeeId, checkOutData) {
    const today = moment().format('YYYY-MM-DD');
    const { accomplishments, blockers, tomorrowPriorities, overallRating } = checkOutData;
    
    // Check if already checked out today
    const [existing] = await pool.execute(
      'SELECT check_out_time FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );
    
    if (existing.length > 0 && existing[0].check_out_time) {
      throw new Error('Already checked out today');
    }
    
    const [result] = await pool.execute(
      `UPDATE attendance 
       SET check_out_time = NOW(), accomplishments = ?, blockers = ?, 
           tomorrow_priorities = ?, overall_rating = ?
       WHERE employee_id = ? AND date = ?`,
      [accomplishments, blockers, tomorrowPriorities, overallRating, employeeId, today]
    );
    return result;
  }

  static async getTodayAttendance(employeeId) {
    const today = moment().format('YYYY-MM-DD');
    const [rows] = await pool.execute(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?',
      [employeeId, today]
    );
    return rows[0];
  }

  static async getAttendanceStats() {
    const [rows] = await pool.execute(`
      SELECT 
        DATE(check_in_time) as date,
        COUNT(*) as total_checkins,
        COUNT(check_out_time) as total_checkouts,
        AVG(overall_rating) as avg_rating
      FROM attendance 
      WHERE check_in_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(check_in_time)
      ORDER BY date DESC
    `);
    return rows;
  }

  static async getEmployeeStats(employeeId) {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total_days,
        COUNT(check_out_time) as completed_days,
        AVG(overall_rating) as avg_rating,
        AVG(TIMESTAMPDIFF(HOUR, check_in_time, check_out_time)) as avg_hours
      FROM attendance 
      WHERE employee_id = ? AND check_in_time >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [employeeId]);
    return rows[0];
  }
}