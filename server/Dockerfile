# Use official Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Install dotenv explicitly
RUN npm install dotenv

# Copy server code
COPY server ./server
COPY knexfile.js ./
COPY migrations ./migrations

# Expose port
EXPOSE 5005

# Set working directory to server
WORKDIR /app/server

# Command to run the backend
CMD ["node", "index.js"]
