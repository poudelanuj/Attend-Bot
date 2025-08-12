# bot/discord/Dockerfile
FROM node:18-alpine

WORKDIR /app


# Copy package.json and install dependencies
COPY package.json ./
RUN npm install --production

# Copy only the bot code
COPY bot/discord ./bot/discord
COPY server ./server
COPY knexfile.js ./
COPY migrations ./migrations

# Use the npm script defined in package.json
CMD ["npm", "run", "discord"]
