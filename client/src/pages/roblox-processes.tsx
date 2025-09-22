import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Monitor, 
  User, 
  Link, 
  X, 
  Activity, 
  Cpu, 
  MemoryStick, 
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Square
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface RobloxProcess {
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
  startTime: string;
  lastActive: string;
  status: 'detected' | 'linked' | 'authenticated' | 'error';
}

interface ProcessStats {
  totalProcesses: number;
  linkedProcesses: number;
  unlinkedProcesses: number;
  averageMemory: number;
  averageCpu: number;
}

interface Account {
  id: number;
  username: string;
  displayName: string;
  roblosecurity?: string;
}

export default function RobloxProcesses() {
  const [selectedProcess, setSelectedProcess] = useState<RobloxProcess | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [manualUsername, setManualUsername] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch detected processes
  const { data: processes = [], isLoading: processesLoading } = useQuery<RobloxProcess[]>({
    queryKey: ['/api/roblox/processes'],
    refetchInterval: 2000 // Refresh every 2 seconds
  });

  // Fetch process statistics
  const { data: stats } = useQuery<ProcessStats>({
    queryKey: ['/api/roblox/processes/stats'],
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch accounts for linking
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['/api/accounts']
  });

  // Link process to username mutation
  const linkProcessMutation = useMutation({
    mutationFn: async (data: { pid: number; username: string }) => {
      return apiRequest('POST', `/api/roblox/processes/${data.pid}/link`, { username: data.username });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roblox/processes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roblox/processes/stats'] });
      setLinkDialogOpen(false);
      setSelectedProcess(null);
      setManualUsername('');
      setSelectedAccountId(null);
      toast({
        title: "Success",
        description: "Process linked to username successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to link process",
        variant: "destructive",
      });
    },
  });

  // Kill process mutation
  const killProcessMutation = useMutation({
    mutationFn: async (pid: number) => {
      return apiRequest('DELETE', `/api/roblox/processes/${pid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/roblox/processes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roblox/processes/stats'] });
      toast({
        title: "Success",
        description: "Process terminated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to terminate process",
        variant: "destructive",
      });
    },
  });

  const handleLinkProcess = (process: RobloxProcess) => {
    setSelectedProcess(process);
    setLinkDialogOpen(true);
  };

  const handleSubmitLink = () => {
    if (!selectedProcess) return;

    let usernameToLink = '';
    
    if (selectedAccountId) {
      const account = accounts.find(acc => acc.id === selectedAccountId);
      if (account) {
        usernameToLink = account.username;
      }
    } else if (manualUsername.trim()) {
      usernameToLink = manualUsername.trim();
    }

    if (!usernameToLink) {
      toast({
        title: "Error",
        description: "Please select an account or enter a username",
        variant: "destructive",
      });
      return;
    }

    linkProcessMutation.mutate({
      pid: selectedProcess.pid,
      username: usernameToLink
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'linked':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'detected':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'authenticated':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'linked':
        return 'bg-green-500';
      case 'detected':
        return 'bg-yellow-500';
      case 'authenticated':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatMemory = (mb: number) => {
    return mb > 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
  };

  const formatUptime = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roblox Process Detection</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/roblox/processes'] })}
          disabled={processesLoading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${processesLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Processes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProcesses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Linked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.linkedProcesses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unlinked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.unlinkedProcesses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Memory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMemory(stats.averageMemory)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg CPU</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageCpu.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Process List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Detected Roblox Processes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processesLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Scanning for processes...
            </div>
          ) : processes.length === 0 ? (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                No Roblox processes detected. Launch Roblox to see processes here.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {processes.map((process) => (
                <div
                  key={process.pid}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      {getStatusIcon(process.status)}
                      <span className="text-xs text-muted-foreground mt-1">
                        PID: {process.pid}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {process.processName}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {process.windowClass}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(process.status)}`}>
                          {process.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm font-medium truncate">
                        {process.windowTitle || 'No window title'}
                      </div>
                      
                      {process.username && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="w-3 h-3" />
                          {process.username}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Resource Usage */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        {process.resourceUsage.cpu}%
                      </div>
                      <div className="flex items-center gap-1">
                        <MemoryStick className="w-3 h-3" />
                        {formatMemory(process.resourceUsage.memory)}
                      </div>
                      <div className="text-xs">
                        {formatUptime(process.startTime)}
                      </div>
                    </div>

                    {/* Window Info */}
                    <div className="text-xs text-muted-foreground">
                      <div>Handle: {process.windowHandle}</div>
                      <div>{process.windowGeometry.width}x{process.windowGeometry.height}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {process.status === 'detected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLinkProcess(process)}
                          disabled={linkProcessMutation.isPending}
                        >
                          <Link className="w-3 h-3 mr-1" />
                          Link User
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => killProcessMutation.mutate(process.pid)}
                        disabled={killProcessMutation.isPending}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Kill
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Process Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Process to Username</DialogTitle>
          </DialogHeader>
          
          {selectedProcess && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">Process Information</div>
                <div className="text-xs text-muted-foreground mt-1">
                  PID: {selectedProcess.pid} | {selectedProcess.processName}
                </div>
                <div className="text-xs text-muted-foreground">
                  Window: {selectedProcess.windowTitle || 'No title'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Class: {selectedProcess.windowClass} | Handle: {selectedProcess.windowHandle}
                </div>
              </div>

              <Tabs defaultValue="accounts" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="accounts">Existing Accounts</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                
                <TabsContent value="accounts" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="account-select">Select Account</Label>
                    <Select 
                      value={selectedAccountId?.toString() || ""} 
                      onValueChange={(value) => setSelectedAccountId(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an account..." />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.username} ({account.displayName})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
                
                <TabsContent value="manual" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={manualUsername}
                      onChange={(e) => setManualUsername(e.target.value)}
                      placeholder="Enter Roblox username..."
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitLink}
                  disabled={linkProcessMutation.isPending}
                >
                  {linkProcessMutation.isPending ? 'Linking...' : 'Link Process'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}