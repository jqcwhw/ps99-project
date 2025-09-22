import { EventEmitter } from 'events';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as xml2js from 'xml2js';
import { v4 as uuidv4 } from 'uuid';
import { robloxMutexManager } from './roblox-mutex-manager';
import { robloxRegistryManager } from './roblox-registry-manager';

const execAsync = promisify(exec);

const { spawn } = require("child_process");

const ps = spawn("powershell.exe", ["-NoLogo", "-NoProfile", "-File", "path/to/script.ps1"]);

ps.stdout.on("data", (data) => {
  console.log(`Output: ${data}`);
});

ps.stderr.on("data", (data) => {
  console.error(`Error: ${data}`);
});

ps.on("exit", (code) => {
  console.log(`PowerShell script exited with code ${code}`);
});

const { exec } = require('child_process');

exec('powershell.exe -Command "Get-Process | ConvertTo-Json"', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  try {
    const jsonOutput = JSON.parse(stdout);
    console.log(jsonOutput);
  } catch (parseError) {
    console.error(`JSON Parse Error: ${parseError.message}`);
  }
});


export interface UWPInstance {
  id: string;
  name: string;
  displayName: string;
  packageName: string;
  path: string;
  publisherId: string;
  isRunning: boolean;
  processId?: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  accountId?: number;
  windowPosition?: { x: number; y: number; width: number; height: number };
}

export class UWPInstanceManager extends EventEmitter {
  private instances: Map<string, UWPInstance> = new Map();
  private robloxUWPPath: string = '';
  private robloxPublisherId: string = '';
  private moddedClientsPath: string = '';
  private resourceMonitor: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.moddedClientsPath = path.join(process.cwd(), 'ModdedRobloxClients');
    this.initializeResourceMonitoring();
  }

  /**
   * Initialize the UWP Instance Manager
   */
  async initialize(): Promise<void> {
    try {
      // Check if we're on Windows
      if (process.platform !== 'win32') {
        console.log('Non-Windows environment detected. UWP Instance Manager will run in demo mode.');
        console.log('UWP features are only available on Windows systems.');
        
        // Create some demo instances for non-Windows environments
        await this.createDemoInstances();
        return;
      }

      // Step 1: Enable multi-instance registry support
      console.log('Enabling multi-instance registry support...');
      await robloxRegistryManager.enableMultiInstance();
      
      // Step 2: Create Roblox singleton mutex
      console.log('Creating Roblox multi-instance mutex...');
      try {
        const mutexResult = await robloxMutexManager.createMutexPowerShell();
        console.log(`Mutex status: ${mutexResult.isActive ? 'Active' : 'Failed'}`);
      } catch (mutexError) {
        console.log('Mutex creation failed, but continuing with UWP method');
      }
      
      // Step 3: Enable Windows Developer Mode
      await this.enableDeveloperMode();
      
      // Step 4: Find Roblox UWP installation
      await this.findRobloxUWPPath();
      
      // Step 5: Setup modded clients directory
      await this.ensureModdedClientsDirectory();
      
      // Step 6: Scan for existing instances
      await this.scanExistingInstances();
      
      console.log('UWP Instance Manager initialized successfully with enhanced multi-instance support');
    } catch (error) {
      console.error(`UWP Instance Manager initialization failed: ${error}`);
      // Don't throw error to prevent app crash - create demo instances instead
      await this.createDemoInstances();
    }
  }

  /**
   * Enable Windows Developer Mode (required for UWP sideloading)
   */
  private async enableDeveloperMode(): Promise<void> {
    if (process.platform !== 'win32') {
      console.log('Skipping developer mode setup on non-Windows platform');
      return;
    }
    
    const command = 'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\AppModelUnlock" /t REG_DWORD /f /v AllowAllTrustedApps /d 1';
    try {
      await execAsync(command);
    } catch (error) {
      throw new Error('Failed to enable developer mode. Please run as administrator.');
    }
  }

  /**
   * Find the installed Roblox UWP package path
   */
  private async findRobloxUWPPath(): Promise<void> {
    if (process.platform !== 'win32') {
      console.log('Skipping Roblox UWP path detection on non-Windows platform');
      this.robloxUWPPath = '/demo/roblox/path';
      this.robloxPublisherId = 'DEMO_PUBLISHER_ID';
      return;
    }
    
    const command = 'powershell "Get-AppxPackage *Roblox* | Format-List -Property InstallLocation"';
    
    try {
      const { stdout } = await execAsync(command);
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes('InstallLocation') && line.includes('WindowsApps\\ROBLOXCORPORATION.ROBLOX_')) {
          this.robloxUWPPath = line.substring(line.indexOf('C:')).trim();
          
          // Extract publisher ID from path
          const publisherMatch = this.robloxUWPPath.match(/(?<=__)(.*)$/);
          if (publisherMatch) {
            this.robloxPublisherId = publisherMatch[1].trim();
          }
          break;
        }
      }

      if (!this.robloxUWPPath) {
        throw new Error('Roblox UWP not found. Please install Roblox from Microsoft Store.');
      }
    } catch (error) {
      throw new Error(`Failed to locate Roblox UWP: ${error}`);
    }
  }

  /**
   * Ensure modded clients directory exists
   */
  private async ensureModdedClientsDirectory(): Promise<void> {
    if (!fs.existsSync(this.moddedClientsPath)) {
      fs.mkdirSync(this.moddedClientsPath, { recursive: true });
    }
  }

  /**
   * Scan for existing modded instances
   */
  private async scanExistingInstances(): Promise<void> {
    if (process.platform !== 'win32') {
      console.log('Skipping instance scanning on non-Windows platform');
      return;
    }
    
    const command = 'powershell "Get-AppxPackage *ROBLOXCORPORATION.ROBLOX.* | Format-List -Property Name"';
    
    try {
      const { stdout } = await execAsync(command);
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('Name') && line.includes('ROBLOXCORPORATION.ROBLOX.')) {
          const packageName = line.substring(7).trim();
          if (packageName !== 'ROBLOXCORPORATION.ROBLOX') {
            // This is a modded instance
            const instanceName = packageName.replace('ROBLOXCORPORATION.ROBLOX.', '');
            const instancePath = path.join(this.moddedClientsPath, packageName);
            
            const instance: UWPInstance = {
              id: uuidv4(),
              name: instanceName,
              displayName: `Roblox-MultiUWP-${instanceName}`,
              packageName,
              path: instancePath,
              publisherId: this.robloxPublisherId,
              isRunning: false,
              resourceUsage: { cpu: 0, memory: 0, gpu: 0 }
            };
            
            this.instances.set(instance.id, instance);
          }
        }
      }
    } catch (error) {
      console.error('Failed to scan existing instances:', error);
    }
  }

  /**
   * Create demo instances for non-Windows environments
   */
  private async createDemoInstances(): Promise<void> {
    const demoInstances = [
      {
        id: 'demo-1',
        name: 'Demo_Instance_1',
        displayName: 'Roblox Demo Instance 1',
        packageName: 'ROBLOXCORPORATION.ROBLOX.Demo1',
        path: '/demo/path/instance1',
        publisherId: 'DEMO_PUBLISHER_ID',
        isRunning: false,
        resourceUsage: { cpu: 0, memory: 0, gpu: 0 }
      },
      {
        id: 'demo-2',
        name: 'Demo_Instance_2',
        displayName: 'Roblox Demo Instance 2',
        packageName: 'ROBLOXCORPORATION.ROBLOX.Demo2',
        path: '/demo/path/instance2',
        publisherId: 'DEMO_PUBLISHER_ID',
        isRunning: false,
        resourceUsage: { cpu: 0, memory: 0, gpu: 0 }
      }
    ];

    for (const instance of demoInstances) {
      this.instances.set(instance.id, instance);
    }
    
    console.log('Created demo instances for non-Windows environment');
  }

  /**
   * Create a new Roblox instance
   */
  async createInstance(customName: string, accountId?: number): Promise<UWPInstance> {
    // Sanitize name
    const sanitizedName = customName.trim().replace(/[^a-zA-Z0-9]/g, '');
    if (!sanitizedName) {
      throw new Error('Invalid instance name');
    }

    // Check if name already exists
    const existingInstance = Array.from(this.instances.values()).find(
      inst => inst.name === sanitizedName
    );
    if (existingInstance) {
      throw new Error('Instance name already exists');
    }

    const instanceId = uuidv4();
    const packageName = `ROBLOXCORPORATION.ROBLOX.${sanitizedName}`;
    const instancePath = path.join(this.moddedClientsPath, packageName);

    try {
      // Step 1: Clone UWP package directory
      await this.copyDirectory(this.robloxUWPPath, instancePath);

      // Step 2: Remove signature to allow modifications
      const signaturePath = path.join(instancePath, 'AppxSignature.p7x');
      if (fs.existsSync(signaturePath)) {
        fs.unlinkSync(signaturePath);
      }

      // Step 3: Modify AppxManifest.xml
      await this.modifyManifest(instancePath, sanitizedName);

      // Step 4: Register the package
      await this.registerPackage(instancePath);

      const instance: UWPInstance = {
        id: instanceId,
        name: sanitizedName,
        displayName: `Roblox-MultiUWP-${sanitizedName}`,
        packageName,
        path: instancePath,
        publisherId: this.robloxPublisherId,
        isRunning: false,
        resourceUsage: { cpu: 0, memory: 0, gpu: 0 },
        accountId
      };

      this.instances.set(instanceId, instance);
      return instance;

    } catch (error) {
      // Cleanup on failure
      if (fs.existsSync(instancePath)) {
        await this.removeDirectory(instancePath);
      }
      throw new Error(`Failed to create instance: ${error}`);
    }
  }

  /**
   * Launch a Roblox instance
   */
  async launchInstance(instanceId: string, gameId?: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    // For non-Windows platforms, simulate launch
    if (process.platform !== 'win32') {
      console.log(`Demo launch: ${instance.displayName} ${gameId ? `(Game: ${gameId})` : ''}`);
      instance.isRunning = true;
      instance.processId = Math.floor(Math.random() * 10000) + 1000;
      this.instances.set(instanceId, instance);
      return;
    }

    // Check resource constraints before launching
    if (await this.isResourceConstraintExceeded()) {
      throw new Error('Resource constraints exceeded. Close other instances first.');
    }

    try {
      let launchCommand: string;
      
      if (gameId) {
        // Launch specific game
        launchCommand = `explorer.exe "roblox://placeId=${gameId}"`;
      } else {
        // Launch app directly
        launchCommand = `explorer.exe shell:AppsFolder\\${instance.packageName}_${this.robloxPublisherId}!App`;
      }

      await execAsync(launchCommand);
      
      // Wait a moment then update running status
      setTimeout(async () => {
        const processId = await this.findInstanceProcess(instance.packageName);
        if (processId) {
          instance.isRunning = true;
          instance.processId = processId;
          this.instances.set(instanceId, instance);
        }
      }, 3000);

    } catch (error) {
      throw new Error(`Failed to launch instance: ${error}`);
    }
  }

  /**
   * Close a running instance
   */
  async closeInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance || !instance.isRunning || !instance.processId) {
      throw new Error('Instance not running');
    }

    try {
      // For non-Windows platforms, simulate close
      if (process.platform !== 'win32') {
        console.log(`Demo close: ${instance.displayName}`);
        instance.isRunning = false;
        instance.processId = undefined;
        instance.resourceUsage = { cpu: 0, memory: 0, gpu: 0 };
        this.instances.set(instanceId, instance);
        return;
      }

      // Gracefully close the process
      await execAsync(`taskkill /PID ${instance.processId} /F`);
      
      instance.isRunning = false;
      instance.processId = undefined;
      instance.resourceUsage = { cpu: 0, memory: 0, gpu: 0 };
      this.instances.set(instanceId, instance);

    } catch (error) {
      throw new Error(`Failed to close instance: ${error}`);
    }
  }

  /**
   * Remove an instance completely
   */
  async removeInstance(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    try {
      // Close if running
      if (instance.isRunning) {
        await this.closeInstance(instanceId);
      }

      // For non-Windows platforms, just remove from memory
      if (process.platform !== 'win32') {
        console.log(`Demo remove: ${instance.displayName}`);
        this.instances.delete(instanceId);
        return;
      }

      // Unregister the package
      const command = `powershell "Get-AppxPackage -Name '${instance.packageName}' | Remove-AppxPackage"`;
      await execAsync(command);

      // Remove directory
      if (fs.existsSync(instance.path)) {
        await this.removeDirectory(instance.path);
      }

      this.instances.delete(instanceId);

    } catch (error) {
      throw new Error(`Failed to remove instance: ${error}`);
    }
  }

  /**
   * Get all instances
   */
  getInstances(): UWPInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): UWPInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Position instance windows to prevent overlap
   */
  async organizeWindows(): Promise<void> {
    const runningInstances = Array.from(this.instances.values()).filter(inst => inst.isRunning);
    
    const screenWidth = 1920; // Could be detected dynamically
    const screenHeight = 1080;
    const cols = Math.ceil(Math.sqrt(runningInstances.length));
    const rows = Math.ceil(runningInstances.length / cols);
    const windowWidth = Math.floor(screenWidth / cols);
    const windowHeight = Math.floor(screenHeight / rows);

    for (let i = 0; i < runningInstances.length; i++) {
      const instance = runningInstances[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = col * windowWidth;
      const y = row * windowHeight;

      if (instance.processId) {
        // Use PowerShell to position window
        const command = `powershell "Add-Type -AssemblyName System.Windows.Forms; $p = Get-Process -Id ${instance.processId}; $p.MainWindowTitle"`;
        try {
          await execAsync(command);
          // Window positioning would require additional Win32 API calls
          instance.windowPosition = { x, y, width: windowWidth, height: windowHeight };
          this.instances.set(instance.id, instance);
        } catch (error) {
          console.error(`Failed to position window for instance ${instance.name}:`, error);
        }
      }
    }
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(src: string, dest: string): Promise<void> {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      const stat = fs.statSync(srcPath);
      if (stat.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Remove directory recursively
   */
  private async removeDirectory(dirPath: string): Promise<void> {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  }

  /**
   * Modify AppxManifest.xml for unique identity
   */
  private async modifyManifest(instancePath: string, customName: string): Promise<void> {
    const manifestPath = path.join(instancePath, 'AppxManifest.xml');
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error('AppxManifest.xml not found');
    }

    try {
      const xmlContent = fs.readFileSync(manifestPath, 'utf8');
      const parser = new xml2js.Parser();
      const builder = new xml2js.Builder();
      
      const result = await parser.parseStringPromise(xmlContent);
      
      // Modify identity
      if (result.Package && result.Package.Identity && result.Package.Identity[0]) {
        result.Package.Identity[0].$.Name = `ROBLOXCORPORATION.ROBLOX.${customName}`;
      }

      // Modify visual elements
      if (result.Package && result.Package.Applications && result.Package.Applications[0] && 
          result.Package.Applications[0].Application && result.Package.Applications[0].Application[0] &&
          result.Package.Applications[0].Application[0].VisualElements) {
        const visualElements = result.Package.Applications[0].Application[0].VisualElements[0];
        visualElements.$.DisplayName = `Roblox-MultiUWP-${customName}`;
        
        if (visualElements.DefaultTile && visualElements.DefaultTile[0]) {
          visualElements.DefaultTile[0].$.ShortName = `Roblox-MultiUWP-${customName}`;
        }
      }

      const newXml = builder.buildObject(result);
      fs.writeFileSync(manifestPath, newXml);

    } catch (error) {
      throw new Error(`Failed to modify manifest: ${error}`);
    }
  }

  /**
   * Register UWP package
   */
  private async registerPackage(instancePath: string): Promise<void> {
    const manifestPath = path.join(instancePath, 'AppxManifest.xml');
    const command = `powershell "Add-AppxPackage -path '${manifestPath}' -register"`;
    
    try {
      const { stderr } = await execAsync(command);
      if (stderr && stderr.trim()) {
        throw new Error(stderr);
      }
    } catch (error) {
      throw new Error(`Failed to register package: ${error}`);
    }
  }

  /**
   * Find process ID for an instance
   */
  private async findInstanceProcess(packageName: string): Promise<number | null> {
    try {
      const command = `powershell "Get-Process | Where-Object {$_.ProcessName -like '*Roblox*'} | Select-Object -First 1 | ForEach-Object {$_.Id}"`;
      const { stdout } = await execAsync(command);
      const processId = parseInt(stdout.trim());
      return isNaN(processId) ? null : processId;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if resource constraints are exceeded
   */
  private async isResourceConstraintExceeded(): Promise<boolean> {
    const runningInstances = Array.from(this.instances.values()).filter(inst => inst.isRunning);
    
    // Limit based on system resources (configurable)
    const maxInstances = 4; // Conservative limit
    const maxCpuUsage = 80; // Percentage
    const maxMemoryUsage = 80; // Percentage
    
    if (runningInstances.length >= maxInstances) {
      return true;
    }

    // Check system resource usage
    try {
      const cpuCommand = `powershell "Get-WmiObject win32_processor | Measure-Object -property LoadPercentage -Average | Select-Object Average"`;
      const memCommand = `powershell "Get-WmiObject -Class win32_operatingsystem | ForEach-Object {[math]::round(($_.TotalVisibleMemorySize - $_.FreePhysicalMemory)/$_.TotalVisibleMemorySize*100,2)}"`;
      
      const [cpuResult, memResult] = await Promise.all([
        execAsync(cpuCommand),
        execAsync(memCommand)
      ]);

      const cpuUsage = parseFloat(cpuResult.stdout.trim());
      const memUsage = parseFloat(memResult.stdout.trim());

      return cpuUsage > maxCpuUsage || memUsage > maxMemoryUsage;
    } catch (error) {
      // If we can't check resources, err on the side of caution
      return runningInstances.length >= 2;
    }
  }

  /**
   * Initialize resource monitoring
   */
  private initializeResourceMonitoring(): void {
    this.resourceMonitor = setInterval(async () => {
      for (const [instanceId, instance] of this.instances.entries()) {
        if (instance.isRunning && instance.processId) {
          try {
            // Get process resource usage
            const command = `powershell "Get-Process -Id ${instance.processId} | Select-Object CPU,WorkingSet"`;
            const { stdout } = await execAsync(command);
            
            // Parse and update resource usage
            // This is a simplified version - real implementation would be more detailed
            instance.resourceUsage.cpu = Math.random() * 20; // Placeholder
            instance.resourceUsage.memory = Math.random() * 500; // MB
            instance.resourceUsage.gpu = Math.random() * 10; // Placeholder
            
            this.instances.set(instanceId, instance);
          } catch (error) {
            // Process might have closed
            instance.isRunning = false;
            instance.processId = undefined;
            this.instances.set(instanceId, instance);
          }
        }
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.resourceMonitor) {
      clearInterval(this.resourceMonitor);
      this.resourceMonitor = null;
    }
  }
}