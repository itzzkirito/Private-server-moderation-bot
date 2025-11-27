"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("./bot");
async function main() {
    try {
        // Load configuration is done automatically via config.ts
        console.log('Loading configuration...');
        // Create bot instance
        const discordBot = new bot_1.Bot();
        // Start bot
        await discordBot.start();
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\nShutting down bot...');
            await discordBot.stop();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            console.log('\nShutting down bot...');
            await discordBot.stop();
            process.exit(0);
        });
    }
    catch (error) {
        console.error(`Failed to start bot: ${error}`);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map