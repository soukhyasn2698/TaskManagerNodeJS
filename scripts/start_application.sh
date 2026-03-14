#!/bin/bash
cd /opt/nodejs-app

# Stop any existing PM2 processes
pm2 stop nodejs-app || true
pm2 delete nodejs-app || true

# Start the application
pm2 start package.json --name "nodejs-app"
pm2 save

# Test if application started successfully
sleep 5
curl -f http://localhost:3000/health || echo "Application health check failed"