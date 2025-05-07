#!/bin/bash

# Add diagnostic logging
echo "Starting before-install.sh script" > /tmp/before-install-log.txt
echo "Current directory: $(pwd)" >> /tmp/before-install-log.txt

# Check if npm configuration has any prefix set
if [ -f ~/.npmrc ]; then
  echo "Existing ~/.npmrc contents:" >> /tmp/before-install-log.txt
  cat ~/.npmrc >> /tmp/before-install-log.txt
  
  # Remove any prefix settings that might redirect npm
  sed -i '/prefix/d' ~/.npmrc
  echo "Removed prefix settings from ~/.npmrc" >> /tmp/before-install-log.txt
fi

# Also check for global npm config
if [ -f /usr/etc/npmrc ]; then
  echo "Global npmrc exists:" >> /tmp/before-install-log.txt
  cat /usr/etc/npmrc >> /tmp/before-install-log.txt
fi

# Stop any running application and clean destination directory
if [ -d /opt/rejuve-app ]; then
  echo "Directory /opt/rejuve-app exists" >> /tmp/before-install-log.txt
  if [ -d /opt/rejuve-app/node_modules ]; then
    # Save node_modules to speed up installation
    mkdir -p /tmp/backup
    cp -r /opt/rejuve-app/node_modules /tmp/backup/
    echo "Backed up node_modules to /tmp/backup" >> /tmp/before-install-log.txt
  fi
fi

# Also check for the wrong directory
if [ -d /var/www/rejuve-conversion-reporting ]; then
  echo "WARNING: Directory /var/www/rejuve-conversion-reporting exists" >> /tmp/before-install-log.txt
  echo "Contents:" >> /tmp/before-install-log.txt
  ls -la /var/www/rejuve-conversion-reporting >> /tmp/before-install-log.txt
  
  # If there's a symlink, remove it
  if [ -L /var/www/rejuve-conversion-reporting ]; then
    echo "Removing symlink /var/www/rejuve-conversion-reporting" >> /tmp/before-install-log.txt
    rm /var/www/rejuve-conversion-reporting
  fi
fi

# Make sure application directory exists
mkdir -p /opt/rejuve-app
echo "Created directory /opt/rejuve-app" >> /tmp/before-install-log.txt

# Create a symbolic link as a workaround for the path mismatch issue
mkdir -p /var/www
ln -sf /opt/rejuve-app /var/www/rejuve-conversion-reporting
echo "Created symbolic link from /var/www/rejuve-conversion-reporting to /opt/rejuve-app" >> /tmp/before-install-log.txt 