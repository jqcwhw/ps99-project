import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Download, Settings, FileText, Zap, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PackageConfig {
  appName: string;
  version: string;
  includeScripts: boolean;
  includePython: boolean;
  includeAutoHotkey: boolean;
  includeExecutor: boolean;
  createInstaller: boolean;
  portableMode: boolean;
}

const StandalonePackager: React.FC = () => {
  const [config, setConfig] = useState<PackageConfig>({
    appName: 'PS99 Enhancement Hub',
    version: '1.0.0',
    includeScripts: true,
    includePython: true,
    includeAutoHotkey: true,
    includeExecutor: false,
    createInstaller: true,
    portableMode: true
  });
  
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildLog, setBuildLog] = useState<string[]>([]);
  const { toast } = useToast();

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setBuildLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const simulateBuild = async () => {
    setIsBuilding(true);
    setBuildProgress(0);
    setBuildLog([]);
    
    const steps = [
      { message: "Initializing build environment...", duration: 1000 },
      { message: "Bundling React application...", duration: 2000 },
      { message: "Installing Python dependencies...", duration: 1500 },
      { message: "Packaging AutoHotkey scripts...", duration: 1000 },
      { message: "Creating Electron wrapper...", duration: 2000 },
      { message: "Generating batch files...", duration: 500 },
      { message: "Creating installer package...", duration: 1500 },
      { message: "Build complete!", duration: 500 }
    ];
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      addToLog(step.message);
      
      await new Promise(resolve => setTimeout(resolve, step.duration));
      setBuildProgress(((i + 1) / steps.length) * 100);
    }
    
    setIsBuilding(false);
    toast({
      title: "📦 Build Complete!",
      description: "Standalone application has been packaged successfully",
    });
  };

  const downloadPackage = () => {
    // Simulate creating and downloading a package
    const packageInfo = {
      name: config.appName,
      version: config.version,
      timestamp: new Date().toISOString(),
      includes: {
        scripts: config.includeScripts,
        python: config.includePython,
        autohotkey: config.includeAutoHotkey,
        executor: config.includeExecutor
      }
    };
    
    const blob = new Blob([JSON.stringify(packageInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.appName.replace(/\s+/g, '_')}_v${config.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "💾 Package Downloaded",
      description: "Package configuration saved to your downloads",
    });
  };

  const estimatedSize = () => {
    let size = 150; // Base React app
    if (config.includePython) size += 50;
    if (config.includeAutoHotkey) size += 20;
    if (config.includeExecutor) size += 30;
    if (config.includeScripts) size += 10;
    return size;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Standalone App Packager</h2>
          <p className="text-muted-foreground">
            Package the PS99 Enhancement Hub as a standalone desktop application
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={simulateBuild} 
            disabled={isBuilding}
            className="flex items-center space-x-2"
          >
            <Package className="h-4 w-4" />
            <span>{isBuilding ? "Building..." : "Build Package"}</span>
          </Button>
          <Button 
            onClick={downloadPackage} 
            variant="outline"
            disabled={isBuilding}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="build">Build Process</TabsTrigger>
          <TabsTrigger value="output">Output Files</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Package Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure your standalone application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input
                    id="appName"
                    value={config.appName}
                    onChange={(e) => setConfig(prev => ({ ...prev, appName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={config.version}
                    onChange={(e) => setConfig(prev => ({ ...prev, version: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Include Components</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeScripts"
                      checked={config.includeScripts}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeScripts: !!checked }))}
                    />
                    <Label htmlFor="includeScripts">PS99 Scripts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includePython"
                      checked={config.includePython}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includePython: !!checked }))}
                    />
                    <Label htmlFor="includePython">Python Runtime</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAutoHotkey"
                      checked={config.includeAutoHotkey}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeAutoHotkey: !!checked }))}
                    />
                    <Label htmlFor="includeAutoHotkey">AutoHotkey Runtime</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeExecutor"
                      checked={config.includeExecutor}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, includeExecutor: !!checked }))}
                    />
                    <Label htmlFor="includeExecutor">Roblox Executor</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Package Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createInstaller"
                      checked={config.createInstaller}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, createInstaller: !!checked }))}
                    />
                    <Label htmlFor="createInstaller">Create Installer (.exe)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="portableMode"
                      checked={config.portableMode}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, portableMode: !!checked }))}
                    />
                    <Label htmlFor="portableMode">Portable Mode</Label>
                  </div>
                </div>
              </div>
              
              <Alert>
                <Package className="h-4 w-4" />
                <AlertDescription>
                  Estimated package size: ~{estimatedSize()}MB
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="build" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Build Progress</span>
              </CardTitle>
              <CardDescription>
                Monitor the packaging process in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isBuilding && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Building Package</span>
                    <span>{Math.round(buildProgress)}%</span>
                  </div>
                  <Progress value={buildProgress} className="w-full" />
                </div>
              )}
              
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
                {buildLog.length === 0 ? (
                  <p>Build log will appear here...</p>
                ) : (
                  buildLog.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="output" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Output Structure</span>
              </CardTitle>
              <CardDescription>
                Files that will be included in your standalone package
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>📁 {config.appName}/</span>
                </div>
                <div className="ml-6 space-y-1">
                  <div>📄 {config.appName}.exe</div>
                  <div>📄 launcher.bat</div>
                  <div>📁 resources/</div>
                  {config.includeScripts && <div className="ml-4">📁 scripts/</div>}
                  {config.includePython && <div className="ml-4">📁 python/</div>}
                  {config.includeAutoHotkey && <div className="ml-4">📁 autohotkey/</div>}
                  {config.includeExecutor && <div className="ml-4">📁 executor/</div>}
                  <div className="ml-4">📁 web/</div>
                  <div className="ml-4">📄 config.json</div>
                  <div className="ml-4">📄 README.txt</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StandalonePackager;