FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy application code
COPY . .

# Build React app
RUN npm run build

# Expose port for React dev server
EXPOSE 3000

# Start the application
CMD ["npm", "start"]