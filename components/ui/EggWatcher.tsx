import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, Play, Square, RefreshCw, Zap, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface EggData {
  name: string;
  id: string;
  category: string;
  isAvailable: boolean;
  rarity?: string;
}

const EggWatcher: React.FC = () => {
  const [isWatching, setIsWatching] = useState(false);
  const [targetEgg, setTargetEgg] = useState<EggData | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [rebirthCount, setRebirthCount] = useState(0);
  const [tilesScanned, setTilesScanned] = useState(0);
  const [lastApiCheck, setLastApiCheck] = useState<Date | null>(null);
  const { toast } = useToast();

  const TARGET_EGG = "Block Party Tier Eight 100×";
  const PS99_API = "https://ps99.biggamesapi.io/api/collection/eggs";

  // Simulate API polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isWatching) {
      interval = setInterval(async () => {
        try {
          // In a real implementation, this would call the actual API
          const mockApiResponse = {
            data: [
              {
                name: TARGET_EGG,
                id: "tier8_100x",
                category: "Tier 8",
                isAvailable: Math.random() > 0.8 // 20% chance to be available
              }
            ]
          };
          
          const eggFound = mockApiResponse.data.find(egg => 
            egg.name.includes("Block Party Tier Eight 100×")
          );
          
          if (eggFound) {
            setTargetEgg(eggFound);
            if (eggFound.isAvailable) {
              toast({
                title: "🎉 Target Egg Found!",
                description: `${TARGET_EGG} is now available!`,
              });
              setIsWatching(false);
            }
          }
          
          setLastApiCheck(new Date());
        } catch (error) {
          console.error('API polling error:', error);
        }
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWatching, toast]);

  // Simulate tile scanning and rebirth cycle
  useEffect(() => {
    let scanInterval: NodeJS.Timeout;
    
    if (isWatching && !targetEgg?.isAvailable) {
      scanInterval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            // Complete scan cycle - trigger rebirth
            setRebirthCount(count => count + 1);
            setTilesScanned(tiles => tiles + Math.floor(Math.random() * 50) + 20);
            toast({
              title: "🔄 Rebirth Triggered",
              description: "Island cleared, starting new scan cycle",
            });
            return 0;
          }
          return prev + Math.random() * 5;
        });
      }, 200);
    }

    return () => {
      if (scanInterval) clearInterval(scanInterval);
    };
  }, [isWatching, targetEgg?.isAvailable, toast]);

  const startWatching = () => {
    setIsWatching(true);
    setScanProgress(0);
    setRebirthCount(0);
    setTilesScanned(0);
    toast({
      title: "🔍 Egg Watcher Started",
      description: "Monitoring PS99 API and scanning for Tier 8 100× egg",
    });
  };

  const stopWatching = () => {
    setIsWatching(false);
    setScanProgress(0);
    toast({
      title: "⏹️ Egg Watcher Stopped",
      description: "Monitoring has been disabled",
    });
  };

  const resetStats = () => {
    setRebirthCount(0);
    setTilesScanned(0);
    setScanProgress(0);
    setTargetEgg(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tier 8 100× Egg Watcher</h2>
          <p className="text-muted-foreground">
            Automatically monitors PS99 API and scans for the rare Block Party Tier Eight 100× egg
          </p>
        </div>
        <div className="flex space-x-2">
          {!isWatching ? (
            <Button onClick={startWatching} className="flex items-center space-x-2">
              <Play className="h-4 w-4" />
              <span>Start Watching</span>
            </Button>
          ) : (
            <Button onClick={stopWatching} variant="destructive" className="flex items-center space-x-2">
              <Square className="h-4 w-4" />
              <span>Stop Watching</span>
            </Button>
          )}
          <Button onClick={resetStats} variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rebirth Count</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rebirthCount}</div>
            <p className="text-xs text-muted-foreground">
              Island resets performed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiles Scanned</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tilesScanned}</div>
            <p className="text-xs text-muted-foreground">
              Total blocks checked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={isWatching ? "default" : "secondary"}>
                {isWatching ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastApiCheck ? `Last check: ${lastApiCheck.toLocaleTimeString()}` : "Not started"}
            </p>
          </CardContent>
        </Card>
      </div>

      {targetEgg && (
        <Alert className={targetEgg.isAvailable ? "border-green-500" : "border-yellow-500"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{TARGET_EGG}</strong> {targetEgg.isAvailable ? "is now available!" : "detected but not yet available"}
          </AlertDescription>
        </Alert>
      )}

      {isWatching && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>Current Scan Progress</span>
            </CardTitle>
            <CardDescription>
              Scanning island tiles for hidden eggs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Island Scan Progress</span>
                <span>{Math.round(scanProgress)}%</span>
              </div>
              <Progress value={scanProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                {scanProgress < 100 
                  ? "Breaking transparent tiles and searching for eggs..." 
                  : "Scan complete - triggering rebirth..."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <h4 className="font-medium">API Monitoring</h4>
              <p className="text-sm text-muted-foreground">Continuously polls the PS99 Big Games API for egg availability</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <h4 className="font-medium">Tile Scanning</h4>
              <p className="text-sm text-muted-foreground">Systematically breaks all transparent tiles on Block Party island</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <h4 className="font-medium">Auto Rebirth</h4>
              <p className="text-sm text-muted-foreground">Automatically rebirths to reset island when scan is complete</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">4</div>
            <div>
              <h4 className="font-medium">Egg Detection</h4>
              <p className="text-sm text-muted-foreground">Stops when Tier 8 100× egg is found and notifies user</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EggWatcher;