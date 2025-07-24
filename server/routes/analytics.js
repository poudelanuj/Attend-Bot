import express from 'express';
import { Attendance } from '../models/Attendance.js';

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

export default router;