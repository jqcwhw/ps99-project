/**
 * Process Manager - Handles Roblox process management like AHK script
 * Mimics the CLIENT_ARRAY and CLIENT_MAP functionality from AutoHotkey
 */

import { EventEmitter } from 'events';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface RobloxClient {
  pid: number;
  windowHandle: string;
  windowClass: string;
  processName: string;
  windowTitle: string;
  username?: string;
  accountName?: string;
  isActive: boolean;
  resourceUsage: {
    cpu: number;
    memory: number;
    threads: number;
  };
  windowGeometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  startTime: Date;
  lastActive: Date;
  config?: {
    flagKeybind?: string;
    sprinklerKeybind?: string;
    eventKeybind?: string;
    supercomputerKeybind?: string;
    chargedEggs?: number;
    goldenEggs?: number;
    daycareSlots?: number;
    daycareUse?: boolean;
    hatchEggs?: boolean;
  };
}

export class ProcessManager extends EventEmitter {
  private clientArray: RobloxClient[] = [];
  private clientMap: Map<string, RobloxClient> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private configPath: string;

  constructor() {
    super();
    this.configPath = path.join(process.cwd(), 'instance-configs');
    this.ensureConfigDirectory();
  }

  private ensureConfigDirectory(): void {
    if (!fs.existsSync(this.configPath)) {
      fs.mkdirSync(this.configPath, { recursive: true });
    }
  }

  /**
   * Get all Roblox clients - equivalent to AHK getRobloxClients()
   */
  async getRobloxClients(): Promise<RobloxClient[]> {
    if (process.platform !== 'win32') {
      return this.createDemoClients();
    }

    try {
      // PowerShell script to get all Roblox windows with details
      const script = `
        $clients = @()
        $processes = Get-Process -Name "RobloxPlayerBeta" -ErrorAction SilentlyContinue
        
        foreach ($process in $processes) {
          if ($process.MainWindowHandle -ne 0) {
            $handle = $process.MainWindowHandle.ToString()
            $title = $process.MainWindowTitle
            $pid = $process.Id
            $memory = [Math]::Round($process.WorkingSet64 / 1MB, 0)
            $threads = $process.Threads.Count
            
            # Try to get window position
            $x = 0; $y = 0; $width = 800; $height = 600
            
            $client = @{
              pid = $pid
              windowHandle = $handle
              windowClass = "WINDOWSCLIENT"
              processName = "RobloxPlayerBeta.exe"
              windowTitle = $title
              isActive = $true
              memory = $memory
              threads = $threads
              startTime = $process.StartTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
              x = $x
              y = $y
              width = $width
              height = $height
            }
            
            $clients += $client
          }
        }
        
        $clients | ConvertTo-Json
      `;

      const { stdout } = await execAsync(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
      
      if (!stdout.trim()) {
        return [];
      }

      const data = JSON.parse(stdout);
      const clients = Array.isArray(data) ? data : [data];
      
      return clients.map(client => ({
        pid: client.pid,
        windowHandle: client.windowHandle,
        windowClass: client.windowClass,
        processName: client.processName,
        windowTitle: client.windowTitle || '',
        isActive: client.isActive,
        resourceUsage: {
          cpu: 0,
          memory: client.memory || 0,
          threads: client.threads || 0
        },
        windowGeometry: {
          x: client.x || 0,
          y: client.y || 0,
          width: client.width || 800,
          height: client.height || 600
        },
        startTime: new Date(client.startTime || Date.now()),
        lastActive: new Date()
      }));

    } catch (error) {
      console.error('Error getting Roblox clients:', error);
      return [];
    }
  }

  /**
   * Initialize clients - equivalent to AHK client initialization
   */
  async initializeClients(): Promise<void> {
    this.clientArray = await this.getRobloxClients();
    this.clientMap.clear();

    for (let i = 0; i < this.clientArray.length; i++) {
      const client = this.clientArray[i];
      
      // Load configuration from temp file (like AHK loadConfigFromTemp)
      const accountName = await this.loadConfigFromTemp(client.windowHandle, i + 1);
      
      if (accountName) {
        client.accountName = accountName;
        client.username = accountName;
        
        // Set window title with account name (like AHK WinSetTitle)
        await this.setWindowTitle(client.windowHandle, `Roblox (${accountName})`);
      }

      this.clientMap.set(client.windowHandle, client);
      this.emit('clientInitialized', client);
    }

    console.log(`Initialized ${this.clientArray.length} Roblox clients`);
  }

  /**
   * Load configuration from temp file - equivalent to AHK loadConfigFromTemp
   */
  private async loadConfigFromTemp(windowHandle: string, listIndex: number): Promise<string | null> {
    const configFile = path.join(this.configPath, `${windowHandle}.json`);
    
    if (!fs.existsSync(configFile)) {
      return null;
    }

    try {
      const configData = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      return configData.accountName || configData.username || null;
    } catch (error) {
      console.error('Error loading config from temp:', error);
      return null;
    }
  }

  /**
   * Save configuration to temp file - equivalent to AHK saveAccountSettingsToFile
   */
  async saveConfigToTemp(windowHandle: string, config: any): Promise<void> {
    const configFile = path.join(this.configPath, `${windowHandle}.json`);
    
    try {
      fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving config to temp:', error);
    }
  }

  /**
   * Set window title - equivalent to AHK WinSetTitle
   */
  private async setWindowTitle(windowHandle: string, title: string): Promise<void> {
    if (process.platform !== 'win32') {
      return;
    }

    try {
      const script = `
        Add-Type -TypeDefinition @"
          using System;
          using System.Runtime.InteropServices;
          
          public class Win32 {
            [DllImport("user32.dll", CharSet = CharSet.Auto)]
            public static extern bool SetWindowText(IntPtr hWnd, string lpString);
          }
"@
        
        $handle = [IntPtr]${windowHandle}
        [Win32]::SetWindowText($handle, "${title}")
      `;

      await execAsync(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
    } catch (error) {
      console.error('Error setting window title:', error);
    }
  }

  /**
   * Activate window - equivalent to AHK activateWindow
   */
  async activateWindow(windowHandle: string): Promise<void> {
    if (process.platform !== 'win32') {
      return;
    }

    try {
      const script = `
        Add-Type -TypeDefinition @"
          using System;
          using System.Runtime.InteropServices;
          
          public class Win32 {
            [DllImport("user32.dll")]
            public static extern bool SetForegroundWindow(IntPtr hWnd);
            
            [DllImport("user32.dll")]
            public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
          }
"@
        
        $handle = [IntPtr]${windowHandle}
        [Win32]::ShowWindow($handle, 9)  # SW_RESTORE
        [Win32]::SetForegroundWindow($handle)
      `;

      await execAsync(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
    } catch (error) {
      console.error('Error activating window:', error);
    }
  }

  /**
   * Resize window - equivalent to AHK resizeWindow
   */
  async resizeWindow(windowHandle: string, width: number = 800, height: number = 600): Promise<void> {
    if (process.platform !== 'win32') {
      return;
    }

    try {
      const script = `
        Add-Type -TypeDefinition @"
          using System;
          using System.Runtime.InteropServices;
          
          public class Win32 {
            [DllImport("user32.dll")]
            public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
          }
"@
        
        $handle = [IntPtr]${windowHandle}
        [Win32]::SetWindowPos($handle, [IntPtr]::Zero, 0, 0, ${width}, ${height}, 0x0002)  # SWP_NOMOVE
      `;

      await execAsync(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
    } catch (error) {
      console.error('Error resizing window:', error);
    }
  }

  /**
   * Link process to username - similar to AHK account management
   */
  async linkProcessToUsername(windowHandle: string, username: string): Promise<boolean> {
    const client = this.clientMap.get(windowHandle);
    if (!client) {
      return false;
    }

    client.username = username;
    client.accountName = username;
    
    // Save configuration
    await this.saveConfigToTemp(windowHandle, {
      windowHandle,
      pid: client.pid,
      username,
      accountName: username,
      timestamp: new Date().toISOString()
    });

    // Update window title
    await this.setWindowTitle(windowHandle, `Roblox (${username})`);

    this.emit('processLinked', client);
    return true;
  }

  /**
   * Get client by window handle
   */
  getClientByHandle(windowHandle: string): RobloxClient | undefined {
    return this.clientMap.get(windowHandle);
  }

  /**
   * Get client by PID
   */
  getClientByPid(pid: number): RobloxClient | undefined {
    return this.clientArray.find(client => client.pid === pid);
  }

  /**
   * Get all clients
   */
  getAllClients(): RobloxClient[] {
    return this.clientArray;
  }

  /**
   * Start monitoring clients
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return;
    }

    this.monitoringInterval = setInterval(async () => {
      await this.initializeClients();
    }, 3000);

    console.log('Client monitoring started');
  }

  /**
   * Stop monitoring clients
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Client monitoring stopped');
  }

  /**
   * Create demo clients for non-Windows environments
   */
  private createDemoClients(): RobloxClient[] {
    return [
      {
        pid: 6960,
        windowHandle: '1770498',
        windowClass: 'WINDOWSCLIENT',
        processName: 'RobloxPlayerBeta.exe',
        windowTitle: 'Roblox - Milamoo12340',
        username: 'Milamoo12340',
        accountName: 'Milamoo12340',
        isActive: true,
        resourceUsage: {
          cpu: 15,
          memory: 256,
          threads: 8
        },
        windowGeometry: {
          x: 100,
          y: 100,
          width: 800,
          height: 600
        },
        startTime: new Date(Date.now() - 300000),
        lastActive: new Date()
      }
    ];
  }

  /**
   * Kill process by PID
   */
  async killProcess(pid: number): Promise<boolean> {
    const client = this.getClientByPid(pid);
    if (!client) {
      return false;
    }

    try {
      if (process.platform === 'win32') {
        await execAsync(`taskkill /PID ${pid} /F`);
      } else {
        // Demo mode - just remove from arrays
        this.clientArray = this.clientArray.filter(c => c.pid !== pid);
        this.clientMap.delete(client.windowHandle);
      }

      this.emit('processTerminated', client);
      return true;
    } catch (error) {
      console.error(`Error killing process ${pid}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const processManager = new ProcessManager();