#!/bin/bash
echo "=== STARTUP SCRIPT ==="
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la
echo "=== STARTING APPLICATION ==="
echo "Command: python backend/main.py"
python backend/main.py
