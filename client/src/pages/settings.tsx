import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Save, FolderOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Settings } from "@shared/schema";

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const { data: settingsData = [], isLoading } = useQuery<Settings[]>({
    queryKey: ["/api/settings"],
    onSuccess: (data) => {
      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
      setSettings(settingsMap);
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      await apiRequest("PUT", `/api/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    Object.entries(settings).forEach(([key, value]) => {
      updateSettingMutation.mutate({ key, value });
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Configure your Roblox Manager preferences</p>
          </div>

          <div className="space-y-6">
            {/* Roblox Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Roblox Configuration</CardTitle>
                <CardDescription>Configure paths and behavior for Roblox client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roblox-path">Roblox Installation Path</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="roblox-path"
                      placeholder="C:\Users\YourName\AppData\Local\Roblox\Versions\..."
                      value={settings.roblox_path || ""}
                      onChange={(e) => handleSettingChange("roblox_path", e.target.value)}
                    />
                    <Button variant="outline" size="icon">
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-instances">Maximum Instances</Label>
                  <Input
                    id="max-instances"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.max_instances || "5"}
                    onChange={(e) => handleSettingChange("max_instances", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Instance Management */}
            <Card>
              <CardHeader>
                <CardTitle>Instance Management</CardTitle>
                <CardDescription>Control how instances are managed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-restart on crash</Label>
                    <p className="text-sm text-gray-500">Automatically restart instances if they crash</p>
                  </div>
                  <Switch
                    checked={settings.auto_restart === "true"}
                    onCheckedChange={(checked) => handleSettingChange("auto_restart", checked.toString())}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Start instances on launch</Label>
                    <p className="text-sm text-gray-500">Start all instances when the application launches</p>
                  </div>
                  <Switch
                    checked={settings.start_on_launch === "true"}
                    onCheckedChange={(checked) => handleSettingChange("start_on_launch", checked.toString())}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Minimize to tray</Label>
                    <p className="text-sm text-gray-500">Minimize application to system tray instead of closing</p>
                  </div>
                  <Switch
                    checked={settings.minimize_to_tray === "true"}
                    onCheckedChange={(checked) => handleSettingChange("minimize_to_tray", checked.toString())}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle>Monitoring & Logging</CardTitle>
                <CardDescription>Configure monitoring and logging preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="log-level">Log Level</Label>
                  <select 
                    id="log-level"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={settings.log_level || "info"}
                    onChange={(e) => handleSettingChange("log_level", e.target.value)}
                  >
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="log-retention">Log Retention (days)</Label>
                  <Input
                    id="log-retention"
                    type="number"
                    min="1"
                    max="30"
                    value={settings.log_retention || "7"}
                    onChange={(e) => handleSettingChange("log_retention", e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Performance monitoring</Label>
                    <p className="text-sm text-gray-500">Monitor CPU and memory usage of instances</p>
                  </div>
                  <Switch
                    checked={settings.performance_monitoring === "true"}
                    onCheckedChange={(checked) => handleSettingChange("performance_monitoring", checked.toString())}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateSettingMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateSettingMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
