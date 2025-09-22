const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'electron-preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Roblox Multi-Instance Manager',
    show: false,
    frame: true,
    titleBarStyle: 'default'
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window (important for Windows)
    if (process.platform === 'win32') {
      mainWindow.setAlwaysOnTop(true);
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(false);
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5000' && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Handle new window requests
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Start the Express server
function startServer() {
  if (isDev) {
    // In development, server is already running via npm run dev
    return;
  }

  const { spawn } = require('child_process');
  const serverPath = path.join(__dirname, 'server', 'index.js');
  
  serverProcess = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err);
    dialog.showErrorBox('Server Error', 'Failed to start the application server.');
    app.quit();
  });
}

// App event handlers
app.whenReady().then(() => {
  startServer();
  
  // Wait a moment for server to start, then create window
  setTimeout(createWindow, isDev ? 1000 : 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// IPC handlers for enhanced desktop integration
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

ipcMain.handle('app:getPlatform', () => {
  return process.platform;
});

ipcMain.handle('app:isAdmin', async () => {
  if (process.platform !== 'win32') {
    return false;
  }
  
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // Check if running as administrator
    const result = await execAsync('net session 2>nul');
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('app:requestAdmin', async () => {
  if (process.platform !== 'win32') {
    return false;
  }

  const response = dialog.showMessageBoxSync(mainWindow, {
    type: 'warning',
    buttons: ['Cancel', 'Restart as Admin'],
    defaultId: 1,
    title: 'Administrator Rights Required',
    message: 'This application requires administrator rights to manage Roblox instances.',
    detail: 'The application will restart with elevated privileges. This is necessary for UWP package management and developer mode activation.'
  });

  if (response === 1) {
    // Restart as admin
    const { spawn } = require('child_process');
    const appPath = process.execPath;
    
    spawn('powershell', [
      '-Command',
      `Start-Process -FilePath "${appPath}" -Verb RunAs`
    ], { detached: true, stdio: 'ignore' });
    
    app.quit();
    return true;
  }
  
  return false;
});

ipcMain.handle('dialog:showError', async (event, title, content) => {
  dialog.showErrorBox(title, content);
});

ipcMain.handle('dialog:showMessage', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Directory'
  });
  
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('shell:openExternal', async (event, url) => {
  await shell.openExternal(url);
});

ipcMain.handle('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Custom protocol for Roblox integration
app.setAsDefaultProtocolClient('roblox-multi-instance');

app.on('open-url', (event, url) => {
  // Handle roblox-multi-instance:// protocol
  event.preventDefault();
  
  if (mainWindow) {
    mainWindow.webContents.send('protocol:handle', url);
  }
});

// Handle protocol on Windows
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    
    // Check for protocol URLs in command line
    const protocolUrl = commandLine.find(arg => arg.startsWith('roblox-multi-instance://'));
    if (protocolUrl) {
      mainWindow.webContents.send('protocol:handle', protocolUrl);
    }
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Performance monitoring
if (isDev) {
  const { powerMonitor } = require('electron');
  
  powerMonitor.on('thermal-state-change', (state) => {
    console.log('Thermal state changed:', state);
  });
  
  powerMonitor.on('speed-limit-change', (limit) => {
    console.log('Speed limit changed:', limit);
  });
}