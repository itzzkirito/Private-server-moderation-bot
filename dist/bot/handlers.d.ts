import { Client, Presence } from 'discord.js';
import { Bot } from './bot';
/**
 * Handles presence updates for vanity role auto-assignment
 */
export declare function handlePresenceUpdate(presence: Presence | null, bot: Bot): Promise<void>;
/**
 * Checks all members on startup
 */
export declare function checkAllMembersForVanity(client: Client, bot: Bot): Promise<void>;
//# sourceMappingURL=handlers.d.ts.map