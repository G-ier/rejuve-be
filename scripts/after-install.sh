#!/bin/bash

# Add diagnostic logging
echo "Starting after-install.sh script" > /tmp/deploy-diagnostics.log
echo "Current directory: $(pwd)" >> /tmp/deploy-diagnostics.log
echo "User: $(whoami)" >> /tmp/deploy-diagnostics.log
echo "PATH: $PATH" >> /tmp/deploy-diagnostics.log

# Change to application directory
cd /opt/rejuve-app
echo "Changed to directory: $(pwd)" >> /tmp/deploy-diagnostics.log

# Check if we're in the right directory
if [ ! -d "/opt/rejuve-app" ]; then
  echo "ERROR: Directory /opt/rejuve-app does not exist!" >> /tmp/deploy-diagnostics.log
  mkdir -p /opt/rejuve-app
  echo "Created directory /opt/rejuve-app" >> /tmp/deploy-diagnostics.log
fi

# List directory contents
echo "Directory contents:" >> /tmp/deploy-diagnostics.log
ls -la >> /tmp/deploy-diagnostics.log

# Restore node_modules if previously backed up
if [ -d /tmp/backup/node_modules ]; then
  cp -r /tmp/backup/node_modules /opt/rejuve-app/
  rm -rf /tmp/backup/node_modules
  echo "Restored node_modules from backup" >> /tmp/deploy-diagnostics.log
fi

# Install dependencies
echo "Running npm install in $(pwd)" >> /tmp/deploy-diagnostics.log
npm install --prefix /opt/rejuve-app
echo "npm install completed with exit code: $?" >> /tmp/deploy-diagnostics.log

# Build the application if needed
if [ -f /opt/rejuve-app/package.json ]; then
  echo "package.json found" >> /tmp/deploy-diagnostics.log
  if grep -q "\"build\":" /opt/rejuve-app/package.json; then
    echo "Running npm run build" >> /tmp/deploy-diagnostics.log
    npm run build --prefix /opt/rejuve-app
    echo "Build completed with exit code: $?" >> /tmp/deploy-diagnostics.log
  fi
else
  echo "ERROR: package.json not found in /opt/rejuve-app" >> /tmp/deploy-diagnostics.log
  echo "Files in /opt/rejuve-app:" >> /tmp/deploy-diagnostics.log
  ls -la /opt/rejuve-app >> /tmp/deploy-diagnostics.log
fi

# Set proper permissions
chown -R ubuntu:ubuntu /opt/rejuve-app
echo "Permissions set for /opt/rejuve-app" >> /tmp/deploy-diagnostics.log 