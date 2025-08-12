import {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    REST,
    Routes,
    SlashCommandBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';
import dotenv from 'dotenv';
import {Employee} from '../../server/models/Employee.js';
import {Attendance} from '../../server/models/Attendance.js';
import {Leave} from '../../server/models/Leave.js';
import cron from 'node-cron';

// Temporary storage for select menu choices
const checkInSelections = new Map();

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Define slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('checkin')
        .setDescription('Start the check-in process'),
    new SlashCommandBuilder()
        .setName('checkout')
        .setDescription('Start the check-out process'),
    new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Apply for leave for today'),
    new SlashCommandBuilder()
        .setName('status')
        .setDescription('View your attendance status'),
].map(command => command.toJSON());

// Register slash commands
client.once('ready', async () => {
    console.log(`✅ Discord bot logged in as ${client.user.tag}`);
    try {
        const rest = new REST({version: '10'}).setToken(process.env.DISCORD_TOKEN);
        await rest.put(Routes.applicationCommands(client.user.id), {body: commands});
        console.log('✅ Successfully registered slash commands');
    } catch (error) {
        console.error('❌ Error registering slash commands:', error);
    }
});

client.on('ready', async () => {
    // 9:55 AM NPT Check-in DM (Mon–Fri, excluding Saturday)
    cron.schedule('55 9 * * 0-5', async () => {
        try {
            console.log("Check-in reminder running at 9:55 AM NPT");
            const guild = await client.guilds.fetch(process.env.GUILD_ID);
            const members = await guild.members.fetch();

            members.forEach(async (member) => {
                if (!member.user.bot) {
                    try {
                        await member.send('🌞 Good morning! Please don\'t forget to `/checkin` today.');
                    } catch (err) {
                        console.warn(`❌ Could not DM ${member.user.tag}:`, err.message);
                    }
                }
            });
            console.log('✅ Check-in DMs sent at 9:55 AM NPT');
        } catch (error) {
            console.error('❌ Error during check-in DM:', error);
        }
    }, {
        timezone: 'Asia/Kathmandu'
    });

// 4:55 PM NPT Check-out DM (Mon–Fri, excluding Sunday)
    cron.schedule('55 16 * * 0-5', async () => {
        try {
            console.log("Check-out reminder running at 4:55 PM NPT");
            const guild = await client.guilds.fetch(process.env.GUILD_ID);
            const members = await guild.members.fetch();

            members.forEach(async (member) => {
                if (!member.user.bot) {
                    try {
                        await member.send('🌇 The work day is over! Please remember to `/checkout` before leaving.');
                    } catch (err) {
                        console.warn(`❌ Could not DM ${member.user.tag}:`, err.message);
                    }
                }
            });
            console.log('✅ Check-out DMs sent at 4:55 PM NPT');
        } catch (error) {
            console.error('❌ Error during check-out DM:', error);
        }
    }, {
        timezone: 'Asia/Kathmandu'
    });
})

// Handle interactions (slash commands, select menus, buttons, modals)
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const {commandName} = interaction;
        if (commandName === 'checkin') {
            await handleCheckIn(interaction);
        } else if (commandName === 'checkout') {
            await handleCheckOut(interaction);
        } else if (commandName === 'leave') {
            await handleLeave(interaction);
        } else if (commandName === 'status') {
            await handleStatus(interaction);
        }
    } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
    } else if (interaction.isButton()) {
        if (interaction.customId === 'proceed_checkin') {
            await handleProceedButton(interaction);
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'checkin_modal') {
            await processCheckIn(interaction);
        } else if (interaction.customId === 'checkout_modal') {
            await processCheckOut(interaction);
        } else if (interaction.customId === 'leave_modal') {
            await processLeave(interaction);
        }
    }
});

async function handleCheckIn(interaction) {
    try {
        // Check if user already checked in today
        const employee = await Employee.findByPlatformId(interaction.user.id);
        if (employee) {
            // Check if on leave today
            const todayLeave = await Leave.getTodayLeave(employee.id);
            if (todayLeave) {
                await interaction.reply({
                    content: '❌ You are on leave today. You cannot check in.',
                    ephemeral: true
                });
                return;
            }

            const todayAttendance = await Attendance.getTodayAttendance(employee.id);
            if (todayAttendance && todayAttendance.check_in_time) {
                await interaction.reply({
                    content: '❌ You have already checked in today. You can only check in once per day.',
                    ephemeral: true
                });
                return;
            }
        }

        // Create work_from select menu
        const workFromSelect = new StringSelectMenuBuilder()
            .setCustomId('work_from_select')
            .setPlaceholder('Select work location')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Office').setValue('office'),
                new StringSelectMenuOptionBuilder().setLabel('Remote').setValue('remote')
            );

        const proceedButton = new ButtonBuilder()
            .setCustomId('proceed_checkin')
            .setLabel('Proceed to Check-in')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true); // Disabled until both selections are made

        const workFromRow = new ActionRowBuilder().addComponents(workFromSelect);
        const buttonRow = new ActionRowBuilder().addComponents(proceedButton);

        // Initialize selections
        checkInSelections.set(interaction.user.id, {});

        await interaction.reply({
            content: 'Please select your work location:',
            components: [workFromRow, buttonRow],
            ephemeral: true
        });
    } catch (error) {
        console.error('Check-in initiation error:', error);
        await interaction.reply({content: '❌ Error initiating check-in. Please try again.', ephemeral: true});
    }
}

async function handleSelectMenu(interaction) {
    try {
        const userSelections = checkInSelections.get(interaction.user.id) || {};

        if (interaction.customId === 'work_from_select') {
            userSelections.workFrom = interaction.values[0];
            checkInSelections.set(interaction.user.id, userSelections);

            // Update to show work_from selection and add status_select
            const workFromSelect = new StringSelectMenuBuilder()
                .setCustomId('work_from_select')
                .setPlaceholder(userSelections.workFrom.charAt(0).toUpperCase() + userSelections.workFrom.slice(1))
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(userSelections.workFrom.charAt(0).toUpperCase() + userSelections.workFrom.slice(1))
                        .setValue(userSelections.workFrom)
                        .setDefault(true)
                )
                .setDisabled(true);

            const statusSelect = new StringSelectMenuBuilder()
                .setCustomId('status_select')
                .setPlaceholder('How are you feeling today?')
                .addOptions(
                    ['Excellent', 'Good', 'Okay', 'Tired', 'Stressed', 'Sick', 'Motivated', 'Anxious', 'Overwhelmed', 'Focused']
                        .map(status => new StringSelectMenuOptionBuilder()
                            .setLabel(status)
                            .setValue(status.toLowerCase()))
                );

            const proceedButton = new ButtonBuilder()
                .setCustomId('proceed_checkin')
                .setLabel('Proceed to Check-in')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true);

            const workFromRow = new ActionRowBuilder().addComponents(workFromSelect);
            const statusRow = new ActionRowBuilder().addComponents(statusSelect);
            const buttonRow = new ActionRowBuilder().addComponents(proceedButton);

            await interaction.update({
                content: 'Work location selected. Now select how you are feeling today:',
                components: [workFromRow, statusRow, buttonRow],
                ephemeral: true
            });
        } else if (interaction.customId === 'status_select') {
            userSelections.currentStatus = interaction.values[0];
            checkInSelections.set(interaction.user.id, userSelections);

            // Update to enable proceed button
            const workFromSelect = new StringSelectMenuBuilder()
                .setCustomId('work_from_select')
                .setPlaceholder(userSelections.workFrom.charAt(0).toUpperCase() + userSelections.workFrom.slice(1))
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(userSelections.workFrom.charAt(0).toUpperCase() + userSelections.workFrom.slice(1))
                        .setValue(userSelections.workFrom)
                        .setDefault(true)
                )
                .setDisabled(true);

            const statusSelect = new StringSelectMenuBuilder()
                .setCustomId('status_select')
                .setPlaceholder(userSelections.currentStatus.charAt(0).toUpperCase() + userSelections.currentStatus.slice(1))
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel(userSelections.currentStatus.charAt(0).toUpperCase() + userSelections.currentStatus.slice(1))
                        .setValue(userSelections.currentStatus)
                        .setDefault(true)
                )
                .setDisabled(true);

            const proceedButton = new ButtonBuilder()
                .setCustomId('proceed_checkin')
                .setLabel('Proceed to Check-in')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(false);

            const workFromRow = new ActionRowBuilder().addComponents(workFromSelect);
            const statusRow = new ActionRowBuilder().addComponents(statusSelect);
            const buttonRow = new ActionRowBuilder().addComponents(proceedButton);

            await interaction.update({
                content: 'Status selected. Click "Proceed to Check-in" to continue:',
                components: [workFromRow, statusRow, buttonRow],
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Select menu error:', error);
        await interaction.update({content: '❌ Error processing selection. Please try again.', ephemeral: true});
    }
}

async function handleProceedButton(interaction) {
    try {
        const userSelections = checkInSelections.get(interaction.user.id);
        if (!userSelections || !userSelections.workFrom || !userSelections.currentStatus) {
            await interaction.reply({content: '❌ Please select both work location and status before proceeding.', ephemeral: true});
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('checkin_modal')
            .setTitle('Daily Check-in');

        const todayPlanInput = new TextInputBuilder()
            .setCustomId('today_plan')
            .setLabel("What's your plan for today?")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe your main tasks and goals for today...')
            .setRequired(true);

        const yesterdayTaskInput = new TextInputBuilder()
            .setCustomId('yesterday_task')
            .setLabel("What did you work on yesterday?")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Briefly describe yesterday\'s accomplishments...')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(todayPlanInput),
            new ActionRowBuilder().addComponents(yesterdayTaskInput)
        );

        await interaction.showModal(modal);
    } catch (error) {
        console.error('Proceed button error:', error);
        await interaction.reply({content: '❌ Error proceeding to check-in. Please try again.', ephemeral: true});
    }
}

async function processCheckIn(interaction) {
    try {
        const userSelections = checkInSelections.get(interaction.user.id);
        if (!userSelections || !userSelections.currentStatus || !userSelections.workFrom) {
            await interaction.reply({content: '❌ Missing status or work location. Please start over with /checkin.', ephemeral: true});
            return;
        }

        const todayPlan = interaction.fields.getTextInputValue('today_plan');
        const yesterdayTask = interaction.fields.getTextInputValue('yesterday_task');
        const currentStatus = userSelections.currentStatus;
        const workFrom = userSelections.workFrom;

        let employee = await Employee.findByPlatformId(interaction.user.id);
        if (!employee) {
            await Employee.create({
                platformId: interaction.user.id,
                username: interaction.user.username,
                displayName: interaction.user.displayName || interaction.user.username,
                email: null,
                department: null,
                position: null
            });
            employee = await Employee.findByPlatformId(interaction.user.id);
        }

        await Attendance.checkIn(employee.id, {
            todayPlan,
            yesterdayTask,
            currentStatus,
            workFrom
        });

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Check-in Successful!')
            .setDescription('Your attendance has been recorded.')
            .addFields(
                {name: '🎯 Today\'s Plan', value: todayPlan, inline: false},
                {name: '📋 Yesterday\'s Task', value: yesterdayTask, inline: false},
                {name: '💭 Feeling Today', value: currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1), inline: true},
                {name: '🏢 Work From', value: workFrom.charAt(0).toUpperCase() + workFrom.slice(1), inline: true}
            )
            .setTimestamp()
            .setFooter({text: 'Have a productive day!'});

        // Clear selections after successful check-in
        checkInSelections.delete(interaction.user.id);

        await interaction.reply({embeds: [embed], ephemeral: true});
    } catch (error) {
        console.error('Check-in error:', error);
        await interaction.reply({content: '❌ Error processing check-in. Please try again.', ephemeral: true});
    }
}

async function handleLeave(interaction) {
    try {
        const employee = await Employee.findByPlatformId(interaction.user.id);
        if (!employee) {
            await Employee.create({
                platformId: interaction.user.id,
                username: interaction.user.username,
                displayName: interaction.user.displayName || interaction.user.username,
                email: null,
                department: null,
                position: null
            });
            const newEmployee = await Employee.findByPlatformId(interaction.user.id);
            employee = newEmployee;
        }

        // Check if already applied for leave today
        const todayLeave = await Leave.getTodayLeave(employee.id);
        if (todayLeave) {
            await interaction.reply({
                content: '❌ You have already applied for leave today.',
                ephemeral: true
            });
            return;
        }

        // Check if already checked in or out today
        const todayAttendance = await Attendance.getTodayAttendance(employee.id);
        if (todayAttendance && (todayAttendance.check_in_time || todayAttendance.check_out_time)) {
            await interaction.reply({
                content: '❌ You cannot apply for leave after checking in or out today.',
                ephemeral: true
            });
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('leave_modal')
            .setTitle('Apply for Leave');

        const descriptionInput = new TextInputBuilder()
            .setCustomId('leave_description')
            .setLabel('Leave Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Please provide the reason for your leave...')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(descriptionInput)
        );

        await interaction.showModal(modal);
    } catch (error) {
        console.error('Leave application error:', error);
        await interaction.reply({content: '❌ Error processing leave application. Please try again.', ephemeral: true});
    }
}

async function processLeave(interaction) {
    try {
        const description = interaction.fields.getTextInputValue('leave_description');
        const employee = await Employee.findByPlatformId(interaction.user.id);

        await Leave.applyLeave(employee.id, description);

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🏖️ Leave Applied Successfully!')
            .setDescription('Your leave application has been recorded.')
            .addFields(
                {name: '📅 Date', value: new Date().toLocaleDateString(), inline: true},
                {name: '📝 Description', value: description, inline: false}
            )
            .setTimestamp()
            .setFooter({text: 'Take care and rest well!'});

        await interaction.reply({embeds: [embed], ephemeral: true});
    } catch (error) {
        console.error('Leave processing error:', error);
        await interaction.reply({content: '❌ Error processing leave application. Please try again.', ephemeral: true});
    }
}

async function handleCheckOut(interaction) {
    try {
        const employee = await Employee.findByPlatformId(interaction.user.id);
        if (!employee) {
            await interaction.reply({content: '❌ Please check in first before checking out.', ephemeral: true});
            return;
        }

        // Check if on leave today
        const todayLeave = await Leave.getTodayLeave(employee.id);
        if (todayLeave) {
            await interaction.reply({
                content: '❌ You are on leave today. You cannot check out.',
                ephemeral: true
            });
            return;
        }

        const todayAttendance = await Attendance.getTodayAttendance(employee.id);
        if (!todayAttendance || !todayAttendance.check_in_time) {
            await interaction.reply({
                content: '❌ You haven\'t checked in today. Please check in first.',
                ephemeral: true
            });
            return;
        }

        if (todayAttendance.check_out_time) {
            await interaction.reply({content: '❌ You have already checked out today.', ephemeral: true});
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('checkout_modal')
            .setTitle('Daily Check-out');

        const accomplishmentsInput = new TextInputBuilder()
            .setCustomId('accomplishments')
            .setLabel('What did you accomplish today?')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('List your main accomplishments and completed tasks...')
            .setRequired(true);

        const blockersInput = new TextInputBuilder()
            .setCustomId('blockers')
            .setLabel('Any blockers or challenges?')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe any obstacles you faced or help you need...')
            .setRequired(false);

        const tomorrowInput = new TextInputBuilder()
            .setCustomId('tomorrow_priorities')
            .setLabel('Tomorrow\'s priorities')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('What are your main priorities for tomorrow?')
            .setRequired(true);

        const ratingInput = new TextInputBuilder()
            .setCustomId('overall_rating')
            .setLabel('Rate your day (1-5)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Rate your productivity: 1 (Poor) to 5 (Excellent)')
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(accomplishmentsInput),
            new ActionRowBuilder().addComponents(blockersInput),
            new ActionRowBuilder().addComponents(tomorrowInput),
            new ActionRowBuilder().addComponents(ratingInput)
        );

        await interaction.showModal(modal);
    } catch (error) {
        console.error('Check-out error:', error);
        await interaction.reply({content: '❌ Error processing check-out. Please try again.', ephemeral: true});
    }
}

async function processCheckOut(interaction) {
    try {
        const accomplishments = interaction.fields.getTextInputValue('accomplishments');
        const blockers = interaction.fields.getTextInputValue('blockers') || 'None';
        const tomorrowPriorities = interaction.fields.getTextInputValue('tomorrow_priorities');
        const overallRating = parseInt(interaction.fields.getTextInputValue('overall_rating'));

        if (isNaN(overallRating) || overallRating < 1 || overallRating > 5) {
            await interaction.reply({content: '❌ Please provide a valid rating between 1 and 5.', ephemeral: true});
            return;
        }

        const employee = await Employee.findByPlatformId(interaction.user.id);

        await Attendance.checkOut(employee.id, {
            accomplishments,
            blockers,
            tomorrowPriorities,
            overallRating
        });

        const ratingEmoji = ['😞', '😐', '😊', '😄', '🤩'][overallRating - 1];

        const embed = new EmbedBuilder()
            .setColor(0xff6600)
            .setTitle('👋 Check-out Successful!')
            .setDescription('Your work day has been recorded. Great job today!')
            .addFields(
                {name: '✅ Accomplishments', value: accomplishments, inline: false},
                {name: '🚧 Blockers', value: blockers, inline: false},
                {name: '📅 Tomorrow\'s Priorities', value: tomorrowPriorities, inline: false},
                {name: '⭐ Day Rating', value: `${overallRating}/5 ${ratingEmoji}`, inline: true}
            )
            .setTimestamp()
            .setFooter({text: 'Have a great evening!'});

        await interaction.reply({embeds: [embed], ephemeral: true});
    } catch (error) {
        console.error('Check-out processing error:', error);
        await interaction.reply({content: '❌ Error processing check-out. Please try again.', ephemeral: true});
    }
}

async function handleStatus(interaction) {
    try {
        const employee = await Employee.findByPlatformId(interaction.user.id);
        if (!employee) {
            await interaction.reply({content: '❌ No attendance record found. Please check in first.', ephemeral: true});
            return;
        }

        const todayAttendance = await Attendance.getTodayAttendance(employee.id);
        const stats = await Attendance.getEmployeeStats(employee.id);

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('📊 Your Attendance Status')
            .setDescription(`Status for ${interaction.user.displayName || interaction.user.username}`)
            .setTimestamp();

        if (todayAttendance) {
            embed.addFields(
                {
                    name: '📅 Today\'s Status',
                    value: `✅ Checked in: ${new Date(todayAttendance.check_in_time).toLocaleTimeString()}\n${todayAttendance.check_out_time ? `👋 Checked out: ${new Date(todayAttendance.check_out_time).toLocaleTimeString()}` : '⏳ Not checked out yet'}`,
                    inline: false
                }
            );
        } else {
            embed.addFields(
                {name: '📅 Today\'s Status', value: '❌ Not checked in yet', inline: false}
            );
        }

        if (stats) {
            const avgRating = parseFloat(stats.avg_rating);
            const formattedRating = !isNaN(avgRating) ? avgRating.toFixed(1) : 'N/A';

            embed.addFields({
                name: '📈 30-Day Stats',
                value: `Days worked: ${stats.total_days}\nCompleted days: ${stats.completed_days}\nAverage rating: ${formattedRating}/5`,
                inline: true
            });
        }

        await interaction.reply({embeds: [embed], ephemeral: true});
    } catch (error) {
        console.error('Status error:', error);
        await interaction.reply({content: '❌ Error fetching status. Please try again.', ephemeral: true});
    }
}

client.login(process.env.DISCORD_TOKEN);
