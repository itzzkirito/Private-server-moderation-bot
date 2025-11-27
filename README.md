# Discord Moderation Bot

<div align="center">

**A high-performance Discord moderation bot available in both Go and TypeScript, featuring role-based permissions, rate limiting, and automated role management.**

[![Go Version](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat-square&logo=go)](https://golang.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**Choose your preferred language: Go for performance, TypeScript for modern development**

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Choose Your Implementation](#choose-your-implementation)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Go Implementation](#go-implementation)
  - [TypeScript Implementation](#typescript-implementation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Commands Reference](#commands-reference)
- [Advanced Features](#advanced-features)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

This Discord moderation bot provides a comprehensive solution for server management with **two complete implementations**:

- **Go Version** (`internal/` & `cmd/`) - High performance, low memory footprint, single binary
- **TypeScript Version** (`src/` & `dist/`) - Modern development, type safety, easy to extend

Both implementations offer:
- **Role-based permission system** with three distinct permission levels
- **Rate limiting** to prevent abuse and ensure fair moderation
- **Automated vanity role assignment** based on custom status
- **Auto-nickname system** for designated channels
- **Comprehensive logging** of all moderation actions
- **100% feature parity** between implementations

---

## 🎨 Choose Your Implementation

### Go Implementation ⚡
**Best for:**
- Production deployments requiring maximum performance
- Low memory footprint environments
- Single binary distribution
- Server environments with Go already installed

**Advantages:**
- ✅ Extremely fast and efficient
- ✅ Single executable file
- ✅ Low memory usage
- ✅ No runtime dependencies
- ✅ Excellent for hosting panels

### TypeScript Implementation 🚀
**Best for:**
- Modern development workflows
- Type safety and IDE support
- Easy customization and extension
- Node.js-based deployments

**Advantages:**
- ✅ Full TypeScript type safety
- ✅ Modern async/await syntax
- ✅ Rich ecosystem (discord.js)
- ✅ Easy to modify and extend
- ✅ Great developer experience

**Both implementations are actively maintained and feature-complete!**

---

## ✨ Features

### 🔐 Permission System

#### **Administrator Role**
- ✅ Unlimited ban, kick, and mute operations
- ✅ Full unban/unmute capabilities
- ✅ Complete role management (mod and staff roles)
- ✅ Staff management permissions

#### **Moderator Role**
- ✅ Rate-limited moderation (10 bans/kicks per day)
- ✅ Unlimited mute/unmute operations
- ✅ Staff role management capabilities

#### **Staff Role**
- ✅ Unlimited mute/unmute operations
- ✅ Administrative-level permissions for most operations

### 🚀 Core Capabilities

- **Moderation Commands**: Ban, kick, mute, unban, and unmute with reason tracking
- **Role Management**: Automated role assignment and removal
- **Rate Limiting**: Configurable daily limits for moderation actions
- **Auto-Nickname System**: Channel-based nickname changes without permissions
- **Vanity Role Automation**: Automatic role assignment based on custom status
- **Comprehensive Logging**: All actions logged to designated channels
- **Performance Optimized**: Efficient caching and thread-safe operations

---

## 📦 Prerequisites

### For Go Implementation
- **Go 1.21 or higher** ([Download](https://golang.org/dl/))
- **Discord Bot Token** ([Get from Discord Developer Portal](https://discord.com/developers/applications))
- **Discord Server (Guild)** with appropriate permissions

### For TypeScript Implementation
- **Node.js 18.0 or higher** ([Download](https://nodejs.org/))
- **Discord Bot Token** ([Get from Discord Developer Portal](https://discord.com/developers/applications))
- **Discord Server (Guild)** with appropriate permissions

### Required Discord Intents
Enable these in the [Discord Developer Portal](https://discord.com/developers/applications):
- ✅ **Server Members Intent** (Required)
- ✅ **Presence Intent** (Required for vanity auto system)
- ✅ **Message Content Intent** (Required for commands)

---

## 🛠️ Installation

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Mod
```

Or download and extract the ZIP file.

### Step 2: Create Environment File

Create a `.env` file in the root directory:

```bash
# On Linux/macOS
touch .env

# On Windows
type nul > .env
```

### Step 3: Configure Environment Variables

Edit the `.env` file with your configuration (see [Configuration](#configuration) section below).

---

## 🔧 Go Implementation

### Installation

```bash
# Install Go dependencies
go mod download
```

### Running the Bot

**Development Mode:**
```bash
go run cmd/bot/main.go
```

**Production Mode:**
```bash
# Build the binary
go build -o bot.exe ./cmd/bot

# Run the binary
./bot.exe  # Linux/macOS
bot.exe    # Windows
```

**Using Startup Scripts:**
```bash
# Linux/macOS
bash start.sh

# Windows
start.bat
```

### Project Structure (Go)

```
cmd/
└── bot/
    └── main.go              # Entry point
internal/
├── bot/
│   ├── bot.go              # Bot core and event handlers
│   ├── commands.go         # Command handlers
│   └── handlers.go         # Presence and vanity handlers
├── config/
│   └── config.go           # Configuration management
└── utils/
    └── permissions.go       # Permission checking and rate limiting
```

---

## 🚀 TypeScript Implementation

### Installation

```bash
# Install Node.js dependencies
npm install
```

### Building the Project

```bash
# Compile TypeScript to JavaScript
npm run build
```

### Running the Bot

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

**Watch Mode (auto-compile on changes):**
```bash
npm run watch
```

### Project Structure (TypeScript)

```
src/
├── index.ts                # Main entry point
├── config/
│   └── config.ts           # Configuration management
├── bot/
│   ├── bot.ts             # Bot core and event handlers
│   ├── commands.ts        # Command handlers
│   └── handlers.ts         # Presence and vanity handlers
└── utils/
    └── permissions.ts      # Permission checking and rate limiting

dist/                       # Compiled JavaScript (generated)
```

---

## ⚙️ Configuration

### Environment Variables

Both implementations use the same `.env` file format. Create a `.env` file in the root directory:

#### **Required Variables**

| Variable | Description | Example |
|----------|-------------|---------|
| `BOT_TOKEN` | Your Discord bot token | `MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.ABC...` |
| `GUILD_ID` | Your Discord server (guild) ID | `123456789012345678` |

#### **Role Configuration**

| Variable | Description | Example |
|----------|-------------|---------|
| `ADMIN_ROLE_ID` | Role ID for administrators | `123456789012345678` |
| `MOD_ROLE_ID` | Role ID for moderators | `123456789012345679` |
| `STAFF_ROLE_ID` | Role ID for staff members | `123456789012345680` |
| `MUTE_ROLE_ID` | Role ID for muted users (must have no send message permissions) | `123456789012345681` |

#### **Optional Configuration**

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PREFIX` | Command prefix | `!` | `!` or `?` or `.` |
| `DISCORD_LOG_CHANNEL_ID` | Channel ID for logging moderation actions | (empty) | `123456789012345682` |
| `AUTO_NICK_CHANNEL_ID` | Channel ID where users can change nicknames | (empty) | `123456789012345683` |

#### **Vanity Role Configuration**

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VANITY_AUTO_ENABLED` | Enable automatic vanity role assignment | `false` | `true` |
| `VANITY_ROLE_ID` | Role ID to assign (preferred method) | (empty) | `123456789012345684` |
| `VANITY_ROLE_NAME` | Role name (fallback if ID not found) | (empty) | `Vanity Role` |
| `VANITY_STRING` | String to check in custom status | (empty) | `/Lovers` |
| `VANITY_COOLDOWN` | Cooldown in seconds between checks | `0` | `2` |

### Example `.env` File

```env
# Required
BOT_TOKEN=your_bot_token_here
GUILD_ID=your_guild_id_here

# Roles
ADMIN_ROLE_ID=123456789012345678
MOD_ROLE_ID=123456789012345679
STAFF_ROLE_ID=123456789012345680
MUTE_ROLE_ID=123456789012345681

# Optional
PREFIX=.
DISCORD_LOG_CHANNEL_ID=123456789012345682
AUTO_NICK_CHANNEL_ID=123456789012345683

# Vanity System (Optional)
VANITY_AUTO_ENABLED=true
VANITY_ROLE_ID=123456789012345684
VANITY_ROLE_NAME=Vanity Role
VANITY_STRING=/Lovers
VANITY_COOLDOWN=2
```

### Getting Discord IDs

#### **Enable Developer Mode**
1. Open Discord Settings
2. Navigate to **Advanced** → **Developer Mode**
3. Enable Developer Mode

#### **Get Role ID**
1. Right-click on the role in Server Settings → Roles
2. Click **Copy ID**

#### **Get Guild (Server) ID**
1. Right-click on your server name
2. Click **Copy ID**

#### **Get Channel ID**
1. Right-click on the channel
2. Click **Copy ID**

---

## 🎮 Usage

### Starting the Bot

#### Go Implementation

**Local Development:**
```bash
go run cmd/bot/main.go
```

**Production:**
```bash
go build -o bot.exe ./cmd/bot
./bot.exe  # Linux/macOS
bot.exe    # Windows
```

#### TypeScript Implementation

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

### Verifying Bot Status

Once running, you should see:
```
Loading configuration...
Logged in as: YourBot#1234
Bot is now running. Press CTRL-C to exit.
```

---

## 📜 Commands Reference

Both implementations support the same commands with identical functionality.

### Moderation Commands

#### **Ban**
```
.ban @user [reason]
```
- **Permission**: Admin, Staff (unlimited) | Mod (10/day)
- **Description**: Permanently bans a user from the server
- **Example**: `.ban @spammer Violating server rules`

#### **Kick**
```
.kick @user [reason]
```
- **Permission**: Admin, Staff (unlimited) | Mod (10/day)
- **Description**: Removes a user from the server
- **Example**: `.kick @user Temporary removal`

#### **Mute**
```
.mute @user [reason]
```
- **Permission**: Admin, Mod, Staff (unlimited)
- **Description**: Mutes a user (prevents sending messages)
- **Example**: `.mute @user Spam prevention`

#### **Unban**
```
.unban <user_id>
.unban @user
```
- **Permission**: Admin, Staff only
- **Description**: Removes a ban from a user
- **Example**: `.unban 123456789012345678` or `.unban @user`

#### **Unmute**
```
.unmute @user
```
- **Permission**: Admin, Mod, Staff
- **Description**: Removes mute from a user
- **Example**: `.unmute @user`

### Role Management Commands

#### **Mod Role Management**
```
.mod add @user
.mod remove @user
```
- **Permission**: Admin, Staff
- **Description**: Add or remove moderator role

#### **Staff Role Management**
```
.staffs add @user
.staffs remove @user
```
- **Permission**: Admin, Staff
- **Description**: Add or remove staff role

#### **Vanity Role Management**
```
.vanity add @user
.vanity remove @user
.vanity check @user
```
- **Permission**: Admin, Staff
- **Description**: Manually manage vanity roles or check user status

### User Commands

#### **Nickname Change**
```
.nick <new nickname>
.nickname <new nickname>
```
- **Permission**: All users (requires "Change Nickname" permission or Admin/Mod/Staff role)
- **Description**: Change your own nickname
- **Restrictions**: 
  - 1-32 characters
  - Cannot contain `@` or `#` symbols
- **Example**: `.nick CoolGamer123`

#### **Help**
```
.help
.commands
```
- **Permission**: All users
- **Description**: Display help menu with available commands

---

## 🚀 Advanced Features

### Auto-Nickname Channel System

When `AUTO_NICK_CHANNEL_ID` is configured, users can change their nicknames by simply sending a message in that channel. No command prefix or permissions required.

**How it works:**
1. User sends a message in the designated channel
2. Bot automatically changes their nickname to the message content
3. Bot reacts with ✅ on success
4. Supports "reset" keyword to reset nickname to default

**Configuration:**
```env
AUTO_NICK_CHANNEL_ID=123456789012345683
```

**Restrictions:**
- Messages with attachments are ignored
- Messages with embeds are ignored
- Messages containing URLs/links are ignored
- Maximum 32 characters

### Vanity Role Auto-Assignment System

Automatically assigns/removes vanity roles based on users' custom Discord status.

**Features:**
- ✅ Real-time presence monitoring
- ✅ Automatic role assignment/removal
- ✅ Startup member check (checks all members on bot start)
- ✅ Cooldown system to prevent rate limits
- ✅ Safety checks (prevents dangerous permissions)
- ✅ Configurable vanity string matching
- ✅ Supports both role ID and role name

**Configuration:**
```env
VANITY_AUTO_ENABLED=true
VANITY_ROLE_ID=123456789012345684
VANITY_STRING=/Lovers
VANITY_COOLDOWN=2
```

**How it works:**
1. Bot monitors user presence updates in real-time
2. Checks if custom status contains `VANITY_STRING`
3. Automatically adds role if status matches
4. Removes role if status doesn't match
5. Checks all members on startup for initial sync

**Note**: The system prioritizes `VANITY_ROLE_ID` over `VANITY_ROLE_NAME`. Using role ID is more reliable.

### Logging System

All moderation actions are automatically logged to the configured channel.

**Logged Information:**
- Action type (Ban, Kick, Mute, etc.)
- Moderator who performed the action
- Target user
- Reason (if provided)
- Timestamp

**Configuration:**
```env
DISCORD_LOG_CHANNEL_ID=123456789012345682
```

---

## 🚢 Deployment

### Hosting Panel Deployment (Cybrancee, Pterodactyl, etc.)

#### Go Implementation

1. **Upload Files**: Upload all project files to your hosting panel
2. **Install Dependencies**: Run `go mod download`
3. **Create `.env` File**: Configure all environment variables
4. **Start Command**: Use `go run cmd/bot/main.go` in the startup command field
5. **Monitor**: Check logs for any errors

**Alternative (Compiled Binary):**
1. Build binary locally: `go build -o bot.exe ./cmd/bot`
2. Upload `bot.exe` and `.env` file
3. Start command: `./bot.exe` or `bot.exe`

#### TypeScript Implementation

1. **Upload Files**: Upload all project files to your hosting panel
2. **Install Dependencies**: Run `npm install`
3. **Build Project**: Run `npm run build`
4. **Create `.env` File**: Configure all environment variables
5. **Start Command**: Use `node dist/index.js` in the startup command field
6. **Monitor**: Check logs for any errors

**Alternative (Development Mode):**
- Start command: `npm run dev` (uses ts-node, no build step required)

For detailed hosting instructions, see [HOSTING.md](HOSTING.md) and [HOSTING_PANEL_SETUP.md](HOSTING_PANEL_SETUP.md).

### Systemd Service (Linux)

#### Go Implementation

Create `/etc/systemd/system/discord-bot.service`:

```ini
[Unit]
Description=Discord Moderation Bot (Go)
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/bot
ExecStart=/usr/local/go/bin/go run cmd/bot/main.go
Restart=always
RestartSec=10
EnvironmentFile=/path/to/bot/.env

[Install]
WantedBy=multi-user.target
```

#### TypeScript Implementation

Create `/etc/systemd/system/discord-bot.service`:

```ini
[Unit]
Description=Discord Moderation Bot (TypeScript)
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/bot
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
EnvironmentFile=/path/to/bot/.env

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable discord-bot
sudo systemctl start discord-bot
```

### Docker Deployment

#### Go Implementation

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o bot ./cmd/bot

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/bot .
COPY --from=builder /app/.env .
CMD ["./bot"]
```

#### TypeScript Implementation

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env .
CMD ["node", "dist/index.js"]
```

---

## 🔧 Bot Permissions

Your bot requires the following Discord permissions:

### Required Permissions
- ✅ **Ban Members** - To ban users
- ✅ **Kick Members** - To kick users
- ✅ **Manage Roles** - To assign/remove roles
- ✅ **Send Messages** - For command responses and logging
- ✅ **Manage Nicknames** - For nickname changes

### Optional Permissions
- ⚠️ **Manage Messages** - For better moderation capabilities
- ⚠️ **Read Message History** - For better context

### Required Intents

Enable these in the [Discord Developer Portal](https://discord.com/developers/applications):

1. Navigate to your application → **Bot** → **Privileged Gateway Intents**
2. Enable:
   - ✅ **Server Members Intent** (Required)
   - ✅ **Presence Intent** (Required for vanity auto system)
   - ✅ **Message Content Intent** (Required for commands)

---

## 🐛 Troubleshooting

### Bot Not Starting

**Issue**: Bot fails to start or crashes immediately

**Solutions**:
- ✅ Verify `.env` file exists and contains all required variables
- ✅ Check that `BOT_TOKEN` is valid and not expired
- ✅ Ensure `GUILD_ID` is correct
- ✅ For Go: Verify Go version: `go version` (should be 1.21+)
- ✅ For TypeScript: Verify Node.js version: `node --version` (should be 18+)
- ✅ Check file permissions on hosting panel

### Bot Not Responding to Commands

**Issue**: Bot is online but doesn't respond to commands

**Solutions**:
- ✅ Verify bot has "Send Messages" permission in the channel
- ✅ Check command prefix matches configuration (default: `!`)
- ✅ Ensure bot role is high enough in role hierarchy
- ✅ Verify required intents are enabled in Discord Developer Portal
- ✅ Check bot logs for error messages

### Vanity Role Not Assigning

**Issue**: Vanity roles are not being assigned automatically

**Solutions**:
- ✅ Verify `VANITY_AUTO_ENABLED=true` in `.env`
- ✅ Check that `VANITY_ROLE_ID` or `VANITY_ROLE_NAME` is correct
- ✅ Ensure "Presence Intent" is enabled in Discord Developer Portal
- ✅ Verify bot role is above vanity role in hierarchy
- ✅ Check that vanity role doesn't have dangerous permissions
- ✅ Review bot logs for error messages

### Rate Limiting Issues

**Issue**: Bot hits Discord rate limits

**Solutions**:
- ✅ Increase `VANITY_COOLDOWN` value
- ✅ Reduce frequency of member checks
- ✅ Check bot's rate limit status in Discord Developer Portal
- ✅ Wait for rate limit to reset

### Permission Errors

**Issue**: Bot cannot perform actions due to permissions

**Solutions**:
- ✅ Verify bot role is above target user's highest role
- ✅ Check bot has required permissions in server settings
- ✅ Ensure bot role has necessary permissions enabled
- ✅ Verify role hierarchy is correct

### TypeScript-Specific Issues

**Issue**: TypeScript compilation errors

**Solutions**:
- ✅ Run `npm install` to ensure all dependencies are installed
- ✅ Check `tsconfig.json` for correct configuration
- ✅ Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- ✅ Clear TypeScript cache: `rm -rf dist && npm run build`
- ✅ Verify Node.js version compatibility

### Go-Specific Issues

**Issue**: Go build or runtime errors

**Solutions**:
- ✅ Run `go mod download` to ensure dependencies are installed
- ✅ Verify Go version: `go version` (should be 1.21+)
- ✅ Clean build cache: `go clean -cache`
- ✅ Verify all imports are correct

---

## 📝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

#### Go
- Follow Go standard formatting (`gofmt`)
- Write clear, documented code
- Add comments for complex logic
- Ensure all tests pass

#### TypeScript
- Follow TypeScript best practices
- Use strict mode
- Write clear, documented code
- Add type annotations
- Ensure code compiles without errors

### Maintaining Feature Parity

When adding features:
- ✅ Implement in both Go and TypeScript versions
- ✅ Maintain identical functionality
- ✅ Update documentation for both
- ✅ Test both implementations

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **Go Implementation**: Built with [discordgo](https://github.com/bwmarrin/discordgo) and [godotenv](https://github.com/joho/godotenv)
- **TypeScript Implementation**: Built with [discord.js](https://discord.js.org/) and [dotenv](https://github.com/motdotla/dotenv)

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on the repository
- Check existing documentation
- Review troubleshooting section
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions

---

<div align="center">

**Made with ❤️ by Kirito**

[Back to Top](#discord-moderation-bot)

</div>
