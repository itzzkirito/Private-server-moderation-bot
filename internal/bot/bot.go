package bot

import (
	"discord-mod-bot/internal/config"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/bwmarrin/discordgo"
)

type Bot struct {
	Session           *discordgo.Session
	vanityCooldowns   map[string]time.Time
	vanityCooldownMux sync.RWMutex
	startupChecked    bool
}

func New() (*Bot, error) {
	session, err := discordgo.New("Bot " + config.Cfg.BotToken)
	if err != nil {
		return nil, fmt.Errorf("error creating Discord session: %w", err)
	}

	session.Identify.Intents = discordgo.IntentsGuilds | discordgo.IntentsGuildMembers | discordgo.IntentsGuildMessages | discordgo.IntentsGuildPresences | discordgo.IntentsMessageContent

	bot := &Bot{
		Session:         session,
		vanityCooldowns: make(map[string]time.Time),
		startupChecked:  false,
	}

	return bot, nil
}

func (b *Bot) Start() error {
	// Register handlers
	b.Session.AddHandler(b.onReady)
	b.Session.AddHandler(b.onMessageCreate)
	b.Session.AddHandler(b.onPresenceUpdate)

	// Open connection
	if err := b.Session.Open(); err != nil {
		return fmt.Errorf("error opening connection: %w", err)
	}

	log.Println("Bot is now running. Press CTRL-C to exit.")
	return nil
}

func (b *Bot) Stop() error {
	return b.Session.Close()
}

func (b *Bot) onReady(s *discordgo.Session, event *discordgo.Ready) {
	if s.State != nil && s.State.User != nil {
		log.Printf("Logged in as: %v#%v", s.State.User.Username, s.State.User.Discriminator)
	} else {
		log.Println("Logged in (user info not available)")
	}

	// Log configuration for debugging
	log.Printf("Bot Configuration:")
	log.Printf("  - Prefix: '%s'", config.Cfg.Prefix)
	log.Printf("  - Guild ID: %s", config.Cfg.GuildID)
	log.Printf("  - Admin Role ID: %s", config.Cfg.AdminRoleID)
	log.Printf("  - Mod Role ID: %s", config.Cfg.ModRoleID)
	log.Printf("  - Staff Role ID: %s", config.Cfg.StaffRoleID)
	log.Printf("  - Message Content Intent: Enabled")
	log.Printf("Use '%s' as prefix for commands (e.g., %sban @user)", config.Cfg.Prefix, config.Cfg.Prefix)

	// Check all members for vanity status on startup
	if config.Cfg.VanityEnabled && !b.startupChecked {
		b.startupChecked = true
		log.Println("Vanity: Auto-assignment enabled, starting member check...")
		// Wait a bit for the guild to be fully loaded
		go func() {
			time.Sleep(3 * time.Second)
			b.checkAllMembersForVanity(s)
		}()
	} else if !config.Cfg.VanityEnabled {
		log.Println("Vanity: Auto-assignment is disabled")
	}
}

func (b *Bot) onMessageCreate(s *discordgo.Session, m *discordgo.MessageCreate) {
	// Validate message and author
	if m == nil || m.Message == nil || m.Author == nil {
		return
	}

	// Ignore messages from bots
	if m.Author.Bot {
		return
	}

	// Check if message is in auto-nick channel and handle auto-nickname
	if config.Cfg.AutoNickChannelID != "" && m.ChannelID == config.Cfg.AutoNickChannelID {
		b.handleAutoNickname(s, m)
		// Don't process as command in auto-nick channel
		return
	}

	// Check if message has content and starts with prefix
	if m.Content == "" {
		return
	}

	if len(m.Content) < len(config.Cfg.Prefix) {
		return
	}

	// Check prefix match
	messagePrefix := m.Content[:len(config.Cfg.Prefix)]
	if messagePrefix != config.Cfg.Prefix {
		// Log when prefix doesn't match (helpful for debugging)
		if strings.HasPrefix(m.Content, ".") || strings.HasPrefix(m.Content, "!") {
			log.Printf("Prefix mismatch: Message starts with '%s' but bot expects '%s'. Message: '%s'",
				messagePrefix, config.Cfg.Prefix, m.Content)
		}
		return
	}

	// Debug logging for command processing
	log.Printf("Command received: '%s' from user %s (ID: %s) in channel %s (Guild: %s)",
		m.Content, m.Author.Username, m.Author.ID, m.ChannelID, m.GuildID)

	// Handle command
	b.HandleCommand(s, m)
}
