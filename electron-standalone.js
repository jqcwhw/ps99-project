const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const cors = require('cors');

// Enable live reload for development
if (process.env.NODE_ENV === 'development') {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

let mainWindow;
let serverProcess;
let serverPort = 3000;

// Create Express server for standalone mode
function createServer() {
  const server = express();
  server.use(cors());
  server.use(express.json());
  server.use(express.static(path.join(__dirname, 'dist')));

  // Import and use routes
  const routes = require('./server/routes');
  server.use('/', routes);

  // Start server on available port
  const startServer = (port) => {
    return new Promise((resolve, reject) => {
      const listener = server.listen(port, 'localhost', (err) => {
        if (err) {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying ${port + 1}`);
            startServer(port + 1).then(resolve).catch(reject);
          } else {
            reject(err);
          }
        } else {
          console.log(`Server running on http://localhost:${port}`);
          serverPort = port;
          resolve(listener);
        }
      });
    });
  };

  return startServer(3000);
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'electron-preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  // Remove default menu in production
  if (process.env.NODE_ENV === 'production') {
    Menu.setApplicationMenu(null);
  }

  // Load the app
  const loadApp = () => {
    mainWindow.loadURL(`http://localhost:${serverPort}`);
  };

  // Start embedded server first
  createServer()
    .then(() => {
      loadApp();
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      dialog.showErrorBox('Server Error', 'Failed to start the application server.');
      app.quit();
    });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window
    if (process.platform === 'darwin') {
      app.dock.show();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Development tools
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // Allow self-signed certificates in development
  if (process.env.NODE_ENV === 'development') {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });
});