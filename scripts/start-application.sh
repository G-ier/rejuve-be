#!/bin/bash

# Change to application directory
cd /opt/rejuve-app

# Ensure directory exists and has proper permissions
if [ ! -d "/opt/rejuve-app" ]; then
  echo "Error: Application directory /opt/rejuve-app does not exist"
  mkdir -p /opt/rejuve-app
  chown -R root:root /opt/rejuve-app
fi

# Determine start command by checking package.json
START_CMD="npm start"
if [ -f package.json ]; then
  # Check if there's a specific start command
  if grep -q "\"start\":" package.json; then
    START_CMD="npm start"
  # Check if there's a dev command as fallback
  elif grep -q "\"dev\":" package.json; then
    START_CMD="npm run dev"
  # Check if this is an Express app with a specific entry point
  elif grep -q "\"main\":" package.json; then
    MAIN_FILE=$(grep "\"main\":" package.json | cut -d '"' -f 4)
    START_CMD="node $MAIN_FILE"
  fi
fi

# Create a systemd service file
cat > /etc/systemd/system/rejuve-app.service << EOF
[Unit]
Description=Rejuve Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/rejuve-app
ExecStart=/usr/bin/env $START_CMD
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=rejuve-app
Environment=NODE_ENV=production
Environment=PATH=/usr/bin:/usr/local/bin:/bin

[Install]
WantedBy=multi-user.target
EOF

# Make sure npm and node are in path for the service
which npm && which node || echo "WARNING: npm or node not found in PATH!"

# Ensure proper permissions
chmod 644 /etc/systemd/system/rejuve-app.service

# Reload systemd, enable and start service
systemctl daemon-reload
systemctl enable rejuve-app

# Stop service if already running
systemctl stop rejuve-app || true

# Delete any old log files that might cause issues
rm -f /opt/rejuve-app/*.log || true

# Start the service
systemctl start rejuve-app

# Wait to confirm service started successfully
sleep 5
systemctl status rejuve-app || echo "Service failed to start. Check logs with: journalctl -u rejuve-app" 