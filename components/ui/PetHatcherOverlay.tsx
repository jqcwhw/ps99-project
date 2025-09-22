import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gamepad2, Heart, Star, Package, TrendingUp, Database } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PetStats {
  total: number;
  rare: number;
  legendary: number;
  mythical: number;
  session: number;
}

interface InventoryItem {
  name: string;
  rarity: string;
  timestamp: Date;
  value?: number;
}

const PetHatcherOverlay: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [petStats, setPetStats] = useState<PetStats>({
    total: 0,
    rare: 0,
    legendary: 0,
    mythical: 0,
    session: 0
  });
  const [hatchRate, setHatchRate] = useState(0);
  const [inventorySync, setInventorySync] = useState(false);
  const [recentHatches, setRecentHatches] = useState<InventoryItem[]>([]);
  const [stockSyncEnabled, setStockSyncEnabled] = useState(false);
  const { toast } = useToast();

  // Simulate pet hatching when active
  useEffect(() => {
    let hatchInterval: NodeJS.Timeout;
    
    if (isActive) {
      hatchInterval = setInterval(() => {
        // Simulate random pet hatch
        const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical'];
        const weights = [50, 30, 15, 3, 1.5, 0.5]; // Weighted probabilities
        
        const random = Math.random() * 100;
        let cumulative = 0;
        let selectedRarity = 'Common';
        
        for (let i = 0; i < weights.length; i++) {
          cumulative += weights[i];
          if (random <= cumulative) {
            selectedRarity = rarities[i];
            break;
          }
        }
        
        const petNames = [
          'Rainbow Dragon', 'Crystal Wolf', 'Golden Phoenix', 'Shadow Cat',
          'Diamond Dog', 'Emerald Tiger', 'Ruby Lion', 'Sapphire Bear'
        ];
        
        const newPet: InventoryItem = {
          name: petNames[Math.floor(Math.random() * petNames.length)],
          rarity: selectedRarity,
          timestamp: new Date(),
          value: Math.floor(Math.random() * 1000000) + 1000
        };
        
        // Update stats
        setPetStats(prev => ({
          ...prev,
          total: prev.total + 1,
          session: prev.session + 1,
          rare: selectedRarity === 'Rare' ? prev.rare + 1 : prev.rare,
          legendary: selectedRarity === 'Legendary' ? prev.legendary + 1 : prev.legendary,
          mythical: selectedRarity === 'Mythical' ? prev.mythical + 1 : prev.mythical
        }));
        
        // Add to recent hatches
        setRecentHatches(prev => [newPet, ...prev.slice(0, 4)]);
        
        // Show notification for rare pets
        if (['Legendary', 'Mythical'].includes(selectedRarity)) {
          toast({
            title: `🎉 ${selectedRarity} Pet Hatched!`,
            description: `${newPet.name} - Value: ${newPet.value?.toLocaleString()} coins`,
          });
        }
        
        // Simulate InvenTree sync
        if (stockSyncEnabled && inventorySync) {
          setTimeout(() => {
            toast({
              title: "📦 Stock Synced",
              description: `${newPet.name} added to InvenTree inventory`,
            });
          }, 500);
        }
        
        // Update hatch rate
        setHatchRate(prev => Math.min(prev + Math.random() * 2, 100));
      }, Math.random() * 2000 + 1000); // Random interval between 1-3 seconds
    }

    return () => {
      if (hatchInterval) clearInterval(hatchInterval);
    };
  }, [isActive, inventorySync, stockSyncEnabled, toast]);

  const toggleHatcher = () => {
    setIsActive(!isActive);
    if (!isActive) {
      toast({
        title: "🎮 Pet Hatcher Started",
        description: "Overlay is now monitoring pet hatches",
      });
    } else {
      toast({
        title: "⏹️ Pet Hatcher Stopped",
        description: "Monitoring has been disabled",
      });
    }
  };

  const resetStats = () => {
    setPetStats({
      total: 0,
      rare: 0,
      legendary: 0,
      mythical: 0,
      session: 0
    });
    setRecentHatches([]);
    setHatchRate(0);
    toast({
      title: "🔄 Stats Reset",
      description: "All statistics have been cleared",
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Mythical': return 'bg-purple-500';
      case 'Legendary': return 'bg-yellow-500';
      case 'Epic': return 'bg-purple-400';
      case 'Rare': return 'bg-blue-500';
      case 'Uncommon': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pet Hatcher Overlay</h2>
          <p className="text-muted-foreground">
            Real-time pet hatching statistics with InvenTree inventory sync
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={toggleHatcher} variant={isActive ? "destructive" : "default"}>
            <Gamepad2 className="h-4 w-4 mr-2" />
            {isActive ? "Stop Hatcher" : "Start Hatcher"}
          </Button>
          <Button onClick={resetStats} variant="outline">
            Reset Stats
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pets</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{petStats.total}</div>
            <p className="text-xs text-muted-foreground">
              Session: {petStats.session}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rare Pets</CardTitle>
            <Star className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{petStats.rare}</div>
            <p className="text-xs text-muted-foreground">
              {petStats.total > 0 ? ((petStats.rare / petStats.total) * 100).toFixed(1) : 0}% rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Legendary</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{petStats.legendary}</div>
            <p className="text-xs text-muted-foreground">
              {petStats.total > 0 ? ((petStats.legendary / petStats.total) * 100).toFixed(2) : 0}% rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mythical</CardTitle>
            <Star className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{petStats.mythical}</div>
            <p className="text-xs text-muted-foreground">
              {petStats.total > 0 ? ((petStats.mythical / petStats.total) * 100).toFixed(3) : 0}% rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Hatch Rate Monitor</span>
            </CardTitle>
            <CardDescription>
              Current hatching efficiency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Efficiency</span>
                <span>{hatchRate.toFixed(1)}%</span>
              </div>
              <Progress value={hatchRate} className="w-full" />
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Recent Hatches</span>
            </CardTitle>
            <CardDescription>
              Latest pets added to collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentHatches.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent hatches</p>
              ) : (
                recentHatches.map((pet, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getRarityColor(pet.rarity)}`} />
                      <span className="text-sm font-medium">{pet.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pet.value?.toLocaleString()} coins
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>InvenTree Integration</span>
          </CardTitle>
          <CardDescription>
            Sync pet hatches with inventory management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="inventory-sync">Enable Inventory Sync</Label>
              <p className="text-sm text-muted-foreground">
                Automatically log hatched pets to InvenTree
              </p>
            </div>
            <Switch
              id="inventory-sync"
              checked={inventorySync}
              onCheckedChange={setInventorySync}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="stock-sync">Stock Item Creation</Label>
              <p className="text-sm text-muted-foreground">
                Create stock entries for rare pets
              </p>
            </div>
            <Switch
              id="stock-sync"
              checked={stockSyncEnabled}
              onCheckedChange={setStockSyncEnabled}
              disabled={!inventorySync}
            />
          </div>
          
          {inventorySync && (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                InvenTree sync is enabled. Rare pets will be automatically logged with metadata including hatch time, rarity, and estimated value.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PetHatcherOverlay;