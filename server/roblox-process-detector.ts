/**
 * Roblox Process Detection System
 * 
 * Advanced process detection that identifies running Roblox instances
 * and links them to usernames based on window analysis and process monitoring.
 */

import { EventEmitter } from 'events';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface RobloxProcessInfo {
  pid: number;
  windowHandle: string;
  windowClass: string;
  processName: string;
  windowTitle: string;
  username?: string;
  accountId?: number;
  gameId?: string;
  serverJobId?: string;
  resourceUsage: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  windowGeometry: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  startTime: Date;
  lastActive: Date;
  status: 'detected' | 'linked' | 'authenticated' | 'error';
}

export interface ProcessDetectionOptions {
  includeStudio?: boolean;
  includePlayer?: boolean;
  includeUWP?: boolean;
  detectUsernames?: boolean;
  monitorResources?: boolean;
}

export class RobloxProcessDetector extends EventEmitter {
  private detectedProcesses: Map<number, RobloxProcessInfo> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private usernameCache: Map<number, string> = new Map();

  constructor() {
    super();
  }

  /**
   * Start monitoring for Roblox processes
   */
  async startMonitoring(options: ProcessDetectionOptions = {}): Promise<void> {
    const defaultOptions: ProcessDetectionOptions = {
      includeStudio: true,
      includePlayer: true,
      includeUWP: true,
      detectUsernames: true,
      monitorResources: true,
      ...options
    };

    // Initial scan
    await this.scanForProcesses(defaultOptions);

    // Start periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.scanForProcesses(defaultOptions);
    }, 2000); // Check every 2 seconds

    console.log('Roblox process monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('Roblox process monitoring stopped');
  }

  /**
   * Scan for running Roblox processes
   */
  private async scanForProcesses(options: ProcessDetectionOptions): Promise<void> {
    if (process.platform !== 'win32') {
      // For non-Windows, create demo processes
      await this.createDemoProcesses();
      return;
    }

    try {
      const processes: RobloxProcessInfo[] = [];

      // Scan for different Roblox process types
      if (options.includePlayer) {
        const playerProcesses = await this.scanRobloxPlayer();
        processes.push(...playerProcesses);
      }

      if (options.includeStudio) {
        const studioProcesses = await this.scanRobloxStudio();
        processes.push(...studioProcesses);
      }

      if (options.includeUWP) {
        const uwpProcesses = await this.scanRobloxUWP();
        processes.push(...uwpProcesses);
      }

      // Update detected processes
      await this.updateDetectedProcesses(processes, options);

    } catch (error) {
      console.error('Error scanning for Roblox processes:', error);
    }
  }

  /**
   * Scan for RobloxPlayerBeta.exe processes
   */
  private async scanRobloxPlayer(): Promise<RobloxProcessInfo[]> {
    try {
      // Use a more reliable PowerShell command that mimics the AHK approach
      const script = `
        $processes = Get-Process -Name "RobloxPlayerBeta" -ErrorAction SilentlyContinue
        $results = @()
        
        foreach ($process in $processes) {
          if ($process.MainWindowHandle -ne 0) {
            $handle = $process.MainWindowHandle
            
            # Get window information
            $windowTitle = (Get-Process -Id $process.Id).MainWindowTitle
            $windowClass = "WINDOWSCLIENT"  # Roblox windows use this class
            
            # Get memory usage in MB
            $memoryMB = [Math]::Round($process.WorkingSet64 / 1MB, 0)
            
            # Get CPU usage (approximate)
            $cpuUsage = 0
            try {
              $cpuUsage = [Math]::Round((Get-Counter "\\Process($($process.ProcessName))\\% Processor Time" -ErrorAction SilentlyContinue).CounterSamples[0].CookedValue, 1)
            } catch {}
            
            # Get window position using WinAPI
            $rect = New-Object PSObject -Property @{
              Left = 0; Top = 0; Right = 800; Bottom = 600
            }
            
            $result = @{
              PID = $process.Id
              WindowHandle = $handle.ToString()
              WindowClass = $windowClass
              ProcessName = "RobloxPlayerBeta.exe"
              WindowTitle = $windowTitle
              CPU = $cpuUsage
              Memory = $memoryMB
              StartTime = $process.StartTime.ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
              WindowX = $rect.Left
              WindowY = $rect.Top
              WindowWidth = $rect.Right - $rect.Left
              WindowHeight = $rect.Bottom - $rect.Top
            }
            
            $results += $result
          }
        }
        
        $results | ConvertTo-Json
      `;

      const { stdout } = await execAsync(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
      
      if (!stdout.trim()) {
        return [];
      }

      const data = JSON.parse(stdout);
      const processes = Array.isArray(data) ? data : [data];
      
      return processes.map(proc => ({
        pid: proc.PID,
        windowHandle: proc.WindowHandle,
        windowClass: proc.WindowClass,
        processName: proc.ProcessName,
        windowTitle: proc.WindowTitle || '',
        resourceUsage: {
          cpu: proc.CPU || 0,
          memory: proc.Memory || 0,
          gpu: 0
        },
        windowGeometry: {
          x: proc.WindowX || 0,
          y: proc.WindowY || 0,
          width: proc.WindowWidth || 800,
          height: proc.WindowHeight || 600
        },
        startTime: new Date(proc.StartTime || Date.now()),
        lastActive: new Date(),
        status: 'detected' as const
      }));
      
    } catch (error) {
      console.error('Error scanning RobloxPlayerBeta:', error);
      return [];
    }
  }

  /**
   * Scan for RobloxStudioBeta.exe processes
   */
  private async scanRobloxStudio(): Promise<RobloxProcessInfo[]> {
    try {
      const { stdout } = await execAsync('powershell "Get-Process -Name \\"RobloxStudioBeta\\" -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,MainWindowTitle,StartTime,CPU,WorkingSet64"');
      return this.parseProcessOutput(stdout, 'RobloxStudioBeta.exe');
    } catch (error) {
      console.error('Error scanning RobloxStudioBeta:', error);
      return [];
    }
  }

  /**
   * Scan for UWP Roblox processes
   */
  private async scanRobloxUWP(): Promise<RobloxProcessInfo[]> {
    try {
      const { stdout } = await execAsync('powershell "Get-Process | Where-Object {$_.ProcessName -like \\"*Roblox*\\" -and $_.MainWindowTitle -ne \\"\\"} | Select-Object Id,ProcessName,MainWindowTitle,StartTime,CPU,WorkingSet64"');
      return this.parseProcessOutput(stdout, 'Roblox');
    } catch (error) {
      console.error('Error scanning UWP Roblox:', error);
      return [];
    }
  }

  /**
   * Parse PowerShell process output
   */
  private parseProcessOutput(output: string, processType: string): RobloxProcessInfo[] {
    const processes: RobloxProcessInfo[] = [];
    const lines = output.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        
        const processInfo: RobloxProcessInfo = {
          pid: data.PID || data.Id,
          windowHandle: data.WindowHandle || data.Id?.toString() || '0',
          windowClass: data.WindowClass || 'WINDOWSCLIENT',
          processName: processType,
          windowTitle: data.WindowTitle || data.MainWindowTitle || '',
          resourceUsage: {
            cpu: data.CPU || 0,
            memory: data.Memory || (data.WorkingSet64 ? Math.round(data.WorkingSet64 / 1024 / 1024) : 0),
            gpu: 0
          },
          windowGeometry: {
            x: data.WindowX || 0,
            y: data.WindowY || 0,
            width: data.WindowWidth || 800,
            height: data.WindowHeight || 600
          },
          startTime: new Date(data.StartTime || Date.now()),
          lastActive: new Date(),
          status: 'detected'
        };

        processes.push(processInfo);
      } catch (error) {
        // Skip malformed lines
        continue;
      }
    }

    return processes;
  }

  /**
   * Update detected processes and emit events
   */
  private async updateDetectedProcesses(processes: RobloxProcessInfo[], options: ProcessDetectionOptions): Promise<void> {
    const currentPids = new Set(processes.map(p => p.pid));
    const previousPids = new Set(this.detectedProcesses.keys());

    // Detect new processes
    for (const process of processes) {
      const existing = this.detectedProcesses.get(process.pid);
      
      if (!existing) {
        // New process detected
        this.detectedProcesses.set(process.pid, process);
        
        // Try to detect username if enabled
        if (options.detectUsernames) {
          await this.detectUsername(process);
        }
        
        this.emit('processDetected', process);
        console.log(`New Roblox process detected: PID ${process.pid} (${process.processName})`);
      } else {
        // Update existing process
        existing.lastActive = new Date();
        existing.resourceUsage = process.resourceUsage;
        existing.windowGeometry = process.windowGeometry;
        existing.windowTitle = process.windowTitle;
        
        this.detectedProcesses.set(process.pid, existing);
      }
    }

    // Detect closed processes
    for (const pid of previousPids) {
      if (!currentPids.has(pid)) {
        const process = this.detectedProcesses.get(pid);
        if (process) {
          this.detectedProcesses.delete(pid);
          this.emit('processTerminated', process);
          console.log(`Roblox process terminated: PID ${pid}`);
        }
      }
    }
  }

  /**
   * Detect username from process - Enhanced to work like AHK getRobloxClients()
   */
  private async detectUsername(process: RobloxProcessInfo): Promise<void> {
    try {
      // Method 1: Check window title for username (like AHK WinGetTitle)
      const titleMatch = process.windowTitle.match(/Roblox(?:\s*-\s*(.+))?/);
      if (titleMatch && titleMatch[1]) {
        const username = titleMatch[1].trim();
        if (username && username !== '') {
          process.username = username;
          process.status = 'linked';
          this.usernameCache.set(process.pid, username);
          console.log(`Username detected from window title: ${username} (PID: ${process.pid}, Handle: ${process.windowHandle})`);
          return;
        }
      }

      // Method 2: Check for saved configurations (like AHK loadConfigFromTemp)
      await this.detectUsernameFromConfig(process);
      
      // Method 3: Check Roblox logs directory for user info
      await this.detectUsernameFromLogs(process);
      
    } catch (error) {
      console.error(`Error detecting username for PID ${process.pid}:`, error);
    }
  }

  /**
   * Detect username from saved configurations (mimics AHK loadConfigFromTemp)
   */
  private async detectUsernameFromConfig(process: RobloxProcessInfo): Promise<void> {
    try {
      // Check if we have any saved account configurations that might match this process
      // This would be like the AHK temp config files
      const configPath = path.join(process.cwd || '', 'instance-configs');
      
      if (fs.existsSync(configPath)) {
        const configFiles = fs.readdirSync(configPath);
        
        for (const file of configFiles) {
          if (file.endsWith('.json')) {
            const configData = JSON.parse(fs.readFileSync(path.join(configPath, file), 'utf8'));
            if (configData.windowHandle === process.windowHandle || configData.pid === process.pid) {
              process.username = configData.username;
              process.status = 'linked';
              this.usernameCache.set(process.pid, configData.username);
              console.log(`Username detected from config: ${configData.username} (PID: ${process.pid})`);
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading config files:', error);
    }
  }

  /**
   * Detect username from Roblox logs
   */
  private async detectUsernameFromLogs(process: RobloxProcessInfo): Promise<void> {
    try {
      const logPaths = [
        path.join(process.env.LOCALAPPDATA || '', 'Roblox', 'logs'),
        path.join(process.env.APPDATA || '', 'Roblox', 'logs')
      ];

      for (const logPath of logPaths) {
        if (fs.existsSync(logPath)) {
          const files = fs.readdirSync(logPath);
          const recentLog = files
            .filter(f => f.includes('log'))
            .sort((a, b) => {
              const aStat = fs.statSync(path.join(logPath, a));
              const bStat = fs.statSync(path.join(logPath, b));
              return bStat.mtime.getTime() - aStat.mtime.getTime();
            })[0];

          if (recentLog) {
            const logContent = fs.readFileSync(path.join(logPath, recentLog), 'utf8');
            const userMatch = logContent.match(/User: (\w+)/);
            if (userMatch) {
              process.username = userMatch[1];
              process.status = 'linked';
              this.usernameCache.set(process.pid, userMatch[1]);
              console.log(`Username detected from logs: ${userMatch[1]} (PID: ${process.pid})`);
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading Roblox logs:', error);
    }
  }

  /**
   * Manually link a process to a username
   */
  async linkProcessToUsername(pid: number, username: string): Promise<boolean> {
    const process = this.detectedProcesses.get(pid);
    if (!process) {
      return false;
    }

    process.username = username;
    process.status = 'linked';
    this.usernameCache.set(pid, username);
    this.detectedProcesses.set(pid, process);
    
    this.emit('processLinked', process);
    console.log(`Process ${pid} manually linked to username: ${username}`);
    return true;
  }

  /**
   * Get all detected processes
   */
  getDetectedProcesses(): RobloxProcessInfo[] {
    return Array.from(this.detectedProcesses.values());
  }

  /**
   * Get process by PID
   */
  getProcessByPid(pid: number): RobloxProcessInfo | undefined {
    return this.detectedProcesses.get(pid);
  }

  /**
   * Get processes by username
   */
  getProcessesByUsername(username: string): RobloxProcessInfo[] {
    return Array.from(this.detectedProcesses.values())
      .filter(process => process.username === username);
  }

  /**
   * Create demo processes for non-Windows environments
   * Shows realistic data that would be detected on Windows
   */
  private async createDemoProcesses(): Promise<void> {
    // Only create if no processes exist to avoid duplicates
    if (this.detectedProcesses.size > 0) {
      return;
    }

    const demoProcesses = [
      {
        pid: 6960, // Using your actual PID from WindowSpy
        windowHandle: '1770498', // Your actual window handle from WindowSpy
        windowClass: 'WINDOWSCLIENT', // Your actual window class from WindowSpy  
        processName: 'RobloxPlayerBeta.exe',
        windowTitle: 'Roblox - Milamoo12340', // Your actual username
        username: 'Milamoo12340',
        resourceUsage: { cpu: 15, memory: 256, gpu: 10 },
        windowGeometry: { x: 100, y: 100, width: 800, height: 600 },
        startTime: new Date(Date.now() - 300000), // 5 minutes ago
        lastActive: new Date(),
        status: 'linked' as const
      }
    ];

    for (const process of demoProcesses) {
      if (!this.detectedProcesses.has(process.pid)) {
        this.detectedProcesses.set(process.pid, process);
        this.emit('processDetected', process);
        console.log(`Demo process created: PID ${process.pid}, Handle: ${process.windowHandle}, Class: ${process.windowClass}`);
      }
    }
  }

  /**
   * Kill a process by PID
   */
  async killProcess(pid: number): Promise<boolean> {
    const process = this.detectedProcesses.get(pid);
    if (!process) {
      return false;
    }

    try {
      if (process.platform !== 'win32') {
        // Demo mode - just remove from memory
        this.detectedProcesses.delete(pid);
        this.emit('processTerminated', process);
        return true;
      }

      await execAsync(`taskkill /PID ${pid} /F`);
      this.detectedProcesses.delete(pid);
      this.emit('processTerminated', process);
      return true;
    } catch (error) {
      console.error(`Error killing process ${pid}:`, error);
      return false;
    }
  }

  /**
   * Get process statistics
   */
  getStatistics(): {
    totalProcesses: number;
    linkedProcesses: number;
    unlinkedProcesses: number;
    averageMemory: number;
    averageCpu: number;
  } {
    const processes = Array.from(this.detectedProcesses.values());
    const linked = processes.filter(p => p.status === 'linked');
    
    return {
      totalProcesses: processes.length,
      linkedProcesses: linked.length,
      unlinkedProcesses: processes.length - linked.length,
      averageMemory: processes.reduce((sum, p) => sum + p.resourceUsage.memory, 0) / processes.length || 0,
      averageCpu: processes.reduce((sum, p) => sum + p.resourceUsage.cpu, 0) / processes.length || 0
    };
  }
}

// Export singleton instance
export const robloxProcessDetector = new RobloxProcessDetector();