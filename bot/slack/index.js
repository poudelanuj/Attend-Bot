import pkg from '@slack/bolt';
const { App } = pkg;

import dotenv from 'dotenv';
import express from 'express';
import { Employee } from '../../server/models/Employee.js';
import { Attendance } from '../../server/models/Attendance.js';
import { Leave } from '../../server/models/Leave.js';
import cron from 'node-cron';

// Temporary storage for user selections
const checkInSelections = new Map();

dotenv.config();
const expressApp = express();

// Export the express app for use in other files
export { expressApp };

// Add request parsing middleware
// expressApp.use(express.json());
// expressApp.use(express.urlencoded({ extended: true }));

// Add debug logging for incoming requests
expressApp.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    receiver: new pkg.ExpressReceiver({
        app: expressApp,
        signingSecret: process.env.SLACK_SIGNING_SECRET,
        endpoints: {
            commands: '/slack/commands',
            events: '/slack/interactions',
        }
    })
});

// Handle direct messages to the bot
app.event('message', async ({ event, client, say }) => {
    // Ignore bot messages to prevent loops
    if (event.subtype === 'bot_message' || event.bot_id) return;

    const userId = event.user;
    const text = event.text.trim();

    await say({
        channel: userId,
        text: `Hi! I'm the attendance bot. Please use commands like /checkin, /checkout, /applyleave, or /askStatus to interact with me.`,
    });
});

// Slash command: /checkin
app.command('/checkin', async ({ command, ack, say, client }) => {
    console.log('Check-in command payload:', JSON.stringify({
        user_id: command.user_id,
        channel_id: command.channel_id,
        channel_type: command.channel_type,
        text: command.text
    }, null, 2));
    await ack();
    try {
        const userId = command.user_id;
        const employee = await Employee.findByPlatformId(userId);

        // Check if on leave today
        if (employee) {
            const todayLeave = await Leave.getTodayLeave(employee.id);
            if (todayLeave) {
                await say({ text: '❌ You are on leave today. You cannot check in.', ephemeral: true });
                return;
            }

            const todayAttendance = await Attendance.getTodayAttendance(employee.id);
            if (todayAttendance && todayAttendance.check_in_time) {
                await say({ text: '❌ You have already checked in today.', ephemeral: true });
                return;
            }
        }

        // Open a modal for work location and status
        await client.views.open({
            trigger_id: command.trigger_id,
            view: {
                type: 'modal',
                callback_id: 'checkin_modal',
                title: { type: 'plain_text', text: 'Check-in' },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'work_from',
                        element: {
                            type: 'static_select',
                            action_id: 'work_from_select',
                            placeholder: { type: 'plain_text', text: 'Select work location' },
                            options: [
                                { text: { type: 'plain_text', text: 'Office' }, value: 'office' },
                                { text: { type: 'plain_text', text: 'Remote' }, value: 'remote' },
                            ],
                        },
                        label: { type: 'plain_text', text: 'Work Location' },
                    },
                    {
                        type: 'input',
                        block_id: 'current_status',
                        element: {
                            type: 'static_select',
                            action_id: 'status_select',
                            placeholder: { type: 'plain_text', text: 'How are you feeling?' },
                            options: ['Excellent', 'Good', 'Okay', 'Tired', 'Stressed', 'Sick', 'Motivated', 'Anxious', 'Overwhelmed', 'Focused'].map(status => ({
                                text: { type: 'plain_text', text: status },
                                value: status.toLowerCase(),
                            })),
                        },
                        label: { type: 'plain_text', text: 'How are you feeling today?' },
                    },
                    {
                        type: 'input',
                        block_id: 'today_plan',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'today_plan_input',
                            multiline: true,
                            placeholder: { type: 'plain_text', text: 'Describe your main tasks and goals for today...' },
                        },
                        label: { type: 'plain_text', text: "What's your plan for today?" },
                    },
                    {
                        type: 'input',
                        block_id: 'yesterday_task',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'yesterday_task_input',
                            multiline: true,
                            placeholder: { type: 'plain_text', text: 'Briefly describe yesterday\'s accomplishments...' },
                        },
                        label: { type: 'plain_text', text: 'What did you work on yesterday?' },
                    },
                ],
                submit: { type: 'plain_text', text: 'Submit' },
            },
        });
    } catch (error) {
        console.error('Check-in error:', error);
        await say({ text: '❌ Error initiating check-in. Please try again.', ephemeral: true });
    }
});

// Handle check-in modal submission
app.view('checkin_modal', async ({ ack, body, view, client }) => {
    await ack();
    try {
        const userId = body.user.id;
        const values = view.state.values;
        const workFrom = values.work_from.work_from_select.selected_option.value;
        const currentStatus = values.current_status.status_select.selected_option.value;
        const todayPlan = values.today_plan.today_plan_input.value;
        const yesterdayTask = values.yesterday_task.yesterday_task_input.value;

        let employee = await Employee.findByPlatformId(userId);
        if (!employee) {
            await Employee.create({
                slackId: userId,
                username: body.user.username,
                displayName: body.user.name || body.user.username,
                email: null,
                department: null,
                position: null,
            });
            employee = await Employee.findByPlatformId(userId);
        }

        await Attendance.checkIn(employee.id, {
            todayPlan,
            yesterdayTask,
            currentStatus,
            workFrom,
        });

        await client.chat.postMessage({
            channel: userId,
            text: '',
            blocks: [
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: '*✅ Check-in Successful!*' },
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `🎯 *Today's Plan*: ${todayPlan}` },
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `📋 *Yesterday's Task*: ${yesterdayTask}` },
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `💭 *Feeling Today*: ${currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}\n🏢 *Work From*: ${workFrom.charAt(0).toUpperCase() + workFrom.slice(1)}` },
                },
            ],
        });

        checkInSelections.delete(userId);
    } catch (error) {
        console.error('Check-in processing error:', error);
        await client.chat.postMessage({
            channel: userId,
            text: '❌ Error processing check-in. Please try again.',
        });
    }
});

// Slash command: /checkout
app.command('/checkout', async ({ command, ack, say, client }) => {
    console.log('Check-out command payload:', JSON.stringify({
        user_id: command.user_id,
        channel_id: command.channel_id,
        channel_type: command.channel_type,
        text: command.text
    }, null, 2));
    await ack();
    try {
        const userId = command.user_id;
        const employee = await Employee.findByPlatformId(userId);
        if (!employee) {
            await say({ text: '❌ Please check in first before checking out.', ephemeral: true });
            return;
        }

        const todayLeave = await Leave.getTodayLeave(employee.id);
        if (todayLeave) {
            await say({ text: '❌ You are on leave today. You cannot check out.', ephemeral: true });
            return;
        }

        const todayAttendance = await Attendance.getTodayAttendance(employee.id);
        if (!todayAttendance || !todayAttendance.check_in_time) {
            await say({ text: '❌ You haven\'t checked in today. Please check in first.', ephemeral: true });
            return;
        }

        if (todayAttendance.check_out_time) {
            await say({ text: '❌ You have already checked out today.', ephemeral: true });
            return;
        }

        await client.views.open({
            trigger_id: command.trigger_id,
            view: {
                type: 'modal',
                callback_id: 'checkout_modal',
                title: { type: 'plain_text', text: 'Check-out' },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'accomplishments',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'accomplishments_input',
                            multiline: true,
                            placeholder: { type: 'plain_text', text: 'List your main accomplishments and completed tasks...' },
                        },
                        label: { type: 'plain_text', text: 'What did you accomplish today?' },
                    },
                    {
                        type: 'input',
                        block_id: 'blockers',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'blockers_input',
                            multiline: true,
                            placeholder: { type: 'plain_text', text: 'Describe any obstacles you faced or help you need...' },
                        },
                        label: { type: 'plain_text', text: 'Any blockers or challenges?' },
                        optional: true,
                    },
                    {
                        type: 'input',
                        block_id: 'tomorrow_priorities',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'tomorrow_priorities_input',
                            multiline: true,
                            placeholder: { type: 'plain_text', text: 'What are your main priorities for tomorrow?' },
                        },
                        label: { type: 'plain_text', text: "Tomorrow's priorities" },
                    },
                    {
                        type: 'input',
                        block_id: 'overall_rating',
                        element: {
                            type: 'static_select',
                            action_id: 'rating_select',
                            placeholder: { type: 'plain_text', text: 'Rate your day (1-5)' },
                            options: [1, 2, 3, 4, 5].map(rating => ({
                                text: { type: 'plain_text', text: `${rating}` },
                                value: `${rating}`,
                            })),
                        },
                        label: { type: 'plain_text', text: 'Rate your day (1-5)' },
                    },
                ],
                submit: { type: 'plain_text', text: 'Submit' },
            },
        });
    } catch (error) {
        console.error('Check-out error:', error);
        await say({ text: '❌ Error initiating check-out. Please try again.', ephemeral: true });
    }
});

// Handle check-out modal submission
app.view('checkout_modal', async ({ ack, body, view, client }) => {
    await ack();
    try {
        const userId = body.user.id;
        const values = view.state.values;
        const accomplishments = values.accomplishments.accomplishments_input.value;
        const blockers = values.blockers.blockers_input?.value || 'None';
        const tomorrowPriorities = values.tomorrow_priorities.tomorrow_priorities_input.value;
        const overallRating = parseInt(values.overall_rating.rating_select.selected_option.value);

        const employee = await Employee.findByPlatformId(userId);
        await Attendance.checkOut(employee.id, {
            accomplishments,
            blockers,
            tomorrowPriorities,
            overallRating,
        });

        const ratingEmoji = ['😞', '😐', '😊', '😄', '🤩'][overallRating - 1];
        await client.chat.postMessage({
            channel: userId,
            text: '',
            blocks: [
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: '*👋 Check-out Successful!*' },
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `✅ *Accomplishments*: ${accomplishments}` },
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `🚧 *Blockers*: ${blockers}` },
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `📅 *Tomorrow's Priorities*: ${tomorrowPriorities}` },
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `⭐ *Day Rating*: ${overallRating}/5 ${ratingEmoji}` },
                },
            ],
        });
    } catch (error) {
        console.error('Check-out processing error:', error);
        await client.chat.postMessage({
            channel: userId,
            text: '❌ Error processing check-out. Please try again.',
        });
    }
});

// Slash command: /applyleave
app.command('/applyleave', async ({ command, ack, say, client }) => {
    console.log('Leave command payload:', JSON.stringify({
        user_id: command.user_id,
        channel_id: command.channel_id,
        channel_type: command.channel_type,
        text: command.text
    }, null, 2));
    await ack();
    try {
        const userId = command.user_id;
        let employee = await Employee.findByPlatformId(userId);
        if (!employee) {
            await Employee.create({
                slackId: userId,
                username: command.user_name,
                displayName: command.user_name,
                email: null,
                department: null,
                position: null,
            });
            employee = await Employee.findByPlatformId(userId);
        }

        const todayLeave = await Leave.getTodayLeave(employee.id);
        if (todayLeave) {
            await say({ text: '❌ You have already applied for leave today.', ephemeral: true });
            return;
        }

        const todayAttendance = await Attendance.getTodayAttendance(employee.id);
        if (todayAttendance && (todayAttendance.check_in_time || todayAttendance.check_out_time)) {
            await say({ text: '❌ You cannot apply for leave after checking in or out today.', ephemeral: true });
            return;
        }

        await client.views.open({
            trigger_id: command.trigger_id,
            view: {
                type: 'modal',
                callback_id: 'leave_modal',
                title: { type: 'plain_text', text: 'Apply for Leave' },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'leave_description',
                        element: {
                            type: 'plain_text_input',
                            action_id: 'leave_description_input',
                            multiline: true,
                            placeholder: { type: 'plain_text', text: 'Please provide the reason for your leave...' },
                        },
                        label: { type: 'plain_text', text: 'Leave Description' },
                    },
                ],
                submit: { type: 'plain_text', text: 'Submit' },
            },
        });
    } catch (error) {
        console.error('Leave application error:', error);
        await say({ text: '❌ Error processing leave application. Please try again.', ephemeral: true });
    }
});

// Handle leave modal submission
app.view('leave_modal', async ({ ack, body, view, client }) => {
    await ack();
    try {
        const userId = body.user.id;
        const description = view.state.values.leave_description.leave_description_input.value;
        const employee = await Employee.findByPlatformId(userId);

        await Leave.applyLeave(employee.id, description);

        await client.chat.postMessage({
            channel: userId,
            text: '',
            blocks: [
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: '*🏖️ Leave Applied Successfully!*' },
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `📅 *Date*: ${new Date().toLocaleDateString()}` },
                },
                {
                    type: 'section',
                    text: { type: 'mrkdwn', text: `📝 *Description*: ${description}` },
                },
            ],
        });
    } catch (error) {
        console.error('Leave processing error:', error);
        await client.chat.postMessage({
            channel: userId,
            text: '❌ Error processing leave application. Please try again.',
        });
    }
});

// Slash command: /status
app.command('/askstatus', async ({ command, ack, say, client }) => {
    console.log('Status command payload:', JSON.stringify({
        user_id: command.user_id,
        channel_id: command.channel_id,
        channel_type: command.channel_type,
        text: command.text
    }, null, 2));
    await ack();
    try {
        const userId = command.user_id;
        const employee = await Employee.findByPlatformId(userId);
        if (!employee) {
            await say({ text: '❌ No attendance record found. Please check in first.', ephemeral: true });
            return;
        }

        const todayAttendance = await Attendance.getTodayAttendance(employee.id);
        const stats = await Attendance.getEmployeeStats(employee.id);

        const blocks = [
            {
                type: 'section',
                text: { type: 'mrkdwn', text: `*📊 Your Attendance Status*\nStatus for <@${userId}>` },
            },
        ];

        if (todayAttendance) {
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `📅 *Today's Status*\n✅ Checked in: ${new Date(todayAttendance.check_in_time).toLocaleTimeString()}\n${todayAttendance.check_out_time ? `👋 Checked out: ${new Date(todayAttendance.check_out_time).toLocaleTimeString()}` : '⏳ Not checked out yet'}`,
                },
            });
        } else {
            blocks.push({
                type: 'section',
                text: { type: 'mrkdwn', text: '📅 *Today\'s Status*\n❌ Not checked in yet' },
            });
        }

        if (stats) {
            const avgRating = parseFloat(stats.avg_rating);
            const formattedRating = !isNaN(avgRating) ? avgRating.toFixed(1) : 'N/A';
            blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: `📈 *30-Day Stats*\nDays worked: ${stats.total_days}\nCompleted days: ${stats.completed_days}\nAverage rating: ${formattedRating}/5`,
                },
            });
        }

        await client.chat.postMessage({
            channel: userId,
            text: '',
            blocks,
        });
    } catch (error) {
        console.error('Status error:', error);
        await say({ text: '❌ Error fetching status. Please try again.', ephemeral: true });
    }
});

// 9:55 AM NPT Check-in Reminder (Mon–Fri, excluding Saturday)
cron.schedule('55 9 * * 1-5', async () => {
    try {
        console.log('Check-in reminder running at 9:55 AM NPT');
        const users = await app.client.users.list();
        for (const user of users.members) {
            if (!user.is_bot && !user.deleted) {
                await app.client.chat.postMessage({
                    channel: user.id,
                    text: '🌞 Good morning! Please don\'t forget to /checkin today.',
                });
            }
        }
        console.log('✅ Check-in DMs sent at 9:55 AM NPT');
    } catch (error) {
        console.error('❌ Error during check-in DM:', error);
    }
}, { timezone: 'Asia/Kathmandu' });

// 4:55 PM NPT Check-out Reminder (Mon–Fri, excluding Saturday)
cron.schedule('55 16 * * 1-5', async () => {
    try {
        console.log('Check-out reminder running at 4:55 PM NPT');
        const users = await app.client.users.list();
        for (const user of users.members) {
            if (!user.is_bot && !user.deleted) {
                await app.client.chat.postMessage({
                    channel: user.id,
                    text: '🌇 The work day is over! Please remember to /checkout before leaving.',
                });
            }
        }
        console.log('✅ Check-out DMs sent at 4:55 PM NPT');
    } catch (error) {
        console.error('❌ Error during check-out DM:', error);
    }
}, { timezone: 'Asia/Kathmandu' });

// Add diagnostic route
expressApp.get('/slack-health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        message: 'Slack bot is running'
    });
});

(async () => {
    try {
        await app.start(process.env.SLACK_BOT_PORT || 3002);
        console.log('✅ Slack bot is running on port', process.env.SLACK_BOT_PORT || 3002);
    } catch (error) {
        console.error('❌ Error starting Slack bot:', error);
    }
})();
