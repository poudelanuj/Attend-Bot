import express from 'express';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const employees = await Employee.findAll();
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    const attendanceHistory = await Employee.getAttendanceHistory(req.params.id);
    const stats = await Attendance.getEmployeeStats(req.params.id);
    
    res.json({
      employee,
      attendanceHistory,
      stats
    });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;