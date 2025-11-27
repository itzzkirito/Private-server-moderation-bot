# Troubleshooting Guide - Moderation Commands Not Working

## Critical Fix Applied

The bot now includes the **Message Content Intent** which is required for Discord bots to read message content. This was the primary issue preventing commands from working.

## Steps to Fix

### 1. Enable Message Content Intent in Discord Developer Portal

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Navigate to **Bot** → **Privileged Gateway Intents**
4. Enable **MESSAGE CONTENT INTENT** ✅
5. Save changes

### 2. Rebuild and Restart the Bot

```bash
go build -o bot.exe ./cmd/bot
./bot.exe  # or bot.exe on Windows
```

### 3. Verify Bot Permissions

Ensure your bot has these permissions in your Discord server:
- ✅ **Send Messages** - Required for command responses
- ✅ **Ban Members** - For ban command
- ✅ **Kick Members** - For kick command
- ✅ **Manage Roles** - For role management commands
- ✅ **Manage Nicknames** - For nickname commands

### 4. Check Bot Role Hierarchy

The bot's role must be **above** the roles of users it's trying to moderate:
1. Go to Server Settings → Roles
2. Drag the bot's role **above** member roles
3. Ensure it's below admin roles (if you want admins to be able to control the bot)

### 5. Verify Configuration

Check your `.env` file has all required variables:
```env
BOT_TOKEN=your_token_here
GUILD_ID=your_guild_id
ADMIN_ROLE_ID=your_admin_role_id
MOD_ROLE_ID=your_mod_role_id
STAFF_ROLE_ID=your_staff_role_id
PREFIX=!
```

### 6. Check Debug Logs

The bot now includes debug logging. When you send a command, you should see:
```
Command received: '!ban @user' from user YourName (ID: 123...) in channel 456... (Guild: 789...)
Command: Processing command 'ban' with args: [@user]
```

If you don't see these logs, the bot isn't receiving the message content.

## Common Issues

### Issue: Bot doesn't respond at all
**Solution**: 
- Check Message Content Intent is enabled
- Verify bot is online (green status)
- Check bot has "Send Messages" permission in the channel

### Issue: "You don't have permission" error
**Solution**:
- Verify your role IDs in `.env` match your Discord roles
- Check you have Admin/Mod/Staff role assigned
- Ensure role IDs are correct (enable Developer Mode to copy IDs)

### Issue: "Failed to ban/kick/mute" error
**Solution**:
- Check bot role is above target user's highest role
- Verify bot has required permissions (Ban Members, Kick Members, Manage Roles)
- Check bot role hierarchy in Server Settings

### Issue: Commands work but actions fail
**Solution**:
- Bot role must be higher than target user's role
- Bot needs specific permissions (see Bot Permissions section)
- Check error logs for specific Discord API errors

## Testing Commands

After fixing the above, test with:

1. **Permission Check**: `!ban @yourself` (should say "You don't have permission" if you're not admin/mod/staff)
2. **Valid Command**: `!ban @testuser reason` (if you have permissions)
3. **Invalid Command**: `!unknown` (should do nothing)

## Still Not Working?

1. **Check Console Logs**: Look for error messages when sending commands
2. **Verify Intent**: Double-check Message Content Intent is enabled
3. **Restart Bot**: Stop and restart the bot after enabling intents
4. **Check Discord Status**: Ensure Discord API is operational
5. **Verify Token**: Ensure bot token is valid and not expired

## Debug Mode

The bot now logs all command attempts. Watch the console output when testing commands to see:
- If commands are being received
- What command is being processed
- Any errors during execution

