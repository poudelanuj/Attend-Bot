# Use official Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy bot code
COPY bot ./bot
COPY server ./server
COPY knexfile.js ./
COPY migrations ./migrations

# Set working directory to bot
WORKDIR /app/bot

# Command to run the bot
CMD ["node", "index.js"]
