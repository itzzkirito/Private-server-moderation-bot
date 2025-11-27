package main

import (
	"discord-mod-bot/internal/bot"
	"discord-mod-bot/internal/config"
	"log"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	// Load configuration
	if err := config.Load(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Create bot instance
	discordBot, err := bot.New()
	if err != nil {
		log.Fatalf("Failed to create bot: %v", err)
	}

	// Start bot
	if err := discordBot.Start(); err != nil {
		log.Fatalf("Failed to start bot: %v", err)
	}

	// Wait for interrupt signal
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	<-sc

	// Cleanup
	log.Println("Shutting down bot...")
	if err := discordBot.Stop(); err != nil {
		log.Printf("Error stopping bot: %v", err)
	}
}

