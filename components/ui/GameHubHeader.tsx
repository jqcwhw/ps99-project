import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Settings, Play } from 'lucide-react';

interface GameHubHeaderProps {
  onDownload: () => void;
  onSettings: () => void;
}

const GameHubHeader: React.FC<GameHubHeaderProps> = ({ onDownload, onSettings }) => {
  return (
    <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Play className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Pet Simulator 99 Hub</h1>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={onSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download Standalone
          </Button>
        </div>
      </div>
    </header>
  );
};

export default GameHubHeader;