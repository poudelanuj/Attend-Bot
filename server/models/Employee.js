import { pool } from '../database.js';

export class Employee {
  static async findByDiscordId(discordId) {
    const [rows] = await pool.execute(
      'SELECT * FROM employees WHERE discord_id = ?',
      [discordId]
    );
    return rows[0];
  }

  static async create(employeeData) {
    console.log(employeeData)
    const { discordId, username, displayName, email, department, position } = employeeData;
    const [result] = await pool.execute(
      `INSERT INTO employees (discord_id, username, display_name, email, department, position) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [discordId, username, displayName, email, department, position]
    );
    return result.insertId;
  }

  static async findAll() {
    const [rows] = await pool.execute(
      `SELECT e.*, 
       COUNT(a.id) as total_attendance,
       MAX(a.check_in_time) as last_checkin
       FROM employees e 
       LEFT JOIN attendance a ON e.id = a.employee_id 
       WHERE e.is_active = 1
       GROUP BY e.id 
       ORDER BY e.username`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM employees WHERE id = ?',
      [id]
    );
    return rows[0];
  }

    static async getAttendanceHistory(employeeId, limit = 30) {
        const safeLimit = Number(limit);
        if (isNaN(safeLimit) || safeLimit <= 0) {
            throw new Error("Invalid limit provided.");
        }

        const [rows] = await pool.execute(
            `SELECT * FROM attendance 
     WHERE employee_id = ? 
     ORDER BY date DESC 
     LIMIT ${safeLimit}`, // injected safely after validation
            [employeeId]
        );
        return rows;
    }


}
