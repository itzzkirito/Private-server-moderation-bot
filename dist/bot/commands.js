"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCommand = handleCommand;
const discord_js_1 = require("discord.js");
const config_1 = require("../config/config");
const permissions_1 = require("../utils/permissions");
async function handleCommand(client, message, bot) {
    // Defensive check
    if (!message || !message.author) {
        return;
    }
    const content = message.content.substring(config_1.cfg.prefix.length).trim();
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
async function handleBan(client, message, args, bot) {
    if (args.length < 1) {
        await message.channel.send(`Usage: \`${config_1.cfg.prefix}ban <@user> [reason]\``);
        return;
    }
    if (!message.guild || !message.member) {
        return;
    }
    // Check permissions
    const [hasAdmin, errAdmin] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleAdmin);
    const [hasMod, errMod] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleMod);
    const [hasStaff, errStaff] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleStaff);
    console.log(`Permission check for user ${message.author.username} (ID: ${message.author.id}) - Admin: ${hasAdmin} (err: ${errAdmin}), Mod: ${hasMod} (err: ${errMod}), Staff: ${hasStaff} (err: ${errStaff})`);
    if (!hasAdmin && !hasMod && !hasStaff) {
        console.log(`Permission denied for user ${message.author.username} attempting to ban`);
        await message.channel.send("❌ You don't have permission to use this command.");
        return;
    }
    // Parse user ID
    const userID = parseUserID(args[0]);
    if (!userID) {
        await message.channel.send('❌ Invalid user mention.');
        return;
    }
    // Check rate limiting for mods
    if (hasMod && !hasAdmin && !hasStaff) {
        const [canBan, err] = (0, permissions_1.canPerformModAction)(message.author.id, 'ban');
        if (err || !canBan) {
            await message.channel.send('❌ Daily ban limit reached (10 bans per day).');
            return;
        }
        (0, permissions_1.recordModAction)(message.author.id, 'ban');
    }
    // Get reason
    let reason = 'No reason provided';
    if (args.length > 1) {
        reason = args.slice(1).join(' ');
    }
    try {
        // Ban user
        await message.guild.members.ban(userID, { reason });
        await message.channel.send(`✅ User <@${userID}> has been banned. Reason: ${reason}`);
        // Log to log channel
        await bot.logAction(client, '🔨 **Ban**', message.author.id, userID, reason);
    }
    catch (error) {
        console.log(`Error banning user: ${error}`);
        await message.channel.send('❌ Failed to ban user.');
    }
}
async function handleKick(client, message, args, bot) {
    if (args.length < 1) {
        await message.channel.send(`Usage: \`${config_1.cfg.prefix}kick <@user> [reason]\``);
        return;
    }
    if (!message.guild || !message.member) {
        return;
    }
    // Check permissions
    const [hasAdmin] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleAdmin);
    const [hasMod] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleMod);
    const [hasStaff] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleStaff);
    if (!hasAdmin && !hasMod && !hasStaff) {
        await message.channel.send("❌ You don't have permission to use this command.");
        return;
    }
    // Parse user ID
    const userID = parseUserID(args[0]);
    if (!userID) {
        await message.channel.send('❌ Invalid user mention.');
        return;
    }
    // Check rate limiting for mods
    if (hasMod && !hasAdmin && !hasStaff) {
        const [canKick, err] = (0, permissions_1.canPerformModAction)(message.author.id, 'kick');
        if (err || !canKick) {
            await message.channel.send('❌ Daily kick limit reached (10 kicks per day).');
            return;
        }
        (0, permissions_1.recordModAction)(message.author.id, 'kick');
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
        await message.channel.send(`✅ User <@${userID}> has been kicked. Reason: ${reason}`);
        // Log to log channel
        await bot.logAction(client, '👢 **Kick**', message.author.id, userID, reason);
    }
    catch (error) {
        console.log(`Error kicking user: ${error}`);
        await message.channel.send('❌ Failed to kick user.');
    }
}
async function handleMute(client, message, args, bot) {
    if (args.length < 1) {
        await message.channel.send(`Usage: \`${config_1.cfg.prefix}mute <@user> [duration] [reason]\``);
        return;
    }
    if (!message.guild || !message.member) {
        return;
    }
    // Check permissions
    const [hasAdmin] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleAdmin);
    const [hasMod] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleMod);
    const [hasStaff] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleStaff);
    if (!hasAdmin && !hasMod && !hasStaff) {
        await message.channel.send("❌ You don't have permission to use this command.");
        return;
    }
    // Parse user ID
    const userID = parseUserID(args[0]);
    if (!userID) {
        await message.channel.send('❌ Invalid user mention.');
        return;
    }
    if (!config_1.cfg.muteRoleID) {
        await message.channel.send('❌ Mute role not configured.');
        return;
    }
    try {
        // Add mute role
        const member = await message.guild.members.fetch(userID);
        await member.roles.add(config_1.cfg.muteRoleID);
        let reason = 'No reason provided';
        if (args.length > 1) {
            reason = args.slice(1).join(' ');
        }
        await message.channel.send(`✅ User <@${userID}> has been muted. Reason: ${reason}`);
        // Log to log channel
        await bot.logAction(client, '🔇 **Mute**', message.author.id, userID, reason);
    }
    catch (error) {
        console.log(`Error muting user: ${error}`);
        const errorMsg = error.toString();
        if (errorMsg.includes('403') || errorMsg.includes('Missing Access')) {
            await message.channel.send("❌ Failed to mute user: Bot doesn't have permission to assign the mute role.\n\n**Fix:**\n1. Ensure the bot has **Manage Roles** permission\n2. The bot's role must be **higher** than the mute role in the role hierarchy\n3. The mute role must be below the bot's highest role");
        }
        else {
            await message.channel.send(`❌ Failed to mute user: ${error}`);
        }
    }
}
async function handleUnban(client, message, args, bot) {
    if (args.length < 1) {
        await message.channel.send(`Usage: \`${config_1.cfg.prefix}unban <user_id>\` or \`${config_1.cfg.prefix}unban @user\`\n\n**Note:** You can use either the user ID or mention the user.`);
        return;
    }
    if (!message.guild || !message.member) {
        return;
    }
    // Check permissions
    const [hasAdmin, errAdmin] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleAdmin);
    const [hasStaff, errStaff] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleStaff);
    console.log(`Unban permission check for user ${message.author.username} (ID: ${message.author.id}) - Admin: ${hasAdmin} (err: ${errAdmin}), Staff: ${hasStaff} (err: ${errStaff})`);
    if (!hasAdmin && !hasStaff) {
        console.log(`Permission denied for user ${message.author.username} attempting to unban`);
        await message.channel.send("❌ You don't have permission to use this command. (Admin/Staff only)");
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
        await message.channel.send(`❌ Invalid user ID or mention. Please provide a valid user ID or mention.\n\n**Example:** \`${config_1.cfg.prefix}unban 123456789012345678\` or \`${config_1.cfg.prefix}unban @user\``);
        return;
    }
    console.log(`Unban: Attempting to unban user ID ${userID}`);
    try {
        // Unban user
        await message.guild.members.unban(userID);
        console.log(`Unban: Successfully unbanned user ${userID}`);
        await message.channel.send(`✅ User <@${userID}> has been unbanned.`);
        // Log to log channel
        await bot.logAction(client, '✅ **Unban**', message.author.id, userID, '');
    }
    catch (error) {
        console.log(`Error unbanning user ${userID}: ${error}`);
        // Provide helpful error messages
        const errorMsg = error.toString();
        if (errorMsg.includes('404') || errorMsg.includes('Unknown Ban')) {
            await message.channel.send(`❌ User <@${userID}> is not banned or doesn't exist.`);
        }
        else if (errorMsg.includes('403') || errorMsg.includes('Missing Access')) {
            await message.channel.send("❌ Bot doesn't have permission to unban users.\n\n**Fix:**\n1. Ensure the bot has **Ban Members** permission\n2. Check that the bot role has proper permissions");
        }
        else {
            await message.channel.send(`❌ Failed to unban user: ${error}`);
        }
    }
}
async function handleUnmute(client, message, args, bot) {
    if (args.length < 1) {
        await message.channel.send(`Usage: \`${config_1.cfg.prefix}unmute <@user>\``);
        return;
    }
    if (!message.guild || !message.member) {
        return;
    }
    // Check permissions
    const [hasAdmin] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleAdmin);
    const [hasMod] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleMod);
    const [hasStaff] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleStaff);
    if (!hasAdmin && !hasMod && !hasStaff) {
        await message.channel.send("❌ You don't have permission to use this command.");
        return;
    }
    // Parse user ID
    const userID = parseUserID(args[0]);
    if (!userID) {
        await message.channel.send('❌ Invalid user mention.');
        return;
    }
    if (!config_1.cfg.muteRoleID) {
        await message.channel.send('❌ Mute role not configured.');
        return;
    }
    try {
        // Remove mute role
        const member = await message.guild.members.fetch(userID);
        await member.roles.remove(config_1.cfg.muteRoleID);
        await message.channel.send(`✅ User <@${userID}> has been unmuted.`);
        // Log to log channel
        await bot.logAction(client, '🔊 **Unmute**', message.author.id, userID, '');
    }
    catch (error) {
        console.log(`Error unmuting user: ${error}`);
        const errorMsg = error.toString();
        if (errorMsg.includes('403') || errorMsg.includes('Missing Access')) {
            await message.channel.send("❌ Failed to unmute user: Bot doesn't have permission to remove the mute role.\n\n**Fix:**\n1. Ensure the bot has **Manage Roles** permission\n2. The bot's role must be **higher** than the mute role in the role hierarchy");
        }
        else {
            await message.channel.send(`❌ Failed to unmute user: ${error}`);
        }
    }
}
async function handleMod(client, message, args, bot) {
    if (args.length < 2) {
        await message.channel.send(`Usage: \`${config_1.cfg.prefix}mod add <@user>\` or \`${config_1.cfg.prefix}mod remove <@user>\``);
        return;
    }
    if (!message.guild || !message.member) {
        return;
    }
    // Check permissions - only admin can manage mod roles
    const [hasAdmin] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleAdmin);
    const [hasStaff] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleStaff);
    if (!hasAdmin && !hasStaff) {
        await message.channel.send("❌ You don't have permission to use this command.");
        return;
    }
    if (!config_1.cfg.modRoleID) {
        await message.channel.send('❌ Mod role not configured.');
        return;
    }
    const action = args[0].toLowerCase();
    const userID = parseUserID(args[1]);
    if (!userID) {
        await message.channel.send('❌ Invalid user mention.');
        return;
    }
    try {
        const member = await message.guild.members.fetch(userID);
        let response = '';
        if (action === 'add') {
            await member.roles.add(config_1.cfg.modRoleID);
            response = `✅ Added <@${userID}> to mod role. Params: @mod <@${userID}>`;
        }
        else if (action === 'remove') {
            await member.roles.remove(config_1.cfg.modRoleID);
            response = `✅ Removed <@${userID}> from mod role.`;
        }
        else {
            await message.channel.send(`Usage: \`${config_1.cfg.prefix}mod add <@user>\` or \`${config_1.cfg.prefix}mod remove <@user>\``);
            return;
        }
        await message.channel.send(response);
        // Log to log channel
        if (action === 'add') {
            await bot.logAction(client, '👤 **Mod Role Added**', message.author.id, userID, '');
        }
        else {
            await bot.logAction(client, '👤 **Mod Role Removed**', message.author.id, userID, '');
        }
    }
    catch (error) {
        console.log(`Error managing mod role: ${error}`);
        await message.channel.send('❌ Failed to manage mod role.');
    }
}
async function handleStaffs(client, message, args, bot) {
    if (args.length < 2) {
        await message.channel.send(`Usage: \`${config_1.cfg.prefix}staffs add <@user>\` or \`${config_1.cfg.prefix}staffs remove <@user>\``);
        return;
    }
    if (!message.guild || !message.member) {
        return;
    }
    // Check permissions - admin, staff, and mod can manage staff roles
    const [hasAdmin] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleAdmin);
    const [hasMod] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleMod);
    const [hasStaff] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleStaff);
    if (!hasAdmin && !hasMod && !hasStaff) {
        await message.channel.send("❌ You don't have permission to use this command.");
        return;
    }
    if (!config_1.cfg.staffRoleID) {
        await message.channel.send('❌ Staff role not configured.');
        return;
    }
    const action = args[0].toLowerCase();
    const userID = parseUserID(args[1]);
    if (!userID) {
        await message.channel.send('❌ Invalid user mention.');
        return;
    }
    try {
        const member = await message.guild.members.fetch(userID);
        let response = '';
        if (action === 'add') {
            await member.roles.add(config_1.cfg.staffRoleID);
            response = `✅ Added <@${userID}> to staff role.`;
        }
        else if (action === 'remove') {
            await member.roles.remove(config_1.cfg.staffRoleID);
            response = `✅ Removed <@${userID}> from staff role.`;
        }
        else {
            await message.channel.send(`Usage: \`${config_1.cfg.prefix}staffs add <@user>\` or \`${config_1.cfg.prefix}staffs remove <@user>\``);
            return;
        }
        await message.channel.send(response);
        // Log to log channel
        if (action === 'add') {
            await bot.logAction(client, '👥 **Staff Role Added**', message.author.id, userID, '');
        }
        else {
            await bot.logAction(client, '👥 **Staff Role Removed**', message.author.id, userID, '');
        }
    }
    catch (error) {
        console.log(`Error managing staff role: ${error}`);
        await message.channel.send('❌ Failed to manage staff role.');
    }
}
async function handleVanity(client, message, args, bot) {
    if (args.length < 1) {
        await message.channel.send(`Usage: \`${config_1.cfg.prefix}vanity add <@user>\` or \`${config_1.cfg.prefix}vanity remove <@user>\` or \`${config_1.cfg.prefix}vanity check <@user>\``);
        return;
    }
    if (!message.guild || !message.member) {
        return;
    }
    const action = args[0].toLowerCase();
    // Handle check command separately
    if (action === 'check') {
        if (args.length < 2) {
            await message.channel.send(`Usage: \`${config_1.cfg.prefix}vanity check <@user>\``);
            return;
        }
        // Check permissions
        const [hasAdmin] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleAdmin);
        const [hasStaff] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleStaff);
        if (!hasAdmin && !hasStaff) {
            await message.channel.send("❌ You don't have permission to use this command.");
            return;
        }
        const userID = parseUserID(args[1]);
        if (!userID) {
            await message.channel.send('❌ Invalid user mention.');
            return;
        }
        try {
            // Get member
            const member = await message.guild.members.fetch(userID);
            if (!member) {
                await message.channel.send('❌ Member not found.');
                return;
            }
            // Get presence
            const presence = member.presence;
            let statusText = '';
            if (presence) {
                // Get custom status from presence activities
                for (const activity of presence.activities || []) {
                    if (activity.type === discord_js_1.ActivityType.Custom) {
                        statusText = (activity.state || activity.name || '').toLowerCase();
                        break;
                    }
                }
            }
            // Check if has role
            let hasRole = false;
            if (config_1.cfg.vanityRoleID) {
                hasRole = member.roles.cache.has(config_1.cfg.vanityRoleID);
            }
            const hasVanity = statusText !== '' &&
                statusText.toLowerCase().includes(config_1.cfg.vanityString.toLowerCase());
            const response = `**Vanity Check for <@${userID}>:**\n` +
                `Status: \`${statusText}\`\n` +
                `Looking for: \`${config_1.cfg.vanityString}\`\n` +
                `Has vanity string: \`${hasVanity}\`\n` +
                `Has role: \`${hasRole}\`\n` +
                `Should have role: \`${hasVanity && !hasRole}\``;
            await message.channel.send(response);
        }
        catch (error) {
            await message.channel.send(`❌ Error getting member: ${error}`);
        }
        return;
    }
    if (args.length < 2) {
        await message.channel.send(`Usage: \`${config_1.cfg.prefix}vanity add <@user>\` or \`${config_1.cfg.prefix}vanity remove <@user>\` or \`${config_1.cfg.prefix}vanity check <@user>\``);
        return;
    }
    // Check permissions - admin and staff can manage vanity roles
    const [hasAdmin] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleAdmin);
    const [hasStaff] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleStaff);
    if (!hasAdmin && !hasStaff) {
        await message.channel.send("❌ You don't have permission to use this command.");
        return;
    }
    if (!config_1.cfg.vanityRoleID) {
        await message.channel.send('❌ Vanity role not configured.');
        return;
    }
    const userID = parseUserID(args[1]);
    if (!userID) {
        await message.channel.send('❌ Invalid user mention.');
        return;
    }
    try {
        const member = await message.guild.members.fetch(userID);
        let response = '';
        if (action === 'add') {
            await member.roles.add(config_1.cfg.vanityRoleID);
            response = `✅ Added <@${userID}> to vanity role.`;
        }
        else if (action === 'remove') {
            await member.roles.remove(config_1.cfg.vanityRoleID);
            response = `✅ Removed <@${userID}> from vanity role.`;
        }
        else {
            await message.channel.send(`Usage: \`${config_1.cfg.prefix}vanity add <@user>\` or \`${config_1.cfg.prefix}vanity remove <@user>\``);
            return;
        }
        await message.channel.send(response);
        // Log to log channel
        if (action === 'add') {
            await bot.logAction(client, '⭐ **Vanity Role Added**', message.author.id, userID, '');
        }
        else {
            await bot.logAction(client, '⭐ **Vanity Role Removed**', message.author.id, userID, '');
        }
    }
    catch (error) {
        console.log(`Error managing vanity role: ${error}`);
        await message.channel.send('❌ Failed to manage vanity role.');
    }
}
async function handleNickname(client, message, args, bot) {
    if (args.length === 0) {
        await message.channel.send(`Usage: \`${config_1.cfg.prefix}nick <new nickname>\`\nExample: \`${config_1.cfg.prefix}nick John Doe\``);
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
        await message.channel.send('❌ Nickname is too long! Maximum length is 32 characters.');
        return;
    }
    if (newNickname.length < 1) {
        return; // Silently ignore empty nicknames
    }
    // Check for potentially problematic characters
    if (newNickname.includes('@') || newNickname.includes('#')) {
        await message.channel.send('❌ Nickname cannot contain @ or # symbols.');
        return;
    }
    // Check permissions
    const hasChangeNickname = message.member.permissions.has('ChangeNickname') ||
        message.member.permissions.has('Administrator');
    if (!hasChangeNickname) {
        await message.channel.send("❌ You don't have permission to change your nickname.\n\n**Required:** Change Nickname permission or Admin/Mod/Staff role");
        console.log(`Nickname: Permission denied for user ${message.author.username}`);
        return;
    }
    // Change the nickname
    console.log(`Nickname: Attempting to change nickname for user ${message.author.username} to '${newNickname}' in guild ${message.guildId}`);
    try {
        await message.member.setNickname(newNickname);
        // Add reaction to indicate success
        await message.react('✅');
        console.log(`Nickname: Successfully changed nickname for user ${message.author.username} to '${newNickname}'`);
        // Log the action
        await bot.logAction(client, '📝 **Nickname Changed**', message.author.id, message.author.id, `New nickname: ${newNickname}`);
    }
    catch (error) {
        console.log(`Nickname: ERROR changing nickname for user ${message.author.id}: ${error}`);
        // Provide helpful error messages
        const errorMsg = error.toString();
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
async function handleHelp(client, message) {
    if (!message.guild || !message.member) {
        return;
    }
    const prefix = config_1.cfg.prefix;
    // Check user permissions to show appropriate commands
    const [hasAdmin] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleAdmin);
    const [hasMod] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleMod);
    const [hasStaff] = await (0, permissions_1.hasPermission)(message.member, permissions_1.RoleStaff);
    const permissionLevel = getPermissionLevel(hasAdmin, hasMod, hasStaff);
    // Create main embed
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('🤖 Bot Commands Help')
        .setDescription(`Prefix: \`${prefix}\`\n\nUse \`${prefix}help\` to view this menu.`)
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
    if (config_1.cfg.autoNickChannelID) {
        embed.addFields({
            name: '💬 Auto-Nickname Channel',
            value: `Send a message in <#${config_1.cfg.autoNickChannelID}> to automatically change your nickname!\n**Note:** Attachments and links are not supported.`,
            inline: false,
        });
    }
    // Vanity System Info
    if (config_1.cfg.vanityEnabled) {
        embed.addFields({
            name: '✨ Vanity Auto-System',
            value: `The bot automatically assigns vanity roles based on your custom status!\n**String:** \`${config_1.cfg.vanityString}\`\n**Cooldown:** ${config_1.cfg.vanityCooldown} seconds`,
            inline: false,
        });
    }
    // Send the embed
    try {
        await message.channel.send({ embeds: [embed] });
    }
    catch (error) {
        console.log(`Error sending help embed: ${error}`);
        // Fallback to plain text
        const helpText = `**Bot Commands Help**\n\nPrefix: \`${prefix}\`\n\n**Moderation:**\n` +
            `\`${prefix}ban @user [reason]\` - Ban a user\n` +
            `\`${prefix}kick @user [reason]\` - Kick a user\n` +
            `\`${prefix}mute @user [reason]\` - Mute a user\n` +
            `\`${prefix}unban <user_id>\` - Unban a user\n` +
            `\`${prefix}unmute @user\` - Unmute a user\n\n` +
            `**User Commands:**\n` +
            `\`${prefix}nick <nickname>\` - Change your nickname\n\n` +
            `Use \`${prefix}help\` for more information.`;
        await message.channel.send(helpText);
    }
}
function getPermissionLevel(hasAdmin, hasMod, hasStaff) {
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
function parseUserID(mention) {
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
//# sourceMappingURL=commands.js.map