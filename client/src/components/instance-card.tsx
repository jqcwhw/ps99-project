import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, User, Activity, AlertCircle } from "lucide-react";
import type { InstanceWithAccount } from "@shared/schema";

interface InstanceCardProps {
  instance: InstanceWithAccount;
}

export function InstanceCard({ instance }: InstanceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-800";
      case "stopped":
        return "bg-gray-100 text-gray-800";
      case "starting":
        return "bg-yellow-100 text-yellow-800";
      case "stopping":
        return "bg-orange-100 text-orange-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Activity className="h-3 w-3" />;
      case "error":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{instance.name}</CardTitle>
          <Badge className={getStatusColor(instance.status)}>
            {getStatusIcon(instance.status)}
            <span className="ml-1 capitalize">{instance.status}</span>
          </Badge>
        </div>
        {instance.account && (
          <CardDescription className="flex items-center space-x-2">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">
                {instance.account.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{instance.account.displayName}</span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-gray-600">
          {instance.processId && (
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>PID: {instance.processId}</span>
            </div>
          )}
          {instance.port && (
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </span>
              <span>Port: {instance.port}</span>
            </div>
          )}
          {instance.gameId && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Game: {instance.gameId}</span>
            </div>
          )}
          {instance.lastStarted && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Started: {new Date(instance.lastStarted).toLocaleString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
