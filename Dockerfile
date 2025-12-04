# Stage 1: Build the frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the built frontend from the builder stage
COPY --from=builder /app/dist ./dist

# Copy the server code
COPY --from=builder /app/server ./server

# Create uploads directory
RUN mkdir -p uploads

# Expose the port the app runs on
EXPOSE 3001

# Start the server
CMD ["node", "server/index.js"]
