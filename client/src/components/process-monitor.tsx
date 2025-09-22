import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Cpu, HardDrive, Activity } from "lucide-react";
import type { InstanceWithAccount } from "@shared/schema";

export function ProcessMonitor() {
  const { data: instances = [] } = useQuery<InstanceWithAccount[]>({
    queryKey: ["/api/instances"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const runningInstances = instances.filter(i => i.status === "running");
  
  // Mock system metrics - in a real app, these would come from the local service
  const systemMetrics = {
    cpuUsage: Math.floor(Math.random() * 60) + 20, // 20-80%
    memoryUsage: Math.floor(Math.random() * 40) + 30, // 30-70%
    diskUsage: Math.floor(Math.random() * 20) + 40, // 40-60%
  };

  return (
    <div className="space-y-4">
      {/* System Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Cpu className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium">CPU</span>
          </div>
          <Progress value={systemMetrics.cpuUsage} className="mb-1" />
          <span className="text-xs text-gray-500">{systemMetrics.cpuUsage}%</span>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <HardDrive className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium">Memory</span>
          </div>
          <Progress value={systemMetrics.memoryUsage} className="mb-1" />
          <span className="text-xs text-gray-500">{systemMetrics.memoryUsage}%</span>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Activity className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-sm font-medium">Disk</span>
          </div>
          <Progress value={systemMetrics.diskUsage} className="mb-1" />
          <span className="text-xs text-gray-500">{systemMetrics.diskUsage}%</span>
        </div>
      </div>

      {/* Running Instances */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Running Instances</h4>
        {runningInstances.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No instances running</p>
        ) : (
          <div className="space-y-2">
            {runningInstances.map((instance) => (
              <div key={instance.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">{instance.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {instance.processId && (
                    <Badge variant="secondary" className="text-xs">
                      PID: {instance.processId}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    {Math.floor(Math.random() * 200) + 50}MB
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
