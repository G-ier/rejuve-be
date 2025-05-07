#!/bin/bash

# Script for AllowTraffic lifecycle hook
echo "AllowTraffic hook starting"

# Make sure the health check app is running
if ! curl -s http://localhost:3500/health > /dev/null; then
  echo "Health check app not responding, starting it"
  cd /var/www/health-check
  pm2 start app.js --name health-check || true
fi

# Always succeed
echo "AllowTraffic hook completing successfully"
exit 0 