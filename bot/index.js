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
    SlashCommandBuilder
} from 'discord.js';
import dotenv from 'dotenv';
import {Employee} from '../server/models/Employee.js';
import {Attendance} from '../server/models/Attendance.js';

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

import cron from 'node-cron';

// 9:55 AM NPT Check-in DM (Mon–Fri)
cron.schedule('55 9 * * 1-5', async () => {
    try {
        console.log("its running")
        const guild = await client.guilds.fetch(process.env.GUILD_ID);
        const members = await guild.members.fetch();
        const usernames = members.map(m => m.user.tag);
        console.log(usernames)
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

// 4:55 PM NPT Check-out DM (Mon–Fri)
cron.schedule('55 16 * * 1-5', async () => {
    try {
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

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const {commandName} = interaction;

    if (commandName === 'checkin') {
        await handleCheckIn(interaction);
    } else if (commandName === 'checkout') {
        await handleCheckOut(interaction);
    } else if (commandName === 'status') {
        await handleStatus(interaction);
    }
});

// Handle modal submissions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    if (interaction.customId === 'checkin_modal') {
        await processCheckIn(interaction);
    } else if (interaction.customId === 'checkout_modal') {
        await processCheckOut(interaction);
    }
});

async function handleCheckIn(interaction) {
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

    const statusInput = new TextInputBuilder()
        .setCustomId('current_status')
        .setLabel('Current Status/Mood')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g., Energetic, Focused, Tired, Motivated...')
        .setRequired(true);

    const firstActionRow = new ActionRowBuilder().addComponents(todayPlanInput);
    const secondActionRow = new ActionRowBuilder().addComponents(yesterdayTaskInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(statusInput);

    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    await interaction.showModal(modal);
}

async function processCheckIn(interaction) {
    try {
        const todayPlan = interaction.fields.getTextInputValue('today_plan');
        const yesterdayTask = interaction.fields.getTextInputValue('yesterday_task');
        const currentStatus = interaction.fields.getTextInputValue('current_status');

        let employee = await Employee.findByDiscordId(interaction.user.id);
        if (!employee) {
            await Employee.create({
                discordId: interaction.user.id,
                username: interaction.user.username,
                displayName: interaction.user.displayName || interaction.user.username,
                email: null,
                department: null,
                position: null
            });
            employee = await Employee.findByDiscordId(interaction.user.id);
        }

        await Attendance.checkIn(employee.id, {
            todayPlan,
            yesterdayTask,
            currentStatus
        });

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Check-in Successful!')
            .setDescription('Your attendance has been recorded.')
            .addFields(
                {name: '🎯 Today\'s Plan', value: todayPlan, inline: false},
                {name: '📋 Yesterday\'s Task', value: yesterdayTask, inline: false},
                {name: '💭 Current Status', value: currentStatus, inline: false}
            )
            .setTimestamp()
            .setFooter({text: 'Have a productive day!'});

        await interaction.reply({embeds: [embed], ephemeral: true});
    } catch (error) {
        console.error('Check-in error:', error);
        await interaction.reply({content: '❌ Error processing check-in. Please try again.', ephemeral: true});
    }
}

async function handleCheckOut(interaction) {
    try {
        const employee = await Employee.findByDiscordId(interaction.user.id);
        if (!employee) {
            await interaction.reply({content: '❌ Please check in first before checking out.', ephemeral: true});
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

        const employee = await Employee.findByDiscordId(interaction.user.id);

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
        const employee = await Employee.findByDiscordId(interaction.user.id);
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
                value: `Days worked: ${stats.total_days}
Completed days: ${stats.completed_days}
Average rating: ${formattedRating}/5`,
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


