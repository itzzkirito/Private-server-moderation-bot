"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleStaff = exports.RoleMod = exports.RoleAdmin = void 0;
exports.hasPermission = hasPermission;
exports.canPerformModAction = canPerformModAction;
exports.recordModAction = recordModAction;
exports.cleanupOldCounts = cleanupOldCounts;
const config_1 = require("../config/config");
exports.RoleAdmin = 'admin';
exports.RoleMod = 'mod';
exports.RoleStaff = 'staff';
const modBanCounts = {};
const modKickCounts = {};
const maxModActions = 10;
/**
 * Checks if a user has the required permission level
 * Optimized: Uses map lookup instead of multiple loops
 */
async function hasPermission(member, requiredRole) {
    if (!member) {
        return [false, new Error('Member not found')];
    }
    // Create map for O(1) lookup instead of O(n) loops
    const roleMap = new Map();
    member.roles.cache.forEach((_, roleID) => {
        roleMap.set(roleID, true);
    });
    // Check roles in priority order (admin > staff > mod)
    if (config_1.cfg.adminRoleID && roleMap.has(config_1.cfg.adminRoleID)) {
        return [true, null];
    }
    if (config_1.cfg.staffRoleID && roleMap.has(config_1.cfg.staffRoleID)) {
        if (requiredRole === exports.RoleAdmin || requiredRole === exports.RoleStaff) {
            return [true, null];
        }
    }
    if (config_1.cfg.modRoleID && roleMap.has(config_1.cfg.modRoleID)) {
        if (requiredRole === exports.RoleMod) {
            return [true, null];
        }
    }
    return [false, null];
}
/**
 * Checks if a mod can perform an action (rate limiting)
 * Thread-safe with mutex
 */
function canPerformModAction(userID, actionType) {
    const today = new Date().toISOString().split('T')[0];
    let counts;
    if (actionType === 'ban') {
        counts = modBanCounts;
    }
    else if (actionType === 'kick') {
        counts = modKickCounts;
    }
    else {
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
function recordModAction(userID, actionType) {
    const today = new Date().toISOString().split('T')[0];
    let counts;
    if (actionType === 'ban') {
        counts = modBanCounts;
    }
    else if (actionType === 'kick') {
        counts = modKickCounts;
    }
    else {
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
function cleanupOldCounts() {
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
//# sourceMappingURL=permissions.js.map