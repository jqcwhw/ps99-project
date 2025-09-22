import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAccountSchema, insertInstanceSchema, insertActivityLogSchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { UWPInstanceManager } from "./uwp-instance-manager";
import { AccountSyncManager } from "./account-sync-manager";
import { robloxProcessDetector } from "./roblox-process-detector";
import { RealProcessLauncher } from "./real-process-launcher";

// Initialize managers
const uwpManager = new UWPInstanceManager();
const syncManager = new AccountSyncManager();
const realLauncher = new RealProcessLauncher();

// Initialize UWP manager on startup
uwpManager.initialize().catch(console.error);

// Start process detection
robloxProcessDetector.startMonitoring({
  includePlayer: true,
  includeStudio: true,
  includeUWP: true,
  detectUsernames: true,
  monitorResources: true
}).catch(console.error);

export async function registerRoutes(app: Express): Promise<Server> {
  // Account routes
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      const accountsWithInstances = await Promise.all(
        accounts.map(async (account) => {
          const instances = await storage.getInstancesByAccount(account.id);
          return { ...account, instances };
        })
      );
      res.json(accountsWithInstances);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.get("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.getAccountWithInstances(id);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch account" });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid account data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.put("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, updates);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid account data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update account" });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccount(id);
      if (!success) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // Instance routes
  app.get("/api/instances", async (req, res) => {
    try {
      const instances = await storage.getInstancesWithAccounts();
      res.json(instances);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch instances" });
    }
  });

  app.get("/api/instances/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const instance = await storage.getInstance(id);
      if (!instance) {
        return res.status(404).json({ error: "Instance not found" });
      }
      res.json(instance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch instance" });
    }
  });

  app.post("/api/instances", async (req, res) => {
    try {
      const instanceData = insertInstanceSchema.parse(req.body);
      const instance = await storage.createInstance(instanceData);
      
      // Log instance creation
      await storage.createActivityLog({
        instanceId: instance.id,
        level: "info",
        message: `Instance '${instance.name}' created`
      });
      
      res.status(201).json(instance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid instance data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create instance" });
    }
  });

  app.put("/api/instances/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertInstanceSchema.partial().parse(req.body);
      const instance = await storage.updateInstance(id, updates);
      if (!instance) {
        return res.status(404).json({ error: "Instance not found" });
      }
      res.json(instance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid instance data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update instance" });
    }
  });

  app.delete("/api/instances/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInstance(id);
      if (!success) {
        return res.status(404).json({ error: "Instance not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete instance" });
    }
  });

  // Instance control routes
  app.post("/api/instances/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const instance = await storage.getInstance(id);
      if (!instance) {
        return res.status(404).json({ error: "Instance not found" });
      }

      // Update instance status
      await storage.updateInstance(id, { 
        status: "starting", 
        lastStarted: new Date() 
      });

      // Log the action
      await storage.createActivityLog({
        instanceId: id,
        level: "info",
        message: `Starting instance '${instance.name}'`
      });

      // In a real implementation, this would start the Roblox process
      // For now, we'll simulate it by setting status to running after a delay
      setTimeout(async () => {
        await storage.updateInstance(id, { 
          status: "running", 
          processId: Math.floor(Math.random() * 10000) + 1000 
        });
        await storage.createActivityLog({
          instanceId: id,
          level: "info",
          message: `Instance '${instance.name}' started successfully`
        });
      }, 2000);

      res.json({ message: "Instance start initiated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start instance" });
    }
  });

  app.post("/api/instances/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const instance = await storage.getInstance(id);
      if (!instance) {
        return res.status(404).json({ error: "Instance not found" });
      }

      // Update instance status
      await storage.updateInstance(id, { 
        status: "stopping", 
        processId: null 
      });

      // Log the action
      await storage.createActivityLog({
        instanceId: id,
        level: "info",
        message: `Stopping instance '${instance.name}'`
      });

      // Simulate stopping process
      setTimeout(async () => {
        await storage.updateInstance(id, { status: "stopped" });
        await storage.createActivityLog({
          instanceId: id,
          level: "info",
          message: `Instance '${instance.name}' stopped`
        });
      }, 1000);

      res.json({ message: "Instance stop initiated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to stop instance" });
    }
  });

  app.post("/api/instances/:id/restart", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const instance = await storage.getInstance(id);
      if (!instance) {
        return res.status(404).json({ error: "Instance not found" });
      }

      // Update instance status
      await storage.updateInstance(id, { status: "stopping" });

      // Log the action
      await storage.createActivityLog({
        instanceId: id,
        level: "info",
        message: `Restarting instance '${instance.name}'`
      });

      // Simulate restart process
      setTimeout(async () => {
        await storage.updateInstance(id, { 
          status: "running", 
          processId: Math.floor(Math.random() * 10000) + 1000,
          lastStarted: new Date()
        });
        await storage.createActivityLog({
          instanceId: id,
          level: "info",
          message: `Instance '${instance.name}' restarted successfully`
        });
      }, 3000);

      res.json({ message: "Instance restart initiated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to restart instance" });
    }
  });

  // Activity log routes
  app.get("/api/logs", async (req, res) => {
    try {
      const instanceId = req.query.instanceId ? parseInt(req.query.instanceId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getActivityLogs(instanceId, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  app.delete("/api/logs", async (req, res) => {
    try {
      const instanceId = req.query.instanceId ? parseInt(req.query.instanceId as string) : undefined;
      await storage.clearActivityLogs(instanceId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear activity logs" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const key = req.params.key;
      const { value } = req.body;
      if (!value) {
        return res.status(400).json({ error: "Value is required" });
      }
      const setting = await storage.setSetting({ key, value });
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  // UWP Instance Management Routes
  app.get("/api/uwp-instances", async (req, res) => {
    try {
      const instances = uwpManager.getInstances();
      res.json(instances);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch UWP instances" });
    }
  });

  app.post("/api/uwp-instances", async (req, res) => {
    try {
      const { name, accountId } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Instance name is required" });
      }
      
      const instance = await uwpManager.createInstance(name, accountId);
      res.status(201).json(instance);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create UWP instance" });
    }
  });

  app.post("/api/uwp-instances/:id/launch", async (req, res) => {
    try {
      const { id } = req.params;
      const { gameId } = req.body;
      
      await uwpManager.launchInstance(id, gameId);
      res.json({ message: "Instance launched successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to launch instance" });
    }
  });

  app.post("/api/uwp-instances/:id/close", async (req, res) => {
    try {
      const { id } = req.params;
      await uwpManager.closeInstance(id);
      res.json({ message: "Instance closed successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to close instance" });
    }
  });

  app.delete("/api/uwp-instances/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await uwpManager.removeInstance(id);
      res.json({ message: "Instance removed successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to remove instance" });
    }
  });

  app.post("/api/uwp-instances/organize", async (req, res) => {
    try {
      await uwpManager.organizeWindows();
      res.json({ message: "Windows organized successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to organize windows" });
    }
  });

  // Roblox Process Detection Routes
  app.get("/api/roblox/processes", async (req, res) => {
    try {
      const processes = robloxProcessDetector.getDetectedProcesses();
      res.json(processes);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get processes" });
    }
  });

  app.get("/api/roblox/processes/stats", async (req, res) => {
    try {
      const stats = robloxProcessDetector.getStatistics();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get process statistics" });
    }
  });

  app.post("/api/roblox/processes/:pid/link", async (req, res) => {
    try {
      const pid = parseInt(req.params.pid);
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: "Username is required" });
      }

      const success = await robloxProcessDetector.linkProcessToUsername(pid, username);
      if (success) {
        res.json({ message: "Process linked successfully" });
      } else {
        res.status(404).json({ error: "Process not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to link process" });
    }
  });

  // Proven Multi-Instance Routes
  app.get("/api/roblox/proven-processes", async (req, res) => {
    try {
      const { provenMultiInstanceManager } = await import('./proven-multi-instance-manager');
      const processes = provenMultiInstanceManager.getAllClients();
      res.json(processes);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get proven processes" });
    }
  });

  app.post("/api/roblox/enable-multi-instance", async (req, res) => {
    try {
      const { provenMultiInstanceManager } = await import('./proven-multi-instance-manager');
      const success = await provenMultiInstanceManager.enableMultiInstance();
      res.json({ success, message: success ? "Multi-instance enabled" : "Failed to enable multi-instance" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to enable multi-instance" });
    }
  });

  app.post("/api/roblox/start-proven-monitoring", async (req, res) => {
    try {
      const { provenMultiInstanceManager } = await import('./proven-multi-instance-manager');
      await provenMultiInstanceManager.startMonitoring();
      res.json({ message: "Proven monitoring started" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to start proven monitoring" });
    }
  });

  app.post("/api/roblox/create-uwp-instance", async (req, res) => {
    try {
      const { customName } = req.body;
      if (!customName) {
        return res.status(400).json({ error: "Custom name is required" });
      }

      const { provenMultiInstanceManager } = await import('./proven-multi-instance-manager');
      const success = await provenMultiInstanceManager.createUWPInstance(customName);
      res.json({ success, message: success ? "UWP instance created" : "Failed to create UWP instance" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to create UWP instance" });
    }
  });

  app.delete("/api/roblox/processes/:pid", async (req, res) => {
    try {
      const pid = parseInt(req.params.pid);
      const success = await robloxProcessDetector.killProcess(pid);
      
      if (success) {
        res.json({ message: "Process terminated successfully" });
      } else {
        res.status(404).json({ error: "Process not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to terminate process" });
    }
  });

  // Real Process Launcher Routes
  app.get("/api/roblox/real-processes", async (req, res) => {
    try {
      const processes = realLauncher.getRunningProcesses();
      res.json(processes);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get real processes" });
    }
  });

  app.post("/api/roblox/launch-real-instance", async (req, res) => {
    try {
      const { instanceId, accountId, gameUrl, authCookie, windowPosition, resourceLimits, launchMethod } = req.body;
      
      if (!instanceId || !accountId) {
        return res.status(400).json({ error: "Instance ID and Account ID are required" });
      }

      const options = {
        instanceId,
        accountId,
        gameUrl,
        authCookie,
        windowPosition,
        resourceLimits,
        launchMethod
      };

      const process = await realLauncher.launchInstance(options);
      res.json(process);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to launch real instance" });
    }
  });

  app.post("/api/roblox/real-instances/:instanceId/stop", async (req, res) => {
    try {
      const { instanceId } = req.params;
      const success = await realLauncher.stopInstance(instanceId);
      
      if (success) {
        res.json({ message: "Real instance stopped successfully" });
      } else {
        res.status(404).json({ error: "Real instance not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to stop real instance" });
    }
  });

  app.get("/api/roblox/processes/username/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const processes = robloxProcessDetector.getProcessesByUsername(username);
      res.json(processes);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to get processes for username" });
    }
  });

  // Account Sync Management Routes
  app.get("/api/sync-sessions", async (req, res) => {
    try {
      const sessions = syncManager.getActiveSyncSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sync sessions" });
    }
  });

  app.post("/api/sync-sessions", async (req, res) => {
    try {
      const { masterInstanceId, slaveInstanceIds, mode = 'mirror', delay = 100 } = req.body;
      
      if (!masterInstanceId || !slaveInstanceIds || !Array.isArray(slaveInstanceIds)) {
        return res.status(400).json({ error: "Master instance ID and slave instance IDs are required" });
      }
      
      const syncId = await syncManager.startSync(masterInstanceId, slaveInstanceIds, mode, delay);
      res.status(201).json({ syncId, message: "Sync session started" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to start sync session" });
    }
  });

  app.delete("/api/sync-sessions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await syncManager.stopSync(id);
      res.json({ message: "Sync session stopped" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to stop sync session" });
    }
  });

  app.post("/api/recording/start", async (req, res) => {
    try {
      const { instanceId } = req.body;
      if (!instanceId) {
        return res.status(400).json({ error: "Instance ID is required" });
      }
      
      await syncManager.startRecording(instanceId);
      res.json({ message: "Recording started" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to start recording" });
    }
  });

  app.post("/api/recording/stop", async (req, res) => {
    try {
      const actions = await syncManager.stopRecording();
      res.json({ actions, message: "Recording stopped" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to stop recording" });
    }
  });

  app.post("/api/recording/playback", async (req, res) => {
    try {
      const { actions, targetInstanceIds } = req.body;
      
      if (!actions || !targetInstanceIds || !Array.isArray(targetInstanceIds)) {
        return res.status(400).json({ error: "Actions and target instance IDs are required" });
      }
      
      await syncManager.playbackActions(actions, targetInstanceIds);
      res.json({ message: "Playback completed" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to playback actions" });
    }
  });

  app.get("/api/recordings", async (req, res) => {
    try {
      const recordings = syncManager.getAvailableRecordings();
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recordings" });
    }
  });

  app.post("/api/recordings/:name/save", async (req, res) => {
    try {
      const { name } = req.params;
      const { actions } = req.body;
      
      if (!actions || !Array.isArray(actions)) {
        return res.status(400).json({ error: "Actions are required" });
      }
      
      await syncManager.saveRecording(actions, name);
      res.json({ message: "Recording saved" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to save recording" });
    }
  });

  app.get("/api/recordings/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const actions = await syncManager.loadRecording(name);
      res.json(actions);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to load recording" });
    }
  });

  // Enhanced Roblox Multi-Instance API Routes  
  app.get('/api/roblox/mutex-status', async (req, res) => {
    try {
      const { robloxMutexManager } = await import('./roblox-mutex-manager');
      const status = robloxMutexManager.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get mutex status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/roblox/mutex/create', async (req, res) => {
    try {
      const { robloxMutexManager } = await import('./roblox-mutex-manager');
      const result = await robloxMutexManager.createMutexPowerShell();
      res.json(result);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to create mutex',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get('/api/roblox/enhanced-processes', async (req, res) => {
    try {
      const { enhancedProcessManager } = await import('./enhanced-process-manager');
      const processes = enhancedProcessManager.getRunningProcesses();
      res.json(processes);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to get enhanced processes',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/roblox/enhanced-processes/launch', async (req, res) => {
    try {
      const { enhancedProcessManager } = await import('./enhanced-process-manager');
      const { instanceId, accountId, roblosecurityToken, gameUrl, windowPosition, resourceLimits } = req.body;
      
      if (!instanceId) {
        return res.status(400).json({ error: 'Instance ID is required' });
      }

      const process = await enhancedProcessManager.launchInstance({
        instanceId,
        accountId,
        roblosecurityToken,
        gameUrl,
        windowPosition,
        resourceLimits
      });
      
      res.json(process);
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to launch enhanced process',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
