import { 
  accounts, 
  instances, 
  activityLogs, 
  settings,
  type Account, 
  type InsertAccount,
  type Instance,
  type InsertInstance,
  type ActivityLog,
  type InsertActivityLog,
  type Settings,
  type InsertSettings,
  type InstanceWithAccount,
  type AccountWithInstances
} from "@shared/schema";

export interface IStorage {
  // Account operations
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  getAccountByUsername(username: string): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  getAccountWithInstances(id: number): Promise<AccountWithInstances | undefined>;

  // Instance operations
  getInstances(): Promise<Instance[]>;
  getInstance(id: number): Promise<Instance | undefined>;
  getInstancesWithAccounts(): Promise<InstanceWithAccount[]>;
  createInstance(instance: InsertInstance): Promise<Instance>;
  updateInstance(id: number, updates: Partial<InsertInstance>): Promise<Instance | undefined>;
  deleteInstance(id: number): Promise<boolean>;
  getInstancesByAccount(accountId: number): Promise<Instance[]>;
  getInstancesByStatus(status: string): Promise<Instance[]>;

  // Activity log operations
  getActivityLogs(instanceId?: number, limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  clearActivityLogs(instanceId?: number): Promise<boolean>;

  // Settings operations
  getSettings(): Promise<Settings[]>;
  getSetting(key: string): Promise<Settings | undefined>;
  setSetting(setting: InsertSettings): Promise<Settings>;
  deleteSetting(key: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private accounts: Map<number, Account> = new Map();
  private instances: Map<number, Instance> = new Map();
  private activityLogs: Map<number, ActivityLog> = new Map();
  private settings: Map<string, Settings> = new Map();
  
  private currentAccountId = 1;
  private currentInstanceId = 1;
  private currentLogId = 1;
  private currentSettingsId = 1;

  constructor() {
    // Initialize with some default settings
    this.setSetting({ key: "roblox_path", value: "" });
    this.setSetting({ key: "max_instances", value: "5" });
    this.setSetting({ key: "auto_restart", value: "true" });
  }

  // Account operations
  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async getAccountByUsername(username: string): Promise<Account | undefined> {
    return Array.from(this.accounts.values()).find(account => account.username === username);
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const account: Account = {
      ...insertAccount,
      id: this.currentAccountId++,
      createdAt: new Date(),
      roblosecurityToken: insertAccount.roblosecurityToken ?? null,
      isActive: insertAccount.isActive ?? true,
    };
    this.accounts.set(account.id, account);
    return account;
  }

  async updateAccount(id: number, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;

    const updatedAccount: Account = { ...account, ...updates };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }

  async getAccountWithInstances(id: number): Promise<AccountWithInstances | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;

    const accountInstances = await this.getInstancesByAccount(id);
    return { ...account, instances: accountInstances };
  }

  // Instance operations
  async getInstances(): Promise<Instance[]> {
    return Array.from(this.instances.values());
  }

  async getInstance(id: number): Promise<Instance | undefined> {
    return this.instances.get(id);
  }

  async getInstancesWithAccounts(): Promise<InstanceWithAccount[]> {
    const instances = Array.from(this.instances.values());
    return instances.map(instance => ({
      ...instance,
      account: instance.accountId ? this.accounts.get(instance.accountId) || null : null
    }));
  }

  async createInstance(insertInstance: InsertInstance): Promise<Instance> {
    const instance: Instance = {
      ...insertInstance,
      id: this.currentInstanceId++,
      createdAt: new Date(),
      lastStarted: null,
      status: insertInstance.status ?? 'stopped',
      accountId: insertInstance.accountId ?? null,
      processId: insertInstance.processId ?? null,
      port: insertInstance.port ?? null,
      gameId: insertInstance.gameId ?? null,
      config: insertInstance.config ?? null,
    };
    this.instances.set(instance.id, instance);
    return instance;
  }

  async updateInstance(id: number, updates: Partial<InsertInstance>): Promise<Instance | undefined> {
    const instance = this.instances.get(id);
    if (!instance) return undefined;

    const updatedInstance: Instance = { ...instance, ...updates };
    this.instances.set(id, updatedInstance);
    return updatedInstance;
  }

  async deleteInstance(id: number): Promise<boolean> {
    return this.instances.delete(id);
  }

  async getInstancesByAccount(accountId: number): Promise<Instance[]> {
    return Array.from(this.instances.values()).filter(instance => instance.accountId === accountId);
  }

  async getInstancesByStatus(status: string): Promise<Instance[]> {
    return Array.from(this.instances.values()).filter(instance => instance.status === status);
  }

  // Activity log operations
  async getActivityLogs(instanceId?: number, limit = 100): Promise<ActivityLog[]> {
    let logs = Array.from(this.activityLogs.values());
    
    if (instanceId !== undefined) {
      logs = logs.filter(log => log.instanceId === instanceId);
    }
    
    return logs
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const log: ActivityLog = {
      ...insertLog,
      id: this.currentLogId++,
      timestamp: new Date(),
      instanceId: insertLog.instanceId ?? null,
    };
    this.activityLogs.set(log.id, log);
    return log;
  }

  async clearActivityLogs(instanceId?: number): Promise<boolean> {
    if (instanceId !== undefined) {
      const logsToDelete = Array.from(this.activityLogs.entries())
        .filter(([_, log]) => log.instanceId === instanceId)
        .map(([id, _]) => id);
      
      logsToDelete.forEach(id => this.activityLogs.delete(id));
      return true;
    } else {
      this.activityLogs.clear();
      return true;
    }
  }

  // Settings operations
  async getSettings(): Promise<Settings[]> {
    return Array.from(this.settings.values());
  }

  async getSetting(key: string): Promise<Settings | undefined> {
    return this.settings.get(key);
  }

  async setSetting(insertSetting: InsertSettings): Promise<Settings> {
    const existing = this.settings.get(insertSetting.key);
    const setting: Settings = {
      id: existing?.id || this.currentSettingsId++,
      key: insertSetting.key,
      value: insertSetting.value,
      updatedAt: new Date(),
    };
    this.settings.set(setting.key, setting);
    return setting;
  }

  async deleteSetting(key: string): Promise<boolean> {
    return this.settings.delete(key);
  }
}

export const storage = new MemStorage();
