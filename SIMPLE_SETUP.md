# 🚀 Simple Hosting Panel Setup Guide

**Step-by-step guide with exact values to copy-paste into your hosting panel.**

**📌 This bot supports both Go and TypeScript implementations. Choose the one that fits your needs.**

---

## 🎯 Quick Decision Guide

**Choose Go if:**
- You want maximum performance
- Your panel supports Go
- You prefer single binary deployment

**Choose TypeScript if:**
- Your panel supports Node.js
- You want easier customization
- You prefer modern development tools

**Both use the same `.env` file and have identical features!**

---

## 📋 Step 1: Upload Files

### For Go Implementation

Upload these folders/files to your hosting panel:
- ✅ `cmd/` folder
- ✅ `internal/` folder
- ✅ `go.mod` file
- ✅ `go.sum` file

### For TypeScript Implementation

Upload these folders/files to your hosting panel:
- ✅ `src/` folder (source files)
- ✅ `package.json` file
- ✅ `package-lock.json` file
- ✅ `tsconfig.json` file

**OR** (if pre-built):
- ✅ `dist/` folder (compiled JavaScript)
- ✅ `package.json` file
- ✅ `package-lock.json` file

---

## ⚙️ Step 2: Configure Panel Settings

Fill in each field in your hosting panel with these **EXACT** values:

---

## 🔵 Go Implementation Configuration

### Field 1: **DOCKER IMAGE**
```
ghcr.io/cybrancee/debian:latest
```
✅ Copy this exactly

---

### Field 2: **GO PACKAGE**
```
discord-mod-bot
```
✅ Copy this exactly (NOT `github.com/bwmarrin/discordgo`)

---

### Field 3: **EXECUTABLE**
```
go run cmd/bot/main.go
```
✅ Copy this exactly

---

### Field 4: **STARTUP COMMAND**
```
go mod download && go run cmd/bot/main.go
```
✅ Copy this exactly

---

### Field 5: **ENVIRONMENT VARIABLES**

**⚠️ IMPORTANT:** Delete everything in this field and paste this (replace with YOUR actual values):

```
BOT_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.ABC_DEF_GHI_JKL_MNO_PQR_STU_VWX_YZ
GUILD_ID=123456789012345678
ADMIN_ROLE_ID=123456789012345678
MOD_ROLE_ID=123456789012345679
STAFF_ROLE_ID=123456789012345680
MUTE_ROLE_ID=123456789012345681
PREFIX=.
DISCORD_LOG_CHANNEL_ID=123456789012345682
AUTO_NICK_CHANNEL_ID=123456789012345683
VANITY_ROLE_ID=123456789012345684
VANITY_STRING=/Lovers
VANITY_ROLE_NAME=Vanity Role
VANITY_COOLDOWN=0
VANITY_AUTO_ENABLED=true
```

**Replace the numbers with YOUR actual IDs!**

---

## 🟢 TypeScript Implementation Configuration

### Field 1: **DOCKER IMAGE**
```
ghcr.io/cybrancee/node:18
```
✅ Copy this exactly (or use `ghcr.io/cybrancee/debian:latest` if Node.js image not available)

---

### Field 2: **EXECUTABLE**
```
node dist/index.js
```
✅ Copy this exactly

---

### Field 3: **STARTUP COMMAND**
```
npm install && npm run build && node dist/index.js
```
✅ Copy this exactly

**If already built (dist/ folder uploaded):**
```
npm install && node dist/index.js
```

---

### Field 4: **ENVIRONMENT VARIABLES**

**⚠️ IMPORTANT:** Delete everything in this field and paste this (replace with YOUR actual values):

```
BOT_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.ABC_DEF_GHI_JKL_MNO_PQR_STU_VWX_YZ
GUILD_ID=123456789012345678
ADMIN_ROLE_ID=123456789012345678
MOD_ROLE_ID=123456789012345679
STAFF_ROLE_ID=123456789012345680
MUTE_ROLE_ID=123456789012345681
PREFIX=.
DISCORD_LOG_CHANNEL_ID=123456789012345682
AUTO_NICK_CHANNEL_ID=123456789012345683
VANITY_ROLE_ID=123456789012345684
VANITY_STRING=/Lovers
VANITY_ROLE_NAME=Vanity Role
VANITY_COOLDOWN=0
VANITY_AUTO_ENABLED=true
```

**Replace the numbers with YOUR actual IDs!**

---

## 📝 How to Get Your Values

### 1. Get BOT_TOKEN
1. Go to https://discord.com/developers/applications
2. Click your bot application
3. Go to **Bot** tab
4. Click **Reset Token** or **Copy** next to token
5. Paste it after `BOT_TOKEN=`

### 2. Get GUILD_ID (Server ID)
1. Enable Developer Mode: Discord Settings → Advanced → Developer Mode ✅
2. Right-click your server name
3. Click **Copy ID**
4. Paste it after `GUILD_ID=`

### 3. Get Role IDs
1. Enable Developer Mode (if not already)
2. Right-click the role (Admin, Mod, Staff, Mute)
3. Click **Copy ID**
4. Paste it after the corresponding variable

### 4. Get Channel IDs
1. Enable Developer Mode
2. Right-click the channel
3. Click **Copy ID**
4. Paste it after the corresponding variable

---

## ✅ Quick Checklist

### Go Implementation

Before clicking "Start" or "Deploy", check:

- [ ] Files uploaded (`cmd/`, `internal/`, `go.mod`, `go.sum`)
- [ ] DOCKER IMAGE = `ghcr.io/cybrancee/debian:latest`
- [ ] GO PACKAGE = `discord-mod-bot`
- [ ] EXECUTABLE = `go run cmd/bot/main.go`
- [ ] STARTUP COMMAND = `go mod download && go run cmd/bot/main.go`
- [ ] ENVIRONMENT VARIABLES has all your values (not just `.env`)
- [ ] BOT_TOKEN is your real token
- [ ] GUILD_ID is your real server ID

### TypeScript Implementation

Before clicking "Start" or "Deploy", check:

- [ ] Files uploaded (`src/`, `package.json`, `tsconfig.json` OR `dist/` if pre-built)
- [ ] DOCKER IMAGE = `ghcr.io/cybrancee/node:18` (or Debian)
- [ ] EXECUTABLE = `node dist/index.js`
- [ ] STARTUP COMMAND = `npm install && npm run build && node dist/index.js`
- [ ] ENVIRONMENT VARIABLES has all your values (not just `.env`)
- [ ] BOT_TOKEN is your real token
- [ ] GUILD_ID is your real server ID

---

## 🎯 Example Configuration

### Go Implementation

**DOCKER IMAGE:**
```
ghcr.io/cybrancee/debian:latest
```

**GO PACKAGE:**
```
discord-mod-bot
```

**EXECUTABLE:**
```
go run cmd/bot/main.go
```

**STARTUP COMMAND:**
```
go mod download && go run cmd/bot/main.go
```

**ENVIRONMENT VARIABLES:**
```
BOT_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.ABC123
GUILD_ID=987654321098765432
ADMIN_ROLE_ID=111111111111111111
MOD_ROLE_ID=222222222222222222
STAFF_ROLE_ID=333333333333333333
MUTE_ROLE_ID=444444444444444444
PREFIX=.
DISCORD_LOG_CHANNEL_ID=555555555555555555
AUTO_NICK_CHANNEL_ID=666666666666666666
VANITY_ROLE_ID=777777777777777777
VANITY_STRING=/Lovers
VANITY_ROLE_NAME=Vanity Role
VANITY_COOLDOWN=0
VANITY_AUTO_ENABLED=true
```

---

### TypeScript Implementation

**DOCKER IMAGE:**
```
ghcr.io/cybrancee/node:18
```

**EXECUTABLE:**
```
node dist/index.js
```

**STARTUP COMMAND:**
```
npm install && npm run build && node dist/index.js
```

**ENVIRONMENT VARIABLES:**
```
BOT_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.ABC123
GUILD_ID=987654321098765432
ADMIN_ROLE_ID=111111111111111111
MOD_ROLE_ID=222222222222222222
STAFF_ROLE_ID=333333333333333333
MUTE_ROLE_ID=444444444444444444
PREFIX=.
DISCORD_LOG_CHANNEL_ID=555555555555555555
AUTO_NICK_CHANNEL_ID=666666666666666666
VANITY_ROLE_ID=777777777777777777
VANITY_STRING=/Lovers
VANITY_ROLE_NAME=Vanity Role
VANITY_COOLDOWN=0
VANITY_AUTO_ENABLED=true
```

---

## 🚨 Common Mistakes

### Go Implementation

### ❌ Wrong: GO PACKAGE = `github.com/bwmarrin/discordgo`
### ✅ Correct: GO PACKAGE = `discord-mod-bot`

### ❌ Wrong: ENVIRONMENT VARIABLES = `.env`
### ✅ Correct: ENVIRONMENT VARIABLES = `BOT_TOKEN=...` (all your variables)

### ❌ Wrong: STARTUP COMMAND = `./bot.exe`
### ✅ Correct: STARTUP COMMAND = `go mod download && go run cmd/bot/main.go`

---

### TypeScript Implementation

### ❌ Wrong: EXECUTABLE = `npm start`
### ✅ Correct: EXECUTABLE = `node dist/index.js`

### ❌ Wrong: STARTUP COMMAND = `node src/index.ts`
### ✅ Correct: STARTUP COMMAND = `npm install && npm run build && node dist/index.js`

### ❌ Wrong: ENVIRONMENT VARIABLES = `.env`
### ✅ Correct: ENVIRONMENT VARIABLES = `BOT_TOKEN=...` (all your variables)

---

## 🔍 After Starting

Check the logs. You should see:

**Go Implementation:**
```
Bot Configuration:
  - Prefix: '.'
  - Guild ID: your_guild_id
Logged in as: YourBot#1234
Bot is now running. Press CTRL-C to exit.
```

**TypeScript Implementation:**
```
Loading configuration...
Logged in as: YourBot#1234
Bot is now running. Press CTRL-C to exit.
```

If you see errors, check:
1. BOT_TOKEN is correct
2. GUILD_ID is correct
3. All IDs are 17-19 digit numbers
4. No spaces in variable values
5. For TypeScript: Node.js is installed and version is 18+
6. For Go: Go is installed and version is 1.21+

---

## 📞 Still Need Help?

1. **Check logs** - Look for error messages
2. **Verify IDs** - Make sure all IDs are correct (enable Developer Mode)
3. **Test locally first** - 
   - Go: Run `go run cmd/bot/main.go` on your computer to test
   - TypeScript: Run `npm run build && npm start` on your computer to test
4. **Check Discord** - Make sure bot is invited to server with proper permissions
5. **Verify versions** - 
   - Go: `go version` should show 1.21+
   - Node.js: `node --version` should show 18+

---

## 🔄 Which Implementation Should I Choose?

### Choose Go if:
- ✅ You want the fastest performance
- ✅ You have limited memory/resources
- ✅ Your hosting panel supports Go well
- ✅ You prefer compiled binaries

### Choose TypeScript if:
- ✅ You want easier code modification
- ✅ Your hosting panel supports Node.js well
- ✅ You prefer modern JavaScript/TypeScript
- ✅ You want better development tools

**Both implementations work perfectly! Choose based on your preference and hosting panel capabilities.**

---

**Made with ❤️ by Kirito**
