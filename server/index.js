import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './database.js';
import { authenticateToken } from './middleware/auth.js';
// No need to import Slack app here as it runs as a separate service

// Routes
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import analyticsRoutes from './routes/analytics.js';
import attendanceRoutes from './routes/attendance.js';
import holidayRoutes from './routes/holidays.js';
import settingsRoutes from './routes/settings.js';
import leaves from "./routes/leaves.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors({
  origin: process.env.ORIGIN,
  credentials: true // Allow cookies or Authorization headers
}));app.use(express.json());

// Test database connection
testConnection();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', authenticateToken, employeeRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/holidays', authenticateToken, holidayRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/leaves', authenticateToken, leaves);

// Add a simple status endpoint for Slack
app.get('/api/slack/status', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Slack API endpoints are available, but handled by separate service',
    note: 'Make sure the Slack bot service is running on port 3002'
  });
});


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
