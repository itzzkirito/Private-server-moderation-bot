package utils

import (
	"discord-mod-bot/internal/config"
	"errors"
	"sync"
	"time"

	"github.com/bwmarrin/discordgo"
)

const (
	RoleAdmin = "admin"
	RoleMod   = "mod"
	RoleStaff = "staff"
)

var (
	modBanCounts  = make(map[string]map[string]int) // userID -> date -> count
	modKickCounts = make(map[string]map[string]int) // userID -> date -> count
	rateLimitMux  sync.RWMutex                      // Mutex for thread-safe access
	maxModActions = 10
)

// HasPermission checks if a user has the required permission level
// Optimized: Uses map lookup instead of multiple loops
func HasPermission(s *discordgo.Session, guildID, userID, requiredRole string) (bool, error) {
	// Try to get member from state cache first (faster)
	member, err := s.State.Member(guildID, userID)
	if err != nil {
		// Fallback to API call if not in cache
		member, err = s.GuildMember(guildID, userID)
		if err != nil {
			return false, err
		}
	}

	if member == nil {
		return false, nil
	}

	// Create map for O(1) lookup instead of O(n) loops
	roleMap := make(map[string]bool, len(member.Roles))
	for _, roleID := range member.Roles {
		roleMap[roleID] = true
	}

	// Check roles in priority order (admin > staff > mod)
	if config.Cfg.AdminRoleID != "" && roleMap[config.Cfg.AdminRoleID] {
		return true, nil
	}

	if config.Cfg.StaffRoleID != "" && roleMap[config.Cfg.StaffRoleID] {
		if requiredRole == RoleAdmin || requiredRole == RoleStaff {
			return true, nil
		}
	}

	if config.Cfg.ModRoleID != "" && roleMap[config.Cfg.ModRoleID] {
		if requiredRole == RoleMod {
			return true, nil
		}
	}

	return false, nil
}

// CanPerformModAction checks if a mod can perform an action (rate limiting)
// Thread-safe with mutex
func CanPerformModAction(userID, actionType string) (bool, error) {
	today := time.Now().Format("2006-01-02")

	var counts map[string]map[string]int
	if actionType == "ban" {
		counts = modBanCounts
	} else if actionType == "kick" {
		counts = modKickCounts
	} else {
		return true, nil // No rate limit for other actions
	}

	rateLimitMux.RLock()
	userCounts, exists := counts[userID]
	rateLimitMux.RUnlock()

	if !exists {
		return true, nil
	}

	rateLimitMux.RLock()
	count := userCounts[today]
	rateLimitMux.RUnlock()

	if count >= maxModActions {
		return false, errors.New("daily limit reached")
	}

	return true, nil
}

// RecordModAction records a mod action for rate limiting
// Thread-safe with mutex
func RecordModAction(userID, actionType string) {
	today := time.Now().Format("2006-01-02")

	var counts map[string]map[string]int
	if actionType == "ban" {
		counts = modBanCounts
	} else if actionType == "kick" {
		counts = modKickCounts
	} else {
		return
	}

	rateLimitMux.Lock()
	defer rateLimitMux.Unlock()

	if counts[userID] == nil {
		counts[userID] = make(map[string]int)
	}

	counts[userID][today]++
}

// CleanupOldCounts removes old date entries (optional cleanup function)
// Thread-safe with mutex
func CleanupOldCounts() {
	today := time.Now().Format("2006-01-02")

	rateLimitMux.Lock()
	defer rateLimitMux.Unlock()

	for userID, dates := range modBanCounts {
		for date := range dates {
			if date != today {
				delete(modBanCounts[userID], date)
			}
		}
		if len(modBanCounts[userID]) == 0 {
			delete(modBanCounts, userID)
		}
	}

	for userID, dates := range modKickCounts {
		for date := range dates {
			if date != today {
				delete(modKickCounts[userID], date)
			}
		}
		if len(modKickCounts[userID]) == 0 {
			delete(modKickCounts, userID)
		}
	}
}
