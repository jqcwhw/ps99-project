import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Play, 
  Square, 
  Trash2, 
  Plus, 
  Link, 
  Unlink,
  Repeat,
  Eye,
  Download,
  Upload,
  Settings,
  Users,
  Radio,
  Copy,
  RotateCw,
  Zap,
  Target,
  Circle,
  PlayCircle,
  StopCircle
} from "lucide-react";

interface SyncAction {
  id: string;
  type: 'click' | 'keypress' | 'scroll' | 'navigate' | 'wait';
  target?: string;
  coordinates?: { x: number; y: number };
  key?: string;
  text?: string;
  url?: string;
  duration?: number;
  timestamp: number;
}

interface AccountSync {
  masterInstanceId: string;
  slaveInstanceIds: string[];
  isActive: boolean;
  syncMode: 'mirror' | 'follow' | 'coordinate';
  delay: number;
  actionQueue: SyncAction[];
}

interface UWPInstance {
  id: string;
  name: string;
  displayName: string;
  packageName: string;
  isRunning: boolean;
  resourceUsage: {
    cpu: number;
    memory: number;
    gpu: number;
  };
  accountId?: number;
}

export default function SyncManagerPage() {
  const [masterInstance, setMasterInstance] = useState<string>("");
  const [slaveInstances, setSlaveInstances] = useState<string[]>([]);
  const [syncMode, setSyncMode] = useState<"mirror" | "follow" | "coordinate">("mirror");
  const [delay, setDelay] = useState(100);
  const [recordingInstance, setRecordingInstance] = useState<string>("");
  const [playbackInstances, setPlaybackInstances] = useState<string[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<string>("");
  const [recordingName, setRecordingName] = useState("");
  const [isCreateSyncDialogOpen, setIsCreateSyncDialogOpen] = useState(false);
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false);
  const [isPlaybackDialogOpen, setIsPlaybackDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch UWP instances
  const { data: instances = [] } = useQuery<UWPInstance[]>({
    queryKey: ["/api/uwp-instances"],
    refetchInterval: 3000
  });

  // Fetch active sync sessions
  const { data: syncSessions = [] } = useQuery<AccountSync[]>({
    queryKey: ["/api/sync-sessions"],
    refetchInterval: 2000
  });

  // Fetch available recordings
  const { data: recordings = [] } = useQuery<string[]>({
    queryKey: ["/api/recordings"]
  });

  // Create sync session mutation
  const createSyncMutation = useMutation({
    mutationFn: async (data: { 
      masterInstanceId: string; 
      slaveInstanceIds: string[]; 
      mode: string; 
      delay: number 
    }) => {
      return apiRequest("/api/sync-sessions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sync-sessions"] });
      setIsCreateSyncDialogOpen(false);
      setMasterInstance("");
      setSlaveInstances([]);
      toast({
        title: "Success",
        description: "Sync session started successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start sync session",
        variant: "destructive",
      });
    },
  });

  // Stop sync session mutation
  const stopSyncMutation = useMutation({
    mutationFn: async (syncId: string) => {
      return apiRequest(`/api/sync-sessions/${syncId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sync-sessions"] });
      toast({
        title: "Success",
        description: "Sync session stopped",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop sync session",
        variant: "destructive",
      });
    },
  });

  // Start recording mutation
  const startRecordingMutation = useMutation({
    mutationFn: async (instanceId: string) => {
      return apiRequest("/api/recording/start", {
        method: "POST",
        body: JSON.stringify({ instanceId }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Recording started",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start recording",
        variant: "destructive",
      });
    },
  });

  // Stop recording mutation
  const stopRecordingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/recording/stop", {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] });
      toast({
        title: "Success",
        description: `Recording stopped with ${data.actions?.length || 0} actions captured`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop recording",
        variant: "destructive",
      });
    },
  });

  // Playback actions mutation
  const playbackMutation = useMutation({
    mutationFn: async (data: { actions: SyncAction[]; targetInstanceIds: string[] }) => {
      return apiRequest("/api/recording/playback", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Playback completed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to playback actions",
        variant: "destructive",
      });
    },
  });

  const runningInstances = instances.filter(instance => instance.isRunning);

  const handleCreateSync = () => {
    if (!masterInstance || slaveInstances.length === 0) {
      toast({
        title: "Error",
        description: "Please select a master instance and at least one slave instance",
        variant: "destructive",
      });
      return;
    }

    createSyncMutation.mutate({
      masterInstanceId: masterInstance,
      slaveInstanceIds: slaveInstances,
      mode: syncMode,
      delay: delay,
    });
  };

  const handlePlaybackRecording = async () => {
    if (!selectedRecording || playbackInstances.length === 0) {
      toast({
        title: "Error",
        description: "Please select a recording and target instances",
        variant: "destructive",
      });
      return;
    }

    try {
      const actions = await apiRequest(`/api/recordings/${selectedRecording}`);
      await playbackMutation.mutateAsync({
        actions,
        targetInstanceIds: playbackInstances,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const toggleSlaveInstance = (instanceId: string) => {
    setSlaveInstances(prev => 
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  const togglePlaybackInstance = (instanceId: string) => {
    setPlaybackInstances(prev => 
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account Sync Manager</h1>
          <p className="text-muted-foreground">
            Synchronize actions across multiple Roblox instances
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={isRecordingDialogOpen} onOpenChange={setIsRecordingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Circle className="h-4 w-4 mr-2" />
                Record Actions
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Dialog open={isCreateSyncDialogOpen} onOpenChange={setIsCreateSyncDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Link className="h-4 w-4 mr-2" />
                Create Sync
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Active Sync Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Radio className="h-5 w-5 mr-2" />
            Active Sync Sessions
          </CardTitle>
          <CardDescription>
            Currently running synchronization sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syncSessions.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Active Sync Sessions</h3>
              <p className="text-muted-foreground mb-4">
                Create a sync session to start mirroring actions between instances
              </p>
              <Button onClick={() => setIsCreateSyncDialogOpen(true)}>
                <Link className="h-4 w-4 mr-2" />
                Create First Sync
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {syncSessions.map((session, index) => {
                const masterInstance = instances.find(i => i.id === session.masterInstanceId);
                const slaveInstancesData = instances.filter(i => 
                  session.slaveInstanceIds.includes(i.id)
                );
                
                return (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="default">{session.syncMode}</Badge>
                            <Badge variant="outline">{session.delay}ms delay</Badge>
                            <Badge variant="secondary">
                              {session.actionQueue.length} actions queued
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <span className="font-medium mr-2">Master:</span>
                              <span>{masterInstance?.displayName || session.masterInstanceId}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <span className="font-medium mr-2">Slaves:</span>
                              <span>
                                {slaveInstancesData.map(i => i.displayName).join(", ") || 
                                 session.slaveInstanceIds.join(", ")}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => stopSyncMutation.mutate(`session-${index}`)}
                          disabled={stopSyncMutation.isPending}
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Stop Sync
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for different sync features */}
      <Tabs defaultValue="live-sync" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live-sync">Live Sync</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="live-sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Instance Synchronization</CardTitle>
              <CardDescription>
                Mirror actions from a master instance to multiple slave instances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {runningInstances.map((instance) => (
                  <Card key={instance.id} className="relative">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{instance.displayName}</h4>
                          <Badge variant="default">Running</Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>CPU: {instance.resourceUsage.cpu.toFixed(1)}%</div>
                          <div>Memory: {(instance.resourceUsage.memory / 1024).toFixed(1)} GB</div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMasterInstance(instance.id)}
                            className={masterInstance === instance.id ? "bg-primary text-primary-foreground" : ""}
                          >
                            Master
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleSlaveInstance(instance.id)}
                            className={slaveInstances.includes(instance.id) ? "bg-secondary" : ""}
                          >
                            Slave
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {runningInstances.length === 0 && (
                <Alert>
                  <AlertDescription>
                    No running instances found. Please start some UWP instances first.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recordings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Record Actions</CardTitle>
                <CardDescription>
                  Record actions from an instance for later playback
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Instance to Record</Label>
                  <Select value={recordingInstance} onValueChange={setRecordingInstance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose instance" />
                    </SelectTrigger>
                    <SelectContent>
                      {runningInstances.map((instance) => (
                        <SelectItem key={instance.id} value={instance.id}>
                          {instance.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={() => startRecordingMutation.mutate(recordingInstance)}
                    disabled={!recordingInstance || startRecordingMutation.isPending}
                    className="flex-1"
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Recording
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => stopRecordingMutation.mutate()}
                    disabled={stopRecordingMutation.isPending}
                    className="flex-1"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Playback Recordings</CardTitle>
                <CardDescription>
                  Play back recorded actions on selected instances
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Recording</Label>
                  <Select value={selectedRecording} onValueChange={setSelectedRecording}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose recording" />
                    </SelectTrigger>
                    <SelectContent>
                      {recordings.map((recording) => (
                        <SelectItem key={recording} value={recording}>
                          {recording}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Target Instances</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {runningInstances.map((instance) => (
                      <Button
                        key={instance.id}
                        size="sm"
                        variant="outline"
                        onClick={() => togglePlaybackInstance(instance.id)}
                        className={playbackInstances.includes(instance.id) ? "bg-secondary" : ""}
                      >
                        {instance.displayName}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Button
                  onClick={handlePlaybackRecording}
                  disabled={!selectedRecording || playbackInstances.length === 0 || playbackMutation.isPending}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Playback
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
              <CardDescription>
                Configure synchronization behavior and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Default Sync Mode</Label>
                <Select value={syncMode} onValueChange={(value: any) => setSyncMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mirror">Mirror - Exact copy of actions</SelectItem>
                    <SelectItem value="follow">Follow - Smart following with delays</SelectItem>
                    <SelectItem value="coordinate">Coordinate - Team-based actions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Default Delay (ms)</Label>
                <Input
                  type="number"
                  value={delay}
                  onChange={(e) => setDelay(parseInt(e.target.value) || 100)}
                  min="0"
                  max="5000"
                />
              </div>
              
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Lower delays provide more responsive syncing but may increase CPU usage.
                  Recommended: 100-500ms for optimal performance.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Sync Dialog */}
      <Dialog open={isCreateSyncDialogOpen} onOpenChange={setIsCreateSyncDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Sync Session</DialogTitle>
            <DialogDescription>
              Set up real-time synchronization between instances
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Master Instance</Label>
              <Select value={masterInstance} onValueChange={setMasterInstance}>
                <SelectTrigger>
                  <SelectValue placeholder="Select master instance" />
                </SelectTrigger>
                <SelectContent>
                  {runningInstances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Slave Instances</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {runningInstances
                  .filter(instance => instance.id !== masterInstance)
                  .map((instance) => (
                    <Button
                      key={instance.id}
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSlaveInstance(instance.id)}
                      className={slaveInstances.includes(instance.id) ? "bg-secondary" : ""}
                    >
                      {instance.displayName}
                    </Button>
                  ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sync Mode</Label>
                <Select value={syncMode} onValueChange={(value: any) => setSyncMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mirror">Mirror</SelectItem>
                    <SelectItem value="follow">Follow</SelectItem>
                    <SelectItem value="coordinate">Coordinate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Delay (ms)</Label>
                <Input
                  type="number"
                  value={delay}
                  onChange={(e) => setDelay(parseInt(e.target.value) || 100)}
                  min="0"
                  max="5000"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateSyncDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSync}
              disabled={createSyncMutation.isPending}
            >
              {createSyncMutation.isPending ? (
                <>
                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Create Sync
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}