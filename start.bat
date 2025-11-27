@echo off
REM Startup script for Discord Bot on Windows hosting panel

REM Load environment variables from .env file
if exist .env (
    for /f "tokens=*" %%a in (.env) do (
        set "%%a"
    )
)

REM Run the bot
go run cmd/bot/main.go

