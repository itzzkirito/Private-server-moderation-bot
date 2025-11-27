import {
  Client,
  GatewayIntentBits,
  Events,
  Message,
  Presence,
  GuildMember,
  ActivityType,
} from 'discord.js';
import { cfg } from '../config/config';
import { handleCommand } from './commands';
import { handlePresenceUpdate, checkAllMembersForVanity } from './handlers';

export class Bot {
  private client: Client;
  private vanityCooldowns: Map<string, Date> = new Map();
  private startupChecked: boolean = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.once(Events.ClientReady, (readyClient) => {
      this.onReady(readyClient);
    });

    this.client.on(Events.MessageCreate, (message) => {
      this.onMessageCreate(message);
    });

    this.client.on(Events.PresenceUpdate, (oldPresence: Presence | null, newPresence: Presence | null) => {
      this.onPresenceUpdate(newPresence);
    });
  }

  private async onPresenceUpdate(presence: Presence | null): Promise<void> {
    const { handlePresenceUpdate } = await import('./handlers');
    await handlePresenceUpdate(presence, this);
  }

  async start(): Promise<void> {
    try {
      await this.client.login(cfg.botToken);
      console.log('Bot is now running. Press CTRL-C to exit.');
    } catch (error) {
      throw new Error(`Error starting bot: ${error}`);
    }
  }

  async stop(): Promise<void> {
    await this.client.destroy();
  }

  private onReady(client: Client): void {
    const user = client.user;
    if (user) {
      console.log(`Logged in as: ${user.username}#${user.discriminator}`);
    } else {
      console.log('Logged in (user info not available)');
    }

    // Log configuration for debugging
    console.log('Bot Configuration:');
    console.log(`  - Prefix: '${cfg.prefix}'`);
    console.log(`  - Guild ID: ${cfg.guildID}`);
    console.log(`  - Admin Role ID: ${cfg.adminRoleID}`);
    console.log(`  - Mod Role ID: ${cfg.modRoleID}`);
    console.log(`  - Staff Role ID: ${cfg.staffRoleID}`);
    console.log(`  - Message Content Intent: Enabled`);
    console.log(
      `Use '${cfg.prefix}' as prefix for commands (e.g., ${cfg.prefix}ban @user)`
    );

    // Check all members for vanity status on startup
    if (cfg.vanityEnabled && !this.startupChecked) {
      this.startupChecked = true;
      console.log('Vanity: Auto-assignment enabled, starting member check...');
      // Wait a bit for the guild to be fully loaded
      setTimeout(async () => {
        const { checkAllMembersForVanity } = await import('./handlers');
        await checkAllMembersForVanity(this.client, this);
      }, 3000);
    } else if (!cfg.vanityEnabled) {
      console.log('Vanity: Auto-assignment is disabled');
    }
  }

  private onMessageCreate(message: Message): void {
    // Validate message and author
    if (!message || !message.author) {
      return;
    }

    // Ignore messages from bots
    if (message.author.bot) {
      return;
    }

    // Check if message is in auto-nick channel and handle auto-nickname
    if (cfg.autoNickChannelID && message.channelId === cfg.autoNickChannelID) {
      this.handleAutoNickname(message);
      // Don't process as command in auto-nick channel
      return;
    }

    // Check if message has content and starts with prefix
    if (!message.content) {
      return;
    }

    if (message.content.length < cfg.prefix.length) {
      return;
    }

    // Check prefix match
    const messagePrefix = message.content.substring(0, cfg.prefix.length);
    if (messagePrefix !== cfg.prefix) {
      // Log when prefix doesn't match (helpful for debugging)
      if (
        message.content.startsWith('.') ||
        message.content.startsWith('!')
      ) {
        console.log(
          `Prefix mismatch: Message starts with '${messagePrefix}' but bot expects '${cfg.prefix}'. Message: '${message.content}'`
        );
      }
      return;
    }

    // Debug logging for command processing
    console.log(
      `Command received: '${message.content}' from user ${message.author.username} (ID: ${message.author.id}) in channel ${message.channelId} (Guild: ${message.guildId})`
    );

    // Handle command
    handleCommand(this.client, message, this);
  }

  private async handleAutoNickname(message: Message): Promise<void> {
    // Ignore messages with attachments (images, files, etc.)
    if (message.attachments.size > 0) {
      console.log(
        `AutoNick: Ignoring message with attachment from user ${message.author.username}`
      );
      return;
    }

    // Ignore messages with embeds
    if (message.embeds.length > 0) {
      console.log(
        `AutoNick: Ignoring message with embed from user ${message.author.username}`
      );
      return;
    }

    // Get the new nickname from message content
    const newNickname = message.content.trim();

    // Ignore empty messages or commands
    if (!newNickname || newNickname.startsWith(cfg.prefix)) {
      return;
    }

    // Ignore messages containing URLs/links
    const urlPattern = /(https?:\/\/|www\.|discord\.gg\/|discord\.com\/|discordapp\.com\/)/i;
    if (urlPattern.test(newNickname)) {
      console.log(
        `AutoNick: Ignoring message with link from user ${message.author.username}`
      );
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

  private async changeNickname(
    message: Message,
    newNickname: string
  ): Promise<void> {
    if (!message.guild || !message.member) {
      return;
    }

    // Validate nickname length (Discord limit is 32 characters)
    if (newNickname.length > 32) {
      if (message.channel.isTextBased() && !message.channel.isDMBased()) {
        await message.channel.send(
          '❌ Nickname is too long! Maximum length is 32 characters.'
        );
      }
      return;
    }

    if (newNickname.length < 1) {
      return; // Silently ignore empty nicknames
    }

    // Check for potentially problematic characters
    if (newNickname.includes('@') || newNickname.includes('#')) {
      if (message.channel.isTextBased() && !message.channel.isDMBased()) {
        await message.channel.send(
          '❌ Nickname cannot contain @ or # symbols.'
        );
      }
      return;
    }

    // Check if this is the auto-nick channel - if so, skip permission checks
    const isAutoNickChannel =
      cfg.autoNickChannelID && message.channelId === cfg.autoNickChannelID;

    if (!isAutoNickChannel) {
      // For command-based nickname changes, check permissions
      const member = message.member;

      // Check if user has permission to change nickname
      const hasChangeNickname =
        member.permissions.has('ChangeNickname') ||
        member.permissions.has('Administrator');

      if (!hasChangeNickname) {
        if (message.channel.isTextBased() && !message.channel.isDMBased()) {
          await message.channel.send(
            "❌ You don't have permission to change your nickname.\n\n**Required:** Change Nickname permission or Admin/Mod/Staff role"
          );
        }
        console.log(
          `Nickname: Permission denied for user ${message.author.username}`
        );
        return;
      }
    } else {
      console.log(
        `Nickname: Auto-nick channel detected, skipping permission check for user ${message.author.username}`
      );
    }

    // Change the nickname
    console.log(
      `Nickname: Attempting to change nickname for user ${message.author.username} to '${newNickname}' in guild ${message.guildId}`
    );

    try {
      await message.member.setNickname(newNickname);
      // Add reaction to indicate success
      await message.react('✅');
      console.log(
        `Nickname: Successfully changed nickname for user ${message.author.username} to '${newNickname}'`
      );

      // Log the action
      await this.logAction(
        this.client,
        '📝 **Nickname Changed**',
        message.author.id,
        message.author.id,
        `New nickname: ${newNickname}`
      );
    } catch (error: any) {
      console.log(
        `Nickname: ERROR changing nickname for user ${message.author.id}: ${error}`
      );

      // Provide helpful error messages
      const errorMsg = error.toString();
      if (message.channel.isTextBased() && !message.channel.isDMBased()) {
        if (errorMsg.includes('403') || errorMsg.includes('Missing Access')) {
          await message.channel.send(
            "❌ Bot doesn't have permission to change nicknames.\n\n**Fix:**\n1. Ensure the bot has **Manage Nicknames** permission\n2. The bot's role must be **higher** than the user's highest role in the role hierarchy\n3. Check that the bot's role is properly positioned above all member roles"
          );
        } else if (errorMsg.includes('50035')) {
          await message.channel.send(
            '❌ Invalid nickname format. Please use only valid characters.'
          );
        } else if (errorMsg.includes('404')) {
          await message.channel.send(
            '❌ User or guild not found. Please try again.'
          );
        } else {
          await message.channel.send(
            `❌ Failed to change nickname: ${error}`
          );
        }
      }
    }
  }

  private async resetNickname(message: Message): Promise<void> {
    if (!message.guild || !message.member) {
      return;
    }

    console.log(
      `Nickname: Resetting nickname for user ${message.author.username} to default`
    );

    try {
      // Set nickname to null to reset to default (username)
      await message.member.setNickname(null);
      // Add reaction to indicate success
      await message.react('✅');
      console.log(
        `Nickname: Successfully reset nickname for user ${message.author.username} to default`
      );

      // Log the action
      await this.logAction(
        this.client,
        '📝 **Nickname Reset**',
        message.author.id,
        message.author.id,
        'Reset to default username'
      );
    } catch (error: any) {
      console.log(
        `Nickname: ERROR resetting nickname for user ${message.author.id}: ${error}`
      );

      // Provide helpful error messages
      const errorMsg = error.toString();
      if (message.channel.isTextBased() && !message.channel.isDMBased()) {
        if (errorMsg.includes('403') || errorMsg.includes('Missing Access')) {
          await message.channel.send(
            "❌ Bot doesn't have permission to change nicknames.\n\n**Fix:**\n1. Ensure the bot has **Manage Nicknames** permission\n2. The bot's role must be **higher** than the user's highest role in the role hierarchy"
          );
        } else if (errorMsg.includes('404')) {
          await message.channel.send(
            '❌ User or guild not found. Please try again.'
          );
        } else {
          await message.channel.send(`❌ Failed to reset nickname: ${error}`);
        }
      }
    }
  }

  async logAction(
    client: Client,
    actionType: string,
    moderatorID: string,
    targetID: string,
    reason: string
  ): Promise<void> {
    if (!cfg.logChannelID) {
      return; // No log channel configured
    }

    try {
      const channel = await client.channels.fetch(cfg.logChannelID);
      if (!channel || !channel.isTextBased()) {
        return;
      }

      // Get moderator info
      let moderatorName = 'Unknown';
      try {
        const moderator = await client.users.fetch(moderatorID);
        moderatorName = moderator.username;
      } catch (error) {
        // Ignore error
      }

      // Get target info
      let targetName = 'Unknown';
      try {
        const target = await client.users.fetch(targetID);
        targetName = target.username;
      } catch (error) {
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
    } catch (error) {
      console.log(`Error sending log message: ${error}`);
    }
  }

  isOnCooldown(userID: string): boolean {
    const lastUsed = this.vanityCooldowns.get(userID);
    if (!lastUsed) {
      return false;
    }

    const cooldownDuration = cfg.vanityCooldown * 1000; // Convert to milliseconds
    return Date.now() - lastUsed.getTime() < cooldownDuration;
  }

  updateCooldown(userID: string): void {
    this.vanityCooldowns.set(userID, new Date());
  }

  getClient(): Client {
    return this.client;
  }
}

