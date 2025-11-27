# Hosting Panel Setup Guide (Cybrancee)

Complete step-by-step guide for setting up the Discord bot on Cybrancee hosting panel.

**📌 This bot supports both Go and TypeScript implementations. Choose the one that fits your needs.**

**📌 For a simpler guide, see [SIMPLE_SETUP.md](SIMPLE_SETUP.md)**

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

## 📋 Panel Configuration

### Option 1: Go Implementation

#### 1. **DOCKER IMAGE**
```
ghcr.io/cybrancee/debian:latest
```
✅ This is correct - keep as is.

---

#### 2. **GO PACKAGE**
```
discord-mod-bot
```
⚠️ **Important:** This should be your module name from `go.mod`, NOT a dependency package.

**Wrong:** `github.com/bwmarrin/discordgo`  
**Correct:** `discord-mod-bot`

---

#### 3. **EXECUTABLE**
```
go run cmd/bot/main.go
```
✅ This is correct - keep as is.

---

#### 4. **STARTUP COMMAND**

Replace the default script with:

```bash
if [[ ! -z .env ]]; then export $(cat .env | xargs); fi
go mod download
go run cmd/bot/main.go
```

**Or simplified version:**
```bash
go mod download && go run cmd/bot/main.go
```

---

#### 5. **ENVIRONMENT VARIABLES**

**⚠️ Important:** Do NOT put `.env` here. Instead, add your actual environment variables in this format:

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

**Format:** One variable per line, `KEY=VALUE` format.

---

### Option 2: TypeScript Implementation

#### 1. **DOCKER IMAGE**
```
ghcr.io/cybrancee/node:18
```
or
```
ghcr.io/cybrancee/debian:latest
```
✅ Use Node.js image if available, otherwise Debian (may need Node.js installation)

---

#### 2. **NODE PACKAGE** (if applicable)
```
discord-mod-bot
```
⚠️ **Note:** Some panels may not have this field for Node.js projects. Skip if not available.

---

#### 3. **EXECUTABLE**
```
node dist/index.js
```
✅ Use compiled JavaScript from `dist/` directory.

**Alternative (Development Mode):**
```
npm run dev
```
⚠️ Requires `ts-node` and all source files. Not recommended for production.

---

#### 4. **STARTUP COMMAND**

**Production (Recommended):**
```bash
npm install
npm run build
node dist/index.js
```

**Or if already built:**
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

#### 5. **ENVIRONMENT VARIABLES**

**⚠️ Important:** Do NOT put `.env` here. Instead, add your actual environment variables in this format:

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

**Format:** One variable per line, `KEY=VALUE` format.

---

## 📝 Complete Configuration Summary

### Go Implementation

| Field | Value |
|-------|-------|
| **DOCKER IMAGE** | `ghcr.io/cybrancee/debian:latest` |
| **GO PACKAGE** | `discord-mod-bot` |
| **EXECUTABLE** | `go run cmd/bot/main.go` |
| **STARTUP COMMAND** | `go mod download && go run cmd/bot/main.go` |
| **ENVIRONMENT VARIABLES** | See section above (all your config values) |

### TypeScript Implementation

| Field | Value |
|-------|-------|
| **DOCKER IMAGE** | `ghcr.io/cybrancee/node:18` or `ghcr.io/cybrancee/debian:latest` |
| **NODE PACKAGE** | `discord-mod-bot` (if applicable) |
| **EXECUTABLE** | `node dist/index.js` |
| **STARTUP COMMAND** | `npm install && npm run build && node dist/index.js` |
| **ENVIRONMENT VARIABLES** | See section above (all your config values) |

---

## 🚀 Step-by-Step Setup

### Go Implementation Setup

#### Step 1: Upload Files

Upload these files/directories to your hosting panel:
- ✅ `cmd/` directory
- ✅ `internal/` directory  
- ✅ `go.mod`
- ✅ `go.sum`
- ✅ `.env` file (optional if using panel env vars)

#### Step 2: Configure Panel Settings

1. **DOCKER IMAGE:** Set to `ghcr.io/cybrancee/debian:latest`
2. **GO PACKAGE:** Set to `discord-mod-bot`
3. **EXECUTABLE:** Set to `go run cmd/bot/main.go`
4. **STARTUP COMMAND:** Set to `go mod download && go run cmd/bot/main.go`
5. **ENVIRONMENT VARIABLES:** Add all your config variables (see format above)

#### Step 3: Start the Bot

Click "Start" or "Deploy" in your hosting panel. The bot should:
1. Download Go dependencies
2. Load environment variables
3. Start the bot
4. Connect to Discord

---

### TypeScript Implementation Setup

#### Step 1: Upload Files

Upload these files/directories to your hosting panel:
- ✅ `src/` directory (source files)
- ✅ `package.json`
- ✅ `package-lock.json`
- ✅ `tsconfig.json`
- ✅ `.env` file (optional if using panel env vars)

**OR** (if pre-built):
- ✅ `dist/` directory (compiled JavaScript)
- ✅ `package.json`
- ✅ `package-lock.json`
- ✅ `node_modules/` (or let npm install handle it)
- ✅ `.env` file (optional if using panel env vars)

#### Step 2: Configure Panel Settings

1. **DOCKER IMAGE:** Set to `ghcr.io/cybrancee/node:18` (or Debian if Node.js not available)
2. **EXECUTABLE:** Set to `node dist/index.js`
3. **STARTUP COMMAND:** Set to `npm install && npm run build && node dist/index.js`
4. **ENVIRONMENT VARIABLES:** Add all your config variables (see format above)

#### Step 3: Start the Bot

Click "Start" or "Deploy" in your hosting panel. The bot should:
1. Install npm dependencies
2. Build TypeScript to JavaScript (if source files uploaded)
3. Load environment variables
4. Start the bot
5. Connect to Discord

---

## 🔍 Verification

After starting, check the logs. You should see:

**Go Implementation:**
```
Bot Configuration:
  - Prefix: '.'
  - Guild ID: your_guild_id
  - Message Content Intent: Enabled
Logged in as: YourBot#1234
Bot is now running. Press CTRL-C to exit.
```

**TypeScript Implementation:**
```
Loading configuration...
Logged in as: YourBot#1234
Bot is now running. Press CTRL-C to exit.
```

---

## ⚠️ Common Issues

### Go Implementation Issues

#### Issue: "module not found" or "package not found"
**Solution:** 
- Check **GO PACKAGE** is set to `discord-mod-bot` (not a dependency)
- Ensure all files are uploaded correctly
- Verify `go.mod` file is present

#### Issue: "BOT_TOKEN is required"
**Solution:**
- Check **ENVIRONMENT VARIABLES** section has `BOT_TOKEN=your_token`
- Don't put `.env` in the field - put actual variables

#### Issue: "go: command not found"
**Solution:**
- Ensure Docker image has Go installed
- Try using: `ghcr.io/cybrancee/debian:latest` (should have Go pre-installed)

---

### TypeScript Implementation Issues

#### Issue: "Cannot find module" or "npm: command not found"
**Solution:**
- Ensure Docker image has Node.js installed
- Use `ghcr.io/cybrancee/node:18` or similar Node.js image
- Verify `package.json` is uploaded

#### Issue: "TypeScript compilation errors"
**Solution:**
- Check all source files in `src/` are uploaded
- Verify `tsconfig.json` is present
- Run `npm install` to ensure dependencies are installed
- Check Node.js version (requires 18+)

#### Issue: "Cannot find module 'discord.js'"
**Solution:**
- Run `npm install` in startup command
- Ensure `node_modules/` is uploaded or let npm install it
- Check `package.json` has correct dependencies

#### Issue: "BOT_TOKEN is required"
**Solution:**
- Check **ENVIRONMENT VARIABLES** section has `BOT_TOKEN=your_token`
- Don't put `.env` in the field - put actual variables

---

### Common Issues (Both Implementations)

#### Issue: Bot doesn't respond to commands
**Solution:**
- Verify Message Content Intent is enabled in Discord Developer Portal
- Check prefix matches (should be `.` based on your config)
- Check bot has "Send Messages" permission
- Verify bot is online in Discord

#### Issue: Bot disconnects frequently
**Solution:**
- Check hosting panel timeout settings
- Verify network connectivity
- Check Discord API status
- Review bot logs for errors

---

## 📌 Quick Reference

**Minimum Required Environment Variables:**
```
BOT_TOKEN=required
GUILD_ID=required
PREFIX=.
```

**Optional but Recommended:**
```
ADMIN_ROLE_ID=
MOD_ROLE_ID=
STAFF_ROLE_ID=
MUTE_ROLE_ID=
DISCORD_LOG_CHANNEL_ID=
AUTO_NICK_CHANNEL_ID=
VANITY_ROLE_ID=
VANITY_STRING=
VANITY_AUTO_ENABLED=false
```

---

## 🎯 Alternative: Using .env File

If your panel supports file uploads and you prefer using `.env`:

### Go Implementation

1. Create `.env` file locally with all variables
2. Upload `.env` to the root directory
3. **ENVIRONMENT VARIABLES** field can be left empty or just: `.env`
4. Update **STARTUP COMMAND** to:
   ```bash
   if [ -f .env ]; then export $(cat .env | xargs); fi
   go mod download
   go run cmd/bot/main.go
   ```

### TypeScript Implementation

1. Create `.env` file locally with all variables
2. Upload `.env` to the root directory
3. **ENVIRONMENT VARIABLES** field can be left empty
4. Update **STARTUP COMMAND** to:
   ```bash
   npm install
   npm run build
   node dist/index.js
   ```
   (TypeScript automatically loads `.env` via `dotenv` package)

---

## ✅ Final Checklist

### Go Implementation

Before starting the bot, verify:

- [ ] All project files uploaded (`cmd/`, `internal/`, `go.mod`, `go.sum`)
- [ ] Docker image set to `ghcr.io/cybrancee/debian:latest`
- [ ] GO PACKAGE set to `discord-mod-bot`
- [ ] EXECUTABLE set to `go run cmd/bot/main.go`
- [ ] STARTUP COMMAND includes `go mod download`
- [ ] ENVIRONMENT VARIABLES has all required values (not just `.env`)
- [ ] Bot token is valid and not expired
- [ ] Message Content Intent enabled in Discord Developer Portal
- [ ] Bot has proper permissions in Discord server

### TypeScript Implementation

Before starting the bot, verify:

- [ ] All project files uploaded (`src/`, `package.json`, `tsconfig.json` OR `dist/` if pre-built)
- [ ] Docker image set to Node.js image (or Debian with Node.js)
- [ ] EXECUTABLE set to `node dist/index.js`
- [ ] STARTUP COMMAND includes `npm install` and `npm run build` (if source files)
- [ ] ENVIRONMENT VARIABLES has all required values (not just `.env`)
- [ ] Bot token is valid and not expired
- [ ] Message Content Intent enabled in Discord Developer Portal
- [ ] Bot has proper permissions in Discord server
- [ ] Node.js version is 18+ (check with `node --version`)

---

## 🆘 Still Having Issues?

1. **Check Logs:** Look at the panel's log output for specific errors
2. **Verify Versions:** 
   - Go: Panel should have Go 1.21+ installed
   - Node.js: Panel should have Node.js 18+ installed
3. **Test Locally First:** 
   - Go: Run `go run cmd/bot/main.go` locally to verify it works
   - TypeScript: Run `npm run build && npm start` locally to verify it works
4. **Check File Permissions:** Ensure uploaded files are readable
5. **Contact Support:** If issues persist, contact your hosting panel support

---

## 🔄 Switching Between Implementations

If you want to switch from one implementation to another:

1. **From Go to TypeScript:**
   - Upload `src/`, `package.json`, `tsconfig.json`
   - Change Docker image to Node.js image
   - Update EXECUTABLE to `node dist/index.js`
   - Update STARTUP COMMAND to `npm install && npm run build && node dist/index.js`

2. **From TypeScript to Go:**
   - Upload `cmd/`, `internal/`, `go.mod`, `go.sum`
   - Change Docker image to `ghcr.io/cybrancee/debian:latest`
   - Update EXECUTABLE to `go run cmd/bot/main.go`
   - Update STARTUP COMMAND to `go mod download && go run cmd/bot/main.go`

**Note:** Environment variables remain the same for both implementations!

---

**Made with ❤️ by Kirito**
