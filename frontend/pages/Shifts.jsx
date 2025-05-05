import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ShiftSchedule from "@/components/dashboard/ShiftSchedule";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShiftsPage = () => {
  const navigate = useNavigate();

  const handleAddShift = () => {
    // Handle adding a new shift
    console.log("Adding new shift");
  };

  const handleEditShift = (shiftId) => {
    // Handle editing a shift
    console.log("Editing shift:", shiftId);
  };

  const handleDeleteShift = (shiftId) => {
    // Handle deleting a shift
    console.log("Deleting shift:", shiftId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Shifts</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage library operating shifts
              </p>
            </div>
          </div>
        </div>

        <ShiftSchedule
          onAddShift={handleAddShift}
          onEditShift={handleEditShift}
          onDeleteShift={handleDeleteShift}
        />
      </div>
    </DashboardLayout>
  );
};

export default ShiftsPage; 