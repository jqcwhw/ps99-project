import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Download, Settings } from 'lucide-react';

interface ScriptCardProps {
  title: string;
  description: string;
  status: 'idle' | 'running' | 'stopped';
  type: 'ahk' | 'python' | 'config';
  onLaunch: () => void;
  onDownload: () => void;
  onConfigure?: () => void;
}

const ScriptCard: React.FC<ScriptCardProps> = ({
  title,
  description,
  status,
  type,
  onLaunch,
  onDownload,
  onConfigure
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'ahk': return 'bg-blue-100 text-blue-800';
      case 'python': return 'bg-yellow-100 text-yellow-800';
      case 'config': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{title}</span>
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge className={getTypeColor()}>{type.toUpperCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Button onClick={onLaunch} disabled={status === 'running'}>
            <Play className="h-4 w-4 mr-2" />
            {status === 'running' ? 'Running' : 'Launch'}
          </Button>
          <Button variant="outline" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {onConfigure && (
            <Button variant="ghost" onClick={onConfigure}>
              <Settings className="h-4 w-4 mr-2" />
              Config
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScriptCard;