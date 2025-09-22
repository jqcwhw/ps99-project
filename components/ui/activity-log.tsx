import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, AlertTriangle, AlertCircle } from "lucide-react";
import type { ActivityLog } from "@shared/schema";

interface ActivityLogProps {
  instanceId?: number;
  limit?: number;
}

export function ActivityLog({ instanceId, limit = 50 }: ActivityLogProps) {
  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/logs", instanceId],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Info className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p>No activity logs found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-64">
      <div className="space-y-2">
        {logs.slice(0, limit).map((log) => (
          <div key={log.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
            <div className="flex-shrink-0 mt-0.5">
              {getLevelIcon(log.level)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge className={getLevelColor(log.level)}>
                  {log.level}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(log.timestamp!).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{log.message}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
