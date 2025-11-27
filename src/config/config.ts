import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  botToken: string;
  guildID: string;
  adminRoleID: string;
  modRoleID: string;
  staffRoleID: string;
  prefix: string;
  muteRoleID: string;
  logChannelID: string;
  autoNickChannelID: string;
  vanityRoleID: string;
  vanityString: string;
  vanityRoleName: string;
  vanityCooldown: number;
  vanityEnabled: boolean;
}

class ConfigManager {
  private config: Config;

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

  private validate(): void {
    if (!this.config.botToken) {
      throw new Error('BOT_TOKEN is required');
    }

    if (!this.config.guildID) {
      throw new Error('GUILD_ID is required');
    }
  }

  private getEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  private getEnvAsInt(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private getEnvAsBool(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true';
  }

  get(): Config {
    return this.config;
  }
}

export const cfg = new ConfigManager().get();

