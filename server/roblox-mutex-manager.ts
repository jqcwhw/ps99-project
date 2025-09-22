/**
 * Roblox Mutex Manager
 * 
 * Handles the ROBLOX_singletonMutex to enable multi-instance support.
 * Based on techniques from Roblox Account Manager and Multi-Instance projects.
 */

import { EventEmitter } from 'events';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MutexStatus {
  isActive: boolean;
  processId?: number;
  createdAt?: Date;
  error?: string;
}

export class RobloxMutexManager extends EventEmitter {
  private mutexProcess: any = null;
  private isActive: boolean = false;
  private createdAt: Date | null = null;

  constructor() {
    super();
  }

  /**
   * Create the Roblox singleton mutex to enable multi-instance support
   */
  async createMutex(): Promise<MutexStatus> {
    try {
      // Kill any existing mutex processes first
      await this.releaseMutex();

      const script = `
        using System;
        using System.Threading;
        using System.Diagnostics;

        public class RobloxMutexManager {
            private static Mutex rbxMutex;
            
            public static void Main() {
                try {
                    // Take ownership of the Roblox singleton mutex
                    rbxMutex = new Mutex(true, "ROBLOX_singletonMutex");
                    
                    if (rbxMutex.WaitOne(0)) {
                        Console.WriteLine("SUCCESS: Roblox multi-instance mutex acquired successfully");
                        Console.WriteLine("ProcessId: " + Process.GetCurrentProcess().Id);
                        
                        // Keep the mutex alive
                        while (true) {
                            Thread.Sleep(1000);
                        }
                    } else {
                        Console.WriteLine("ERROR: Failed to acquire mutex - another instance may be running");
                        Environment.Exit(1);
                    }
                } catch (Exception ex) {
                    Console.WriteLine("ERROR: " + ex.Message);
                    Environment.Exit(1);
                }
            }
        }
      `;

      // Write the C# script to a temporary file
      const tempScript = 'temp_mutex_manager.cs';
      const fs = require('fs').promises;
      await fs.writeFile(tempScript, script);

      // Compile and run the C# script
      const compileResult = await execAsync(`csc /out:temp_mutex_manager.exe ${tempScript}`);
      
      // Start the mutex manager process
      this.mutexProcess = spawn('temp_mutex_manager.exe', [], {
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let resolved = false;
      const result: MutexStatus = { isActive: false };

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Mutex creation timeout'));
          }
        }, 10000);

        this.mutexProcess.stdout.on('data', (data: Buffer) => {
          const output = data.toString();
          console.log('Mutex Manager Output:', output);

          if (output.includes('SUCCESS')) {
            this.isActive = true;
            this.createdAt = new Date();
            
            const pidMatch = output.match(/ProcessId: (\d+)/);
            if (pidMatch) {
              result.processId = parseInt(pidMatch[1]);
            }

            result.isActive = true;
            result.createdAt = this.createdAt;

            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(result);
            }

            this.emit('mutexCreated', result);
          } else if (output.includes('ERROR')) {
            result.error = output.trim();
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              reject(new Error(result.error));
            }
          }
        });

        this.mutexProcess.stderr.on('data', (data: Buffer) => {
          console.error('Mutex Manager Error:', data.toString());
          result.error = data.toString();
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            reject(new Error(result.error));
          }
        });

        this.mutexProcess.on('exit', (code: number) => {
          console.log(`Mutex manager process exited with code ${code}`);
          this.isActive = false;
          this.emit('mutexReleased');

          if (!resolved && code !== 0) {
            resolved = true;
            clearTimeout(timeout);
            reject(new Error(`Mutex process exited with code ${code}`));
          }
        });
      });

    } catch (error) {
      console.error('Failed to create Roblox mutex:', error);
      return {
        isActive: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Release the Roblox singleton mutex
   */
  async releaseMutex(): Promise<void> {
    try {
      // Kill our mutex process
      if (this.mutexProcess) {
        this.mutexProcess.kill('SIGTERM');
        this.mutexProcess = null;
      }

      // Windows-specific cleanup
      if (process.platform === 'win32') {
        // Also kill any existing RobloxPlayerBeta processes that might hold the mutex
        try {
          await execAsync('taskkill /F /IM RobloxPlayerBeta.exe 2>nul');
        } catch (e) {
          // Ignore errors if no processes found
        }

        // Kill any other mutex manager processes
        try {
          await execAsync('taskkill /F /IM temp_mutex_manager.exe 2>nul');
        } catch (e) {
          // Ignore errors if no processes found
        }
      }

      this.isActive = false;
      this.createdAt = null;
      this.emit('mutexReleased');

      console.log('Roblox mutex released successfully');
    } catch (error) {
      console.error('Error releasing mutex:', error);
      throw error;
    }
  }

  /**
   * Get the current status of the mutex
   */
  getStatus(): MutexStatus {
    return {
      isActive: this.isActive,
      processId: this.mutexProcess?.pid,
      createdAt: this.createdAt || undefined
    };
  }

  /**
   * Alternative PowerShell-based mutex creation for environments without C# compiler
   */
  async createMutexPowerShell(): Promise<MutexStatus> {
    // Check if we're on Windows
    if (process.platform !== 'win32') {
      console.log('Non-Windows environment detected. Mutex management not available.');
      return { 
        isActive: false, 
        error: 'Mutex management is only available on Windows systems' 
      };
    }

    try {
      const script = `
        Add-Type -TypeDefinition @"
        using System;
        using System.Threading;
        using System.Diagnostics;
        
        public class RobloxMutex {
            private static Mutex mutex;
            
            public static string CreateMutex() {
                try {
                    mutex = new Mutex(true, "ROBLOX_singletonMutex");
                    if (mutex.WaitOne(0)) {
                        return "SUCCESS:" + Process.GetCurrentProcess().Id;
                    } else {
                        return "ERROR:Mutex already exists";
                    }
                } catch (Exception ex) {
                    return "ERROR:" + ex.Message;
                }
            }
            
            public static void KeepAlive() {
                while (true) {
                    [System.Threading.Thread]::Sleep(1000);
                }
            }
        }
"@ -Language CSharp
        
        $result = [RobloxMutex]::CreateMutex()
        Write-Output $result
        
        if ($result.StartsWith("SUCCESS")) {
            [RobloxMutex]::KeepAlive()
        }
      `;

      this.mutexProcess = spawn('powershell.exe', ['-NoProfile', '-Command', script], {
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let resolved = false;
      const result: MutexStatus = { isActive: false };

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error('PowerShell mutex creation timeout'));
          }
        }, 15000);

        this.mutexProcess.stdout.on('data', (data: Buffer) => {
          const output = data.toString().trim();
          console.log('PowerShell Mutex Output:', output);

          if (output.includes('SUCCESS')) {
            this.isActive = true;
            this.createdAt = new Date();
            
            const pidMatch = output.match(/SUCCESS:(\d+)/);
            if (pidMatch) {
              result.processId = parseInt(pidMatch[1]);
            }

            result.isActive = true;
            result.createdAt = this.createdAt;

            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(result);
            }

            this.emit('mutexCreated', result);
          } else if (output.includes('ERROR')) {
            result.error = output.replace('ERROR:', '');
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              reject(new Error(result.error));
            }
          }
        });

        this.mutexProcess.stderr.on('data', (data: Buffer) => {
          console.error('PowerShell Mutex Error:', data.toString());
        });

        this.mutexProcess.on('exit', (code: number) => {
          console.log(`PowerShell mutex process exited with code ${code}`);
          this.isActive = false;
          this.emit('mutexReleased');
        });
      });

    } catch (error) {
      console.error('Failed to create PowerShell mutex:', error);
      return {
        isActive: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if Roblox processes are currently running
   */
  async getRobloxProcesses(): Promise<Array<{ pid: number; name: string; cmdLine?: string }>> {
    try {
      const { stdout } = await execAsync('wmic process where "name=\'RobloxPlayerBeta.exe\'" get ProcessId,CommandLine /format:csv');
      const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('Node,CommandLine,ProcessId'));
      
      return lines.map(line => {
        const parts = line.split(',');
        return {
          pid: parseInt(parts[parts.length - 1]) || 0,
          name: 'RobloxPlayerBeta.exe',
          cmdLine: parts.slice(1, -1).join(',')
        };
      }).filter(proc => proc.pid > 0);
    } catch (error) {
      console.error('Error getting Roblox processes:', error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.releaseMutex().catch(console.error);
    this.removeAllListeners();
  }
}

// Singleton instance
export const robloxMutexManager = new RobloxMutexManager();