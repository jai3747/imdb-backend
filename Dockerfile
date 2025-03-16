#backend dockefile



FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# First remove any existing modules and lock file
RUN rm -rf node_modules
RUN rm -f package-lock.json

# Install dependencies
RUN npm install
RUN npm install --save-dev babel-jest
# Copy the rest of the application
COPY . .

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]

