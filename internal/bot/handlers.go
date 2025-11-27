package bot

import (
	"discord-mod-bot/internal/config"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
)

// Dangerous permissions that should not be in vanity role
var dangerousPerms = []int64{
	discordgo.PermissionAdministrator,
	discordgo.PermissionManageServer,
	discordgo.PermissionManageRoles,
	discordgo.PermissionBanMembers,
	discordgo.PermissionKickMembers,
	discordgo.PermissionManageChannels,
	discordgo.PermissionManageWebhooks,
	discordgo.PermissionMentionEveryone,
}

// onPresenceUpdate handles presence updates for vanity role auto-assignment
func (b *Bot) onPresenceUpdate(s *discordgo.Session, p *discordgo.PresenceUpdate) {
	if !config.Cfg.VanityEnabled {
		return
	}

	if p == nil {
		log.Printf("Vanity: Received nil presence update")
		return
	}

	if p.GuildID == "" {
		log.Printf("Vanity: Presence update has empty GuildID")
		return
	}

	if p.GuildID != config.Cfg.GuildID {
		log.Printf("Vanity: Presence update for different guild: %s (expected: %s)", p.GuildID, config.Cfg.GuildID)
		return
	}

	if p.User == nil {
		log.Printf("Vanity: Presence update has nil user")
		return
	}

	log.Printf("Vanity: ✅ Presence update received for user %s (ID: %s) in guild %s", p.User.Username, p.User.ID, p.GuildID)

	// Log presence details for debugging
	if p.Presence.Activities != nil {
		log.Printf("Vanity: User %s has %d activities", p.User.Username, len(p.Presence.Activities))
		for i, act := range p.Presence.Activities {
			log.Printf("Vanity: Activity %d: Type=%d, Name='%s', State='%s'", i, act.Type, act.Name, act.State)
		}
	} else {
		log.Printf("Vanity: User %s has no activities", p.User.Username)
	}

	// Get member
	member, err := s.GuildMember(p.GuildID, p.User.ID)
	if err != nil {
		log.Printf("Vanity: Error getting member %s: %v", p.User.ID, err)
		return
	}

	if member == nil {
		log.Printf("Vanity: Member is nil for user %s", p.User.ID)
		return
	}

	log.Printf("Vanity: Processing vanity check for user %s", p.User.Username)
	// Update vanity role based on presence
	b.updateVanityRoleWithPresence(s, member, &p.Presence)
}

// isOnCooldown checks if a user is on cooldown
func (b *Bot) isOnCooldown(userID string) bool {
	b.vanityCooldownMux.RLock()
	defer b.vanityCooldownMux.RUnlock()

	lastUsed, exists := b.vanityCooldowns[userID]
	if !exists {
		return false
	}

	cooldownDuration := time.Duration(config.Cfg.VanityCooldown) * time.Second
	return time.Since(lastUsed) < cooldownDuration
}

// updateCooldown updates the cooldown for a user
func (b *Bot) updateCooldown(userID string) {
	b.vanityCooldownMux.Lock()
	defer b.vanityCooldownMux.Unlock()

	b.vanityCooldowns[userID] = time.Now()
}

// isRoleSafe checks if a role has dangerous permissions
func (b *Bot) isRoleSafe(role *discordgo.Role) bool {
	for _, perm := range dangerousPerms {
		if role.Permissions&perm != 0 {
			return false
		}
	}
	return true
}

// getCustomStatusText extracts custom status from member's activities
func (b *Bot) getCustomStatusText(member *discordgo.Member) string {
	if member == nil || member.User == nil {
		return ""
	}
	// Try to get presence from state (cached, fast)
	presence, err := b.Session.State.Presence(config.Cfg.GuildID, member.User.ID)
	if err != nil || presence == nil {
		return ""
	}

	// Check activities for custom status
	// Custom status is ActivityTypeCustom (type 4) and text is in State field
	for _, activity := range presence.Activities {
		if activity.Type == discordgo.ActivityTypeCustom {
			// Custom status text can be in State or Name field
			statusText := ""
			if activity.State != "" {
				statusText = activity.State
			} else if activity.Name != "" {
				statusText = activity.Name
			}

			if statusText != "" {
				return strings.ToLower(statusText)
			}
		}
	}

	return ""
}

// getCustomStatusTextFromPresence extracts custom status from a presence object
func (b *Bot) getCustomStatusTextFromPresence(presence *discordgo.Presence) string {
	if presence == nil {
		log.Printf("Vanity: Presence is nil")
		return ""
	}

	log.Printf("Vanity: Checking %d activities for custom status", len(presence.Activities))

	// Check activities for custom status
	// Custom status is ActivityTypeCustom (type 4) and text is in State field
	for i, activity := range presence.Activities {
		log.Printf("Vanity: Activity %d - Type: %d, Name: '%s', State: '%s', Details: '%s'",
			i, activity.Type, activity.Name, activity.State, activity.Details)

		// Custom status is type 4 (ActivityTypeCustom)
		if activity.Type == discordgo.ActivityTypeCustom {
			// Custom status text can be in State or Name field
			statusText := ""
			if activity.State != "" {
				statusText = activity.State
			} else if activity.Name != "" {
				statusText = activity.Name
			}

			if statusText != "" {
				log.Printf("Vanity: Found custom status: '%s'", statusText)
				return strings.ToLower(statusText)
			}
		}
	}

	log.Printf("Vanity: No custom status found in activities")
	return ""
}

// updateVanityRoleWithPresence updates vanity role using provided presence
func (b *Bot) updateVanityRoleWithPresence(s *discordgo.Session, member *discordgo.Member, presence *discordgo.Presence) {
	if !config.Cfg.VanityEnabled {
		return
	}

	if member == nil || member.User == nil {
		return
	}

	if member.GuildID != config.Cfg.GuildID {
		return
	}

	// Skip cooldown if set to 0 for instant checking
	if config.Cfg.VanityCooldown > 0 {
		if b.isOnCooldown(member.User.ID) {
			return
		}
		b.updateCooldown(member.User.ID)
	}

	// Find vanity role by ID (preferred) or name
	var vanityRole *discordgo.Role
	guild, err := s.Guild(member.GuildID)
	if err != nil {
		log.Printf("Vanity: Error getting guild: %v", err)
		return
	}

	// Try role ID first (preferred)
	if config.Cfg.VanityRoleID != "" {
		for _, role := range guild.Roles {
			if role.ID == config.Cfg.VanityRoleID {
				vanityRole = role
				break
			}
		}
	}

	// Fallback to role name if ID not found or not configured
	if vanityRole == nil && config.Cfg.VanityRoleName != "" {
		for _, role := range guild.Roles {
			if role.Name == config.Cfg.VanityRoleName {
				vanityRole = role
				break
			}
		}
	}

	if vanityRole == nil {
		log.Printf("Vanity: Role not found (ID: %s, Name: %s)", config.Cfg.VanityRoleID, config.Cfg.VanityRoleName)
		return
	}

	if !b.isRoleSafe(vanityRole) {
		log.Printf("Vanity: Role %s has dangerous permissions, skipping", vanityRole.Name)
		return
	}

	// Get custom status from presence
	status := b.getCustomStatusTextFromPresence(presence)
	if status == "" {
		return
	}

	// Cache lowercase vanity string
	vanityLower := strings.ToLower(config.Cfg.VanityString)
	hasVanity := strings.Contains(status, vanityLower)

	// Check if member has the role - optimized with map lookup
	memberRoleMap := make(map[string]bool, len(member.Roles))
	for _, roleID := range member.Roles {
		memberRoleMap[roleID] = true
	}
	hasRole := memberRoleMap[vanityRole.ID]

	// Add role if status contains vanity string and doesn't have role
	if hasVanity && !hasRole {
		// Use config guild ID instead of member.GuildID (may be empty)
		guildID := config.Cfg.GuildID
		if member.GuildID != "" {
			guildID = member.GuildID
		}

		if guildID == "" || member.User.ID == "" || vanityRole.ID == "" {
			return
		}

		err := s.GuildMemberRoleAdd(guildID, member.User.ID, vanityRole.ID)
		if err != nil {
			log.Printf("Vanity: ERROR adding vanity role to %s: %v", member.User.Username, err)
			log.Printf("Vanity: Check bot permissions - needs 'Manage Roles' and role must be below bot's role")
			return
		}
		log.Printf("Vanity: ✅ Successfully added role %s to user %s", vanityRole.Name, member.User.Username)

		// Send log message
		if config.Cfg.LogChannelID != "" {
			embed := &discordgo.MessageEmbed{
				Description: fmt.Sprintf("🩷 %s thanks for putting our vanity in your status, keep supporting!", vanityRole.Mention()),
				Color:       0xFFC0CB, // Pink color
			}
			s.ChannelMessageSendComplex(config.Cfg.LogChannelID, &discordgo.MessageSend{
				Content: member.User.Mention(),
				Embed:   embed,
			})
		}
	} else if !hasVanity && hasRole {
		// Remove role if status doesn't contain vanity string and has role
		// Use config guild ID instead of member.GuildID (may be empty)
		guildID := config.Cfg.GuildID
		if member.GuildID != "" {
			guildID = member.GuildID
		}

		log.Printf("Vanity: Removing role %s from user %s (status doesn't match) in guild %s",
			vanityRole.Name, member.User.Username, guildID)

		// Validate IDs before making API call
		if guildID == "" || member.User.ID == "" || vanityRole.ID == "" {
			log.Printf("Vanity: ERROR - Invalid IDs (GuildID: %s, UserID: %s, RoleID: %s)",
				guildID, member.User.ID, vanityRole.ID)
			return
		}

		err := s.GuildMemberRoleRemove(guildID, member.User.ID, vanityRole.ID)
		if err != nil {
			log.Printf("Vanity: Error removing vanity role from %s: %v", member.User.Username, err)
		} else {
			log.Printf("Vanity: Successfully removed role %s from user %s", vanityRole.Name, member.User.Username)
		}
	} else if hasVanity && hasRole {
		log.Printf("Vanity: User %s already has role %s", member.User.Username, vanityRole.Name)
	} else {
		log.Printf("Vanity: User %s doesn't have vanity in status and doesn't have role", member.User.Username)
	}
}

// checkAllMembersForVanity checks all members on startup
func (b *Bot) checkAllMembersForVanity(s *discordgo.Session) {
	if !config.Cfg.VanityEnabled {
		log.Println("Vanity: Auto-assignment is disabled")
		return
	}

	log.Println("Vanity: Starting vanity check for all members...")
	log.Printf("Vanity: Config - Enabled: %v, String: '%s', RoleID: '%s', RoleName: '%s'",
		config.Cfg.VanityEnabled, config.Cfg.VanityString, config.Cfg.VanityRoleID, config.Cfg.VanityRoleName)

	guild, err := s.Guild(config.Cfg.GuildID)
	if err != nil {
		log.Printf("Vanity: Error getting guild for vanity check: %v", err)
		return
	}

	if guild == nil {
		log.Printf("Vanity: Error: Guild is nil")
		return
	}

	// Find vanity role by ID (preferred) or name
	var vanityRole *discordgo.Role

	// Try role ID first (preferred)
	if config.Cfg.VanityRoleID != "" {
		for _, role := range guild.Roles {
			if role.ID == config.Cfg.VanityRoleID {
				vanityRole = role
				log.Printf("Vanity: Found role by ID: %s (%s)", role.Name, role.ID)
				break
			}
		}
	}

	// Fallback to role name if ID not found or not configured
	if vanityRole == nil && config.Cfg.VanityRoleName != "" {
		for _, role := range guild.Roles {
			if role.Name == config.Cfg.VanityRoleName {
				vanityRole = role
				log.Printf("Vanity: Found role by name: %s (%s)", role.Name, role.ID)
				break
			}
		}
	}

	if vanityRole == nil {
		log.Printf("Vanity: Role not found! (ID: '%s', Name: '%s')", config.Cfg.VanityRoleID, config.Cfg.VanityRoleName)
		return
	}

	if !b.isRoleSafe(vanityRole) {
		log.Printf("Vanity: Role %s has dangerous permissions, skipping", vanityRole.Name)
		return
	}

	log.Printf("Vanity: Using role %s (%s)", vanityRole.Name, vanityRole.ID)

	// Request all members - Discord requires explicit member requests
	members, err := s.GuildMembers(config.Cfg.GuildID, "", 1000)
	if err != nil {
		log.Printf("Vanity: Error fetching members: %v", err)
		// Fallback to cached members if available
		if len(guild.Members) > 0 {
			log.Printf("Vanity: Using cached members (%d members)", len(guild.Members))
			members = guild.Members
		} else {
			log.Printf("Vanity: No members available (cached or fetched)")
			return
		}
	} else {
		log.Printf("Vanity: Fetched %d members", len(members))
	}

	if len(members) == 0 {
		log.Println("Vanity: No members to check")
		return
	}

	log.Printf("Vanity: Checking %d members for vanity status...", len(members))

	checked := 0
	added := 0
	removed := 0
	skipped := 0

	// Check all members - only delay when making API calls
	for i, member := range members {
		if member == nil || member.User == nil {
			continue
		}

		// Check if member has the role
		hasRole := false
		for _, roleID := range member.Roles {
			if roleID == vanityRole.ID {
				hasRole = true
				break
			}
		}

		// Get custom status
		status := b.getCustomStatusText(member)
		if status == "" {
			// No status found - remove role if they have it
			if hasRole {
				// Use config guild ID instead of member.GuildID (may be empty)
				guildID := config.Cfg.GuildID
				if member.GuildID != "" {
					guildID = member.GuildID
				}

				// Validate IDs before making API call
				if guildID == "" || member.User.ID == "" || vanityRole.ID == "" {
					log.Printf("Vanity: ERROR - Invalid IDs (GuildID: %s, UserID: %s, RoleID: %s)",
						guildID, member.User.ID, vanityRole.ID)
					skipped++
					continue
				}

				err := s.GuildMemberRoleRemove(guildID, member.User.ID, vanityRole.ID)
				if err != nil {
					log.Printf("Vanity: Error removing role from %s (no status): %v", member.User.Username, err)
				} else {
					removed++
				}
				// Small delay after API call
				time.Sleep(50 * time.Millisecond)
			}
			skipped++
			continue
		}

		hasVanity := strings.Contains(strings.ToLower(status), strings.ToLower(config.Cfg.VanityString))
		checked++

		// Add role if status contains vanity string and doesn't have role
		if hasVanity && !hasRole {
			// Use config guild ID instead of member.GuildID (may be empty)
			guildID := config.Cfg.GuildID
			if member.GuildID != "" {
				guildID = member.GuildID
			}

			// Validate IDs before making API call
			if guildID == "" || member.User.ID == "" || vanityRole.ID == "" {
				log.Printf("Vanity: ERROR - Invalid IDs (GuildID: %s, UserID: %s, RoleID: %s)",
					guildID, member.User.ID, vanityRole.ID)
				continue
			}

			err := s.GuildMemberRoleAdd(guildID, member.User.ID, vanityRole.ID)
			if err != nil {
				log.Printf("Vanity: ERROR adding role to %s (GuildID: %s, UserID: %s, RoleID: %s): %v",
					member.User.Username, guildID, member.User.ID, vanityRole.ID, err)
			} else {
				added++
				log.Printf("Vanity: ✅ Added role to %s", member.User.Username)
			}
			// Small delay after API call to avoid rate limits
			time.Sleep(50 * time.Millisecond)
		} else if !hasVanity && hasRole {
			// Remove role if status doesn't contain vanity string and has role
			// Use config guild ID instead of member.GuildID (may be empty)
			guildID := config.Cfg.GuildID
			if member.GuildID != "" {
				guildID = member.GuildID
			}

			// Validate IDs before making API call
			if guildID == "" || member.User.ID == "" || vanityRole.ID == "" {
				log.Printf("Vanity: ERROR - Invalid IDs (GuildID: %s, UserID: %s, RoleID: %s)",
					guildID, member.User.ID, vanityRole.ID)
				continue
			}

			err := s.GuildMemberRoleRemove(guildID, member.User.ID, vanityRole.ID)
			if err != nil {
				log.Printf("Vanity: ERROR removing role from %s (GuildID: %s, UserID: %s, RoleID: %s): %v",
					member.User.Username, guildID, member.User.ID, vanityRole.ID, err)
			} else {
				removed++
				log.Printf("Vanity: Removed role from %s", member.User.Username)
			}
			// Small delay after API call
			time.Sleep(50 * time.Millisecond)
		}

		// Progress update every 100 members
		if (i+1)%100 == 0 {
			log.Printf("Vanity: Progress - Checked: %d/%d, Added: %d, Removed: %d", i+1, len(members), added, removed)
		}
	}

	log.Printf("Vanity: ✅ Finished - Checked: %d, Added: %d, Removed: %d, Skipped (no status): %d", checked, added, removed, skipped)
}
