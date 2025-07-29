import express from 'express';
import { pool } from '../database.js';

const router = express.Router();

// Get all holidays
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
        'SELECT id, name, DATE_FORMAT(date, \'%Y-%m-%d\') as date, description FROM holidays ORDER BY date DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new holiday
router.post('/', async (req, res) => {
  try {
    const { date, name, description } = req.body;

    if (!date || !name) {
      return res.status(400).json({ message: 'Date and name are required' });
    }

    const [result] = await pool.execute(
        'INSERT INTO holidays (date, name, description) VALUES (?, ?, ?)',
        [date, name, description || null]
    );

    res.status(201).json({
      id: result.insertId,
      date,
      name,
      description,
      message: 'Holiday added successfully'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Holiday already exists for this date' });
    }
    console.error('Error adding holiday:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete holiday
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
        'DELETE FROM holidays WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Holiday not found' });
    }

    res.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
