# Use official Node.js 18 as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Command to copy build output to volume (optional, as build artifacts are in ./dist)
CMD ["cp", "-r", "dist", "/app/dist"]
