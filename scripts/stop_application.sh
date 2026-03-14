#!/bin/bash
pm2 stop nodejs-app || true
pm2 delete nodejs-app || true