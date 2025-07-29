import { pool } from '../database.js';

export class ProjectSettings {
  static async getSettings() {
    const [rows] = await pool.execute(
      'SELECT * FROM project_settings ORDER BY id DESC LIMIT 1'
    );
    return rows[0];
  }

  static async updateStartDate(startDate) {
    const [existing] = await pool.execute('SELECT id FROM project_settings LIMIT 1');
    
    if (existing.length > 0) {
      const [result] = await pool.execute(
        'UPDATE project_settings SET start_date = ?, updated_at = NOW() WHERE id = ?',
        [startDate, existing[0].id]
      );
      return result;
    } else {
      const [result] = await pool.execute(
        'INSERT INTO project_settings (start_date) VALUES (?)',
        [startDate]
      );
      return result;
    }
  }
}