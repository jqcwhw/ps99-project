import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Square, RotateCcw, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InstanceWithAccount } from "@shared/schema";

const { spawn } = require("child_process");

const ps = spawn("powershell.exe", ["-NoLogo", "-NoProfile", "-File", "path/to/script.ps1"]);

ps.stdout.on("data", (data) => {
  console.log(`Output: ${data}`);
});

ps.stderr.on("data", (data) => {
  console.error(`Error: ${data}`);
});

ps.on("exit", (code) => {
  console.log(`PowerShell script exited with code ${code}`);
});

const { exec } = require('child_process');

exec('powershell.exe -Command "Get-Process | ConvertTo-Json"', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  try {
    const jsonOutput = JSON.parse(stdout);
    console.log(jsonOutput);
  } catch (parseError) {
    console.error(`JSON Parse Error: ${parseError.message}`);
  }
});


interface InstanceControlsProps {
  instance: InstanceWithAccount;
}

export function InstanceControls({ instance }: InstanceControlsProps) {
  const { toast } = useToast();

  const startInstanceMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/instances/${instance.id}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instances"] });
      toast({
        title: "Instance Starting",
        description: `${instance.name} is starting up...`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start instance",
        variant: "destructive",
      });
    },
  });

  const stopInstanceMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/instances/${instance.id}/stop`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instances"] });
      toast({
        title: "Instance Stopping",
        description: `${instance.name} is shutting down...`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to stop instance",
        variant: "destructive",
      });
    },
  });

  const restartInstanceMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/instances/${instance.id}/restart`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instances"] });
      toast({
        title: "Instance Restarting",
        description: `${instance.name} is restarting...`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to restart instance",
        variant: "destructive",
      });
    },
  });

  const deleteInstanceMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/instances/${instance.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/instances"] });
      toast({
        title: "Instance Deleted",
        description: `${instance.name} has been deleted`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete instance",
        variant: "destructive",
      });
    },
  });

  const handleDeleteInstance = () => {
    if (confirm(`Are you sure you want to delete ${instance.name}?`)) {
      deleteInstanceMutation.mutate();
    }
  };

  const isTransitioning = ["starting", "stopping"].includes(instance.status);
  const isRunning = instance.status === "running";
  const isStopped = instance.status === "stopped";

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex space-x-2">
          {isStopped && (
            <Button
              onClick={() => startInstanceMutation.mutate()}
              disabled={startInstanceMutation.isPending || isTransitioning}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Start
            </Button>
          )}
          
          {isRunning && (
            <Button
              onClick={() => stopInstanceMutation.mutate()}
              disabled={stopInstanceMutation.isPending || isTransitioning}
              variant="outline"
              className="flex-1"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          
          {isRunning && (
            <Button
              onClick={() => restartInstanceMutation.mutate()}
              disabled={restartInstanceMutation.isPending || isTransitioning}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restart
            </Button>
          )}
          
          {isStopped && (
            <Button
              onClick={handleDeleteInstance}
              disabled={deleteInstanceMutation.isPending}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
