import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ShiftSchedule from "@/components/dashboard/ShiftSchedule";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const ShiftsPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Shift Management</h1>
            <p className="text-muted-foreground">
              Manage library operating shifts
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ShiftSchedule />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ShiftsPage;
