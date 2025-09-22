import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Play, 
  Square, 
  Trash2, 
  Plus, 
  Monitor, 
  Cpu, 
  MemoryStick, 
  Zap,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  GamepadIcon,
  Layers,
  RotateCw,
  Shield
} from "lucide-react";

interface UWPInstance {
  id: string;
  name: string;
  displayName: string;
  packageName: string;
  path: string;
  publisherId: string;
  isRunning: boolean;
  processId?: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  accountId?: number;
  windowPosition?: { x: number; y: number; width: number; height: number };
}

interface Account {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
  roblosecurity?: string;
  robux?: number;
  isPremium?: boolean;
  status?: string;
  lastActive?: string;
  currentLocation?: string;
  petsObtained?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function UWPInstancesPage() {
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [instanceName, setInstanceName] = useState("");
  const [gameId, setGameId] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLaunchDialogOpen, setIsLaunchDialogOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<UWPInstance | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch UWP instances
  const { data: instances = [], isLoading: isLoadingInstances } = useQuery<UWPInstance[]>({
    queryKey: ["/api/uwp-instances"],
    refetchInterval: 3000 // Refresh every 3 seconds for real-time updates
  });

  // Fetch accounts for assignment
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["/api/accounts"]
  });

  // Create instance mutation
  const createInstanceMutation = useMutation({
    mutationFn: async (data: { name: string; accountId?: number }) => {
      return apiRequest("POST", "/api/uwp-instances", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uwp-instances"] });
      setIsCreateDialogOpen(false);
      setInstanceName("");
      setSelectedAccount("");
      toast({
        title: "Success",
        description: "UWP instance created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create instance",
        variant: "destructive",
      });
    },
  });

  // Launch instance mutation
  const launchInstanceMutation = useMutation({
    mutationFn: async (data: { id: string; gameId?: string }) => {
      return apiRequest("POST", `/api/uwp-instances/${data.id}/launch`, { gameId: data.gameId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uwp-instances"] });
      setIsLaunchDialogOpen(false);
      setGameId("");
      toast({
        title: "Success",
        description: "Instance launched successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to launch instance",
        variant: "destructive",
      });
    },
  });

  // Close instance mutation
  const closeInstanceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/uwp-instances/${id}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uwp-instances"] });
      toast({
        title: "Success",
        description: "Instance closed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to close instance",
        variant: "destructive",
      });
    },
  });

  // Remove instance mutation
  const removeInstanceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/uwp-instances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/uwp-instances"] });
      toast({
        title: "Success",
        description: "Instance removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove instance",
        variant: "destructive",
      });
    },
  });

  // Organize windows mutation
  const organizeWindowsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/uwp-instances/organize", {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Windows organized successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to organize windows",
        variant: "destructive",
      });
    },
  });

  const runningInstances = instances.filter(instance => instance.isRunning);
  const totalCpuUsage = runningInstances.reduce((sum, instance) => sum + instance.resourceUsage.cpu, 0);
  const totalMemoryUsage = runningInstances.reduce((sum, instance) => sum + instance.resourceUsage.memory, 0);
  const totalGpuUsage = runningInstances.reduce((sum, instance) => sum + instance.resourceUsage.gpu, 0);

  const handleCreateInstance = () => {
    if (!instanceName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an instance name",
        variant: "destructive",
      });
      return;
    }

    createInstanceMutation.mutate({
      name: instanceName.trim(),
      accountId: selectedAccount ? parseInt(selectedAccount) : undefined,
    });
  };

  const handleLaunchInstance = () => {
    if (!selectedInstance) return;

    launchInstanceMutation.mutate({
      id: selectedInstance.id,
      gameId: gameId.trim() || undefined,
    });
  };

  const openLaunchDialog = (instance: UWPInstance) => {
    setSelectedInstance(instance);
    setIsLaunchDialogOpen(true);
  };

  if (isLoadingInstances) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RotateCw className="h-6 w-6 animate-spin" />
          <span>Loading UWP instances...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">UWP Instance Manager</h1>
          <p className="text-muted-foreground">
            Create and manage multiple Roblox instances using UWP technology
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => organizeWindowsMutation.mutate()}
            disabled={organizeWindowsMutation.isPending || runningInstances.length === 0}
            variant="outline"
            size="sm"
          >
            <Layers className="h-4 w-4 mr-2" />
            Organize Windows
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Instance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New UWP Instance</DialogTitle>
                <DialogDescription>
                  Create a new Roblox UWP instance with a unique identity
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="instanceName">Instance Name</Label>
                  <Input
                    id="instanceName"
                    placeholder="Enter instance name (e.g., MainAccount)"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="account">Assign Account (Optional)</Label>
                  <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Account</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.username} {account.displayName && `(${account.displayName})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateInstance}
                  disabled={createInstanceMutation.isPending}
                >
                  {createInstanceMutation.isPending ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Instance
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* System Resource Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="h-5 w-5 mr-2" />
            System Resources
          </CardTitle>
          <CardDescription>
            Real-time resource usage across all running instances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Cpu className="h-4 w-4 mr-2 text-blue-500" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {totalCpuUsage.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(totalCpuUsage, 100)} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MemoryStick className="h-4 w-4 mr-2 text-green-500" />
                  <span className="text-sm font-medium">Memory</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {(totalMemoryUsage / 1024).toFixed(1)} GB
                </span>
              </div>
              <Progress value={Math.min(totalMemoryUsage / 10, 100)} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                  <span className="text-sm font-medium">GPU Usage</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {totalGpuUsage.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(totalGpuUsage, 100)} className="h-2" />
            </div>
          </div>
          
          {runningInstances.length > 0 && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {runningInstances.length} instance{runningInstances.length !== 1 ? 's' : ''} currently running
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.map((instance) => {
          const assignedAccount = accounts.find(acc => acc.id === instance.accountId);
          
          return (
            <Card key={instance.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{instance.displayName}</CardTitle>
                  <Badge variant={instance.isRunning ? "default" : "secondary"}>
                    {instance.isRunning ? "Running" : "Stopped"}
                  </Badge>
                </div>
                <CardDescription>
                  {assignedAccount ? (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {assignedAccount.username}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No account assigned</span>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Resource Usage */}
                {instance.isRunning && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Resource Usage</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>CPU</span>
                        <span>{instance.resourceUsage.cpu.toFixed(1)}%</span>
                      </div>
                      <Progress value={instance.resourceUsage.cpu} className="h-1" />
                      
                      <div className="flex justify-between text-xs">
                        <span>Memory</span>
                        <span>{(instance.resourceUsage.memory / 1024).toFixed(1)} GB</span>
                      </div>
                      <Progress value={Math.min(instance.resourceUsage.memory / 10, 100)} className="h-1" />
                    </div>
                  </div>
                )}
                
                {/* Process Info */}
                {instance.processId && (
                  <div className="text-xs text-muted-foreground">
                    Process ID: {instance.processId}
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {!instance.isRunning ? (
                    <Button
                      size="sm"
                      onClick={() => openLaunchDialog(instance)}
                      disabled={launchInstanceMutation.isPending}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Launch
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => closeInstanceMutation.mutate(instance.id)}
                      disabled={closeInstanceMutation.isPending}
                      className="flex-1"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeInstanceMutation.mutate(instance.id)}
                    disabled={removeInstanceMutation.isPending || instance.isRunning}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {instances.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No UWP Instances</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Create your first UWP instance to start managing multiple Roblox clients. 
              UWP instances provide better isolation and security.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Instance
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Launch Dialog */}
      <Dialog open={isLaunchDialogOpen} onOpenChange={setIsLaunchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Launch Instance</DialogTitle>
            <DialogDescription>
              Launch {selectedInstance?.displayName} with optional game ID
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="gameId">Game ID (Optional)</Label>
              <Input
                id="gameId"
                placeholder="Enter Roblox game ID (e.g., 606849621)"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to launch Roblox main menu
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLaunchDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLaunchInstance}
              disabled={launchInstanceMutation.isPending}
            >
              {launchInstanceMutation.isPending ? (
                <>
                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Launch Instance
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}