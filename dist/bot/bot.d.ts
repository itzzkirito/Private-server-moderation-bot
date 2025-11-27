import { Client } from 'discord.js';
export declare class Bot {
    private client;
    private vanityCooldowns;
    private startupChecked;
    constructor();
    private setupEventHandlers;
    private onPresenceUpdate;
    start(): Promise<void>;
    stop(): Promise<void>;
    private onReady;
    private onMessageCreate;
    private handleAutoNickname;
    private changeNickname;
    private resetNickname;
    logAction(client: Client, actionType: string, moderatorID: string, targetID: string, reason: string): Promise<void>;
    isOnCooldown(userID: string): boolean;
    updateCooldown(userID: string): void;
    getClient(): Client;
}
//# sourceMappingURL=bot.d.ts.map