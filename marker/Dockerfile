FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy AMPS JavaScript client tarball and extract amps.js to src/lib/
COPY amps-javascript-client-5.3.4.0.tar.gz .
RUN tar -xzf amps-javascript-client-5.3.4.0.tar.gz && \
    mkdir -p src/lib && \
    cp amps-javascript-client-5.3.4.0/amps.js src/lib/amps.js && \
    rm -rf amps-javascript-client-5.3.4.0 amps-javascript-client-5.3.4.0.tar.gz && \
    test -s src/lib/amps.js || (echo "Error: src/lib/amps.js is empty or missing" && exit 1)

# Copy application code
COPY . .

# Build React app
RUN npm run build

# Expose port for React dev server
EXPOSE 3000

# Start the application
CMD ["npm", "start"]