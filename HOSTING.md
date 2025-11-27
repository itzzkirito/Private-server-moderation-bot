# Hosting Panel Setup Guide

This guide explains how to run the Discord bot on hosting panels like Cybrancee (https://panel.cybrancee.com/).

**📌 This bot supports both Go and TypeScript implementations. Choose the one that fits your needs.**

---

## 🎯 Choose Your Implementation

### Go Implementation ⚡
**Best for:**
- Maximum performance and low memory usage
- Single binary deployment
- Hosting panels with Go support

### TypeScript Implementation 🚀
**Best for:**
- Node.js-based hosting panels
- Modern development workflows
- Easy customization

**Both implementations have 100% feature parity and use the same `.env` configuration!**

---

## 📋 Panel Configuration (Cybrancee)

### Go Implementation

#### Required Settings

| Setting | Value |
|---------|-------|
| **DOCKER IMAGE** | `ghcr.io/cybrancee/debian:latest` |
| **GO PACKAGE** | `discord-mod-bot` ⚠️ (NOT `github.com/bwmarrin/discordgo`) |
| **EXECUTABLE** | `go run cmd/bot/main.go` |
| **STARTUP COMMAND** | `go mod download && go run cmd/bot/main.go` |

---

### TypeScript Implementation

#### Required Settings

| Setting | Value |
|---------|-------|
| **DOCKER IMAGE** | `ghcr.io/cybrancee/node:18` or `ghcr.io/cybrancee/debian:latest` |
| **EXECUTABLE** | `node dist/index.js` |
| **STARTUP COMMAND** | `npm install && npm run build && node dist/index.js` |

---

### Environment Variables (Both Implementations)

**⚠️ Important:** Do NOT put `.env` in the ENVIRONMENT VARIABLES field. Instead, add your actual variables:

```
BOT_TOKEN=your_bot_token_here
GUILD_ID=your_guild_id_here
ADMIN_ROLE_ID=your_admin_role_id
MOD_ROLE_ID=your_mod_role_id
STAFF_ROLE_ID=your_staff_role_id
PREFIX=.
MUTE_ROLE_ID=your_mute_role_id
DISCORD_LOG_CHANNEL_ID=your_log_channel_id
AUTO_NICK_CHANNEL_ID=your_nick_channel_id
VANITY_ROLE_ID=your_vanity_role_id
VANITY_STRING=/Lovers
VANITY_ROLE_NAME=Vanity Role
VANITY_COOLDOWN=0
VANITY_AUTO_ENABLED=true
```

**Format:** One variable per line: `KEY=VALUE`

---

## Prerequisites

### For Go Implementation
1. **Go Version**: Ensure Go 1.21 or higher is installed on the server
2. **Environment Variables**: Configure in panel or create `.env` file

### For TypeScript Implementation
1. **Node.js Version**: Ensure Node.js 18.0 or higher is installed on the server
2. **Environment Variables**: Configure in panel or create `.env` file

---

## Setup Steps

### Go Implementation

#### 1. Upload Your Files

Upload all project files to your hosting panel:
- `cmd/` directory
- `internal/` directory
- `go.mod` and `go.sum`
- `.env` file (optional if using panel env vars)
- `README.md` (optional)

#### 2. Configure Panel Settings

1. Set **DOCKER IMAGE** to `ghcr.io/cybrancee/debian:latest`
2. Set **GO PACKAGE** to `discord-mod-bot` (your module name)
3. Set **EXECUTABLE** to `go run cmd/bot/main.go`
4. Set **STARTUP COMMAND** to `go mod download && go run cmd/bot/main.go`
5. Add all environment variables in **ENVIRONMENT VARIABLES** field

#### 3. Start the Bot

Click "Start" or "Deploy" in your hosting panel. The bot will:
1. Download Go dependencies automatically
2. Load environment variables
3. Start and connect to Discord

**Alternative Startup Command (if using .env file):**
```bash
if [ -f .env ]; then export $(cat .env | xargs); fi
go mod download
go run cmd/bot/main.go
```

---

### TypeScript Implementation

#### 1. Upload Your Files

Upload all project files to your hosting panel:
- `src/` directory (source files)
- `package.json` and `package-lock.json`
- `tsconfig.json`
- `.env` file (optional if using panel env vars)

**OR** (if pre-built):
- `dist/` directory (compiled JavaScript)
- `package.json` and `package-lock.json`
- `node_modules/` (or let npm install handle it)
- `.env` file (optional if using panel env vars)

#### 2. Configure Panel Settings

1. Set **DOCKER IMAGE** to `ghcr.io/cybrancee/node:18` (or Debian if Node.js not available)
2. Set **EXECUTABLE** to `node dist/index.js`
3. Set **STARTUP COMMAND** to `npm install && npm run build && node dist/index.js`
4. Add all environment variables in **ENVIRONMENT VARIABLES** field

#### 3. Start the Bot

Click "Start" or "Deploy" in your hosting panel. The bot will:
1. Install npm dependencies automatically
2. Build TypeScript to JavaScript (if source files uploaded)
3. Load environment variables
4. Start and connect to Discord

**Alternative Startup Command (if already built):**
```bash
npm install
node dist/index.js
```

**Development Mode (if source files uploaded):**
```bash
npm install
npm run dev
```

---

## Troubleshooting

### Go Implementation Issues

#### Bot Not Starting
- Check that `.env` file exists and has all required variables
- Verify Go version: `go version` (should be 1.21+)
- Check file permissions on the hosting panel
- Ensure `go.mod` and `go.sum` are uploaded

#### Bot Disconnects
- This is normal if the hosting panel has timeout limits
- Consider using a process manager like PM2 or screen
- Check if the hosting panel supports background processes

#### Missing Dependencies
```bash
go mod tidy
go mod download
```

#### Permission Errors
- Ensure the bot has proper file permissions
- Check that the `.env` file is readable

---

### TypeScript Implementation Issues

#### Bot Not Starting
- Check that `.env` file exists and has all required variables
- Verify Node.js version: `node --version` (should be 18+)
- Check file permissions on the hosting panel
- Ensure `package.json` is uploaded

#### Bot Disconnects
- This is normal if the hosting panel has timeout limits
- Consider using a process manager like PM2
- Check if the hosting panel supports background processes

#### Missing Dependencies
```bash
npm install
npm run build
```

#### TypeScript Compilation Errors
- Ensure all source files in `src/` are uploaded
- Verify `tsconfig.json` is present
- Check Node.js version compatibility
- Clear and rebuild: `rm -rf node_modules dist && npm install && npm run build`

#### Permission Errors
- Ensure the bot has proper file permissions
- Check that the `.env` file is readable

---

## Process Managers (Optional)

### For Go Implementation

If your hosting panel supports it, you can use PM2:

```bash
# Install PM2
npm install -g pm2

# Start bot with PM2
pm2 start "go run cmd/bot/main.go" --name discord-bot-go

# View logs
pm2 logs discord-bot-go

# Restart bot
pm2 restart discord-bot-go
```

### For TypeScript Implementation

If your hosting panel supports it, you can use PM2:

```bash
# Install PM2
npm install -g pm2

# Start bot with PM2
pm2 start "node dist/index.js" --name discord-bot-ts

# View logs
pm2 logs discord-bot-ts

# Restart bot
pm2 restart discord-bot-ts
```

---

## Performance Comparison

### Go Implementation
- ✅ Lower memory usage (~10-20MB)
- ✅ Faster startup time
- ✅ Single binary (after compilation)
- ✅ Better for resource-constrained environments

### TypeScript Implementation
- ✅ Easier to modify and extend
- ✅ Better development experience
- ✅ Rich ecosystem and libraries
- ✅ Hot reload support in development

**Both implementations perform excellently for Discord bot workloads!**

---

## Support

For issues specific to your hosting panel, consult their documentation or support.

For bot-specific issues:
- Check the logs for error messages
- Verify all environment variables are set correctly
- Ensure Discord intents are enabled in Developer Portal
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions

---

**Made with ❤️ by Kirito**
