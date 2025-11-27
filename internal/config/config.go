package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	BotToken          string
	GuildID           string
	AdminRoleID       string
	ModRoleID         string
	StaffRoleID       string
	Prefix            string
	MuteRoleID        string
	LogChannelID      string
	AutoNickChannelID string
	VanityRoleID      string
	VanityString      string
	VanityRoleName    string
	VanityCooldown    int
	VanityEnabled     bool
}

var Cfg *Config

func Load() error {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		return fmt.Errorf("error loading .env file: %w", err)
	}

	Cfg = &Config{
		BotToken:          getEnv("BOT_TOKEN", ""),
		GuildID:           getEnv("GUILD_ID", ""),
		AdminRoleID:       getEnv("ADMIN_ROLE_ID", ""),
		ModRoleID:         getEnv("MOD_ROLE_ID", ""),
		StaffRoleID:       getEnv("STAFF_ROLE_ID", ""),
		Prefix:            getEnv("PREFIX", "!"),
		MuteRoleID:        getEnv("MUTE_ROLE_ID", ""),
		LogChannelID:      getEnv("DISCORD_LOG_CHANNEL_ID", ""),
		AutoNickChannelID: getEnv("AUTO_NICK_CHANNEL_ID", ""),
		VanityRoleID:      getEnv("VANITY_ROLE_ID", ""),
		VanityString:      getEnv("VANITY_STRING", ""),
		VanityRoleName:    getEnv("VANITY_ROLE_NAME", ""),
		VanityCooldown:    getEnvAsInt("VANITY_COOLDOWN", 0),
		VanityEnabled:     getEnvAsBool("VANITY_AUTO_ENABLED", false),
	}

	if Cfg.BotToken == "" {
		return fmt.Errorf("BOT_TOKEN is required")
	}

	if Cfg.GuildID == "" {
		return fmt.Errorf("GUILD_ID is required")
	}

	return nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := os.Getenv(key)
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := os.Getenv(key)
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.ParseBool(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}
