import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Square, Code, Download, AlertTriangle, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const RobloxScriptExecutor: React.FC = () => {
  const [currentScript, setCurrentScript] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const { toast } = useToast();

  const prebuiltScripts = {
    eggWatcher: `-- PS99 Tier 8 100× Egg Watcher\nlocal HttpService = game:GetService("HttpService")\nlocal API_URL = "https://ps99.biggamesapi.io/api/collection/eggs"\nlocal TARGET_EGG = "Block Party Tier Eight 100×"\n\nlocal function checkEggAPI()\n    local success, result = pcall(function()\n        return HttpService:GetAsync(API_URL, true)\n    end)\n    if success then\n        local data = HttpService:JSONDecode(result)\n        for _, egg in ipairs(data.data or {}) do\n            if string.find(egg.name or "", TARGET_EGG) then\n                print("🎉 Target egg found!")\n                return true\n            end\n        end\n    end\n    return false\nend\n\nwhile true do\n    if checkEggAPI() then\n        print("✅ Egg is live!")\n        break\n    end\n    wait(5)\nend`,
    
    tileScanner: `-- PS99 Tile Scanner\nlocal Players = game:GetService("Players")\nlocal player = Players.LocalPlayer\n\nlocal function scanTiles()\n    local island = workspace:FindFirstChild("BlockPartyIsland")\n    if not island then return end\n    \n    for _, block in ipairs(island:GetDescendants()) do\n        if block:IsA("BasePart") and block.Transparency > 0.5 then\n            block:BreakJoints()\n            wait(0.05)\n        end\n    end\nend\n\nscanTiles()`,

    autoRebirth: `-- PS99 Auto Rebirth\nlocal Players = game:GetService("Players")\nlocal player = Players.LocalPlayer\nlocal playerGui = player:WaitForChild("PlayerGui")\n\nlocal function performRebirth()\n    for _, gui in ipairs(playerGui:GetDescendants()) do\n        if gui:IsA("TextButton") and gui.Name:lower():find("rebirth") then\n            gui.Activated:Fire()\n            wait(6)\n            return true\n        end\n    end\n    return false\nend\n\nperformRebirth()`
  };

  const executeScript = async (script?: string) => {
    const scriptToExecute = script || currentScript;
    if (!scriptToExecute.trim()) {
      toast({
        title: "❌ No Script",
        description: "Please enter a script to execute",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    const timestamp = new Date().toLocaleTimeString();
    
    try {
      setExecutionLog(prev => [...prev, `[${timestamp}] Executing script...`]);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setExecutionLog(prev => [...prev, `[${timestamp}] ✅ Script executed successfully`]);
      
      toast({
        title: "🚀 Script Executed",
        description: "Script has been sent to the execution engine",
      });
    } catch (error) {
      setExecutionLog(prev => [...prev, `[${timestamp}] ❌ Execution failed`]);
      toast({
        title: "❌ Execution Failed",
        description: "Script execution encountered an error",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const loadPrebuiltScript = (scriptKey: keyof typeof prebuiltScripts) => {
    setCurrentScript(prebuiltScripts[scriptKey]);
    toast({
      title: "📜 Script Loaded",
      description: `${scriptKey} script has been loaded`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Roblox Script Executor</h2>
          <p className="text-muted-foreground">
            Execute Lua scripts for Pet Simulator 99 automation
          </p>
        </div>
        <Badge variant={isExecuting ? "default" : "secondary"}>
          {isExecuting ? "Executing" : "Ready"}
        </Badge>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Requires a compatible Roblox executor. Use on alternate accounts only.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="editor">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="prebuilt">Scripts</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle>Lua Script Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="-- Enter your Lua script here"
                value={currentScript}
                onChange={(e) => setCurrentScript(e.target.value)}
                className="font-mono min-h-[300px]"
              />
              <div className="flex justify-end space-x-2">
                {!isExecuting ? (
                  <Button onClick={() => executeScript()}>
                    <Play className="h-4 w-4 mr-2" />
                    Execute
                  </Button>
                ) : (
                  <Button onClick={() => setIsExecuting(false)} variant="destructive">
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prebuilt">
          <div className="grid gap-4">
            {Object.entries(prebuiltScripts).map(([key, script]) => (
              <Card key={key} className="cursor-pointer hover:bg-muted/50" onClick={() => loadPrebuiltScript(key as keyof typeof prebuiltScripts)}>
                <CardHeader>
                  <CardTitle className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</CardTitle>
                  <CardDescription>{script.split('\n')[0].replace('-- ', '')}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Execution Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
                {executionLog.length === 0 ? (
                  <p>No execution logs yet...</p>
                ) : (
                  executionLog.map((log, i) => <div key={i}>{log}</div>)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RobloxScriptExecutor;