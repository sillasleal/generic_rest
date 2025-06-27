FROM node:20-bullseye-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /workspace

# Create a non-root user
RUN groupadd --gid 1000 node \
    && useradd --uid 1000 --gid node --shell /bin/bash --create-home node

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Change ownership to node user
RUN chown -R node:node /workspace

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "dev"]
