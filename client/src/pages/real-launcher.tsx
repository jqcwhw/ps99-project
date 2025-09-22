import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Play, Square, Activity, CheckCircle, XCircle, AlertTriangle, Monitor, Settings, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RealProcess {
  pid: number;
  instanceId: string;
  accountId: number;
  startTime: string;
  status: 'launching' | 'running' | 'crashed' | 'stopped';
  windowHandle?: string;
  resourceUsage: { cpu: number; memory: number; gpu: number };
  launchMethod: string;
  gameUrl?: string;
}

interface LaunchOptions {
  instanceId: string;
  accountId: number;
  gameUrl?: string;
  authCookie?: string;
  windowPosition?: { x: number; y: number; width: number; height: number };
  resourceLimits?: { maxCpu: number; maxMemory: number; priority: string };
  launchMethod?: 'protocol' | 'direct' | 'uwp' | 'powershell' | 'auto';
}

export default function RealLauncher() {
  const [launchOptions, setLaunchOptions] = useState<LaunchOptions>({
    instanceId: '',
    accountId: 1,
    gameUrl: '',
    authCookie: '',
    launchMethod: 'auto'
  });
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch real processes
  const { data: processes = [], isLoading: processesLoading } = useQuery({
    queryKey: ['/api/roblox/real-processes'],
    refetchInterval: 2000
  });

  // Launch instance mutation
  const launchMutation = useMutation({
    mutationFn: async (options: LaunchOptions) => {
      const response = await fetch('/api/roblox/launch-real-instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to launch instance');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Instance Launched",
        description: `Successfully launched instance ${data.instanceId} using ${data.launchMethod}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roblox/real-processes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Launch Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Stop instance mutation
  const stopMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      const response = await fetch(`/api/roblox/real-instances/${instanceId}/stop`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to stop instance');
      }
      
      return response.json();
    },
    onSuccess: (data, instanceId) => {
      toast({
        title: "Instance Stopped",
        description: `Successfully stopped instance ${instanceId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roblox/real-processes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Stop Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleLaunch = () => {
    if (!launchOptions.instanceId || !launchOptions.accountId) {
      toast({
        title: "Missing Information",
        description: "Please provide instance ID and account ID",
        variant: "destructive",
      });
      return;
    }

    const options = {
      ...launchOptions,
      instanceId: launchOptions.instanceId || `instance-${Date.now()}`,
      windowPosition: { x: 100, y: 100, width: 1200, height: 800 },
      resourceLimits: { maxCpu: 80, maxMemory: 4096, priority: 'normal' }
    };

    launchMutation.mutate(options);
  };

  const handleStop = (instanceId: string) => {
    stopMutation.mutate(instanceId);
  };

  const handleQuickLaunch = (gameUrl: string, gameName: string) => {
    const instanceId = `quick-${Date.now()}`;
    const options = {
      instanceId,
      accountId: 1,
      gameUrl,
      launchMethod: 'auto' as const,
      windowPosition: { x: 100, y: 100, width: 1200, height: 800 },
      resourceLimits: { maxCpu: 80, maxMemory: 4096, priority: 'normal' }
    };

    launchMutation.mutate(options);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'launching': return 'bg-yellow-500';
      case 'crashed': return 'bg-red-500';
      case 'stopped': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <CheckCircle className="h-4 w-4" />;
      case 'launching': return <Activity className="h-4 w-4 animate-pulse" />;
      case 'crashed': return <XCircle className="h-4 w-4" />;
      case 'stopped': return <Square className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatMemory = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
  };

  const totalProcesses = processes.length;
  const runningProcesses = processes.filter((p: RealProcess) => p.status === 'running').length;
  const launchingProcesses = processes.filter((p: RealProcess) => p.status === 'launching').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Real Process Launcher</h1>
          <p className="text-muted-foreground mt-2">Launch and manage actual Roblox instances with proven methods</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="bg-blue-50 border-blue-200">
            <Zap className="h-4 w-4 mr-2 text-blue-600" />
            Real Launching
          </Badge>
          <Badge variant="outline">
            {totalProcesses} Total • {runningProcesses} Running
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="launch" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="launch">Launch Instance</TabsTrigger>
          <TabsTrigger value="processes">Active Processes</TabsTrigger>
          <TabsTrigger value="quick">Quick Launch</TabsTrigger>
        </TabsList>

        <TabsContent value="launch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Launch Configuration
              </CardTitle>
              <CardDescription>
                Configure and launch real Roblox instances using proven methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instanceId">Instance ID</Label>
                  <Input
                    id="instanceId"
                    value={launchOptions.instanceId}
                    onChange={(e) => setLaunchOptions({...launchOptions, instanceId: e.target.value})}
                    placeholder="e.g., instance-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountId">Account ID</Label>
                  <Input
                    id="accountId"
                    type="number"
                    value={launchOptions.accountId}
                    onChange={(e) => setLaunchOptions({...launchOptions, accountId: parseInt(e.target.value) || 1})}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameUrl">Game URL (Optional)</Label>
                <Input
                  id="gameUrl"
                  value={launchOptions.gameUrl}
                  onChange={(e) => setLaunchOptions({...launchOptions, gameUrl: e.target.value})}
                  placeholder="https://www.roblox.com/games/606849621/Jailbreak"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="authCookie">Auth Cookie (Optional)</Label>
                <Input
                  id="authCookie"
                  type="password"
                  value={launchOptions.authCookie}
                  onChange={(e) => setLaunchOptions({...launchOptions, authCookie: e.target.value})}
                  placeholder=".ROBLOSECURITY cookie"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="launchMethod">Launch Method</Label>
                <Select 
                  value={launchOptions.launchMethod} 
                  onValueChange={(value) => setLaunchOptions({...launchOptions, launchMethod: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Recommended)</SelectItem>
                    <SelectItem value="protocol">Protocol Handler</SelectItem>
                    <SelectItem value="direct">Direct Execution</SelectItem>
                    <SelectItem value="uwp">UWP Shell</SelectItem>
                    <SelectItem value="powershell">PowerShell</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This will launch actual Roblox processes. Make sure you have proper authentication if joining games.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleLaunch}
                disabled={launchMutation.isPending}
                className="w-full"
              >
                {launchMutation.isPending ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Launch Instance
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Active Processes ({processes.length})
              </CardTitle>
              <CardDescription>
                Monitor and manage all running Roblox instances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {processesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 h-20 rounded-lg" />
                  ))}
                </div>
              ) : processes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active processes found</p>
                  <p className="text-sm mt-2">Launch an instance to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {processes.map((process: RealProcess) => (
                    <div key={process.instanceId} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full ${getStatusColor(process.status)}`} />
                          <div>
                            <h3 className="font-semibold">{process.instanceId}</h3>
                            <p className="text-sm text-muted-foreground">
                              PID: {process.pid} • Method: {process.launchMethod}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={process.status === 'running' ? 'default' : 'secondary'}>
                            {getStatusIcon(process.status)}
                            <span className="ml-2 capitalize">{process.status}</span>
                          </Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStop(process.instanceId)}
                            disabled={stopMutation.isPending}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="font-medium">Memory Usage</p>
                          <p className="text-muted-foreground">{formatMemory(process.resourceUsage.memory)}</p>
                        </div>
                        <div>
                          <p className="font-medium">CPU Usage</p>
                          <p className="text-muted-foreground">{process.resourceUsage.cpu}%</p>
                        </div>
                        <div>
                          <p className="font-medium">Started</p>
                          <p className="text-muted-foreground">
                            {new Date(process.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      
                      {process.gameUrl && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium">Game URL:</p>
                          <p className="text-sm text-muted-foreground truncate">{process.gameUrl}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Launch
              </CardTitle>
              <CardDescription>
                Launch popular games with one click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-16 flex-col"
                  onClick={() => handleQuickLaunch('https://www.roblox.com/games/606849621/Jailbreak', 'Jailbreak')}
                  disabled={launchMutation.isPending}
                >
                  <span className="font-semibold">Jailbreak</span>
                  <span className="text-sm text-muted-foreground">Popular Crime Game</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-16 flex-col"
                  onClick={() => handleQuickLaunch('https://www.roblox.com/games/155615604/Prison-Life', 'Prison Life')}
                  disabled={launchMutation.isPending}
                >
                  <span className="font-semibold">Prison Life</span>
                  <span className="text-sm text-muted-foreground">Escape Game</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-16 flex-col"
                  onClick={() => handleQuickLaunch('https://www.roblox.com/games/537413528/Build-A-Boat-For-Treasure', 'Build A Boat')}
                  disabled={launchMutation.isPending}
                >
                  <span className="font-semibold">Build A Boat</span>
                  <span className="text-sm text-muted-foreground">Building Game</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-16 flex-col"
                  onClick={() => handleQuickLaunch('', 'Roblox Home')}
                  disabled={launchMutation.isPending}
                >
                  <span className="font-semibold">Roblox Home</span>
                  <span className="text-sm text-muted-foreground">Main Menu</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}