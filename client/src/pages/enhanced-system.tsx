import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Square, 
  Settings, 
  Shield, 
  Cpu, 
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface RobloxProcess {
  pid: number;
  instanceId: string;
  accountId?: number;
  status: 'launching' | 'running' | 'crashed' | 'stopped';
  resourceUsage: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  startTime: string;
}

interface MutexStatus {
  isActive: boolean;
  processId?: number;
  createdAt?: string;
  error?: string;
}

export default function EnhancedSystemPage() {
  const queryClient = useQueryClient();
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null);

  // Fetch mutex status
  const { data: mutexStatus } = useQuery<MutexStatus>({
    queryKey: ['/api/roblox/mutex-status'],
    refetchInterval: 5000,
  });

  // Fetch enhanced processes
  const { data: processes = [] } = useQuery<RobloxProcess[]>({
    queryKey: ['/api/roblox/enhanced-processes'],
    refetchInterval: 3000,
  });

  // Create mutex mutation
  const createMutexMutation = useMutation({
    mutationFn: () => fetch('/api/roblox/mutex/create', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roblox/mutex-status'] });
    },
  });

  // Launch process mutation
  const launchProcessMutation = useMutation({
    mutationFn: (data: any) => 
      fetch('/api/roblox/enhanced-processes/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roblox/enhanced-processes'] });
    },
  });

  // Stop process mutation
  const stopProcessMutation = useMutation({
    mutationFn: (instanceId: string) => 
      fetch(`/api/roblox/enhanced-processes/${instanceId}/stop`, { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roblox/enhanced-processes'] });
    },
  });

  const handleLaunchTestInstance = () => {
    const instanceId = `test-${Date.now()}`;
    launchProcessMutation.mutate({
      instanceId,
      accountId: 1,
      gameUrl: 'https://www.roblox.com/games/606849621/Jailbreak',
      windowPosition: { x: 100, y: 100, width: 800, height: 600 },
      resourceLimits: { maxCpu: 50, maxMemory: 2048, priority: 'normal' }
    });
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Roblox System</h1>
          <p className="text-muted-foreground">
            Advanced multi-instance management with anti-detection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={mutexStatus?.isActive ? "default" : "destructive"}>
            {mutexStatus?.isActive ? "Protected" : "Vulnerable"}
          </Badge>
          <Zap className="h-5 w-5 text-blue-500" />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
          <TabsTrigger value="protection">Protection</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processes.filter(p => p.status === 'running').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {processes.length} total instances
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Protection Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {mutexStatus?.isActive ? 'Active' : 'Inactive'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Multi-instance enabled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resource Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(processes.reduce((acc, p) => acc + p.resourceUsage.cpu, 0))}%
                </div>
                <p className="text-xs text-muted-foreground">
                  CPU across all instances
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={() => createMutexMutation.mutate()}
                  disabled={createMutexMutation.isPending || mutexStatus?.isActive}
                  variant={mutexStatus?.isActive ? "outline" : "default"}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {mutexStatus?.isActive ? 'Protection Active' : 'Enable Protection'}
                </Button>
                
                <Button 
                  onClick={handleLaunchTestInstance}
                  disabled={launchProcessMutation.isPending}
                  variant="secondary"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Launch Test Instance
                </Button>
              </div>

              {!mutexStatus?.isActive && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Multi-instance protection is not active. Enable protection before launching multiple instances.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Running Processes</h3>
            <Button 
              onClick={handleLaunchTestInstance}
              disabled={launchProcessMutation.isPending}
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              New Instance
            </Button>
          </div>

          <div className="grid gap-4">
            {processes.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    No Roblox processes currently running
                  </div>
                </CardContent>
              </Card>
            ) : (
              processes.map((process) => (
                <Card key={process.instanceId} className="cursor-pointer hover:bg-accent/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(process.status)}`} />
                        <div>
                          <div className="font-medium">Instance {process.instanceId}</div>
                          <div className="text-sm text-muted-foreground">
                            PID: {process.pid} | Started: {new Date(process.startTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            CPU: {process.resourceUsage.cpu}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Memory: {process.resourceUsage.memory}MB
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {getStatusIcon(process.status)}
                            <span className="ml-1">{process.status}</span>
                          </Badge>
                          
                          {process.status === 'running' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => stopProcessMutation.mutate(process.instanceId)}
                              disabled={stopProcessMutation.isPending}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="protection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Instance Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Roblox Singleton Mutex</div>
                  <div className="text-sm text-muted-foreground">
                    Bypasses Roblox's single-instance limitation
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={mutexStatus?.isActive ? "default" : "destructive"}>
                    {mutexStatus?.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {!mutexStatus?.isActive && (
                    <Button 
                      size="sm"
                      onClick={() => createMutexMutation.mutate()}
                      disabled={createMutexMutation.isPending}
                    >
                      Enable
                    </Button>
                  )}
                </div>
              </div>

              {mutexStatus?.error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Protection Error: {mutexStatus.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {processes.map((process) => (
                    <div key={process.instanceId} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Instance {process.instanceId}</span>
                      <div className="flex items-center space-x-4">
                        <div className="w-20">
                          <div className="text-xs text-muted-foreground">CPU</div>
                          <Progress value={process.resourceUsage.cpu} className="h-2" />
                        </div>
                        <div className="w-20">
                          <div className="text-xs text-muted-foreground">Memory</div>
                          <Progress value={(process.resourceUsage.memory / 2048) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}