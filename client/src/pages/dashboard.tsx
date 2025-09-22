import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstanceCard } from "@/components/instance-card";
import { ActivityLog } from "@/components/activity-log";
import { ProcessMonitor } from "@/components/process-monitor";
import { Users, GamepadIcon, Activity, AlertCircle } from "lucide-react";
import type { InstanceWithAccount, Account } from "@shared/schema";

export default function Dashboard() {
  const { data: instances = [], isLoading: instancesLoading } = useQuery<InstanceWithAccount[]>({
    queryKey: ["/api/instances"],
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
  });

  const runningInstances = instances.filter(i => i.status === "running");
  const stoppedInstances = instances.filter(i => i.status === "stopped");
  const errorInstances = instances.filter(i => i.status === "error");

  if (instancesLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Monitor and control your Roblox instances</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Instances</CardTitle>
              <GamepadIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{instances.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{runningInstances.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accounts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{errorInstances.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Running Instances */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Running Instances</h2>
          {runningInstances.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center py-8">No instances currently running</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {runningInstances.map((instance) => (
                <InstanceCard key={instance.id} instance={instance} />
              ))}
            </div>
          )}
        </div>

        {/* System Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Monitor</CardTitle>
              <CardDescription>Resource usage and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessMonitor />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and logs</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityLog limit={10} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
