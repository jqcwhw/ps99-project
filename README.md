# Enhanced Roblox Multi-Instance Manager - Desktop App

## Features
- Native desktop application with embedded server
- Launch multiple Roblox instances simultaneously
- Real-time FPS monitoring (30-1000 FPS support)
- RAM usage tracking and automatic optimization
- Performance statistics dashboard
- Cross-platform support (Windows, Mac, Linux)
- Modern React-based UI with advanced monitoring

## Quick Start

### Option 1: Run Development Version
1. Install dependencies: `npm install`
2. Start the app: `npm run electron:dev`

### Option 2: Build Desktop App
1. Install dependencies: `npm install`
2. Build the app: `npm run electron:build`
3. Find the built app in the `dist` folder

### Option 3: Standalone Mode
1. Run: `node electron-standalone.js`
2. Open http://localhost:5000 in your browser

## Enhanced Performance Features

### FPS Monitoring System
- Real-time FPS tracking for all instances
- Customizable FPS targets (30-1000 FPS)
- Visual progress bars and statistics
- Based on FPSPingGraph.lua techniques

### RAM Management
- System-wide RAM usage monitoring
- Per-instance memory limits (512MB-16GB)
- Automatic cleanup when usage exceeds 85%
- Based on RAMDecrypt optimization methods

### Advanced Dashboard
- Performance cards with live statistics
- Interactive toggle switches for settings
- Real-time progress bars and indicators
- Modern gradient design with responsive layout

## Technical Implementation

### Multi-Instance Engine
- ROBLOX_singletonEvent mutex bypass
- UWP package cloning support
- Multiple launch methods (Direct, Protocol, UWP, PowerShell)
- Cross-platform process management

### Performance Optimization
- ClientAppSettings.json FPS unlocking
- DFIntTaskSchedulerTargetFps modification
- PowerShell-based memory monitoring
- Automatic resource optimization

### Anti-Detection Methods
- Mutex management and bypass
- Registry modification support
- Process isolation techniques
- Based on analysis of 19+ projects

## Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run electron:dev` - Start Electron app in development
- `npm run electron:build` - Build desktop application
- `npm run db:push` - Push database schema changes

## Requirements
- Node.js 18+ (Download from https://nodejs.org/)
- Modern web browser (for standalone mode)
- 4GB+ RAM recommended for multiple instances

Created: January 2025
Version: Enhanced Edition with Advanced Performance Monitoring
Technology: React + Node.js + Electron + PostgreSQL
