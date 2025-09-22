import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import Accounts from "@/pages/accounts";
import Instances from "@/pages/instances";
import UWPInstances from "@/pages/uwp-instances";
import RobloxProcesses from "@/pages/roblox-processes";
import SyncManager from "@/pages/sync-manager";
import EnhancedSystem from "@/pages/enhanced-system";
import ProvenMultiInstance from "@/pages/proven-multi-instance";
import RealLauncher from "@/pages/real-launcher";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/instances" component={Instances} />
          <Route path="/uwp-instances" component={UWPInstances} />
          <Route path="/roblox-processes" component={RobloxProcesses} />
          <Route path="/sync-manager" component={SyncManager} />
          <Route path="/enhanced-system" component={EnhancedSystem} />
          <Route path="/proven-multi-instance" component={ProvenMultiInstance} />
          <Route path="/real-launcher" component={RealLauncher} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
