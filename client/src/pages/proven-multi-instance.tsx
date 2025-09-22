import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Play, 
  Square, 
  Monitor, 
  Cpu, 
  MemoryStick, 
  Clock,
  User,
  Terminal,
  Shield,
  Zap,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Power
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ProvenRobloxClient {
  pid: number;
  windowHandle: string;
  windowClass: string;
  processName: string;
  windowTitle: string;
  commandLine: string;
  username?: string;
  accountName?: string;
  browserTrackerID?: string;
  isActive: boolean;
  isFocused: boolean;
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
  startTime: string;
  lastActive: string;
  logFile?: string;
  status: 'detected' | 'linked' | 'authenticated' | 'error';
}

export default function ProvenMultiInstancePage() {
  const [isMultiInstanceEnabled, setIsMultiInstanceEnabled] = useState(false);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch proven processes
  const { data: processes = [], isLoading: processesLoading } = useQuery<ProvenRobloxClient[]>({
    queryKey: ['/api/roblox/proven-processes'],
    refetchInterval: 3000 // Refresh every 3 seconds
  });

  // Enable multi-instance mutation
  const enableMultiInstanceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/roblox/enable-multi-instance', {});
    },
    onSuccess: (data) => {
      setIsMultiInstanceEnabled(data.success);
      toast({
        title: data.success ? "Multi-Instance Enabled" : "Failed to Enable",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enable multi-instance",
        variant: "destructive"
      });
    }
  });

  // Start monitoring mutation
  const startMonitoringMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/roblox/start-proven-monitoring', {});
    },
    onSuccess: () => {
      setIsMonitoringActive(true);
      toast({
        title: "Monitoring Started",
        description: "Proven multi-instance monitoring is now active"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roblox/proven-processes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start monitoring",
        variant: "destructive"
      });
    }
  });

  // Create UWP instance mutation
  const createUWPInstanceMutation = useMutation({
    mutationFn: async (customName: string) => {
      return apiRequest('POST', '/api/roblox/create-uwp-instance', { customName });
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "UWP Instance Created" : "Failed to Create",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      setNewInstanceName('');
      queryClient.invalidateQueries({ queryKey: ['/api/roblox/proven-processes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create UWP instance",
        variant: "destructive"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'linked': return 'bg-green-500';
      case 'authenticated': return 'bg-blue-500';
      case 'detected': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'linked': return <CheckCircle className="h-4 w-4" />;
      case 'authenticated': return <Shield className="h-4 w-4" />;
      case 'detected': return <Activity className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proven Multi-Instance System</h1>
          <p className="text-muted-foreground">
            Based on analysis of 19+ real-world Roblox multi-instance projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isMultiInstanceEnabled ? "default" : "destructive"}>
            {isMultiInstanceEnabled ? "Mutex Active" : "Mutex Inactive"}
          </Badge>
          <Badge variant={isMonitoringActive ? "default" : "secondary"}>
            {isMonitoringActive ? "Monitoring" : "Stopped"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="processes">Processes</TabsTrigger>
          <TabsTrigger value="uwp">UWP Instances</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{processes.length}</div>
                <p className="text-xs text-muted-foreground">
                  Detected Roblox instances
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Linked Accounts</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processes.filter(p => p.status === 'linked').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Processes with usernames
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Memory</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {processes.reduce((sum, p) => sum + p.resourceUsage.memory, 0)} MB
                </div>
                <p className="text-xs text-muted-foreground">
                  Combined memory usage
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>ROBLOX_singletonMutex</span>
                </div>
                <Badge variant={isMultiInstanceEnabled ? "default" : "destructive"}>
                  {isMultiInstanceEnabled ? "Active" : "Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Process Monitoring</span>
                </div>
                <Badge variant={isMonitoringActive ? "default" : "secondary"}>
                  {isMonitoringActive ? "Running" : "Stopped"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  <span>Command Line Detection</span>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Detected Processes</h2>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/roblox/proven-processes'] })}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {processesLoading ? (
            <div className="text-center py-8">Loading processes...</div>
          ) : processes.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No Roblox processes detected. Make sure Roblox is running and monitoring is enabled.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {processes.map((process) => (
                <Card key={process.pid} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(process.status)}
                        <span className="font-medium">
                          {process.username || process.windowTitle || `Process ${process.pid}`}
                        </span>
                        <Badge variant="outline">PID: {process.pid}</Badge>
                        <Badge variant="outline">Handle: {process.windowHandle}</Badge>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(process.status)}`} />
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <div>Window Class: {process.windowClass}</div>
                        <div>Window Title: {process.windowTitle}</div>
                        {process.browserTrackerID && (
                          <div>Browser Tracker ID: {process.browserTrackerID}</div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {process.resourceUsage.cpu}%
                        </div>
                        <div className="flex items-center gap-1">
                          <MemoryStick className="h-3 w-3" />
                          {process.resourceUsage.memory} MB
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {process.resourceUsage.threads} threads
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Started: {formatTimestamp(process.startTime)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={process.status === 'linked' ? 'default' : 'secondary'}>
                        {process.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="uwp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create UWP Instance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="instanceName">Instance Name</Label>
                <Input
                  id="instanceName"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  placeholder="Enter custom name for new instance"
                />
              </div>
              
              <Button 
                onClick={() => createUWPInstanceMutation.mutate(newInstanceName)}
                disabled={!newInstanceName.trim() || createUWPInstanceMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createUWPInstanceMutation.isPending ? 'Creating...' : 'Create UWP Instance'}
              </Button>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  UWP instance creation requires Windows with developer mode enabled and admin privileges.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  onClick={() => enableMultiInstanceMutation.mutate()}
                  disabled={enableMultiInstanceMutation.isPending || isMultiInstanceEnabled}
                  className="w-full"
                  variant={isMultiInstanceEnabled ? "secondary" : "default"}
                >
                  <Power className="h-4 w-4 mr-2" />
                  {enableMultiInstanceMutation.isPending ? 'Enabling...' : 
                   isMultiInstanceEnabled ? 'Multi-Instance Enabled' : 'Enable Multi-Instance'}
                </Button>
                
                <Button 
                  onClick={() => startMonitoringMutation.mutate()}
                  disabled={startMonitoringMutation.isPending || isMonitoringActive}
                  className="w-full"
                  variant={isMonitoringActive ? "secondary" : "default"}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {startMonitoringMutation.isPending ? 'Starting...' : 
                   isMonitoringActive ? 'Monitoring Active' : 'Start Monitoring'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Implementation Status</h3>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Mutex Bypass (ROBLOX_singletonMutex)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Advanced Process Detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Command Line Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Username Detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>UWP Package Cloning</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}