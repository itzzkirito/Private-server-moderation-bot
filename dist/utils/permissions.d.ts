import { GuildMember } from 'discord.js';
export declare const RoleAdmin = "admin";
export declare const RoleMod = "mod";
export declare const RoleStaff = "staff";
/**
 * Checks if a user has the required permission level
 * Optimized: Uses map lookup instead of multiple loops
 */
export declare function hasPermission(member: GuildMember | null, requiredRole: string): Promise<[boolean, Error | null]>;
/**
 * Checks if a mod can perform an action (rate limiting)
 * Thread-safe with mutex
 */
export declare function canPerformModAction(userID: string, actionType: string): [boolean, Error | null];
/**
 * Records a mod action for rate limiting
 * Thread-safe with mutex
 */
export declare function recordModAction(userID: string, actionType: string): void;
/**
 * Removes old date entries (optional cleanup function)
 * Thread-safe with mutex
 */
export declare function cleanupOldCounts(): void;
//# sourceMappingURL=permissions.d.ts.map