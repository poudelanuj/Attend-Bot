import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
  {
    name: 'checkin',
    description: 'Check in for the day and provide your daily plan',
  },
  {
    name: 'checkout',
    description: 'Check out for the day and provide a summary',
  },
  {
    name: 'status',
    description: 'View your attendance status and statistics',
  },
  {
    name: 'leave',
    description: 'Apply for leave',
  },
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands },
  );

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}
