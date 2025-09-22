import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Package, Download, Settings, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BuildStep {
  id: string;
  name: string;
  completed: boolean;
}

const StandaloneBuilder: React.FC = () => {
  const { toast } = useToast();
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([
    { id: 'scripts', name: 'Package Scripts', completed: false },
    { id: 'dependencies', name: 'Bundle Dependencies', completed: false },
    { id: 'executable', name: 'Create Executable', completed: false },
    { id: 'installer', name: 'Generate Installer', completed: false },
    { id: 'batch', name: 'Create Batch Files', completed: false }
  ]);

  const startBuild = async () => {
    setIsBuilding(true);
    setBuildProgress(0);
    
    // Reset all steps
    setBuildSteps(steps => steps.map(step => ({ ...step, completed: false })));
    
    // Simulate build process
    for (let i = 0; i < buildSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setBuildSteps(steps => 
        steps.map((step, index) => 
          index === i ? { ...step, completed: true } : step
        )
      );
      
      setBuildProgress(((i + 1) / buildSteps.length) * 100);
    }
    
    setIsBuilding(false);
    
    toast({
      title: "Build Complete!",
      description: "Your standalone Pet Simulator 99 Hub is ready for download",
    });
  };

  const downloadStandalone = () => {
    // Create a mock download
    const buildFiles = {
      'ps99-hub-installer.exe': 'Mock installer executable',
      'run-hub.bat': '@echo off\nstart ps99-hub.exe\npause',
      'config.json': JSON.stringify({ version: '1.0.0', scripts: ['pet-hatcher', 'egg-watcher'] }, null, 2)
    };
    
    Object.entries(buildFiles).forEach(([filename, content]) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    
    toast({
      title: "Download Started",
      description: "Standalone build files are being downloaded",
    });
  };

  const allStepsCompleted = buildSteps.every(step => step.completed);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Standalone App Builder</span>
          {allStepsCompleted && (
            <Badge className="bg-green-100 text-green-800">Ready</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Build a standalone executable with all scripts and dependencies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Build Progress</span>
            <span>{Math.round(buildProgress)}%</span>
          </div>
          <Progress value={buildProgress} className="w-full" />
        </div>

        <div className="space-y-2">
          {buildSteps.map((step) => (
            <div key={step.id} className="flex items-center space-x-2">
              {step.completed ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
              )}
              <span className={`text-sm ${step.completed ? 'text-green-600' : 'text-gray-600'}`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={startBuild} 
            disabled={isBuilding}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isBuilding ? 'Building...' : 'Build Standalone'}
          </Button>
          
          <Button 
            onClick={downloadStandalone}
            disabled={!allStepsCompleted}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          Includes: AutoHotkey runtime, Python interpreter, all scripts, and batch launcher
        </div>
      </CardContent>
    </Card>
  );
};

export default StandaloneBuilder;