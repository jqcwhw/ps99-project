/**
 * Roblox Registry Manager
 * 
 * Manages Windows registry modifications for multi-instance support.
 * Based on techniques from professional Roblox account managers.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RegistryBackup {
  path: string;
  values: Record<string, any>;
  timestamp: Date;
}

export class RobloxRegistryManager {
  private backups: RegistryBackup[] = [];

  /**
   * Create registry modifications for multi-instance support
   */
  async enableMultiInstance(): Promise<void> {
    if (process.platform !== 'win32') {
      console.log('Non-Windows environment detected. Registry management not available.');
      return;
    }

    try {
      console.log('Creating registry backups before modifications...');
      await this.createBackups();

      console.log('Applying multi-instance registry modifications...');

      // Primary Roblox Player registry modifications
      const playerRegistryPath = 'HKEY_CURRENT_USER\\Software\\Roblox Corporation\\Environments\\roblox-player';
      
      // Backup and modify the main registry entries
      await this.setRegistryValue(playerRegistryPath, 'EnableMultipleInstances', 'REG_DWORD', '1');
      await this.setRegistryValue(playerRegistryPath, 'DisableSingletonMutex', 'REG_DWORD', '1');
      await this.setRegistryValue(playerRegistryPath, 'AllowMultipleClients', 'REG_DWORD', '1');

      // Studio registry modifications (if needed)
      const studioRegistryPath = 'HKEY_CURRENT_USER\\Software\\Roblox Corporation\\Environments\\roblox-studio';
      await this.setRegistryValue(studioRegistryPath, 'EnableMultipleInstances', 'REG_DWORD', '1');

      // Process isolation settings
      await this.setRegistryValue(playerRegistryPath, 'ProcessIsolation', 'REG_DWORD', '1');
      await this.setRegistryValue(playerRegistryPath, 'IndependentProcesses', 'REG_DWORD', '1');

      // Memory management for multiple instances
      await this.setRegistryValue(playerRegistryPath, 'LimitMemoryUsage', 'REG_DWORD', '1');
      await this.setRegistryValue(playerRegistryPath, 'MaxMemoryPerInstance', 'REG_DWORD', '2048'); // 2GB limit per instance

      // GPU resource sharing
      await this.setRegistryValue(playerRegistryPath, 'SharedGPUResources', 'REG_DWORD', '1');
      await this.setRegistryValue(playerRegistryPath, 'GPUInstanceLimit', 'REG_DWORD', '4');

      console.log('Registry modifications applied successfully');
    } catch (error) {
      console.error('Failed to enable multi-instance registry settings:', error);
      throw error;
    }
  }

  /**
   * Disable multi-instance registry modifications
   */
  async disableMultiInstance(): Promise<void> {
    try {
      console.log('Restoring original registry settings...');

      for (const backup of this.backups) {
        await this.restoreRegistryBackup(backup);
      }

      console.log('Registry settings restored successfully');
    } catch (error) {
      console.error('Failed to restore registry settings:', error);
      throw error;
    }
  }

  /**
   * Create instance-specific registry entries
   */
  async createInstanceRegistry(instanceId: string, instanceName: string): Promise<void> {
    try {
      const instancePath = `HKEY_CURRENT_USER\\Software\\Roblox Corporation\\Instances\\${instanceId}`;

      // Create instance-specific settings
      await this.setRegistryValue(instancePath, 'InstanceName', 'REG_SZ', instanceName);
      await this.setRegistryValue(instancePath, 'InstanceId', 'REG_SZ', instanceId);
      await this.setRegistryValue(instancePath, 'CreatedAt', 'REG_SZ', new Date().toISOString());
      await this.setRegistryValue(instancePath, 'IsActive', 'REG_DWORD', '0');

      // Instance-specific process settings
      await this.setRegistryValue(instancePath, 'ProcessPriority', 'REG_DWORD', '32'); // Normal priority
      await this.setRegistryValue(instancePath, 'CPUAffinity', 'REG_DWORD', '0'); // Use all cores
      await this.setRegistryValue(instancePath, 'MemoryLimit', 'REG_DWORD', '2048'); // 2GB limit

      // Graphics settings per instance
      await this.setRegistryValue(instancePath, 'GraphicsMode', 'REG_DWORD', '1'); // Automatic
      await this.setRegistryValue(instancePath, 'RenderQuality', 'REG_DWORD', '5'); // Medium quality
      await this.setRegistryValue(instancePath, 'FrameRateLimit', 'REG_DWORD', '60');

      console.log(`Instance registry created for ${instanceName} (${instanceId})`);
    } catch (error) {
      console.error(`Failed to create instance registry for ${instanceName}:`, error);
      throw error;
    }
  }

  /**
   * Remove instance-specific registry entries
   */
  async removeInstanceRegistry(instanceId: string): Promise<void> {
    try {
      const instancePath = `HKEY_CURRENT_USER\\Software\\Roblox Corporation\\Instances\\${instanceId}`;
      
      await execAsync(`reg delete "${instancePath}" /f`);
      console.log(`Instance registry removed for ${instanceId}`);
    } catch (error) {
      // Ignore errors if registry key doesn't exist
      console.log(`Registry key for instance ${instanceId} not found or already removed`);
    }
  }

  /**
   * Update instance status in registry
   */
  async updateInstanceStatus(instanceId: string, isActive: boolean, processId?: number): Promise<void> {
    try {
      const instancePath = `HKEY_CURRENT_USER\\Software\\Roblox Corporation\\Instances\\${instanceId}`;
      
      await this.setRegistryValue(instancePath, 'IsActive', 'REG_DWORD', isActive ? '1' : '0');
      await this.setRegistryValue(instancePath, 'LastUpdate', 'REG_SZ', new Date().toISOString());
      
      if (processId) {
        await this.setRegistryValue(instancePath, 'ProcessId', 'REG_DWORD', processId.toString());
      }

      if (!isActive) {
        // Clear process ID when instance becomes inactive
        await this.deleteRegistryValue(instancePath, 'ProcessId');
      }
    } catch (error) {
      console.error(`Failed to update instance status for ${instanceId}:`, error);
    }
  }

  /**
   * Get all registered instances from registry
   */
  async getRegisteredInstances(): Promise<Array<{ id: string; name: string; isActive: boolean; processId?: number }>> {
    try {
      const { stdout } = await execAsync('reg query "HKEY_CURRENT_USER\\Software\\Roblox Corporation\\Instances" /s');
      const instances = [];
      const lines = stdout.split('\n');

      let currentInstance: any = null;
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.includes('\\Instances\\')) {
          if (currentInstance) {
            instances.push(currentInstance);
          }
          const instanceId = trimmed.split('\\').pop();
          currentInstance = { id: instanceId, name: '', isActive: false };
        } else if (currentInstance && trimmed.includes('REG_')) {
          const parts = trimmed.split('REG_');
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const value = parts[1].split(' ').slice(1).join(' ').trim();
            
            if (name === 'InstanceName') {
              currentInstance.name = value;
            } else if (name === 'IsActive') {
              currentInstance.isActive = value === '0x1';
            } else if (name === 'ProcessId') {
              currentInstance.processId = parseInt(value.replace('0x', ''), 16);
            }
          }
        }
      }

      if (currentInstance) {
        instances.push(currentInstance);
      }

      return instances;
    } catch (error) {
      // Return empty array if no instances found
      return [];
    }
  }

  /**
   * Set a registry value
   */
  private async setRegistryValue(path: string, name: string, type: string, value: string): Promise<void> {
    try {
      await execAsync(`reg add "${path}" /v "${name}" /t ${type} /d "${value}" /f`);
    } catch (error) {
      console.error(`Failed to set registry value ${path}\\${name}:`, error);
      throw error;
    }
  }

  /**
   * Delete a registry value
   */
  private async deleteRegistryValue(path: string, name: string): Promise<void> {
    try {
      await execAsync(`reg delete "${path}" /v "${name}" /f`);
    } catch (error) {
      // Ignore errors if value doesn't exist
    }
  }

  /**
   * Create backups of important registry keys before modification
   */
  private async createBackups(): Promise<void> {
    const paths = [
      'HKEY_CURRENT_USER\\Software\\Roblox Corporation\\Environments\\roblox-player',
      'HKEY_CURRENT_USER\\Software\\Roblox Corporation\\Environments\\roblox-studio'
    ];

    for (const path of paths) {
      try {
        const backup = await this.createRegistryBackup(path);
        this.backups.push(backup);
      } catch (error) {
        console.log(`Could not backup registry path ${path} (may not exist)`);
      }
    }
  }

  /**
   * Create a backup of a registry path
   */
  private async createRegistryBackup(path: string): Promise<RegistryBackup> {
    try {
      const { stdout } = await execAsync(`reg query "${path}" /s`);
      const values: Record<string, any> = {};
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.includes('REG_')) {
          const parts = trimmed.split('REG_');
          if (parts.length >= 2) {
            const name = parts[0].trim();
            const typeAndValue = parts[1].trim();
            const spaceIndex = typeAndValue.indexOf(' ');
            const type = typeAndValue.substring(0, spaceIndex);
            const value = typeAndValue.substring(spaceIndex + 1).trim();
            
            values[name] = { type: 'REG_' + type, value };
          }
        }
      }

      return {
        path,
        values,
        timestamp: new Date()
      };
    } catch (error) {
      throw new Error(`Failed to backup registry path ${path}: ${error}`);
    }
  }

  /**
   * Restore a registry backup
   */
  private async restoreRegistryBackup(backup: RegistryBackup): Promise<void> {
    try {
      for (const [name, data] of Object.entries(backup.values)) {
        await this.setRegistryValue(backup.path, name, data.type, data.value);
      }
      console.log(`Restored registry backup for ${backup.path}`);
    } catch (error) {
      console.error(`Failed to restore registry backup for ${backup.path}:`, error);
    }
  }

  /**
   * Check if multi-instance registry modifications are active
   */
  async isMultiInstanceEnabled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('reg query "HKEY_CURRENT_USER\\Software\\Roblox Corporation\\Environments\\roblox-player" /v EnableMultipleInstances');
      return stdout.includes('0x1');
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up all registry modifications
   */
  async cleanup(): Promise<void> {
    try {
      await this.disableMultiInstance();
      
      // Remove all instance registries
      const instances = await this.getRegisteredInstances();
      for (const instance of instances) {
        await this.removeInstanceRegistry(instance.id);
      }

      console.log('Registry cleanup completed');
    } catch (error) {
      console.error('Registry cleanup failed:', error);
    }
  }
}

// Singleton instance
export const robloxRegistryManager = new RobloxRegistryManager();