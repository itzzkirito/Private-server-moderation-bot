# Discord Moderation Bot (TypeScript)

This is the TypeScript version of the Discord moderation bot, converted from the original Go implementation.

## 📋 Features

- **Role-based permission system** with three distinct permission levels
- **Rate limiting** to prevent abuse and ensure fair moderation
- **Automated vanity role assignment** based on custom status
- **Auto-nickname system** for designated channels
- **Comprehensive logging** of all moderation actions
- **TypeScript** for type safety and modern JavaScript features

## 🚀 Quick Start

### Prerequisites

- **Node.js 18.0 or higher** ([Download](https://nodejs.org/))
- **Discord Bot Token** ([Get from Discord Developer Portal](https://discord.com/developers/applications))
- **Discord Server (Guild)** with appropriate permissions

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create `.env` File**
   Create a `.env` file in the root directory with your configuration:
   ```env
   BOT_TOKEN=your_bot_token_here
   GUILD_ID=your_guild_id_here
   ADMIN_ROLE_ID=123456789012345678
   MOD_ROLE_ID=123456789012345679
   STAFF_ROLE_ID=123456789012345680
   MUTE_ROLE_ID=123456789012345681
   PREFIX=!
   DISCORD_LOG_CHANNEL_ID=123456789012345682
   AUTO_NICK_CHANNEL_ID=123456789012345683
   VANITY_AUTO_ENABLED=true
   VANITY_ROLE_ID=123456789012345684
   VANITY_STRING=/Lovers
   VANITY_COOLDOWN=2
   ```

3. **Build the Project**
   ```bash
   npm run build
   ```

4. **Run the Bot**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── index.ts              # Main entry point
├── config/
│   └── config.ts         # Configuration management
├── bot/
│   ├── bot.ts           # Bot core and event handlers
│   ├── commands.ts      # Command handlers
│   └── handlers.ts      # Presence and vanity handlers
└── utils/
    └── permissions.ts    # Permission checking and rate limiting
```

## 🔧 Configuration

All configuration is done via environment variables in the `.env` file. See the original README.md for detailed configuration options.

## 📜 Commands

All commands from the Go version are available:

- `!ban @user [reason]` - Ban a user
- `!kick @user [reason]` - Kick a user
- `!mute @user [reason]` - Mute a user
- `!unban <user_id>` - Unban a user
- `!unmute @user` - Unmute a user
- `!mod add/remove @user` - Manage mod role
- `!staffs add/remove @user` - Manage staff role
- `!vanity add/remove/check @user` - Manage vanity role
- `!nick <nickname>` - Change nickname
- `!help` - Show help menu

## 🛠️ Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled bot
- `npm run dev` - Run with ts-node (development)
- `npm run watch` - Watch mode for TypeScript compilation

### TypeScript Configuration

The project uses TypeScript with strict mode enabled. Configuration is in `tsconfig.json`.

## 🔄 Migration from Go

This TypeScript version maintains 100% feature parity with the original Go implementation:

- ✅ All commands work identically
- ✅ Same permission system
- ✅ Same rate limiting
- ✅ Same vanity role system
- ✅ Same auto-nickname system
- ✅ Same logging system

## 📝 Notes

- Uses `discord.js` v14 instead of `discordgo`
- Uses `dotenv` instead of `godotenv`
- All async operations use Promises/async-await
- Type safety throughout the codebase

## 🐛 Troubleshooting

### Bot Not Starting

- Verify `.env` file exists and contains all required variables
- Check that `BOT_TOKEN` is valid
- Ensure `GUILD_ID` is correct
- Verify Node.js version: `node --version` (should be 18+)

### TypeScript Errors

- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` for correct configuration
- Ensure all imports are correct

## 📄 License

Same as the original project.

---

**Made with ❤️ by Kirito**

