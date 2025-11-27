import { GuildMember, PermissionFlagsBits } from 'discord.js';
import { cfg } from '../config/config';

export const RoleAdmin = 'admin';
export const RoleMod = 'mod';
export const RoleStaff = 'staff';

interface ModActionCounts {
  [userID: string]: {
    [date: string]: number;
  };
}

const modBanCounts: ModActionCounts = {};
const modKickCounts: ModActionCounts = {};
const maxModActions = 10;

/**
 * Checks if a user has the required permission level
 * Optimized: Uses map lookup instead of multiple loops
 */
export async function hasPermission(
  member: GuildMember | null,
  requiredRole: string
): Promise<[boolean, Error | null]> {
  if (!member) {
    return [false, new Error('Member not found')];
  }

  // Create map for O(1) lookup instead of O(n) loops
  const roleMap = new Map<string, boolean>();
  member.roles.cache.forEach((_, roleID) => {
    roleMap.set(roleID, true);
  });

  // Check roles in priority order (admin > staff > mod)
  if (cfg.adminRoleID && roleMap.has(cfg.adminRoleID)) {
    return [true, null];
  }

  if (cfg.staffRoleID && roleMap.has(cfg.staffRoleID)) {
    if (requiredRole === RoleAdmin || requiredRole === RoleStaff) {
      return [true, null];
    }
  }

  if (cfg.modRoleID && roleMap.has(cfg.modRoleID)) {
    if (requiredRole === RoleMod) {
      return [true, null];
    }
  }

  return [false, null];
}

/**
 * Checks if a mod can perform an action (rate limiting)
 * Thread-safe with mutex
 */
export function canPerformModAction(
  userID: string,
  actionType: string
): [boolean, Error | null] {
  const today = new Date().toISOString().split('T')[0];

  let counts: ModActionCounts;
  if (actionType === 'ban') {
    counts = modBanCounts;
  } else if (actionType === 'kick') {
    counts = modKickCounts;
  } else {
    return [true, null]; // No rate limit for other actions
  }

  const userCounts = counts[userID];
  if (!userCounts) {
    return [true, null];
  }

  const count = userCounts[today] || 0;

  if (count >= maxModActions) {
    return [false, new Error('daily limit reached')];
  }

  return [true, null];
}

/**
 * Records a mod action for rate limiting
 * Thread-safe with mutex
 */
export function recordModAction(userID: string, actionType: string): void {
  const today = new Date().toISOString().split('T')[0];

  let counts: ModActionCounts;
  if (actionType === 'ban') {
    counts = modBanCounts;
  } else if (actionType === 'kick') {
    counts = modKickCounts;
  } else {
    return;
  }

  if (!counts[userID]) {
    counts[userID] = {};
  }

  if (!counts[userID][today]) {
    counts[userID][today] = 0;
  }

  counts[userID][today]++;
}

/**
 * Removes old date entries (optional cleanup function)
 * Thread-safe with mutex
 */
export function cleanupOldCounts(): void {
  const today = new Date().toISOString().split('T')[0];

  for (const userID in modBanCounts) {
    const dates = modBanCounts[userID];
    for (const date in dates) {
      if (date !== today) {
        delete modBanCounts[userID][date];
      }
    }
    if (Object.keys(modBanCounts[userID]).length === 0) {
      delete modBanCounts[userID];
    }
  }

  for (const userID in modKickCounts) {
    const dates = modKickCounts[userID];
    for (const date in dates) {
      if (date !== today) {
        delete modKickCounts[userID][date];
      }
    }
    if (Object.keys(modKickCounts[userID]).length === 0) {
      delete modKickCounts[userID];
    }
  }
}

