import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import PropTypes from "prop-types";
import { 
  Armchair, 
  BookOpen, 
  CalendarDays, 
  Clock, 
  Layout, 
  MapPin, 
  Settings as SettingsIcon, 
  Sofa, 
  Users, 
  Bell, 
  CreditCard, 
  Shield, 
  Globe, 
  Database, 
  Mail, 
  Lock, 
  FileText,
  Zap,
  Palette,
  Languages
} from "lucide-react";

const seatLayoutSchema = z.object({
  seatingMode: z.string(),
  rowSpacing: z.string(),
  seatSpacing: z.string(),
  autoNumbering: z.boolean().default(true),
  enableGroupBooking: z.boolean().default(true),
  defaultLayout: z.string(),
});

const seatingFeaturesSchema = z.object({
  allowMultiDayBooking: z.boolean().default(true),
  maxHoursPerBooking: z.string(),
  requireApproval: z.boolean().default(false),
  allowStudentCancellation: z.boolean().default(true),
  enableWaitlist: z.boolean().default(true),
  preventDoubleBooking: z.boolean().default(true),
  requireStudentVerification: z.boolean().default(false)
});

const reservationRulesSchema = z.object({
  maxDaysInAdvance: z.string(),
  maxActiveReservations: z.string(),
  bookingCooldown: z.string(),
  lateArrivalPolicy: z.string(),
  noShowPenalty: z.string(),
});

const SettingsPage = () => {
  const { toast = () => {} } = useToast();

  const seatingLayoutForm = useForm({
    resolver: zodResolver(seatLayoutSchema),
    defaultValues: {
      seatingMode: "standard",
      rowSpacing: "normal",
      seatSpacing: "normal",
      autoNumbering: true,
      enableGroupBooking: true,
      defaultLayout: "classroom"
    },
  });

  const seatingFeaturesForm = useForm({
    resolver: zodResolver(seatingFeaturesSchema),
    defaultValues: {
      allowMultiDayBooking: true,
      maxHoursPerBooking: "4",
      requireApproval: false,
      allowStudentCancellation: true,
      enableWaitlist: true,
      preventDoubleBooking: true,
      requireStudentVerification: false
    },
  });

  const reservationRulesForm = useForm({
    resolver: zodResolver(reservationRulesSchema),
    defaultValues: {
      maxDaysInAdvance: "7",
      maxActiveReservations: "2",
      bookingCooldown: "1",
      lateArrivalPolicy: "15",
      noShowPenalty: "1",
    },
  });

  const onSubmitSeatingLayout = (data) => {
    toast({
      title: "Seating Layout Updated",
      description: "Your seating layout settings have been updated successfully.",
    });
    console.log("Seating Layout:", data);
  };

  const onSubmitSeatingFeatures = (data) => {
    toast({
      title: "Seating Features Updated",
      description: "Your seating features settings have been updated successfully.",
    });
    console.log("Seating Features:", data);
  };

  const onSubmitReservationRules = (data) => {
    toast({
      title: "Reservation Rules Updated",
      description: "Your reservation rules have been updated successfully.",
    });
    console.log("Reservation Rules:", data);
  };

  const zones = [
    { value: "full-day", label: "Full Day Zone" },
    { value: "half-day", label: "Half Day Zone" },
    { value: "reading-area", label: "Reading Area" },
    { value: "computer-zone", label: "Computer Zone" },
    { value: "quiet-study", label: "Quiet Study" },
    { value: "group-study", label: "Group Study" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and preferences
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <TabsTrigger value="general">
              <SettingsIcon className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="layout">
              <Layout className="w-4 h-4 mr-2" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure basic system settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>System Name</Label>
                    <Input defaultValue="SB2 Library Management System" />
                  </div>
                  <div className="space-y-2">
                    <Label>Time Zone</Label>
                    <Select defaultValue="asia/kolkata">
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia/kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="asia/dubai">Asia/Dubai (GST)</SelectItem>
                        <SelectItem value="asia/singapore">Asia/Singapore (SGT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select defaultValue="dd/mm/yyyy">
                      <SelectTrigger>
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="maintenance-mode" />
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Integration Settings</CardTitle>
                  <CardDescription>
                    Configure third-party integrations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Google Maps API Key</Label>
                    <Input type="password" placeholder="Enter API key" />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Gateway</Label>
                    <Select defaultValue="razorpay">
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment gateway" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="razorpay">Razorpay</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Layout Settings */}
          <TabsContent value="layout">
            <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Seat Layout Configuration</CardTitle>
                <CardDescription>
                  Configure the seating arrangement and layout settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Left Side Columns</Label>
                    <Input type="number" value="3" disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Right Side Columns</Label>
                    <Input type="number" value="4" disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Total Rows</Label>
                  <Input type="number" value="14" disabled />
                            </div>
                <div className="space-y-2">
                  <Label>Grid Gap</Label>
                  <Input type="number" value="1" disabled />
                            </div>
                <div className="flex items-center space-x-2">
                  <Switch id="auto-refresh" />
                  <Label htmlFor="auto-refresh">Auto-refresh seat status</Label>
                    </div>
              </CardContent>
            </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Seating Features</CardTitle>
                  <CardDescription>
                    Configure advanced seating features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="group-booking" />
                    <Label htmlFor="group-booking">Enable group booking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="waitlist" />
                    <Label htmlFor="waitlist">Enable waitlist</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="auto-assign" />
                    <Label htmlFor="auto-assign">Auto-assign seats</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <div className="grid gap-4">
            <Card>
              <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="email-notifications" />
                  <Label htmlFor="email-notifications">Email notifications</Label>
                    </div>
                <div className="flex items-center space-x-2">
                  <Switch id="push-notifications" />
                  <Label htmlFor="push-notifications">Push notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="booking-alerts" />
                  <Label htmlFor="booking-alerts">Booking alerts</Label>
                </div>
              </CardContent>
            </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Email Templates</CardTitle>
                  <CardDescription>
                    Configure email notification templates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Booking Confirmation</Label>
                    <Select defaultValue="default">
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Template</SelectItem>
                        <SelectItem value="custom">Custom Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Reminder Notifications</Label>
                    <Select defaultValue="default">
                      <SelectTrigger>
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default Template</SelectItem>
                        <SelectItem value="custom">Custom Template</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Settings */}
          <TabsContent value="users">
            <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Configure user roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-approve" />
                  <Label htmlFor="auto-approve">Auto-approve new users</Label>
                    </div>
                <div className="flex items-center space-x-2">
                  <Switch id="require-verification" />
                  <Label htmlFor="require-verification">Require email verification</Label>
                </div>
                  <div className="space-y-2">
                    <Label>Default User Role</Label>
                    <Select defaultValue="student">
                      <SelectTrigger>
                        <SelectValue placeholder="Select default role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Access Control</CardTitle>
                  <CardDescription>
                    Configure access control settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input type="number" defaultValue="30" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="ip-restriction" />
                    <Label htmlFor="ip-restriction">Enable IP restriction</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="2fa" />
                    <Label htmlFor="2fa">Require 2FA for admins</Label>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure security and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="password-policy" />
                    <Label htmlFor="password-policy">Enforce password policy</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Password Expiry (days)</Label>
                    <Input type="number" defaultValue="90" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="login-attempts" />
                    <Label htmlFor="login-attempts">Limit login attempts</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input type="number" defaultValue="5" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Protection</CardTitle>
                  <CardDescription>
                    Configure data protection settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="data-encryption" />
                    <Label htmlFor="data-encryption">Enable data encryption</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="audit-logs" />
                    <Label htmlFor="audit-logs">Enable audit logs</Label>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Retention Period (days)</Label>
                    <Input type="number" defaultValue="365" />
                  </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Settings</CardTitle>
                  <CardDescription>
                    Configure the application's appearance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select defaultValue="light">
                      <SelectTrigger>
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <Select defaultValue="blue">
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="compact-mode" />
                    <Label htmlFor="compact-mode">Compact mode</Label>
                  </div>
                </CardContent>
              </Card>

            <Card>
              <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                <CardDescription>
                    Configure display preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select defaultValue="dd/mm/yyyy">
                      <SelectTrigger>
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                <div className="space-y-2">
                    <Label>Time Format</Label>
                    <Select defaultValue="12h">
                      <SelectTrigger>
                        <SelectValue placeholder="Select time format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                <div className="flex items-center space-x-2">
                    <Switch id="show-seconds" />
                    <Label htmlFor="show-seconds">Show seconds in time</Label>
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

SettingsPage.propTypes = {
  toast: PropTypes.func
};

export default SettingsPage;
