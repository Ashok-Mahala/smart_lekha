import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Key, Shield, Lock, Smartphone, AlertTriangle, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

export default function SecurityPage() {
  const navigate = useNavigate();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [devices, setDevices] = useState([]);
  const [securityScore, setSecurityScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDevices();
    fetchSecurityScore();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const response = await fetch('/api/devices');
      // const data = await response.json();
      // setDevices(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch devices');
      setLoading(false);
    }
  };

  const fetchSecurityScore = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const response = await fetch('/api/security-score');
      // const data = await response.json();
      // setSecurityScore(data.score);
      setSecurityScore(85); // Default value until API is implemented
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch security score');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <div className="grid gap-6">
        {/* Security Overview */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Security Overview</CardTitle>
                <CardDescription>Your account security status and recommendations</CardDescription>
              </div>
              <Badge variant="outline" className="bg-white">
                Score: {securityScore}/100
              </Badge>
            </div>
            <Progress value={securityScore} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Two-Factor Authentication */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </div>
              <Badge variant={twoFactorEnabled ? "success" : "destructive"}>
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <Label>Enable 2FA</Label>
                <p className="text-sm text-muted-foreground">
                  Protect your account with two-factor authentication
                </p>
              </div>
              <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
            </div>
            {twoFactorEnabled && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 rounded-lg border">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Authenticator App</p>
                    <p className="text-sm text-muted-foreground">Set up using Google Authenticator</p>
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
                <div className="flex items-center gap-2 p-4 rounded-lg border">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Key className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Backup Codes</p>
                    <p className="text-sm text-muted-foreground">Generate backup codes for emergencies</p>
                  </div>
                  <Badge variant="secondary">Generated</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Manage your active sessions and devices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && <p>Loading devices...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {!loading && !error && devices.length === 0 && (
              <p className="text-center text-muted-foreground">No active sessions found</p>
            )}
            {devices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Last active: {device.lastActive}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Location: {device.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={device.status === "active" ? "success" : "secondary"}>
                    {device.status}
                  </Badge>
                  <Button variant="outline" size="sm">End Session</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Security Alerts</CardTitle>
            <CardDescription>Configure your security alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <Label>Login Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone logs in to your account
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <Label>Device Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a new device accesses your account
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <Label>Security Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive important security updates and announcements
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Security */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Security</CardTitle>
            <CardDescription>Additional security measures for your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>IP Whitelist</Label>
                <Input placeholder="Enter IP addresses (comma separated)" />
                <p className="text-xs text-muted-foreground">
                  Only allow access from these IP addresses
                </p>
              </div>
              <div className="space-y-2">
                <Label>Session Timeout</Label>
                <Input type="number" placeholder="Minutes" defaultValue="30" />
                <p className="text-xs text-muted-foreground">
                  Automatically log out after inactivity
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Save Advanced Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 