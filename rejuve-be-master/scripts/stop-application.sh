#!/bin/bash

# Stop the application service if it exists
if [ -f /etc/systemd/system/rejuve-app.service ]; then
  systemctl stop rejuve-app
  systemctl disable rejuve-app
  echo "Rejuve application service stopped"
else
  echo "No rejuve application service found"
fi

# Kill any potentially running Node.js processes for the application
pkill -f "node.*rejuve-app" || true 