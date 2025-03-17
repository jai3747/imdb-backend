FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# First remove any existing modules and lock file
RUN rm -rf node_modules
RUN rm -f package-lock.json

# Install dependencies including dotenv explicitly
RUN npm install
RUN npm install dotenv cors mongoose express --save
RUN npm install --save-dev babel-jest
RUN npm install prom-client
# Copy the rest of the application
COPY . .

# Set all environment variables directly in Dockerfile - fix MongoDB URL format
ENV PORT=5000
ENV MONGO_URL="mongodb+srv://JAYACHANDRAN:KQJrxDn44181NsqT@cluster0.w45he.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
ENV NODE_ENV=production
ENV FRONTEND_URL=http://imdb-app.jayachandran.xyz
ENV CORS_ORIGIN=*

# Create .env file to ensure dotenv can read it - with quotes around MongoDB URL
RUN echo "PORT=$PORT" > .env && \
    echo "MONGO_URL=\"$MONGO_URL\"" >> .env && \
    echo "NODE_ENV=$NODE_ENV" >> .env && \
    echo "FRONTEND_URL=$FRONTEND_URL" >> .env && \
    echo "CORS_ORIGIN=$CORS_ORIGIN" >> .env

# Expose port
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]
