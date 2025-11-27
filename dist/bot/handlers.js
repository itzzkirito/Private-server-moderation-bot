"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePresenceUpdate = handlePresenceUpdate;
exports.checkAllMembersForVanity = checkAllMembersForVanity;
const discord_js_1 = require("discord.js");
const config_1 = require("../config/config");
// Dangerous permissions that should not be in vanity role
const dangerousPerms = [
    discord_js_1.PermissionFlagsBits.Administrator,
    discord_js_1.PermissionFlagsBits.ManageGuild,
    discord_js_1.PermissionFlagsBits.ManageRoles,
    discord_js_1.PermissionFlagsBits.BanMembers,
    discord_js_1.PermissionFlagsBits.KickMembers,
    discord_js_1.PermissionFlagsBits.ManageChannels,
    discord_js_1.PermissionFlagsBits.ManageWebhooks,
    discord_js_1.PermissionFlagsBits.MentionEveryone,
];
/**
 * Handles presence updates for vanity role auto-assignment
 */
async function handlePresenceUpdate(presence, bot) {
    if (!config_1.cfg.vanityEnabled) {
        return;
    }
    if (!presence) {
        console.log('Vanity: Received null presence update');
        return;
    }
    if (!presence.guild) {
        console.log('Vanity: Presence update has no guild');
        return;
    }
    if (presence.guild.id !== config_1.cfg.guildID) {
        console.log(`Vanity: Presence update for different guild: ${presence.guild.id} (expected: ${config_1.cfg.guildID})`);
        return;
    }
    if (!presence.user) {
        console.log('Vanity: Presence update has no user');
        return;
    }
    console.log(`Vanity: ✅ Presence update received for user ${presence.user.username} (ID: ${presence.user.id}) in guild ${presence.guild.id}`);
    // Log presence details for debugging
    if (presence.activities) {
        console.log(`Vanity: User ${presence.user.username} has ${presence.activities.length} activities`);
        presence.activities.forEach((act, i) => {
            console.log(`Vanity: Activity ${i}: Type=${act.type}, Name='${act.name}', State='${act.state}'`);
        });
    }
    else {
        console.log(`Vanity: User ${presence.user.username} has no activities`);
    }
    try {
        // Get member
        const member = await presence.guild.members.fetch(presence.user.id);
        if (!member) {
            console.log(`Vanity: Member is null for user ${presence.user.id}`);
            return;
        }
        console.log(`Vanity: Processing vanity check for user ${presence.user.username}`);
        // Update vanity role based on presence
        await updateVanityRoleWithPresence(bot.getClient(), member, presence, bot);
    }
    catch (error) {
        console.log(`Vanity: Error getting member ${presence.user.id}: ${error}`);
    }
}
/**
 * Checks if a role has dangerous permissions
 */
function isRoleSafe(role) {
    const permissions = BigInt(role.permissions);
    for (const perm of dangerousPerms) {
        if ((permissions & perm) !== 0n) {
            return false;
        }
    }
    return true;
}
/**
 * Extracts custom status from a presence object
 */
function getCustomStatusTextFromPresence(presence) {
    if (!presence) {
        console.log('Vanity: Presence is null');
        return '';
    }
    console.log(`Vanity: Checking ${presence.activities?.length || 0} activities for custom status`);
    // Check activities for custom status
    // Custom status is ActivityType.Custom (type 4) and text is in State field
    if (presence.activities) {
        for (let i = 0; i < presence.activities.length; i++) {
            const activity = presence.activities[i];
            console.log(`Vanity: Activity ${i} - Type: ${activity.type}, Name: '${activity.name}', State: '${activity.state}', Details: '${activity.details}'`);
            // Custom status is type 4 (ActivityType.Custom)
            if (activity.type === discord_js_1.ActivityType.Custom) {
                // Custom status text can be in State or Name field
                const statusText = activity.state || activity.name || '';
                if (statusText) {
                    console.log(`Vanity: Found custom status: '${statusText}'`);
                    return statusText.toLowerCase();
                }
            }
        }
    }
    console.log('Vanity: No custom status found in activities');
    return '';
}
/**
 * Updates vanity role using provided presence
 */
async function updateVanityRoleWithPresence(client, member, presence, bot) {
    if (!config_1.cfg.vanityEnabled) {
        return;
    }
    if (!member || !member.user) {
        return;
    }
    if (member.guild.id !== config_1.cfg.guildID) {
        return;
    }
    // Skip cooldown if set to 0 for instant checking
    if (config_1.cfg.vanityCooldown > 0) {
        if (bot.isOnCooldown(member.user.id)) {
            return;
        }
        bot.updateCooldown(member.user.id);
    }
    // Find vanity role by ID (preferred) or name
    let vanityRole = null;
    try {
        const guild = await client.guilds.fetch(member.guild.id);
        // Try role ID first (preferred)
        if (config_1.cfg.vanityRoleID) {
            try {
                vanityRole = await guild.roles.fetch(config_1.cfg.vanityRoleID);
            }
            catch (error) {
                // Role not found by ID
            }
        }
        // Fallback to role name if ID not found or not configured
        if (!vanityRole && config_1.cfg.vanityRoleName) {
            const roles = await guild.roles.fetch();
            vanityRole =
                roles.find((role) => role.name === config_1.cfg.vanityRoleName) || null;
        }
        if (!vanityRole) {
            console.log(`Vanity: Role not found (ID: ${config_1.cfg.vanityRoleID}, Name: ${config_1.cfg.vanityRoleName})`);
            return;
        }
        if (!isRoleSafe(vanityRole)) {
            console.log(`Vanity: Role ${vanityRole.name} has dangerous permissions, skipping`);
            return;
        }
        // Get custom status from presence
        const status = getCustomStatusTextFromPresence(presence);
        if (!status) {
            return;
        }
        // Cache lowercase vanity string
        const vanityLower = config_1.cfg.vanityString.toLowerCase();
        const hasVanity = status.includes(vanityLower);
        // Check if member has the role
        const hasRole = member.roles.cache.has(vanityRole.id);
        // Add role if status contains vanity string and doesn't have role
        if (hasVanity && !hasRole) {
            const guildID = member.guild.id;
            if (!guildID || !member.user.id || !vanityRole.id) {
                return;
            }
            try {
                await member.roles.add(vanityRole);
                console.log(`Vanity: ✅ Successfully added role ${vanityRole.name} to user ${member.user.username}`);
                // Send log message
                if (config_1.cfg.logChannelID) {
                    try {
                        const channel = await client.channels.fetch(config_1.cfg.logChannelID);
                        if (channel && channel.isTextBased()) {
                            const embed = new discord_js_1.EmbedBuilder()
                                .setDescription(`🩷 ${vanityRole} thanks for putting our vanity in your status, keep supporting!`)
                                .setColor(0xffc0cb); // Pink color
                            await channel.send({
                                content: member.user.toString(),
                                embeds: [embed],
                            });
                        }
                    }
                    catch (error) {
                        console.log(`Vanity: Error sending log message: ${error}`);
                    }
                }
            }
            catch (error) {
                console.log(`Vanity: ERROR adding vanity role to ${member.user.username}: ${error}`);
                console.log("Vanity: Check bot permissions - needs 'Manage Roles' and role must be below bot's role");
            }
        }
        else if (!hasVanity && hasRole) {
            // Remove role if status doesn't contain vanity string and has role
            const guildID = member.guild.id;
            console.log(`Vanity: Removing role ${vanityRole.name} from user ${member.user.username} (status doesn't match) in guild ${guildID}`);
            // Validate IDs before making API call
            if (!guildID || !member.user.id || !vanityRole.id) {
                console.log(`Vanity: ERROR - Invalid IDs (GuildID: ${guildID}, UserID: ${member.user.id}, RoleID: ${vanityRole.id})`);
                return;
            }
            try {
                await member.roles.remove(vanityRole);
                console.log(`Vanity: Successfully removed role ${vanityRole.name} from user ${member.user.username}`);
            }
            catch (error) {
                console.log(`Vanity: Error removing vanity role from ${member.user.username}: ${error}`);
            }
        }
        else if (hasVanity && hasRole) {
            console.log(`Vanity: User ${member.user.username} already has role ${vanityRole.name}`);
        }
        else {
            console.log(`Vanity: User ${member.user.username} doesn't have vanity in status and doesn't have role`);
        }
    }
    catch (error) {
        console.log(`Vanity: Error getting guild: ${error}`);
    }
}
/**
 * Gets custom status text from member's activities
 */
function getCustomStatusText(member) {
    if (!member || !member.user) {
        return '';
    }
    // Try to get presence from member
    const presence = member.presence;
    if (!presence) {
        return '';
    }
    return getCustomStatusTextFromPresence(presence);
}
/**
 * Checks all members on startup
 */
async function checkAllMembersForVanity(client, bot) {
    if (!config_1.cfg.vanityEnabled) {
        console.log('Vanity: Auto-assignment is disabled');
        return;
    }
    console.log('Vanity: Starting vanity check for all members...');
    console.log(`Vanity: Config - Enabled: ${config_1.cfg.vanityEnabled}, String: '${config_1.cfg.vanityString}', RoleID: '${config_1.cfg.vanityRoleID}', RoleName: '${config_1.cfg.vanityRoleName}'`);
    try {
        const guild = await client.guilds.fetch(config_1.cfg.guildID);
        if (!guild) {
            console.log('Vanity: Error: Guild is null');
            return;
        }
        // Find vanity role by ID (preferred) or name
        let vanityRole = null;
        // Try role ID first (preferred)
        if (config_1.cfg.vanityRoleID) {
            try {
                vanityRole = await guild.roles.fetch(config_1.cfg.vanityRoleID);
                if (vanityRole) {
                    console.log(`Vanity: Found role by ID: ${vanityRole.name} (${vanityRole.id})`);
                }
            }
            catch (error) {
                // Role not found by ID
            }
        }
        // Fallback to role name if ID not found or not configured
        if (!vanityRole && config_1.cfg.vanityRoleName) {
            const roles = await guild.roles.fetch();
            vanityRole =
                roles.find((role) => role.name === config_1.cfg.vanityRoleName) || null;
            if (vanityRole) {
                console.log(`Vanity: Found role by name: ${vanityRole.name} (${vanityRole.id})`);
            }
        }
        if (!vanityRole) {
            console.log(`Vanity: Role not found! (ID: '${config_1.cfg.vanityRoleID}', Name: '${config_1.cfg.vanityRoleName}')`);
            return;
        }
        if (!isRoleSafe(vanityRole)) {
            console.log(`Vanity: Role ${vanityRole.name} has dangerous permissions, skipping`);
            return;
        }
        console.log(`Vanity: Using role ${vanityRole.name} (${vanityRole.id})`);
        // Request all members - Discord requires explicit member requests
        let members = [];
        try {
            const fetchedMembers = await guild.members.fetch({ limit: 1000 });
            members = Array.from(fetchedMembers.values());
            console.log(`Vanity: Fetched ${members.length} members`);
        }
        catch (error) {
            console.log(`Vanity: Error fetching members: ${error}`);
            return;
        }
        if (members.length === 0) {
            console.log('Vanity: No members to check');
            return;
        }
        console.log(`Vanity: Checking ${members.length} members for vanity status...`);
        let checked = 0;
        let added = 0;
        let removed = 0;
        let skipped = 0;
        // Check all members - only delay when making API calls
        for (let i = 0; i < members.length; i++) {
            const member = members[i];
            if (!member || !member.user) {
                continue;
            }
            // Check if member has the role
            const hasRole = member.roles.cache.has(vanityRole.id);
            // Get custom status
            const status = getCustomStatusText(member);
            if (!status) {
                // No status found - remove role if they have it
                if (hasRole) {
                    const guildID = member.guild.id;
                    if (!guildID || !member.user.id || !vanityRole.id) {
                        console.log(`Vanity: ERROR - Invalid IDs (GuildID: ${guildID}, UserID: ${member.user.id}, RoleID: ${vanityRole.id})`);
                        skipped++;
                        continue;
                    }
                    try {
                        await member.roles.remove(vanityRole);
                        removed++;
                    }
                    catch (error) {
                        console.log(`Vanity: Error removing role from ${member.user.username} (no status): ${error}`);
                    }
                    // Small delay after API call
                    await new Promise((resolve) => setTimeout(resolve, 50));
                }
                skipped++;
                continue;
            }
            const hasVanity = status
                .toLowerCase()
                .includes(config_1.cfg.vanityString.toLowerCase());
            checked++;
            // Add role if status contains vanity string and doesn't have role
            if (hasVanity && !hasRole) {
                const guildID = member.guild.id;
                if (!guildID || !member.user.id || !vanityRole.id) {
                    console.log(`Vanity: ERROR - Invalid IDs (GuildID: ${guildID}, UserID: ${member.user.id}, RoleID: ${vanityRole.id})`);
                    continue;
                }
                try {
                    await member.roles.add(vanityRole);
                    added++;
                    console.log(`Vanity: ✅ Added role to ${member.user.username}`);
                }
                catch (error) {
                    console.log(`Vanity: ERROR adding role to ${member.user.username} (GuildID: ${guildID}, UserID: ${member.user.id}, RoleID: ${vanityRole.id}): ${error}`);
                }
                // Small delay after API call to avoid rate limits
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
            else if (!hasVanity && hasRole) {
                // Remove role if status doesn't contain vanity string and has role
                const guildID = member.guild.id;
                if (!guildID || !member.user.id || !vanityRole.id) {
                    console.log(`Vanity: ERROR - Invalid IDs (GuildID: ${guildID}, UserID: ${member.user.id}, RoleID: ${vanityRole.id})`);
                    continue;
                }
                try {
                    await member.roles.remove(vanityRole);
                    removed++;
                    console.log(`Vanity: Removed role from ${member.user.username}`);
                }
                catch (error) {
                    console.log(`Vanity: ERROR removing role from ${member.user.username} (GuildID: ${guildID}, UserID: ${member.user.id}, RoleID: ${vanityRole.id}): ${error}`);
                }
                // Small delay after API call
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
            // Progress update every 100 members
            if ((i + 1) % 100 === 0) {
                console.log(`Vanity: Progress - Checked: ${i + 1}/${members.length}, Added: ${added}, Removed: ${removed}`);
            }
        }
        console.log(`Vanity: ✅ Finished - Checked: ${checked}, Added: ${added}, Removed: ${removed}, Skipped (no status): ${skipped}`);
    }
    catch (error) {
        console.log(`Vanity: Error getting guild for vanity check: ${error}`);
    }
}
//# sourceMappingURL=handlers.js.map