import React, { useState, useEffect } from 'react';
import ScriptCard from './ScriptCard';
import { useToast } from '@/hooks/use-toast';
import { robloxIntegration } from '@/lib/robloxIntegration';

interface Script {
  id: string;
  title: string;
  description: string;
  status: 'idle' | 'running' | 'stopped';
  type: 'ahk' | 'python' | 'lua' | 'config';
  content: string;
  category: 'automation' | 'monitoring' | 'enhancement';
}

const ScriptManager: React.FC = () => {
  const { toast } = useToast();
  const [scripts, setScripts] = useState<Script[]>([
    {
      id: 'tile-scanner',
      title: 'Advanced Tile Scanner',
      description: 'Intelligent tile scanning with pattern recognition for Tier 8 100x eggs',
      status: 'idle',
      type: 'lua',
      category: 'automation',
      content: `-- Advanced Tile Scanner for Pet Simulator 99\nlocal Players = game:GetService("Players")\nlocal ReplicatedStorage = game:GetService("ReplicatedStorage")\n\nlocal player = Players.LocalPlayer\nlocal TARGET_EGG = "Block Party Tier Eight 100x"\n\nlocal tilePositions = {}\nfor i = 1, 20 do\n    table.insert(tilePositions, Vector3.new(i*5, 0, 0))\n    table.insert(tilePositions, Vector3.new(-i*5, 0, 0))\n    table.insert(tilePositions, Vector3.new(0, 0, i*5))\n    table.insert(tilePositions, Vector3.new(0, 0, -i*5))\nend\n\nlocal function breakBlock(pos)\n    ReplicatedStorage.Network.Invoke:InvokeServer("BreakBlock", pos)\nend\n\nlocal running = false\n_G.TileScannerActive = false\n\nlocal function startScanning()\n    running = true\n    _G.TileScannerActive = true\n    \n    while running and _G.TileScannerActive do\n        local character = player.Character\n        if character and character:FindFirstChild("HumanoidRootPart") then\n            for _, pos in ipairs(tilePositions) do\n                if not _G.TileScannerActive then break end\n                breakBlock(character.HumanoidRootPart.Position + pos)\n                wait(0.1)\n            end\n        end\n        wait(1)\n    end\nend\n\n_G.AdvancedTileScanner = {\n    start = startScanning,\n    stop = function() running = false; _G.TileScannerActive = false end,\n    isRunning = function() return running end\n}`
    },
    {
      id: 'smart-rebirth',
      title: 'Smart Rebirth Manager',
      description: 'Intelligent rebirth system with coin optimization',
      status: 'idle',
      type: 'lua',
      category: 'automation',
      content: `-- Smart Rebirth Manager\nlocal Players = game:GetService("Players")\nlocal ReplicatedStorage = game:GetService("ReplicatedStorage")\n\nlocal player = Players.LocalPlayer\nlocal MIN_COINS = 1000000\nlocal rebirthCount = 0\n\nlocal function getCurrentCoins()\n    local leaderstats = player:FindFirstChild("leaderstats")\n    if leaderstats then\n        local coins = leaderstats:FindFirstChild("Coins")\n        return coins and coins.Value or 0\n    end\n    return 0\nend\n\nlocal function performRebirth()\n    local args = {[1] = "Rebirth"}\n    ReplicatedStorage.Network.Invoke:InvokeServer(unpack(args))\n    rebirthCount = rebirthCount + 1\n    print("Rebirth #" .. rebirthCount .. " completed!")\nend\n\nlocal running = false\n\nlocal function startAutoRebirth()\n    running = true\n    while running do\n        local coins = getCurrentCoins()\n        if coins >= MIN_COINS then\n            performRebirth()\n            wait(10)\n        end\n        wait(5)\n    end\nend\n\n_G.SmartRebirthManager = {\n    start = startAutoRebirth,\n    stop = function() running = false end,\n    isRunning = function() return running end\n}`
    },
    {
      id: 'egg-monitor',
      title: 'Real-time Egg Monitor',
      description: 'Monitors PS99 API for rare egg availability',
      status: 'idle',
      type: 'lua',
      category: 'monitoring',
      content: `-- Egg Monitor\nlocal HttpService = game:GetService("HttpService")\nlocal API_URL = "https://ps99.biggamesapi.io/api/collection/eggs"\n\nlocal function checkEggs()\n    local success, result = pcall(function()\n        return HttpService:GetAsync(API_URL)\n    end)\n    \n    if success then\n        local data = HttpService:JSONDecode(result)\n        for _, egg in pairs(data.data or {}) do\n            if string.find(egg.configName or "", "Tier Eight 100x") then\n                print("Target egg found: " .. egg.configName)\n                return true\n            end\n        end\n    end\n    return false\nend\n\nlocal running = false\n\nlocal function startMonitoring()\n    running = true\n    while running do\n        checkEggs()\n        wait(30)\n    end\nend\n\n_G.EggMonitor = {\n    start = startMonitoring,\n    stop = function() running = false end,\n    check = checkEggs\n}`
    },
    {
      id: 'pet-hatcher',
      title: 'Smart Pet Hatcher',
      description: 'Automated pet hatching with inventory management',
      status: 'idle',
      type: 'lua',
      category: 'automation',
      content: `-- Smart Pet Hatcher\nlocal Players = game:GetService("Players")\nlocal ReplicatedStorage = game:GetService("ReplicatedStorage")\n\nlocal player = Players.LocalPlayer\nlocal HATCH_DELAY = 1\nlocal MAX_PETS = 100\n\nlocal function getCurrentPetCount()\n    local pets = player:FindFirstChild("Pets")\n    return pets and #pets:GetChildren() or 0\nend\n\nlocal function hatchEgg(eggName)\n    local args = {[1] = "HatchEgg", [2] = eggName, [3] = 1}\n    ReplicatedStorage.Network.Invoke:InvokeServer(unpack(args))\nend\n\nlocal function managePets()\n    local petCount = getCurrentPetCount()\n    if petCount >= MAX_PETS then\n        -- Delete common pets\n        local pets = player.Pets:GetChildren()\n        for i = 1, math.min(10, #pets) do\n            if pets[i]:GetAttribute("Rarity") == "Common" then\n                pets[i]:Destroy()\n            end\n        end\n    end\nend\n\nlocal running = false\nlocal hatchCount = 0\n\nlocal function startHatching()\n    running = true\n    while running do\n        managePets()\n        hatchEgg("Basic Egg")\n        hatchCount = hatchCount + 1\n        print("Hatched pet #" .. hatchCount)\n        wait(HATCH_DELAY)\n    end\nend\n\n_G.PetHatcher = {\n    start = startHatching,\n    stop = function() running = false end,\n    getCount = function() return hatchCount end\n}`
    }
  ]);

  const handleLaunch = async (scriptId: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (!script) return;

    try {
      const result = await robloxIntegration.executeScript(script.content);
      
      if (result.success) {
        setScripts(prev => prev.map(s => 
          s.id === scriptId ? { ...s, status: 'running' } : s
        ));
        
        toast({
          title: "Script Launched",
          description: `${script.title} is now running`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Launch Error",
        description: `Failed to launch ${script.title}`,
        variant: "destructive",
      });
    }
  };

  const handleStop = (scriptId: string) => {
    setScripts(prev => prev.map(s => 
      s.id === scriptId ? { ...s, status: 'stopped' } : s
    ));
    
    toast({
      title: "Script Stopped",
      description: "Script has been stopped",
    });
  };

  const handleDownload = (script: Script) => {
    const extension = script.type === 'lua' ? '.lua' : script.type === 'ahk' ? '.ahk' : '.py';
    const blob = new Blob([script.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${script.id}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: `${script.title} has been downloaded`,
    });
  };

  const handleConfigure = (scriptId: string) => {
    toast({
      title: "Configuration",
      description: "Configuration panel would open here",
    });
  };

  // Auto-stop scripts after demo period in web mode
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.electron) {
      const timer = setInterval(() => {
        setScripts(prev => prev.map(script => 
          script.status === 'running' ? { ...script, status: 'stopped' } : script
        ));
      }, 15000);
      
      return () => clearInterval(timer);
    }
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Enhanced Script Manager</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {scripts.map((script) => (
          <ScriptCard
            key={script.id}
            title={script.title}
            description={script.description}
            status={script.status}
            type={script.type}
            onLaunch={() => script.status === 'running' ? handleStop(script.id) : handleLaunch(script.id)}
            onDownload={() => handleDownload(script)}
            onConfigure={() => handleConfigure(script.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ScriptManager;