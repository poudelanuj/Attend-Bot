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
    return rows[0] ? parseInt(rows[0].setting_value) : 20; // Default 20 days
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
}