import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GameHubHeader from './GameHubHeader';
import RobloxScriptExecutor from './RobloxScriptExecutor';
import ScriptExecutionEngine from './ScriptExecutionEngine';
import EggWatcher from './EggWatcher';
import PetHatcherOverlay from './PetHatcherOverlay';
import StandalonePackager from './StandalonePackager';
import ScriptManager from './ScriptManager';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Code, Package, Eye, Gamepad2, Settings } from 'lucide-react';

const AppLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('executor');

  return (
    <div className="min-h-screen bg-background">
      <GameHubHeader />
      
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="executor" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span className="hidden sm:inline">Scripts</span>
            </TabsTrigger>
            <TabsTrigger value="engines" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Engines</span>
            </TabsTrigger>
            <TabsTrigger value="watcher" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Watcher</span>
            </TabsTrigger>
            <TabsTrigger value="hatcher" className="flex items-center space-x-2">
              <Gamepad2 className="h-4 w-4" />
              <span className="hidden sm:inline">Hatcher</span>
            </TabsTrigger>
            <TabsTrigger value="manager" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Manager</span>
            </TabsTrigger>
            <TabsTrigger value="package" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Package</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="executor" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <RobloxScriptExecutor />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="engines" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <ScriptExecutionEngine />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="watcher" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <EggWatcher />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hatcher" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <PetHatcherOverlay />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="manager" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <ScriptManager />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="package" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <StandalonePackager />
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </main>
      
      <footer className="border-t bg-muted/50 py-4 mt-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-sm text-muted-foreground">
              Pet Simulator 99 Enhancement Hub - v1.0.0
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Status: {typeof window !== 'undefined' && window.electron ? 'Standalone' : 'Web'}</span>
              <span>•</span>
              <span>Scripts: Active</span>
              <span>•</span>
              <span>API: Connected</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;