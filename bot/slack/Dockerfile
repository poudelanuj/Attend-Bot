# bot/slack/Dockerfile
FROM node:18-alpine

WORKDIR /app



# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy slack bot code
COPY bot/slack ./bot/slack
COPY server ./server
COPY knexfile.js ./
COPY migrations ./migrations

# Run slack bot via npm script
CMD ["npm", "run", "slack"]
