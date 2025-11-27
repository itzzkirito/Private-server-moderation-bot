#!/bin/bash
# Startup script for Discord Bot on hosting panel

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the bot
go run cmd/bot/main.go

