# Discord Attendance Bot with Admin Dashboard

A comprehensive attendance management system featuring a Discord bot for employee check-ins/check-outs and a web-based admin dashboard for monitoring and analytics.

## Features

### Discord Bot
- **Check-in Command** (`/checkin`): Employees provide today's plan, yesterday's tasks, and current status
- **Check-out Command** (`/checkout`): Employees log accomplishments, blockers, tomorrow's priorities, and rate their day
- **Status Command** (`/status`): View personal attendance statistics
- Interactive modal forms for seamless data collection

### Admin Dashboard
- **Employee Management**: View all employees with attendance statistics
- **Analytics Dashboard**: Visual charts showing attendance trends and ratings
- **Employee Detail Pages**: Individual employee records with complete attendance history
- **Secure Authentication**: JWT-based admin login system

### Database Schema
- Employees table with Discord integration
- Attendance records with detailed check-in/check-out data
- Admin users for dashboard access

## Setup Instructions

### 1. Database Setup
```sql
-- Run the SQL schema from database/schema.sql in your MySQL database
mysql -u your_username -p your_database < database/schema.sql
```

### 2. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values:
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=attendance_db

DISCORD_TOKEN=your_discord_bot_token
GUILD_ID=your_discord_server_id
CLIENT_ID=your_discord_app_client_id

PORT=3001
JWT_SECRET=your_jwt_secret_key

ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
```

### 3. Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Copy the bot token to your `.env` file
4. Invite the bot to your server with appropriate permissions
5. Get your server (guild) ID and client ID

### 4. Install Dependencies
```bash
npm install
```

### 5. Deploy Discord Commands
```bash
# Set CLIENT_ID in your .env file first
node bot/deploy-commands.js
```

### 6. Start the Application

**Development Mode:**
```bash
# Start both server and client
npm run dev

# Or start individually:
npm run dev:server  # Backend API
npm run dev:client  # Frontend dashboard
```

**Production Mode:**
```bash
# Start the server
npm start

# In a separate terminal, start the bot
npm run bot
```

### 7. Access the Dashboard
- Open http://localhost:5173 in your browser
- Login with: admin / admin123 (or your configured credentials)

## Discord Commands

### `/checkin`
Opens a modal asking for:
- Today's work plan
- Yesterday's tasks
- Current status/mood

### `/checkout`
Opens a modal asking for:
- Today's accomplishments
- Any blockers or challenges
- Tomorrow's priorities
- Day rating (1-5)

### `/status`
Shows:
- Today's check-in/check-out status
- 30-day statistics
- Average rating

## Dashboard Features

### Main Dashboard
- Total employees count
- Today's check-ins and check-outs
- Average rating
- 30-day attendance trend chart
- Employee list with basic info

### Employee Detail Page
- Employee information
- 30-day statistics (total days, completed days, average rating, average hours)
- Complete attendance history table
- Individual day ratings and status

## Tech Stack

### Backend
- Node.js with Express
- MySQL database
- JWT authentication
- bcrypt for password hashing

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Recharts for analytics
- Axios for API calls
- React Router for navigation

### Discord Bot
- Discord.js v14
- Modal-based interactions
- Slash commands

## Deployment

### Server Requirements
- Node.js 18+
- MySQL 8.0+
- PM2 (recommended for process management)

### Production Deployment
1. Set up your MySQL database
2. Configure environment variables
3. Build the frontend: `npm run build`
4. Use PM2 or similar to manage processes:
   ```bash
   pm2 start server/index.js --name "attendance-api"
   pm2 start bot/index.js --name "attendance-bot"
   ```

## Security Notes

- Change default admin credentials immediately
- Use strong JWT secret
- Keep Discord bot token secure
- Use HTTPS in production
- Regular database backups recommended

## Customization

### Adding Questions
Modify the modal builders in `bot/index.js` to add/change questions for check-in or check-out.

### Dashboard Analytics
Extend the analytics queries in `server/models/Attendance.js` to add more insights.

### Employee Fields
Add custom fields to the employees table and update the forms accordingly.

## Troubleshooting

### Common Issues
1. **Bot not responding**: Check Discord token and permissions
2. **Database connection failed**: Verify MySQL credentials and connection
3. **Commands not showing**: Run `deploy-commands.js` and check bot permissions
4. **Dashboard login fails**: Check JWT secret and admin credentials

### Logs
- Server logs: Check console output
- Bot logs: Check bot process output
- Database queries: Enable MySQL query logging if needed

## Support

For issues and questions:
1. Check the logs for error messages
2. Verify all environment variables are set correctly
3. Ensure database schema is properly imported
4. Check Discord bot permissions and invite URL