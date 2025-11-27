"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const discord_js_1 = require("discord.js");
const config_1 = require("../config/config");
const commands_1 = require("./commands");
class Bot {
    client;
    vanityCooldowns = new Map();
    startupChecked = false;
    constructor() {
        this.client = new discord_js_1.Client({
            intents: [
                discord_js_1.GatewayIntentBits.Guilds,
                discord_js_1.GatewayIntentBits.GuildMembers,
                discord_js_1.GatewayIntentBits.GuildMessages,
                discord_js_1.GatewayIntentBits.GuildPresences,
                discord_js_1.GatewayIntentBits.MessageContent,
            ],
        });
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.client.once(discord_js_1.Events.ClientReady, (readyClient) => {
            this.onReady(readyClient);
        });
        this.client.on(discord_js_1.Events.MessageCreate, (message) => {
            this.onMessageCreate(message);
        });
        this.client.on(discord_js_1.Events.PresenceUpdate, (oldPresence, newPresence) => {
            this.onPresenceUpdate(newPresence);
        });
    }
    async onPresenceUpdate(presence) {
        const { handlePresenceUpdate } = await Promise.resolve().then(() => __importStar(require('./handlers')));
        await handlePresenceUpdate(presence, this);
    }
    async start() {
        try {
            await this.client.login(config_1.cfg.botToken);
            console.log('Bot is now running. Press CTRL-C to exit.');
        }
        catch (error) {
            throw new Error(`Error starting bot: ${error}`);
        }
    }
    async stop() {
        await this.client.destroy();
    }
    onReady(client) {
        const user = client.user;
        if (user) {
            console.log(`Logged in as: ${user.username}#${user.discriminator}`);
        }
        else {
            console.log('Logged in (user info not available)');
        }
        // Log configuration for debugging
        console.log('Bot Configuration:');
        console.log(`  - Prefix: '${config_1.cfg.prefix}'`);
        console.log(`  - Guild ID: ${config_1.cfg.guildID}`);
        console.log(`  - Admin Role ID: ${config_1.cfg.adminRoleID}`);
        console.log(`  - Mod Role ID: ${config_1.cfg.modRoleID}`);
        console.log(`  - Staff Role ID: ${config_1.cfg.staffRoleID}`);
        console.log(`  - Message Content Intent: Enabled`);
        console.log(`Use '${config_1.cfg.prefix}' as prefix for commands (e.g., ${config_1.cfg.prefix}ban @user)`);
        // Check all members for vanity status on startup
        if (config_1.cfg.vanityEnabled && !this.startupChecked) {
            this.startupChecked = true;
            console.log('Vanity: Auto-assignment enabled, starting member check...');
            // Wait a bit for the guild to be fully loaded
            setTimeout(async () => {
                const { checkAllMembersForVanity } = await Promise.resolve().then(() => __importStar(require('./handlers')));
                await checkAllMembersForVanity(this.client, this);
            }, 3000);
        }
        else if (!config_1.cfg.vanityEnabled) {
            console.log('Vanity: Auto-assignment is disabled');
        }
    }
    onMessageCreate(message) {
        // Validate message and author
        if (!message || !message.author) {
            return;
        }
        // Ignore messages from bots
        if (message.author.bot) {
            return;
        }
        // Check if message is in auto-nick channel and handle auto-nickname
        if (config_1.cfg.autoNickChannelID && message.channelId === config_1.cfg.autoNickChannelID) {
            this.handleAutoNickname(message);
            // Don't process as command in auto-nick channel
            return;
        }
        // Check if message has content and starts with prefix
        if (!message.content) {
            return;
        }
        if (message.content.length < config_1.cfg.prefix.length) {
            return;
        }
        // Check prefix match
        const messagePrefix = message.content.substring(0, config_1.cfg.prefix.length);
        if (messagePrefix !== config_1.cfg.prefix) {
            // Log when prefix doesn't match (helpful for debugging)
            if (message.content.startsWith('.') ||
                message.content.startsWith('!')) {
                console.log(`Prefix mismatch: Message starts with '${messagePrefix}' but bot expects '${config_1.cfg.prefix}'. Message: '${message.content}'`);
            }
            return;
        }
        // Debug logging for command processing
        console.log(`Command received: '${message.content}' from user ${message.author.username} (ID: ${message.author.id}) in channel ${message.channelId} (Guild: ${message.guildId})`);
        // Handle command
        (0, commands_1.handleCommand)(this.client, message, this);
    }
    async handleAutoNickname(message) {
        // Ignore messages with attachments (images, files, etc.)
        if (message.attachments.size > 0) {
            console.log(`AutoNick: Ignoring message with attachment from user ${message.author.username}`);
            return;
        }
        // Ignore messages with embeds
        if (message.embeds.length > 0) {
            console.log(`AutoNick: Ignoring message with embed from user ${message.author.username}`);
            return;
        }
        // Get the new nickname from message content
        const newNickname = message.content.trim();
        // Ignore empty messages or commands
        if (!newNickname || newNickname.startsWith(config_1.cfg.prefix)) {
            return;
        }
        // Ignore messages containing URLs/links
        const urlPattern = /(https?:\/\/|www\.|discord\.gg\/|discord\.com\/|discordapp\.com\/)/i;
        if (urlPattern.test(newNickname)) {
            console.log(`AutoNick: Ignoring message with link from user ${message.author.username}`);
            return;
        }
        // Check if user wants to reset nickname to default
        if (newNickname.toLowerCase() === 'reset') {
            await this.resetNickname(message);
            return;
        }
        // Validate and change nickname
        await this.changeNickname(message, newNickname);
    }
    async changeNickname(message, newNickname) {
        if (!message.guild || !message.member) {
            return;
        }
        // Validate nickname length (Discord limit is 32 characters)
        if (newNickname.length > 32) {
            if (message.channel.isTextBased() && !message.channel.isDMBased()) {
                await message.channel.send('❌ Nickname is too long! Maximum length is 32 characters.');
            }
            return;
        }
        if (newNickname.length < 1) {
            return; // Silently ignore empty nicknames
        }
        // Check for potentially problematic characters
        if (newNickname.includes('@') || newNickname.includes('#')) {
            if (message.channel.isTextBased() && !message.channel.isDMBased()) {
                await message.channel.send('❌ Nickname cannot contain @ or # symbols.');
            }
            return;
        }
        // Check if this is the auto-nick channel - if so, skip permission checks
        const isAutoNickChannel = config_1.cfg.autoNickChannelID && message.channelId === config_1.cfg.autoNickChannelID;
        if (!isAutoNickChannel) {
            // For command-based nickname changes, check permissions
            const member = message.member;
            // Check if user has permission to change nickname
            const hasChangeNickname = member.permissions.has('ChangeNickname') ||
                member.permissions.has('Administrator');
            if (!hasChangeNickname) {
                if (message.channel.isTextBased() && !message.channel.isDMBased()) {
                    await message.channel.send("❌ You don't have permission to change your nickname.\n\n**Required:** Change Nickname permission or Admin/Mod/Staff role");
                }
                console.log(`Nickname: Permission denied for user ${message.author.username}`);
                return;
            }
        }
        else {
            console.log(`Nickname: Auto-nick channel detected, skipping permission check for user ${message.author.username}`);
        }
        // Change the nickname
        console.log(`Nickname: Attempting to change nickname for user ${message.author.username} to '${newNickname}' in guild ${message.guildId}`);
        try {
            await message.member.setNickname(newNickname);
            // Add reaction to indicate success
            await message.react('✅');
            console.log(`Nickname: Successfully changed nickname for user ${message.author.username} to '${newNickname}'`);
            // Log the action
            await this.logAction(this.client, '📝 **Nickname Changed**', message.author.id, message.author.id, `New nickname: ${newNickname}`);
        }
        catch (error) {
            console.log(`Nickname: ERROR changing nickname for user ${message.author.id}: ${error}`);
            // Provide helpful error messages
            const errorMsg = error.toString();
            if (message.channel.isTextBased() && !message.channel.isDMBased()) {
                if (errorMsg.includes('403') || errorMsg.includes('Missing Access')) {
                    await message.channel.send("❌ Bot doesn't have permission to change nicknames.\n\n**Fix:**\n1. Ensure the bot has **Manage Nicknames** permission\n2. The bot's role must be **higher** than the user's highest role in the role hierarchy\n3. Check that the bot's role is properly positioned above all member roles");
                }
                else if (errorMsg.includes('50035')) {
                    await message.channel.send('❌ Invalid nickname format. Please use only valid characters.');
                }
                else if (errorMsg.includes('404')) {
                    await message.channel.send('❌ User or guild not found. Please try again.');
                }
                else {
                    await message.channel.send(`❌ Failed to change nickname: ${error}`);
                }
            }
        }
    }
    async resetNickname(message) {
        if (!message.guild || !message.member) {
            return;
        }
        console.log(`Nickname: Resetting nickname for user ${message.author.username} to default`);
        try {
            // Set nickname to null to reset to default (username)
            await message.member.setNickname(null);
            // Add reaction to indicate success
            await message.react('✅');
            console.log(`Nickname: Successfully reset nickname for user ${message.author.username} to default`);
            // Log the action
            await this.logAction(this.client, '📝 **Nickname Reset**', message.author.id, message.author.id, 'Reset to default username');
        }
        catch (error) {
            console.log(`Nickname: ERROR resetting nickname for user ${message.author.id}: ${error}`);
            // Provide helpful error messages
            const errorMsg = error.toString();
            if (message.channel.isTextBased() && !message.channel.isDMBased()) {
                if (errorMsg.includes('403') || errorMsg.includes('Missing Access')) {
                    await message.channel.send("❌ Bot doesn't have permission to change nicknames.\n\n**Fix:**\n1. Ensure the bot has **Manage Nicknames** permission\n2. The bot's role must be **higher** than the user's highest role in the role hierarchy");
                }
                else if (errorMsg.includes('404')) {
                    await message.channel.send('❌ User or guild not found. Please try again.');
                }
                else {
                    await message.channel.send(`❌ Failed to reset nickname: ${error}`);
                }
            }
        }
    }
    async logAction(client, actionType, moderatorID, targetID, reason) {
        if (!config_1.cfg.logChannelID) {
            return; // No log channel configured
        }
        try {
            const channel = await client.channels.fetch(config_1.cfg.logChannelID);
            if (!channel || !channel.isTextBased()) {
                return;
            }
            // Get moderator info
            let moderatorName = 'Unknown';
            try {
                const moderator = await client.users.fetch(moderatorID);
                moderatorName = moderator.username;
            }
            catch (error) {
                // Ignore error
            }
            // Get target info
            let targetName = 'Unknown';
            try {
                const target = await client.users.fetch(targetID);
                targetName = target.username;
            }
            catch (error) {
                // Ignore error
            }
            // Build log message
            let logMsg = `${actionType}\n**Moderator:** <@${moderatorID}> (${moderatorName})\n**Target:** <@${targetID}> (${targetName})`;
            if (reason) {
                logMsg += `\n**Reason:** ${reason}`;
            }
            // Send to log channel
            if (channel.isTextBased() && !channel.isDMBased()) {
                await channel.send(logMsg);
            }
        }
        catch (error) {
            console.log(`Error sending log message: ${error}`);
        }
    }
    isOnCooldown(userID) {
        const lastUsed = this.vanityCooldowns.get(userID);
        if (!lastUsed) {
            return false;
        }
        const cooldownDuration = config_1.cfg.vanityCooldown * 1000; // Convert to milliseconds
        return Date.now() - lastUsed.getTime() < cooldownDuration;
    }
    updateCooldown(userID) {
        this.vanityCooldowns.set(userID, new Date());
    }
    getClient() {
        return this.client;
    }
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map