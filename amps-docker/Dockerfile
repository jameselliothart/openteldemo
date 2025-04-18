FROM ubuntu:20.04
LABEL Author="60East Technologies <support@crankuptheamps.com>"

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    tar \
    && rm -rf /var/lib/apt/lists/*

# Copy AMPS tar.gz file
COPY AMPS-5.3.4.114-Release-Linux.tar.gz /binaries/AMPS-5.3.4.114-Release-Linux.tar.gz

# Extract AMPS and clean up
RUN tar -xzf /binaries/AMPS-5.3.4.114-Release-Linux.tar.gz -C / && \
    mv /AMPS-5.3.4.114-Release-Linux /AMPS && \
    rm /binaries/AMPS-5.3.4.114-Release-Linux.tar.gz

# Create log directory
RUN mkdir -p /var/log/amps && chmod -R 777 /var/log/amps

# Copy AMPS configuration file
COPY config.xml /AMPS/config.xml

# Expose WebSocket, TCP, and Admin ports (adjust based on config.xml)
EXPOSE 9007
EXPOSE 9008
EXPOSE 8085

# Run AMPS server with the configuration file
CMD ["/AMPS/bin/ampServer", "/AMPS/config.xml"]