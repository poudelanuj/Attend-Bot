import express from 'express';
import { Leave } from '../models/Leave.js';

const router = express.Router();

// Get all leaves
router.get('/', async (req, res) => {
  try {
    const leaves = await Leave.getAllLeaves();
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaves by date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const leaves = await Leave.getLeavesByDate(date);
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves by date:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const leaves = await Leave.getEmployeeLeaves(employeeId);
    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves for employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
