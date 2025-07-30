import { pool } from '../database.js';

export class ProjectSettings {
  static async getSettings() {
    const [rows] = await pool.execute(
      'SELECT * FROM project_settings ORDER BY id DESC LIMIT 1'
    );
    return rows[0];
  }

  static async updateStartDate(startDate) {
    const [existing] = await pool.execute('SELECT id FROM project_settings WHERE setting_key = "project_start_date" LIMIT 1');
    
    if (existing.length > 0) {
      const [result] = await pool.execute(
        'UPDATE project_settings SET setting_value = ?, updated_at = NOW() WHERE id = ?',
        [startDate, existing[0].id]
      );
      return result;
    } else {
      const [result] = await pool.execute(
        'INSERT INTO project_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
        ['project_start_date', startDate, 'The date when the attendance tracking project was deployed and started']
      );
      return result;
    }
  }

  static async getAnnualLeaveConfig() {
    const [rows] = await pool.execute(
      'SELECT setting_value FROM project_settings WHERE setting_key = "annual_leave_days"'
    );
    return rows[0] ? parseInt(rows[0].setting_value) : 14; // Default 14 days
  }

  static async updateAnnualLeaveConfig(days) {
    const [existing] = await pool.execute('SELECT id FROM project_settings WHERE setting_key = "annual_leave_days" LIMIT 1');
    
    if (existing.length > 0) {
      const [result] = await pool.execute(
        'UPDATE project_settings SET setting_value = ?, updated_at = NOW() WHERE id = ?',
        [days.toString(), existing[0].id]
      );
      return result;
    } else {
      const [result] = await pool.execute(
        'INSERT INTO project_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
        ['annual_leave_days', days.toString(), 'Annual leave days allocated per employee']
      );
      return result;
    }
  }
  
  static async getAnnualLeaveResetDate() {
    const [rows] = await pool.execute(
      'SELECT setting_value FROM project_settings WHERE setting_key = "annual_leave_reset_date"'
    );
    return rows[0] ? rows[0].setting_value : '07-16'; // Default July 16
  }

  static async updateAnnualLeaveResetDate(resetDate) {
    // Validate date format (MM-DD)
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!dateRegex.test(resetDate)) {
      throw new Error('Invalid date format. Use MM-DD format.');
    }
    
    const [existing] = await pool.execute('SELECT id FROM project_settings WHERE setting_key = "annual_leave_reset_date" LIMIT 1');
    
    if (existing.length > 0) {
      const [result] = await pool.execute(
        'UPDATE project_settings SET setting_value = ?, updated_at = NOW() WHERE id = ?',
        [resetDate, existing[0].id]
      );
      return result;
    } else {
      const [result] = await pool.execute(
        'INSERT INTO project_settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
        ['annual_leave_reset_date', resetDate, 'Date when annual leave resets (format: MM-DD)']
      );
      return result;
    }
  }
}