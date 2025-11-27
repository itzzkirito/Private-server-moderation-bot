package bot

import (
	"discord-mod-bot/internal/config"
	"discord-mod-bot/internal/utils"
	"fmt"
	"log"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
)

func (b *Bot) HandleCommand(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Defensive check (should already be validated in onMessageCreate, but extra safety)
	if m == nil || m.Message == nil || m.Author == nil {
		return
	}

	content := strings.TrimPrefix(m.Content, config.Cfg.Prefix)
	args := strings.Fields(content)
	if len(args) == 0 {
		log.Printf("Command: No arguments found after prefix")
		return
	}

	command := strings.ToLower(args[0])
	log.Printf("Command: Processing command '%s' with args: %v", command, args[1:])

	switch command {
	case "ban":
		b.handleBan(s, m, args[1:])
	case "kick":
		b.handleKick(s, m, args[1:])
	case "mute":
		b.handleMute(s, m, args[1:])
	case "unban":
		b.handleUnban(s, m, args[1:])
	case "unmute":
		b.handleUnmute(s, m, args[1:])
	case "mod":
		b.handleMod(s, m, args[1:])
	case "staffs":
		b.handleStaffs(s, m, args[1:])
	case "vanity":
		b.handleVanity(s, m, args[1:])
	case "nick", "nickname":
		b.handleNickname(s, m, args[1:])
	case "help", "commands":
		b.handleHelp(s, m)
	default:
		// Unknown command
		return
	}
}

func (b *Bot) handleBan(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) < 1 {
		s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"ban <@user> [reason]`")
		return
	}

	// Check permissions
	hasAdmin, errAdmin := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleAdmin)
	hasMod, errMod := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleMod)
	hasStaff, errStaff := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleStaff)

	log.Printf("Permission check for user %s (ID: %s) - Admin: %v (err: %v), Mod: %v (err: %v), Staff: %v (err: %v)",
		m.Author.Username, m.Author.ID, hasAdmin, errAdmin, hasMod, errMod, hasStaff, errStaff)

	if !hasAdmin && !hasMod && !hasStaff {
		log.Printf("Permission denied for user %s attempting to ban", m.Author.Username)
		s.ChannelMessageSend(m.ChannelID, "❌ You don't have permission to use this command.")
		return
	}

	// Parse user ID
	userID := parseUserID(args[0])
	if userID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Invalid user mention.")
		return
	}

	// Check rate limiting for mods
	if hasMod && !hasAdmin && !hasStaff {
		canBan, err := utils.CanPerformModAction(m.Author.ID, "ban")
		if err != nil {
			s.ChannelMessageSend(m.ChannelID, "❌ Daily ban limit reached (10 bans per day).")
			return
		}
		if !canBan {
			s.ChannelMessageSend(m.ChannelID, "❌ Daily ban limit reached (10 bans per day).")
			return
		}
		utils.RecordModAction(m.Author.ID, "ban")
	}

	// Get reason
	reason := "No reason provided"
	if len(args) > 1 {
		reason = strings.Join(args[1:], " ")
	}

	// Ban user
	err := s.GuildBanCreateWithReason(m.GuildID, userID, reason, 0)
	if err != nil {
		log.Printf("Error banning user: %v", err)
		s.ChannelMessageSend(m.ChannelID, "❌ Failed to ban user.")
		return
	}

	s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("✅ User <@%s> has been banned. Reason: %s", userID, reason))

	// Log to log channel
	b.logAction(s, "🔨 **Ban**", m.Author.ID, userID, reason)
}

func (b *Bot) handleKick(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) < 1 {
		s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"kick <@user> [reason]`")
		return
	}

	// Check permissions
	hasAdmin, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleAdmin)
	hasMod, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleMod)
	hasStaff, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleStaff)

	if !hasAdmin && !hasMod && !hasStaff {
		s.ChannelMessageSend(m.ChannelID, "❌ You don't have permission to use this command.")
		return
	}

	// Parse user ID
	userID := parseUserID(args[0])
	if userID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Invalid user mention.")
		return
	}

	// Check rate limiting for mods
	if hasMod && !hasAdmin && !hasStaff {
		canKick, err := utils.CanPerformModAction(m.Author.ID, "kick")
		if err != nil {
			s.ChannelMessageSend(m.ChannelID, "❌ Daily kick limit reached (10 kicks per day).")
			return
		}
		if !canKick {
			s.ChannelMessageSend(m.ChannelID, "❌ Daily kick limit reached (10 kicks per day).")
			return
		}
		utils.RecordModAction(m.Author.ID, "kick")
	}

	// Get reason
	reason := "No reason provided"
	if len(args) > 1 {
		reason = strings.Join(args[1:], " ")
	}

	// Kick user
	err := s.GuildMemberDeleteWithReason(m.GuildID, userID, reason)
	if err != nil {
		log.Printf("Error kicking user: %v", err)
		s.ChannelMessageSend(m.ChannelID, "❌ Failed to kick user.")
		return
	}

	s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("✅ User <@%s> has been kicked. Reason: %s", userID, reason))

	// Log to log channel
	b.logAction(s, "👢 **Kick**", m.Author.ID, userID, reason)
}

func (b *Bot) handleMute(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) < 1 {
		s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"mute <@user> [duration] [reason]`")
		return
	}

	// Check permissions
	hasAdmin, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleAdmin)
	hasMod, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleMod)
	hasStaff, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleStaff)

	if !hasAdmin && !hasMod && !hasStaff {
		s.ChannelMessageSend(m.ChannelID, "❌ You don't have permission to use this command.")
		return
	}

	// Parse user ID
	userID := parseUserID(args[0])
	if userID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Invalid user mention.")
		return
	}

	if config.Cfg.MuteRoleID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Mute role not configured.")
		return
	}

	// Add mute role
	err := s.GuildMemberRoleAdd(m.GuildID, userID, config.Cfg.MuteRoleID)
	if err != nil {
		log.Printf("Error muting user: %v", err)
		// Check for specific permission errors
		if strings.Contains(err.Error(), "403") || strings.Contains(err.Error(), "Missing Access") {
			s.ChannelMessageSend(m.ChannelID, "❌ Failed to mute user: Bot doesn't have permission to assign the mute role.\n\n**Fix:**\n1. Ensure the bot has **Manage Roles** permission\n2. The bot's role must be **higher** than the mute role in the role hierarchy\n3. The mute role must be below the bot's highest role")
		} else {
			s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("❌ Failed to mute user: %v", err))
		}
		return
	}

	reason := "No reason provided"
	if len(args) > 1 {
		reason = strings.Join(args[1:], " ")
	}

	s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("✅ User <@%s> has been muted. Reason: %s", userID, reason))

	// Log to log channel
	b.logAction(s, "🔇 **Mute**", m.Author.ID, userID, reason)
}

func (b *Bot) handleUnban(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) < 1 {
		s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("Usage: `%sunban <user_id>` or `%sunban @user`\n\n**Note:** You can use either the user ID or mention the user.", config.Cfg.Prefix, config.Cfg.Prefix))
		return
	}

	// Check permissions
	hasAdmin, errAdmin := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleAdmin)
	hasStaff, errStaff := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleStaff)

	log.Printf("Unban permission check for user %s (ID: %s) - Admin: %v (err: %v), Staff: %v (err: %v)",
		m.Author.Username, m.Author.ID, hasAdmin, errAdmin, hasStaff, errStaff)

	if !hasAdmin && !hasStaff {
		log.Printf("Permission denied for user %s attempting to unban", m.Author.Username)
		s.ChannelMessageSend(m.ChannelID, "❌ You don't have permission to use this command. (Admin/Staff only)")
		return
	}

	// Parse user ID - support both mention and raw ID
	userID := parseUserID(args[0])
	if userID == "" {
		// If not a mention, try as raw ID (must be numeric and 17-19 digits)
		rawID := strings.TrimSpace(args[0])
		if len(rawID) >= 17 && len(rawID) <= 19 {
			// Check if it's numeric
			isNumeric := true
			for _, r := range rawID {
				if r < '0' || r > '9' {
					isNumeric = false
					break
				}
			}
			if isNumeric {
				userID = rawID
			}
		}
	}

	if userID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Invalid user ID or mention. Please provide a valid user ID or mention.\n\n**Example:** `"+config.Cfg.Prefix+"unban 123456789012345678` or `"+config.Cfg.Prefix+"unban @user`")
		return
	}

	log.Printf("Unban: Attempting to unban user ID %s", userID)

	// Unban user
	err := s.GuildBanDelete(m.GuildID, userID)
	if err != nil {
		log.Printf("Error unbanning user %s: %v", userID, err)

		// Provide helpful error messages
		if strings.Contains(err.Error(), "404") || strings.Contains(err.Error(), "Unknown Ban") {
			s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("❌ User <@%s> is not banned or doesn't exist.", userID))
		} else if strings.Contains(err.Error(), "403") || strings.Contains(err.Error(), "Missing Access") {
			s.ChannelMessageSend(m.ChannelID, "❌ Bot doesn't have permission to unban users.\n\n**Fix:**\n1. Ensure the bot has **Ban Members** permission\n2. Check that the bot role has proper permissions")
		} else {
			s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("❌ Failed to unban user: %v", err))
		}
		return
	}

	log.Printf("Unban: Successfully unbanned user %s", userID)
	s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("✅ User <@%s> has been unbanned.", userID))

	// Log to log channel
	b.logAction(s, "✅ **Unban**", m.Author.ID, userID, "")
}

func (b *Bot) handleUnmute(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) < 1 {
		s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"unmute <@user>`")
		return
	}

	// Check permissions
	hasAdmin, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleAdmin)
	hasMod, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleMod)
	hasStaff, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleStaff)

	if !hasAdmin && !hasMod && !hasStaff {
		s.ChannelMessageSend(m.ChannelID, "❌ You don't have permission to use this command.")
		return
	}

	// Parse user ID
	userID := parseUserID(args[0])
	if userID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Invalid user mention.")
		return
	}

	if config.Cfg.MuteRoleID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Mute role not configured.")
		return
	}

	// Remove mute role
	err := s.GuildMemberRoleRemove(m.GuildID, userID, config.Cfg.MuteRoleID)
	if err != nil {
		log.Printf("Error unmuting user: %v", err)
		// Check for specific permission errors
		if strings.Contains(err.Error(), "403") || strings.Contains(err.Error(), "Missing Access") {
			s.ChannelMessageSend(m.ChannelID, "❌ Failed to unmute user: Bot doesn't have permission to remove the mute role.\n\n**Fix:**\n1. Ensure the bot has **Manage Roles** permission\n2. The bot's role must be **higher** than the mute role in the role hierarchy")
		} else {
			s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("❌ Failed to unmute user: %v", err))
		}
		return
	}

	s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("✅ User <@%s> has been unmuted.", userID))

	// Log to log channel
	b.logAction(s, "🔊 **Unmute**", m.Author.ID, userID, "")
}

func (b *Bot) handleMod(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) < 2 {
		s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"mod add <@user>` or `"+config.Cfg.Prefix+"mod remove <@user>`")
		return
	}

	// Check permissions - only admin can manage mod roles
	hasAdmin, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleAdmin)
	hasStaff, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleStaff)

	if !hasAdmin && !hasStaff {
		s.ChannelMessageSend(m.ChannelID, "❌ You don't have permission to use this command.")
		return
	}

	if config.Cfg.ModRoleID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Mod role not configured.")
		return
	}

	action := strings.ToLower(args[0])
	userID := parseUserID(args[1])

	if userID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Invalid user mention.")
		return
	}

	var err error
	var response string

	switch action {
	case "add":
		err = s.GuildMemberRoleAdd(m.GuildID, userID, config.Cfg.ModRoleID)
		if err == nil {
			response = fmt.Sprintf("✅ Added <@%s> to mod role. Params: @mod <@%s>", userID, userID)
		}
	case "remove":
		err = s.GuildMemberRoleRemove(m.GuildID, userID, config.Cfg.ModRoleID)
		if err == nil {
			response = fmt.Sprintf("✅ Removed <@%s> from mod role.", userID)
		}
	default:
		s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"mod add <@user>` or `"+config.Cfg.Prefix+"mod remove <@user>`")
		return
	}

	if err != nil {
		log.Printf("Error managing mod role: %v", err)
		s.ChannelMessageSend(m.ChannelID, "❌ Failed to manage mod role.")
		return
	}

	s.ChannelMessageSend(m.ChannelID, response)

	// Log to log channel
	switch action {
	case "add":
		b.logAction(s, "👤 **Mod Role Added**", m.Author.ID, userID, "")
	case "remove":
		b.logAction(s, "👤 **Mod Role Removed**", m.Author.ID, userID, "")
	}
}

func (b *Bot) handleStaffs(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) < 2 {
		s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"staffs add <@user>` or `"+config.Cfg.Prefix+"staffs remove <@user>`")
		return
	}

	// Check permissions - admin, staff, and mod can manage staff roles
	hasAdmin, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleAdmin)
	hasMod, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleMod)
	hasStaff, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleStaff)

	if !hasAdmin && !hasMod && !hasStaff {
		s.ChannelMessageSend(m.ChannelID, "❌ You don't have permission to use this command.")
		return
	}

	if config.Cfg.StaffRoleID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Staff role not configured.")
		return
	}

	action := strings.ToLower(args[0])
	userID := parseUserID(args[1])

	if userID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Invalid user mention.")
		return
	}

	var err error
	var response string

	switch action {
	case "add":
		err = s.GuildMemberRoleAdd(m.GuildID, userID, config.Cfg.StaffRoleID)
		if err == nil {
			response = fmt.Sprintf("✅ Added <@%s> to staff role.", userID)
		}
	case "remove":
		err = s.GuildMemberRoleRemove(m.GuildID, userID, config.Cfg.StaffRoleID)
		if err == nil {
			response = fmt.Sprintf("✅ Removed <@%s> from staff role.", userID)
		}
	default:
		s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"staffs add <@user>` or `"+config.Cfg.Prefix+"staffs remove <@user>`")
		return
	}

	if err != nil {
		log.Printf("Error managing staff role: %v", err)
		s.ChannelMessageSend(m.ChannelID, "❌ Failed to manage staff role.")
		return
	}

	s.ChannelMessageSend(m.ChannelID, response)

	// Log to log channel
	switch action {
	case "add":
		b.logAction(s, "👥 **Staff Role Added**", m.Author.ID, userID, "")
	case "remove":
		b.logAction(s, "👥 **Staff Role Removed**", m.Author.ID, userID, "")
	}
}

func (b *Bot) handleVanity(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) < 1 {
		s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"vanity add <@user>` or `"+config.Cfg.Prefix+"vanity remove <@user>` or `"+config.Cfg.Prefix+"vanity check <@user>`")
		return
	}

	action := strings.ToLower(args[0])

	// Handle check command separately
	if action == "check" {
		if len(args) < 2 {
			s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"vanity check <@user>`")
			return
		}

		// Check permissions
		hasAdmin, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleAdmin)
		hasStaff, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleStaff)

		if !hasAdmin && !hasStaff {
			s.ChannelMessageSend(m.ChannelID, "❌ You don't have permission to use this command.")
			return
		}

		userID := parseUserID(args[1])
		if userID == "" {
			s.ChannelMessageSend(m.ChannelID, "❌ Invalid user mention.")
			return
		}

		// Get member
		member, err := s.GuildMember(m.GuildID, userID)
		if err != nil {
			s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("❌ Error getting member: %v", err))
			return
		}

		if member == nil {
			s.ChannelMessageSend(m.ChannelID, "❌ Member not found.")
			return
		}

		// Get presence
		presence, err := s.State.Presence(m.GuildID, userID)
		if err != nil {
			s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("❌ Error getting presence: %v", err))
			return
		}

		// Check vanity status
		var statusText string
		if presence != nil {
			statusText = b.getCustomStatusTextFromPresence(presence)
		}

		// Check if has role
		hasRole := false
		if config.Cfg.VanityRoleID != "" {
			for _, roleID := range member.Roles {
				if roleID == config.Cfg.VanityRoleID {
					hasRole = true
					break
				}
			}
		}

		hasVanity := false
		if statusText != "" {
			hasVanity = strings.Contains(strings.ToLower(statusText), strings.ToLower(config.Cfg.VanityString))
		}

		response := fmt.Sprintf("**Vanity Check for <@%s>:**\n", userID)
		response += fmt.Sprintf("Status: `%s`\n", statusText)
		response += fmt.Sprintf("Looking for: `%s`\n", config.Cfg.VanityString)
		response += fmt.Sprintf("Has vanity string: `%v`\n", hasVanity)
		response += fmt.Sprintf("Has role: `%v`\n", hasRole)
		response += fmt.Sprintf("Should have role: `%v`", hasVanity && !hasRole)

		s.ChannelMessageSend(m.ChannelID, response)
		return
	}

	if len(args) < 2 {
		s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"vanity add <@user>` or `"+config.Cfg.Prefix+"vanity remove <@user>` or `"+config.Cfg.Prefix+"vanity check <@user>`")
		return
	}

	// Check permissions - admin and staff can manage vanity roles
	hasAdmin, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleAdmin)
	hasStaff, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleStaff)

	if !hasAdmin && !hasStaff {
		s.ChannelMessageSend(m.ChannelID, "❌ You don't have permission to use this command.")
		return
	}

	if config.Cfg.VanityRoleID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Vanity role not configured.")
		return
	}

	userID := parseUserID(args[1])

	if userID == "" {
		s.ChannelMessageSend(m.ChannelID, "❌ Invalid user mention.")
		return
	}

	var err error
	var response string

	switch action {
	case "add":
		err = s.GuildMemberRoleAdd(m.GuildID, userID, config.Cfg.VanityRoleID)
		if err == nil {
			response = fmt.Sprintf("✅ Added <@%s> to vanity role.", userID)
		}
	case "remove":
		err = s.GuildMemberRoleRemove(m.GuildID, userID, config.Cfg.VanityRoleID)
		if err == nil {
			response = fmt.Sprintf("✅ Removed <@%s> from vanity role.", userID)
		}
	default:
		s.ChannelMessageSend(m.ChannelID, "Usage: `"+config.Cfg.Prefix+"vanity add <@user>` or `"+config.Cfg.Prefix+"vanity remove <@user>`")
		return
	}

	if err != nil {
		log.Printf("Error managing vanity role: %v", err)
		s.ChannelMessageSend(m.ChannelID, "❌ Failed to manage vanity role.")
		return
	}

	s.ChannelMessageSend(m.ChannelID, response)

	// Log to log channel
	switch action {
	case "add":
		b.logAction(s, "⭐ **Vanity Role Added**", m.Author.ID, userID, "")
	case "remove":
		b.logAction(s, "⭐ **Vanity Role Removed**", m.Author.ID, userID, "")
	}
}

// logAction sends a formatted log message to the log channel
func (b *Bot) logAction(s *discordgo.Session, actionType string, moderatorID, targetID, reason string) {
	if config.Cfg.LogChannelID == "" {
		return // No log channel configured
	}

	// Get moderator info
	moderator, err := s.User(moderatorID)
	moderatorName := "Unknown"
	if err == nil && moderator != nil {
		moderatorName = moderator.Username
	}

	// Get target info
	target, err := s.User(targetID)
	targetName := "Unknown"
	if err == nil && target != nil {
		targetName = target.Username
	}

	// Build log message
	logMsg := fmt.Sprintf("%s\n**Moderator:** <@%s> (%s)\n**Target:** <@%s> (%s)",
		actionType, moderatorID, moderatorName, targetID, targetName)

	if reason != "" {
		logMsg += fmt.Sprintf("\n**Reason:** %s", reason)
	}

	// Send to log channel
	_, err = s.ChannelMessageSend(config.Cfg.LogChannelID, logMsg)
	if err != nil {
		log.Printf("Error sending log message: %v", err)
	}
}

// URL pattern to detect links (http, https, www., discord.gg, etc.)
var urlPattern = regexp.MustCompile(`(?i)(https?://|www\.|discord\.gg/|discord\.com/|discordapp\.com/)`)

// handleAutoNickname automatically changes nickname when user sends message in auto-nick channel
func (b *Bot) handleAutoNickname(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Ignore messages with attachments (images, files, etc.)
	if m.Message != nil && len(m.Message.Attachments) > 0 {
		log.Printf("AutoNick: Ignoring message with attachment from user %s", m.Author.Username)
		return
	}

	// Ignore messages with embeds
	if m.Message != nil && len(m.Message.Embeds) > 0 {
		log.Printf("AutoNick: Ignoring message with embed from user %s", m.Author.Username)
		return
	}

	// Get the new nickname from message content
	newNickname := strings.TrimSpace(m.Content)

	// Ignore empty messages or commands
	if newNickname == "" || strings.HasPrefix(newNickname, config.Cfg.Prefix) {
		return
	}

	// Ignore messages containing URLs/links
	if urlPattern.MatchString(newNickname) {
		log.Printf("AutoNick: Ignoring message with link from user %s", m.Author.Username)
		return
	}

	// Check if user wants to reset nickname to default
	if strings.ToLower(newNickname) == "reset" {
		b.resetNickname(s, m)
		return
	}

	// Validate and change nickname
	b.changeNickname(s, m, newNickname)
}

// handleNickname handles nickname change requests via command
func (b *Bot) handleNickname(s *discordgo.Session, m *discordgo.MessageCreate, args []string) {
	if len(args) == 0 {
		s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("Usage: `%snick <new nickname>`\nExample: `%snick John Doe`", config.Cfg.Prefix, config.Cfg.Prefix))
		return
	}

	// Get the new nickname (join all args to allow spaces)
	newNickname := strings.Join(args, " ")

	// Validate and change nickname
	b.changeNickname(s, m, newNickname)
}

// changeNickname validates and changes the user's nickname
func (b *Bot) changeNickname(s *discordgo.Session, m *discordgo.MessageCreate, newNickname string) {

	// Validate nickname length (Discord limit is 32 characters)
	if len(newNickname) > 32 {
		s.ChannelMessageSend(m.ChannelID, "❌ Nickname is too long! Maximum length is 32 characters.")
		return
	}

	if len(newNickname) < 1 {
		return // Silently ignore empty nicknames
	}

	// Check for potentially problematic characters
	if strings.Contains(newNickname, "@") || strings.Contains(newNickname, "#") {
		s.ChannelMessageSend(m.ChannelID, "❌ Nickname cannot contain @ or # symbols.")
		return
	}

	// Check if this is the auto-nick channel - if so, skip permission checks
	isAutoNickChannel := config.Cfg.AutoNickChannelID != "" && m.ChannelID == config.Cfg.AutoNickChannelID

	if !isAutoNickChannel {
		// For command-based nickname changes, check permissions
		// Get member to check current nickname
		member, err := s.GuildMember(m.GuildID, m.Author.ID)
		if err != nil {
			log.Printf("Error getting member for nickname change: %v", err)
			s.ChannelMessageSend(m.ChannelID, "❌ Error retrieving your member information.")
			return
		}

		// Check if user has permission to change nickname
		// Users can change their own nickname if they have "Change Nickname" permission
		// Or if they're admin/staff/mod, they can change it
		hasAdmin, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleAdmin)
		hasMod, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleMod)
		hasStaff, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleStaff)

		// Check if user has "Change Nickname" permission
		canChangeNick := false
		if member != nil {
			// Check guild permissions - use guild-level permissions for nickname changes
			guild, err := s.Guild(m.GuildID)
			if err == nil && guild != nil {
				// Calculate member's guild permissions
				var memberPerms int64
				if guild.OwnerID == m.Author.ID {
					// Owner has all permissions
					memberPerms = discordgo.PermissionAll
					canChangeNick = true
				} else {
					// Calculate permissions from roles
					for _, roleID := range member.Roles {
						for _, role := range guild.Roles {
							if role.ID == roleID {
								memberPerms |= role.Permissions
								break
							}
						}
					}
					// Check if user has ChangeNickname permission
					if memberPerms&discordgo.PermissionChangeNickname != 0 {
						canChangeNick = true
					}
				}
				log.Printf("Nickname: User %s - Admin: %v, Mod: %v, Staff: %v, CanChangeNick: %v, Perms: %d",
					m.Author.Username, hasAdmin, hasMod, hasStaff, canChangeNick, memberPerms)
			}
		}

		// Allow if user has admin/mod/staff role OR has ChangeNickname permission
		if !hasAdmin && !hasMod && !hasStaff && !canChangeNick {
			s.ChannelMessageSend(m.ChannelID, "❌ You don't have permission to change your nickname.\n\n**Required:** Change Nickname permission or Admin/Mod/Staff role")
			log.Printf("Nickname: Permission denied for user %s", m.Author.Username)
			return
		}
	} else {
		log.Printf("Nickname: Auto-nick channel detected, skipping permission check for user %s", m.Author.Username)
	}

	// Change the nickname
	log.Printf("Nickname: Attempting to change nickname for user %s to '%s' in guild %s", m.Author.Username, newNickname, m.GuildID)
	err := s.GuildMemberNickname(m.GuildID, m.Author.ID, newNickname)
	if err != nil {
		log.Printf("Nickname: ERROR changing nickname for user %s: %v", m.Author.ID, err)

		// Provide helpful error messages
		if strings.Contains(err.Error(), "403") || strings.Contains(err.Error(), "Missing Access") {
			s.ChannelMessageSend(m.ChannelID, "❌ Bot doesn't have permission to change nicknames.\n\n**Fix:**\n1. Ensure the bot has **Manage Nicknames** permission\n2. The bot's role must be **higher** than the user's highest role in the role hierarchy\n3. Check that the bot's role is properly positioned above all member roles")
		} else if strings.Contains(err.Error(), "50035") {
			s.ChannelMessageSend(m.ChannelID, "❌ Invalid nickname format. Please use only valid characters.")
		} else if strings.Contains(err.Error(), "404") {
			s.ChannelMessageSend(m.ChannelID, "❌ User or guild not found. Please try again.")
		} else {
			s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("❌ Failed to change nickname: %v", err))
		}
		return
	}

	// Add reaction to indicate success (removed success message to avoid spam)
	s.MessageReactionAdd(m.ChannelID, m.Message.ID, "✅")
	log.Printf("Nickname: Successfully changed nickname for user %s to '%s'", m.Author.Username, newNickname)

	// Log the action
	b.logAction(s, "📝 **Nickname Changed**", m.Author.ID, m.Author.ID, fmt.Sprintf("New nickname: %s", newNickname))
}

// resetNickname resets the user's nickname to their default username
func (b *Bot) resetNickname(s *discordgo.Session, m *discordgo.MessageCreate) {
	log.Printf("Nickname: Resetting nickname for user %s to default", m.Author.Username)

	// Set nickname to empty string to reset to default (username)
	err := s.GuildMemberNickname(m.GuildID, m.Author.ID, "")
	if err != nil {
		log.Printf("Nickname: ERROR resetting nickname for user %s: %v", m.Author.ID, err)

		// Provide helpful error messages
		if strings.Contains(err.Error(), "403") || strings.Contains(err.Error(), "Missing Access") {
			s.ChannelMessageSend(m.ChannelID, "❌ Bot doesn't have permission to change nicknames.\n\n**Fix:**\n1. Ensure the bot has **Manage Nicknames** permission\n2. The bot's role must be **higher** than the user's highest role in the role hierarchy")
		} else if strings.Contains(err.Error(), "404") {
			s.ChannelMessageSend(m.ChannelID, "❌ User or guild not found. Please try again.")
		} else {
			s.ChannelMessageSend(m.ChannelID, fmt.Sprintf("❌ Failed to reset nickname: %v", err))
		}
		return
	}

	// Add reaction to indicate success
	s.MessageReactionAdd(m.ChannelID, m.Message.ID, "✅")
	log.Printf("Nickname: Successfully reset nickname for user %s to default", m.Author.Username)

	// Log the action
	b.logAction(s, "📝 **Nickname Reset**", m.Author.ID, m.Author.ID, "Reset to default username")
}

// handleHelp displays a comprehensive help menu with all available commands
func (b *Bot) handleHelp(s *discordgo.Session, m *discordgo.MessageCreate) {
	prefix := config.Cfg.Prefix

	// Check user permissions to show appropriate commands
	hasAdmin, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleAdmin)
	hasMod, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleMod)
	hasStaff, _ := utils.HasPermission(s, m.GuildID, m.Author.ID, utils.RoleStaff)

	permissionLevel := getPermissionLevel(hasAdmin, hasMod, hasStaff)

	// Create main embed
	embed := &discordgo.MessageEmbed{
		Title:       "🤖 Bot Commands Help",
		Description: fmt.Sprintf("Prefix: `%s`\n\nUse `%shelp` to view this menu.", prefix, prefix),
		Color:       0x5865F2, // Discord blurple
		Fields:      []*discordgo.MessageEmbedField{},
		Footer: &discordgo.MessageEmbedFooter{
			Text: "Made with ❤️ by Kirito",
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	// Moderation Commands Section
	embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
		Name:   "📋 Moderation Commands",
		Value:  fmt.Sprintf("Available commands for %s", permissionLevel),
		Inline: false,
	})

	embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
		Name:   "🔨 Ban",
		Value:  fmt.Sprintf("`%sban @user [reason]`\n**Permission:** Admin/Staff (unlimited) | Mod (10/day)\n**Description:** Permanently bans a user from the server", prefix),
		Inline: false,
	})

	embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
		Name:   "👢 Kick",
		Value:  fmt.Sprintf("`%skick @user [reason]`\n**Permission:** Admin/Staff (unlimited) | Mod (10/day)\n**Description:** Removes a user from the server", prefix),
		Inline: false,
	})

	embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
		Name:   "🔇 Mute",
		Value:  fmt.Sprintf("`%smute @user [duration] [reason]`\n**Permission:** Admin/Mod/Staff (unlimited)\n**Description:** Mutes a user (prevents sending messages)", prefix),
		Inline: false,
	})

	embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
		Name:   "✅ Unban",
		Value:  fmt.Sprintf("`%sunban <user_id>` or `%sunban @user`\n**Permission:** Admin/Staff only\n**Description:** Removes a ban from a user", prefix, prefix),
		Inline: false,
	})

	embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
		Name:   "🔊 Unmute",
		Value:  fmt.Sprintf("`%sunmute @user`\n**Permission:** Admin/Mod/Staff\n**Description:** Removes mute from a user", prefix),
		Inline: false,
	})

	// Role Management Commands (Admin/Staff only)
	if hasAdmin || hasStaff {
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:   "👤 Mod Role",
			Value:  fmt.Sprintf("`%smod add @user`\n`%smod remove @user`\n**Permission:** Admin/Staff\n**Description:** Add or remove moderator role", prefix, prefix),
			Inline: false,
		})

		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:   "👥 Staff Role",
			Value:  fmt.Sprintf("`%sstaffs add @user`\n`%sstaffs remove @user`\n**Permission:** Admin/Staff\n**Description:** Add or remove staff role", prefix, prefix),
			Inline: false,
		})

		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:   "⭐ Vanity Role",
			Value:  fmt.Sprintf("`%svanity add @user`\n`%svanity remove @user`\n`%svanity check @user`\n**Permission:** Admin/Staff\n**Description:** Manually manage vanity roles", prefix, prefix, prefix),
			Inline: false,
		})
	}

	// User Commands Section
	embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
		Name:   "👤 User Commands",
		Value:  "Commands available to all users",
		Inline: false,
	})

	embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
		Name:   "📝 Nickname",
		Value:  fmt.Sprintf("`%snick <new nickname>`\n`%snickname <new nickname>`\n**Permission:** All users (requires 'Change Nickname' permission or Admin/Mod/Staff role)\n**Description:** Change your own nickname\n**Restrictions:** 1-32 characters, cannot contain @ or #", prefix, prefix),
		Inline: false,
	})

	// Auto-Nickname Channel Info
	if config.Cfg.AutoNickChannelID != "" {
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:   "💬 Auto-Nickname Channel",
			Value:  fmt.Sprintf("Send a message in <#%s> to automatically change your nickname!\n**Note:** Attachments and links are not supported.", config.Cfg.AutoNickChannelID),
			Inline: false,
		})
	}

	// Vanity System Info
	if config.Cfg.VanityEnabled {
		embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
			Name:   "✨ Vanity Auto-System",
			Value:  fmt.Sprintf("The bot automatically assigns vanity roles based on your custom status!\n**String:** `%s`\n**Cooldown:** %d seconds", config.Cfg.VanityString, config.Cfg.VanityCooldown),
			Inline: false,
		})
	}

	// Send the embed
	_, err := s.ChannelMessageSendEmbed(m.ChannelID, embed)
	if err != nil {
		log.Printf("Error sending help embed: %v", err)
		// Fallback to plain text
		helpText := fmt.Sprintf("**Bot Commands Help**\n\nPrefix: `%s`\n\n**Moderation:**\n`%sban @user [reason]` - Ban a user\n`%skick @user [reason]` - Kick a user\n`%smute @user [reason]` - Mute a user\n`%sunban <user_id>` - Unban a user\n`%sunmute @user` - Unmute a user\n\n**User Commands:**\n`%snick <nickname>` - Change your nickname\n\nUse `%shelp` for more information.",
			prefix, prefix, prefix, prefix, prefix, prefix, prefix, prefix)
		s.ChannelMessageSend(m.ChannelID, helpText)
	}
}

// getPermissionLevel returns a string describing the user's permission level
func getPermissionLevel(hasAdmin, hasMod, hasStaff bool) string {
	if hasAdmin {
		return "Administrators"
	}
	if hasStaff {
		return "Staff Members"
	}
	if hasMod {
		return "Moderators"
	}
	return "Regular Users"
}

// parseUserID extracts user ID from mention string
func parseUserID(mention string) string {
	mention = strings.TrimSpace(mention)

	// Remove <@ and >
	if strings.HasPrefix(mention, "<@") && strings.HasSuffix(mention, ">") {
		mention = mention[2 : len(mention)-1]
		// Remove ! if present (nickname mention)
		mention = strings.TrimPrefix(mention, "!")
		return mention
	}

	// Try parsing as direct ID
	if _, err := strconv.ParseUint(mention, 10, 64); err == nil {
		return mention
	}

	return ""
}
