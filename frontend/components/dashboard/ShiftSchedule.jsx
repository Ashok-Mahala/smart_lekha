import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilLine, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  createShift,
  getShifts,
  updateShift,
  deleteShift,
} from "@/api/shifts";
import ShiftForm from "@/components/dashboard/ShiftForm";

const ShiftSchedule = ({ className }) => {
  const { toast } = useToast();
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);

  const loadShifts = async () => {
    try {
      const response = await getShifts();
      setShifts(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load shifts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const handleCreateShift = async (shiftData) => {
    try {
      await createShift(shiftData);
      await loadShifts(); // Ensures latest data from DB
      setIsFormOpen(false);
      toast({
        title: "Success",
        description: "Shift created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create shift",
        variant: "destructive",
      });
    }
  };

  const handleUpdateShift = async (id, shiftData) => {
    try {
      await updateShift(id, shiftData);
      await loadShifts(); // Ensures consistency after update
      setEditingShift(null);
      toast({
        title: "Success",
        description: "Shift updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update shift",
        variant: "destructive",
      });
    }
  };

  const handleDeleteShift = async (id) => {
    try {
      await deleteShift(id);
      setShifts((prevShifts) => prevShifts.filter((s) => s._id !== id));
      toast({
        title: "Success",
        description: "Shift deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete shift",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Invalid Time";

    try {
      const time = new Date(timeString);
      if (isNaN(time.getTime())) {
        return timeString;
      }
      return time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return timeString;
    }
  };

  if (isLoading) {
    return <div>Loading shifts...</div>;
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Shift Management</CardTitle>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Shift
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift._id || `${shift.name}-${shift.startTime}`}>
                  <TableCell>{shift.name || "—"}</TableCell>
                  <TableCell>{formatTime(shift.startTime)}</TableCell>
                  <TableCell>{formatTime(shift.endTime)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingShift(shift)}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteShift(shift._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {isFormOpen && (
          <ShiftForm
            shift={null}
            onSubmit={handleCreateShift}
            onCancel={() => setIsFormOpen(false)}
          />
        )}

        {editingShift && (
          <ShiftForm
            shift={editingShift}
            onSubmit={(data) => handleUpdateShift(editingShift._id, data)}
            onCancel={() => setEditingShift(null)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ShiftSchedule;
