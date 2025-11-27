import {
  Client,
  Message,
  EmbedBuilder,
  ActivityType,
  TextBasedChannel,
} from 'discord.js';
import { cfg } from '../config/config';
import {
  hasPermission,
  canPerformModAction,
  recordModAction,
  RoleAdmin,
  RoleMod,
  RoleStaff,
} from '../utils/permissions';
import { Bot } from './bot';

// Helper function to safely send messages
async function safeSend(channel: TextBasedChannel | null, content: string | { embeds: any[] }): Promise<void> {
  if (channel && channel.isTextBased() && !channel.isDMBased()) {
    await channel.send(content as any);
  }
}

export async function handleCommand(
  client: Client,
  message: Message,
  bot: Bot
): Promise<void> {
  // Defensive check
  if (!message || !message.author) {
    return;
  }

  const content = message.content.substring(cfg.prefix.length).trim();
  const args = content.split(/\s+/);
  if (args.length === 0 || !args[0]) {
    console.log('Command: No arguments found after prefix');
    return;
  }

  const command = args[0].toLowerCase();
  console.log(`Command: Processing command '${command}' with args:`, args.slice(1));

  switch (command) {
    case 'ban':
      await handleBan(client, message, args.slice(1), bot);
      break;
    case 'kick':
      await handleKick(client, message, args.slice(1), bot);
      break;
    case 'mute':
      await handleMute(client, message, args.slice(1), bot);
      break;
    case 'unban':
      await handleUnban(client, message, args.slice(1), bot);
      break;
    case 'unmute':
      await handleUnmute(client, message, args.slice(1), bot);
      break;
    case 'mod':
      await handleMod(client, message, args.slice(1), bot);
      break;
    case 'staffs':
      await handleStaffs(client, message, args.slice(1), bot);
      break;
    case 'vanity':
      await handleVanity(client, message, args.slice(1), bot);
      break;
    case 'nick':
    case 'nickname':
      await handleNickname(client, message, args.slice(1), bot);
      break;
    case 'help':
    case 'commands':
      await handleHelp(client, message);
      break;
    default:
      // Unknown command
      return;
  }
}

async function handleBan(
  client: Client,
  message: Message,
  args: string[],
  bot: Bot
): Promise<void> {
  if (args.length < 1) {
    await safeSend(message.channel, `Usage: \`${cfg.prefix}ban <@user> [reason]\``);
    return;
  }

  if (!message.guild || !message.member) {
    return;
  }

  // Check permissions
  const [hasAdmin, errAdmin] = await hasPermission(
    message.member,
    RoleAdmin
  );
  const [hasMod, errMod] = await hasPermission(message.member, RoleMod);
  const [hasStaff, errStaff] = await hasPermission(message.member, RoleStaff);

  console.log(
    `Permission check for user ${message.author.username} (ID: ${message.author.id}) - Admin: ${hasAdmin} (err: ${errAdmin}), Mod: ${hasMod} (err: ${errMod}), Staff: ${hasStaff} (err: ${errStaff})`
  );

  if (!hasAdmin && !hasMod && !hasStaff) {
    console.log(
      `Permission denied for user ${message.author.username} attempting to ban`
    );
    await safeSend(message.channel, "❌ You don't have permission to use this command.");
    return;
  }

  // Parse user ID
  const userID = parseUserID(args[0]);
  if (!userID) {
    await safeSend(message.channel, '❌ Invalid user mention.');
    return;
  }

  // Check rate limiting for mods
  if (hasMod && !hasAdmin && !hasStaff) {
    const [canBan, err] = canPerformModAction(message.author.id, 'ban');
    if (err || !canBan) {
      await safeSend(message.channel, '❌ Daily ban limit reached (10 bans per day).');
      return;
    }
    recordModAction(message.author.id, 'ban');
  }

  // Get reason
  let reason = 'No reason provided';
  if (args.length > 1) {
    reason = args.slice(1).join(' ');
  }

  try {
    // Ban user
    await message.guild.members.ban(userID, { reason });
    await safeSend(message.channel, `✅ User <@${userID}> has been banned. Reason: ${reason}`);

    // Log to log channel
    await bot.logAction(client, '🔨 **Ban**', message.author.id, userID, reason);
  } catch (error: any) {
    console.log(`Error banning user: ${error}`);
    await safeSend(message.channel, '❌ Failed to ban user.');
  }
}

async function handleKick(
  client: Client,
  message: Message,
  args: string[],
  bot: Bot
): Promise<void> {
  if (args.length < 1) {
    await safeSend(message.channel, `Usage: \`${cfg.prefix}kick <@user> [reason]\``);
    return;
  }

  if (!message.guild || !message.member) {
    return;
  }

  // Check permissions
  const [hasAdmin] = await hasPermission(message.member, RoleAdmin);
  const [hasMod] = await hasPermission(message.member, RoleMod);
  const [hasStaff] = await hasPermission(message.member, RoleStaff);

  if (!hasAdmin && !hasMod && !hasStaff) {
    await safeSend(message.channel, "❌ You don't have permission to use this command.");
    return;
  }

  // Parse user ID
  const userID = parseUserID(args[0]);
  if (!userID) {
    await safeSend(message.channel, '❌ Invalid user mention.');
    return;
  }

  // Check rate limiting for mods
  if (hasMod && !hasAdmin && !hasStaff) {
    const [canKick, err] = canPerformModAction(message.author.id, 'kick');
    if (err || !canKick) {
      await safeSend(message.channel, '❌ Daily kick limit reached (10 kicks per day).');
      return;
    }
    recordModAction(message.author.id, 'kick');
  }

  // Get reason
  let reason = 'No reason provided';
  if (args.length > 1) {
    reason = args.slice(1).join(' ');
  }

  try {
    // Kick user
    const member = await message.guild.members.fetch(userID);
    await member.kick(reason);
    await safeSend(message.channel, `✅ User <@${userID}> has been kicked. Reason: ${reason}`);

    // Log to log channel
    await bot.logAction(client, '👢 **Kick**', message.author.id, userID, reason);
  } catch (error: any) {
    console.log(`Error kicking user: ${error}`);
    await safeSend(message.channel, '❌ Failed to kick user.');
  }
}

async function handleMute(
  client: Client,
  message: Message,
  args: string[],
  bot: Bot
): Promise<void> {
  if (args.length < 1) {
    await safeSend(message.channel, `Usage: \`${cfg.prefix}mute <@user> [duration] [reason]\``);
    return;
  }

  if (!message.guild || !message.member) {
    return;
  }

  // Check permissions
  const [hasAdmin] = await hasPermission(message.member, RoleAdmin);
  const [hasMod] = await hasPermission(message.member, RoleMod);
  const [hasStaff] = await hasPermission(message.member, RoleStaff);

  if (!hasAdmin && !hasMod && !hasStaff) {
    await safeSend(message.channel, "❌ You don't have permission to use this command.");
    return;
  }

  // Parse user ID
  const userID = parseUserID(args[0]);
  if (!userID) {
    await safeSend(message.channel, '❌ Invalid user mention.');
    return;
  }

  if (!cfg.muteRoleID) {
    await safeSend(message.channel, '❌ Mute role not configured.');
    return;
  }

  try {
    // Add mute role
    const member = await message.guild.members.fetch(userID);
    await member.roles.add(cfg.muteRoleID);

    let reason = 'No reason provided';
    if (args.length > 1) {
      reason = args.slice(1).join(' ');
    }

    await safeSend(message.channel, `✅ User <@${userID}> has been muted. Reason: ${reason}`);

    // Log to log channel
    await bot.logAction(client, '🔇 **Mute**', message.author.id, userID, reason);
  } catch (error: any) {
    console.log(`Error muting user: ${error}`);
    const errorMsg = error.toString();
    if (errorMsg.includes('403') || errorMsg.includes('Missing Access')) {
      await safeSend(message.channel, "❌ Failed to mute user: Bot doesn't have permission to assign the mute role.\n\n**Fix:**\n1. Ensure the bot has **Manage Roles** permission\n2. The bot's role must be **higher** than the mute role in the role hierarchy\n3. The mute role must be below the bot's highest role");
    } else {
      await safeSend(message.channel, `❌ Failed to mute user: ${error}`);
    }
  }
}

async function handleUnban(
  client: Client,
  message: Message,
  args: string[],
  bot: Bot
): Promise<void> {
  if (args.length < 1) {
    await safeSend(message.channel, `Usage: \`${cfg.prefix}unban <user_id>\` or \`${cfg.prefix}unban @user\`\n\n**Note:** You can use either the user ID or mention the user.`);
    return;
  }

  if (!message.guild || !message.member) {
    return;
  }

  // Check permissions
  const [hasAdmin, errAdmin] = await hasPermission(
    message.member,
    RoleAdmin
  );
  const [hasStaff, errStaff] = await hasPermission(message.member, RoleStaff);

  console.log(
    `Unban permission check for user ${message.author.username} (ID: ${message.author.id}) - Admin: ${hasAdmin} (err: ${errAdmin}), Staff: ${hasStaff} (err: ${errStaff})`
  );

  if (!hasAdmin && !hasStaff) {
    console.log(
      `Permission denied for user ${message.author.username} attempting to unban`
    );
    await safeSend(message.channel, "❌ You don't have permission to use this command. (Admin/Staff only)");
    return;
  }

  // Parse user ID - support both mention and raw ID
  let userID = parseUserID(args[0]);
  if (!userID) {
    // If not a mention, try as raw ID (must be numeric and 17-19 digits)
    const rawID = args[0].trim();
    if (rawID.length >= 17 && rawID.length <= 19 && /^\d+$/.test(rawID)) {
      userID = rawID;
    }
  }

  if (!userID) {
    await safeSend(message.channel, `❌ Invalid user ID or mention. Please provide a valid user ID or mention.\n\n**Example:** \`${cfg.prefix}unban 123456789012345678\` or \`${cfg.prefix}unban @user\``);
    return;
  }

  console.log(`Unban: Attempting to unban user ID ${userID}`);

  try {
    // Unban user
    await message.guild.members.unban(userID);
    console.log(`Unban: Successfully unbanned user ${userID}`);
    await safeSend(message.channel, `✅ User <@${userID}> has been unbanned.`);

    // Log to log channel
    await bot.logAction(client, '✅ **Unban**', message.author.id, userID, '');
  } catch (error: any) {
    console.log(`Error unbanning user ${userID}: ${error}`);

    // Provide helpful error messages
    const errorMsg = error.toString();
    if (errorMsg.includes('404') || errorMsg.includes('Unknown Ban')) {
      await safeSend(message.channel, `❌ User <@${userID}> is not banned or doesn't exist.`);
    } else if (errorMsg.includes('403') || errorMsg.includes('Missing Access')) {
      await safeSend(message.channel, "❌ Bot doesn't have permission to unban users.\n\n**Fix:**\n1. Ensure the bot has **Ban Members** permission\n2. Check that the bot role has proper permissions");
    } else {
      await safeSend(message.channel, `❌ Failed to unban user: ${error}`);
    }
  }
}

async function handleUnmute(
  client: Client,
  message: Message,
  args: string[],
  bot: Bot
): Promise<void> {
  if (args.length < 1) {
    await safeSend(message.channel, `Usage: \`${cfg.prefix}unmute <@user>\``);
    return;
  }

  if (!message.guild || !message.member) {
    return;
  }

  // Check permissions
  const [hasAdmin] = await hasPermission(message.member, RoleAdmin);
  const [hasMod] = await hasPermission(message.member, RoleMod);
  const [hasStaff] = await hasPermission(message.member, RoleStaff);

  if (!hasAdmin && !hasMod && !hasStaff) {
    await safeSend(message.channel, "❌ You don't have permission to use this command.");
    return;
  }

  // Parse user ID
  const userID = parseUserID(args[0]);
  if (!userID) {
    await safeSend(message.channel, '❌ Invalid user mention.');
    return;
  }

  if (!cfg.muteRoleID) {
    await safeSend(message.channel, '❌ Mute role not configured.');
    return;
  }

  try {
    // Remove mute role
    const member = await message.guild.members.fetch(userID);
    await member.roles.remove(cfg.muteRoleID);
    await safeSend(message.channel, `✅ User <@${userID}> has been unmuted.`);

    // Log to log channel
    await bot.logAction(client, '🔊 **Unmute**', message.author.id, userID, '');
  } catch (error: any) {
    console.log(`Error unmuting user: ${error}`);
    const errorMsg = error.toString();
    if (errorMsg.includes('403') || errorMsg.includes('Missing Access')) {
      await safeSend(message.channel, "❌ Failed to unmute user: Bot doesn't have permission to remove the mute role.\n\n**Fix:**\n1. Ensure the bot has **Manage Roles** permission\n2. The bot's role must be **higher** than the mute role in the role hierarchy");
    } else {
      await safeSend(message.channel, `❌ Failed to unmute user: ${error}`);
    }
  }
}

async function handleMod(
  client: Client,
  message: Message,
  args: string[],
  bot: Bot
): Promise<void> {
  if (args.length < 2) {
    await safeSend(message.channel, `Usage: \`${cfg.prefix}mod add <@user>\` or \`${cfg.prefix}mod remove <@user>\``);
    return;
  }

  if (!message.guild || !message.member) {
    return;
  }

  // Check permissions - only admin can manage mod roles
  const [hasAdmin] = await hasPermission(message.member, RoleAdmin);
  const [hasStaff] = await hasPermission(message.member, RoleStaff);

  if (!hasAdmin && !hasStaff) {
    await safeSend(message.channel, "❌ You don't have permission to use this command.");
    return;
  }

  if (!cfg.modRoleID) {
    await safeSend(message.channel, '❌ Mod role not configured.');
    return;
  }

  const action = args[0].toLowerCase();
  const userID = parseUserID(args[1]);

  if (!userID) {
    await safeSend(message.channel, '❌ Invalid user mention.');
    return;
  }

  try {
    const member = await message.guild.members.fetch(userID);
    let response = '';

    if (action === 'add') {
      await member.roles.add(cfg.modRoleID);
      response = `✅ Added <@${userID}> to mod role. Params: @mod <@${userID}>`;
    } else if (action === 'remove') {
      await member.roles.remove(cfg.modRoleID);
      response = `✅ Removed <@${userID}> from mod role.`;
    } else {
      await safeSend(message.channel, `Usage: \`${cfg.prefix}mod add <@user>\` or \`${cfg.prefix}mod remove <@user>\``);
      return;
    }

    await safeSend(message.channel, response);

    // Log to log channel
    if (action === 'add') {
      await bot.logAction(
        client,
        '👤 **Mod Role Added**',
        message.author.id,
        userID,
        ''
      );
    } else {
      await bot.logAction(
        client,
        '👤 **Mod Role Removed**',
        message.author.id,
        userID,
        ''
      );
    }
  } catch (error: any) {
    console.log(`Error managing mod role: ${error}`);
    await safeSend(message.channel, '❌ Failed to manage mod role.');
  }
}

async function handleStaffs(
  client: Client,
  message: Message,
  args: string[],
  bot: Bot
): Promise<void> {
  if (args.length < 2) {
    await safeSend(message.channel, `Usage: \`${cfg.prefix}staffs add <@user>\` or \`${cfg.prefix}staffs remove <@user>\``);
    return;
  }

  if (!message.guild || !message.member) {
    return;
  }

  // Check permissions - admin, staff, and mod can manage staff roles
  const [hasAdmin] = await hasPermission(message.member, RoleAdmin);
  const [hasMod] = await hasPermission(message.member, RoleMod);
  const [hasStaff] = await hasPermission(message.member, RoleStaff);

  if (!hasAdmin && !hasMod && !hasStaff) {
    await safeSend(message.channel, "❌ You don't have permission to use this command.");
    return;
  }

  if (!cfg.staffRoleID) {
    await safeSend(message.channel, '❌ Staff role not configured.');
    return;
  }

  const action = args[0].toLowerCase();
  const userID = parseUserID(args[1]);

  if (!userID) {
    await safeSend(message.channel, '❌ Invalid user mention.');
    return;
  }

  try {
    const member = await message.guild.members.fetch(userID);
    let response = '';

    if (action === 'add') {
      await member.roles.add(cfg.staffRoleID);
      response = `✅ Added <@${userID}> to staff role.`;
    } else if (action === 'remove') {
      await member.roles.remove(cfg.staffRoleID);
      response = `✅ Removed <@${userID}> from staff role.`;
    } else {
      await safeSend(message.channel, `Usage: \`${cfg.prefix}staffs add <@user>\` or \`${cfg.prefix}staffs remove <@user>\``);
      return;
    }

    await safeSend(message.channel, response);

    // Log to log channel
    if (action === 'add') {
      await bot.logAction(
        client,
        '👥 **Staff Role Added**',
        message.author.id,
        userID,
        ''
      );
    } else {
      await bot.logAction(
        client,
        '👥 **Staff Role Removed**',
        message.author.id,
        userID,
        ''
      );
    }
  } catch (error: any) {
    console.log(`Error managing staff role: ${error}`);
    await safeSend(message.channel, '❌ Failed to manage staff role.');
  }
}

async function handleVanity(
  client: Client,
  message: Message,
  args: string[],
  bot: Bot
): Promise<void> {
  if (args.length < 1) {
    await safeSend(message.channel, `Usage: \`${cfg.prefix}vanity add <@user>\` or \`${cfg.prefix}vanity remove <@user>\` or \`${cfg.prefix}vanity check <@user>\``);
    return;
  }

  if (!message.guild || !message.member) {
    return;
  }

  const action = args[0].toLowerCase();

  // Handle check command separately
  if (action === 'check') {
    if (args.length < 2) {
      await safeSend(message.channel, `Usage: \`${cfg.prefix}vanity check <@user>\``);
      return;
    }

    // Check permissions
    const [hasAdmin] = await hasPermission(message.member, RoleAdmin);
    const [hasStaff] = await hasPermission(message.member, RoleStaff);

    if (!hasAdmin && !hasStaff) {
      await safeSend(message.channel, "❌ You don't have permission to use this command.");
      return;
    }

    const userID = parseUserID(args[1]);
    if (!userID) {
      await safeSend(message.channel, '❌ Invalid user mention.');
      return;
    }

    try {
      // Get member
      const member = await message.guild.members.fetch(userID);
      if (!member) {
        await safeSend(message.channel, '❌ Member not found.');
        return;
      }

      // Get presence
      const presence = member.presence;
      let statusText = '';
      if (presence) {
        // Get custom status from presence activities
        for (const activity of presence.activities || []) {
          if (activity.type === ActivityType.Custom) {
            statusText = (activity.state || activity.name || '').toLowerCase();
            break;
          }
        }
      }

      // Check if has role
      let hasRole = false;
      if (cfg.vanityRoleID) {
        hasRole = member.roles.cache.has(cfg.vanityRoleID);
      }

      const hasVanity =
        statusText !== '' &&
        statusText.toLowerCase().includes(cfg.vanityString.toLowerCase());

      const response = `**Vanity Check for <@${userID}>:**\n` +
        `Status: \`${statusText}\`\n` +
        `Looking for: \`${cfg.vanityString}\`\n` +
        `Has vanity string: \`${hasVanity}\`\n` +
        `Has role: \`${hasRole}\`\n` +
        `Should have role: \`${hasVanity && !hasRole}\``;

      await safeSend(message.channel, response);
    } catch (error: any) {
      await safeSend(message.channel, `❌ Error getting member: ${error}`);
    }
    return;
  }

  if (args.length < 2) {
    await safeSend(message.channel, `Usage: \`${cfg.prefix}vanity add <@user>\` or \`${cfg.prefix}vanity remove <@user>\` or \`${cfg.prefix}vanity check <@user>\``);
    return;
  }

  // Check permissions - admin and staff can manage vanity roles
  const [hasAdmin] = await hasPermission(message.member, RoleAdmin);
  const [hasStaff] = await hasPermission(message.member, RoleStaff);

  if (!hasAdmin && !hasStaff) {
    await safeSend(message.channel, "❌ You don't have permission to use this command.");
    return;
  }

  if (!cfg.vanityRoleID) {
    await safeSend(message.channel, '❌ Vanity role not configured.');
    return;
  }

  const userID = parseUserID(args[1]);
  if (!userID) {
    await safeSend(message.channel, '❌ Invalid user mention.');
    return;
  }

  try {
    const member = await message.guild.members.fetch(userID);
    let response = '';

    if (action === 'add') {
      await member.roles.add(cfg.vanityRoleID);
      response = `✅ Added <@${userID}> to vanity role.`;
    } else if (action === 'remove') {
      await member.roles.remove(cfg.vanityRoleID);
      response = `✅ Removed <@${userID}> from vanity role.`;
    } else {
      await safeSend(message.channel, `Usage: \`${cfg.prefix}vanity add <@user>\` or \`${cfg.prefix}vanity remove <@user>\``);
      return;
    }

    await safeSend(message.channel, response);

    // Log to log channel
    if (action === 'add') {
      await bot.logAction(
        client,
        '⭐ **Vanity Role Added**',
        message.author.id,
        userID,
        ''
      );
    } else {
      await bot.logAction(
        client,
        '⭐ **Vanity Role Removed**',
        message.author.id,
        userID,
        ''
      );
    }
  } catch (error: any) {
    console.log(`Error managing vanity role: ${error}`);
    await safeSend(message.channel, '❌ Failed to manage vanity role.');
  }
}

async function handleNickname(
  client: Client,
  message: Message,
  args: string[],
  bot: Bot
): Promise<void> {
  if (args.length === 0) {
    await safeSend(message.channel, `Usage: \`${cfg.prefix}nick <new nickname>\`\nExample: \`${cfg.prefix}nick John Doe\``);
    return;
  }

  // Get the new nickname (join all args to allow spaces)
  const newNickname = args.join(' ');

  // Validate and change nickname
  if (!message.guild || !message.member) {
    return;
  }

  // Validate nickname length (Discord limit is 32 characters)
  if (newNickname.length > 32) {
    await safeSend(message.channel, '❌ Nickname is too long! Maximum length is 32 characters.');
    return;
  }

  if (newNickname.length < 1) {
    return; // Silently ignore empty nicknames
  }

  // Check for potentially problematic characters
  if (newNickname.includes('@') || newNickname.includes('#')) {
    await safeSend(message.channel, '❌ Nickname cannot contain @ or # symbols.');
    return;
  }

  // Check permissions
  const hasChangeNickname =
    message.member.permissions.has('ChangeNickname') ||
    message.member.permissions.has('Administrator');

  if (!hasChangeNickname) {
    await safeSend(message.channel, "❌ You don't have permission to change your nickname.\n\n**Required:** Change Nickname permission or Admin/Mod/Staff role");
    console.log(
      `Nickname: Permission denied for user ${message.author.username}`
    );
    return;
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
    await bot.logAction(
      client,
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
    if (errorMsg.includes('403') || errorMsg.includes('Missing Access')) {
      await safeSend(message.channel, "❌ Bot doesn't have permission to change nicknames.\n\n**Fix:**\n1. Ensure the bot has **Manage Nicknames** permission\n2. The bot's role must be **higher** than the user's highest role in the role hierarchy\n3. Check that the bot's role is properly positioned above all member roles");
    } else if (errorMsg.includes('50035')) {
      await safeSend(message.channel, '❌ Invalid nickname format. Please use only valid characters.');
    } else if (errorMsg.includes('404')) {
      await safeSend(message.channel, '❌ User or guild not found. Please try again.');
    } else {
      await safeSend(message.channel, `❌ Failed to change nickname: ${error}`);
    }
  }
}

async function handleHelp(client: Client, message: Message): Promise<void> {
  if (!message.guild || !message.member) {
    return;
  }

  const prefix = cfg.prefix;

  // Check user permissions to show appropriate commands
  const [hasAdmin] = await hasPermission(message.member, RoleAdmin);
  const [hasMod] = await hasPermission(message.member, RoleMod);
  const [hasStaff] = await hasPermission(message.member, RoleStaff);

  const permissionLevel = getPermissionLevel(hasAdmin, hasMod, hasStaff);

  // Create main embed
  const embed = new EmbedBuilder()
    .setTitle('🤖 Bot Commands Help')
    .setDescription(
      `Prefix: \`${prefix}\`\n\nUse \`${prefix}help\` to view this menu.`
    )
    .setColor(0x5865f2) // Discord blurple
    .setFooter({ text: 'Made with ❤️ by Kirito' })
    .setTimestamp();

  // Moderation Commands Section
  embed.addFields({
    name: '📋 Moderation Commands',
    value: `Available commands for ${permissionLevel}`,
    inline: false,
  });

  embed.addFields({
    name: '🔨 Ban',
    value: `\`${prefix}ban @user [reason]\`\n**Permission:** Admin/Staff (unlimited) | Mod (10/day)\n**Description:** Permanently bans a user from the server`,
    inline: false,
  });

  embed.addFields({
    name: '👢 Kick',
    value: `\`${prefix}kick @user [reason]\`\n**Permission:** Admin/Staff (unlimited) | Mod (10/day)\n**Description:** Removes a user from the server`,
    inline: false,
  });

  embed.addFields({
    name: '🔇 Mute',
    value: `\`${prefix}mute @user [duration] [reason]\`\n**Permission:** Admin/Mod/Staff (unlimited)\n**Description:** Mutes a user (prevents sending messages)`,
    inline: false,
  });

  embed.addFields({
    name: '✅ Unban',
    value: `\`${prefix}unban <user_id>\` or \`${prefix}unban @user\`\n**Permission:** Admin/Staff only\n**Description:** Removes a ban from a user`,
    inline: false,
  });

  embed.addFields({
    name: '🔊 Unmute',
    value: `\`${prefix}unmute @user\`\n**Permission:** Admin/Mod/Staff\n**Description:** Removes mute from a user`,
    inline: false,
  });

  // Role Management Commands (Admin/Staff only)
  if (hasAdmin || hasStaff) {
    embed.addFields({
      name: '👤 Mod Role',
      value: `\`${prefix}mod add @user\`\n\`${prefix}mod remove @user\`\n**Permission:** Admin/Staff\n**Description:** Add or remove moderator role`,
      inline: false,
    });

    embed.addFields({
      name: '👥 Staff Role',
      value: `\`${prefix}staffs add @user\`\n\`${prefix}staffs remove @user\`\n**Permission:** Admin/Staff\n**Description:** Add or remove staff role`,
      inline: false,
    });

    embed.addFields({
      name: '⭐ Vanity Role',
      value: `\`${prefix}vanity add @user\`\n\`${prefix}vanity remove @user\`\n\`${prefix}vanity check @user\`\n**Permission:** Admin/Staff\n**Description:** Manually manage vanity roles`,
      inline: false,
    });
  }

  // User Commands Section
  embed.addFields({
    name: '👤 User Commands',
    value: 'Commands available to all users',
    inline: false,
  });

  embed.addFields({
    name: '📝 Nickname',
    value: `\`${prefix}nick <new nickname>\`\n\`${prefix}nickname <new nickname>\`\n**Permission:** All users (requires 'Change Nickname' permission or Admin/Mod/Staff role)\n**Description:** Change your own nickname\n**Restrictions:** 1-32 characters, cannot contain @ or #`,
    inline: false,
  });

  // Auto-Nickname Channel Info
  if (cfg.autoNickChannelID) {
    embed.addFields({
      name: '💬 Auto-Nickname Channel',
      value: `Send a message in <#${cfg.autoNickChannelID}> to automatically change your nickname!\n**Note:** Attachments and links are not supported.`,
      inline: false,
    });
  }

  // Vanity System Info
  if (cfg.vanityEnabled) {
    embed.addFields({
      name: '✨ Vanity Auto-System',
      value: `The bot automatically assigns vanity roles based on your custom status!\n**String:** \`${cfg.vanityString}\`\n**Cooldown:** ${cfg.vanityCooldown} seconds`,
      inline: false,
    });
  }

  // Send the embed
  try {
    await safeSend(message.channel, { embeds: [embed] });
  } catch (error: any) {
    console.log(`Error sending help embed: ${error}`);
    // Fallback to plain text
    const helpText =
      `**Bot Commands Help**\n\nPrefix: \`${prefix}\`\n\n**Moderation:**\n` +
      `\`${prefix}ban @user [reason]\` - Ban a user\n` +
      `\`${prefix}kick @user [reason]\` - Kick a user\n` +
      `\`${prefix}mute @user [reason]\` - Mute a user\n` +
      `\`${prefix}unban <user_id>\` - Unban a user\n` +
      `\`${prefix}unmute @user\` - Unmute a user\n\n` +
      `**User Commands:**\n` +
      `\`${prefix}nick <nickname>\` - Change your nickname\n\n` +
      `Use \`${prefix}help\` for more information.`;
    await safeSend(message.channel, helpText);
  }
}

function getPermissionLevel(
  hasAdmin: boolean,
  hasMod: boolean,
  hasStaff: boolean
): string {
  if (hasAdmin) {
    return 'Administrators';
  }
  if (hasStaff) {
    return 'Staff Members';
  }
  if (hasMod) {
    return 'Moderators';
  }
  return 'Regular Users';
}

function parseUserID(mention: string): string | null {
  const trimmed = mention.trim();

  // Remove <@ and >
  if (trimmed.startsWith('<@') && trimmed.endsWith('>')) {
    let id = trimmed.substring(2, trimmed.length - 1);
    // Remove ! if present (nickname mention)
    id = id.replace(/^!/, '');
    return id;
  }

  // Try parsing as direct ID
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}


