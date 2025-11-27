"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cfg = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class ConfigManager {
    config;
    constructor() {
        this.config = {
            botToken: this.getEnv('BOT_TOKEN', ''),
            guildID: this.getEnv('GUILD_ID', ''),
            adminRoleID: this.getEnv('ADMIN_ROLE_ID', ''),
            modRoleID: this.getEnv('MOD_ROLE_ID', ''),
            staffRoleID: this.getEnv('STAFF_ROLE_ID', ''),
            prefix: this.getEnv('PREFIX', '!'),
            muteRoleID: this.getEnv('MUTE_ROLE_ID', ''),
            logChannelID: this.getEnv('DISCORD_LOG_CHANNEL_ID', ''),
            autoNickChannelID: this.getEnv('AUTO_NICK_CHANNEL_ID', ''),
            vanityRoleID: this.getEnv('VANITY_ROLE_ID', ''),
            vanityString: this.getEnv('VANITY_STRING', ''),
            vanityRoleName: this.getEnv('VANITY_ROLE_NAME', ''),
            vanityCooldown: this.getEnvAsInt('VANITY_COOLDOWN', 0),
            vanityEnabled: this.getEnvAsBool('VANITY_AUTO_ENABLED', false),
        };
        this.validate();
    }
    validate() {
        if (!this.config.botToken) {
            throw new Error('BOT_TOKEN is required');
        }
        if (!this.config.guildID) {
            throw new Error('GUILD_ID is required');
        }
    }
    getEnv(key, defaultValue) {
        return process.env[key] || defaultValue;
    }
    getEnvAsInt(key, defaultValue) {
        const value = process.env[key];
        if (!value) {
            return defaultValue;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    getEnvAsBool(key, defaultValue) {
        const value = process.env[key];
        if (!value) {
            return defaultValue;
        }
        return value.toLowerCase() === 'true';
    }
    get() {
        return this.config;
    }
}
exports.cfg = new ConfigManager().get();
//# sourceMappingURL=config.js.map