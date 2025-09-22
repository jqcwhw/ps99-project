import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Play, Square, Activity, Zap } from 'lucide-react';

interface ExecutionEngine {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'error';
  lastExecution?: Date;
  executionCount: number;
}

const ScriptExecutionEngine: React.FC = () => {
  const { toast } = useToast();
  const [engines, setEngines] = useState<ExecutionEngine[]>([
    {
      id: 'roblox-injector',
      name: 'Roblox Script Injector',
      description: 'Injects Lua scripts directly into Roblox process',
      status: 'idle',
      executionCount: 0
    },
    {
      id: 'ahk-executor',
      name: 'AutoHotkey Executor',
      description: 'Executes AutoHotkey scripts for UI automation',
      status: 'idle',
      executionCount: 0
    },
    {
      id: 'python-daemon',
      name: 'Python Service Daemon',
      description: 'Runs Python scripts as background services',
      status: 'idle',
      executionCount: 0
    }
  ]);

  // Simulate real script execution for web demo
  const executeScript = async (engineId: string, scriptCode: string) => {
    if (typeof window !== 'undefined' && !window.electron) {
      // Web simulation
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, output: 'Script executed successfully (simulation)' });
        }, 2000);
      });
    }
    
    // Standalone execution
    try {
      switch (engineId) {
        case 'roblox-injector':
          return await window.electron?.executeRobloxScript(scriptCode);
        case 'ahk-executor':
          return await window.electron?.executeAHKScript(scriptCode);
        case 'python-daemon':
          return await window.electron?.executePythonScript(scriptCode);
        default:
          throw new Error('Unknown engine');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const startEngine = async (engineId: string) => {
    setEngines(prev => prev.map(engine => 
      engine.id === engineId 
        ? { ...engine, status: 'running', lastExecution: new Date() }
        : engine
    ));

    // Sample script execution based on engine type
    let scriptCode = '';
    switch (engineId) {
      case 'roblox-injector':
        scriptCode = `-- Roblox execution test
print("PS99 Enhancement Hub - Script injected successfully!")
local Players = game:GetService("Players")
print("Player: " .. Players.LocalPlayer.Name)`;
        break;
      case 'ahk-executor':
        scriptCode = `; AutoHotkey test
MsgBox, PS99 Enhancement Hub - AHK Script Running
WinActivate, Roblox
Sleep, 1000`;
        break;
      case 'python-daemon':
        scriptCode = `# Python daemon test
import time
print("PS99 Enhancement Hub - Python service started")
time.sleep(2)
print("Service running successfully")`;
        break;
    }

    try {
      const result = await executeScript(engineId, scriptCode);
      
      if (result.success) {
        setEngines(prev => prev.map(engine => 
          engine.id === engineId 
            ? { ...engine, executionCount: engine.executionCount + 1 }
            : engine
        ));
        
        toast({
          title: "Engine Started",
          description: `${engines.find(e => e.id === engineId)?.name} is now running`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setEngines(prev => prev.map(engine => 
        engine.id === engineId 
          ? { ...engine, status: 'error' }
          : engine
      ));
      
      toast({
        title: "Engine Error",
        description: `Failed to start ${engines.find(e => e.id === engineId)?.name}`,
        variant: "destructive",
      });
    }
  };

  const stopEngine = (engineId: string) => {
    setEngines(prev => prev.map(engine => 
      engine.id === engineId 
        ? { ...engine, status: 'idle' }
        : engine
    ));
    
    toast({
      title: "Engine Stopped",
      description: `${engines.find(e => e.id === engineId)?.name} has been stopped`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running': return <Badge className="bg-green-100 text-green-800">Running</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Idle</Badge>;
    }
  };

  // Auto-stop running engines after demo period in web mode
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.electron) {
      const timer = setInterval(() => {
        setEngines(prev => prev.map(engine => 
          engine.status === 'running' && engine.lastExecution && 
          Date.now() - engine.lastExecution.getTime() > 15000
            ? { ...engine, status: 'idle' }
            : engine
        ));
      }, 5000);
      
      return () => clearInterval(timer);
    }
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold flex items-center">
        <Zap className="h-5 w-5 mr-2" />
        Script Execution Engines
      </h2>
      
      <div className="grid gap-4 md:grid-cols-3">
        {engines.map((engine) => (
          <Card key={engine.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <span>{engine.name}</span>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(engine.status)}`} />
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {engine.description}
                  </p>
                </div>
                {getStatusBadge(engine.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Executions:</span>
                  <span className="font-medium">{engine.executionCount}</span>
                </div>
                
                {engine.lastExecution && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Run:</span>
                    <span className="font-medium">
                      {engine.lastExecution.toLocaleTimeString()}
                    </span>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  {engine.status !== 'running' ? (
                    <Button 
                      onClick={() => startEngine(engine.id)} 
                      size="sm"
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => stopEngine(engine.id)} 
                      size="sm" 
                      variant="destructive"
                      className="flex-1"
                    >
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                  )}
                  
                  <Button size="sm" variant="outline">
                    <Activity className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Execution Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {engines.filter(e => e.status === 'running').length}
              </div>
              <div className="text-sm text-muted-foreground">Running</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {engines.reduce((sum, e) => sum + e.executionCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Executions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {engines.filter(e => e.status === 'error').length}
              </div>
              <div className="text-sm text-muted-foreground">Errors</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScriptExecutionEngine;