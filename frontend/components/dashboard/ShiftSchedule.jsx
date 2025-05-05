import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import { 
  PencilLine, 
  Plus, 
  ClockIcon, 
  AlertCircle,
  RotateCw,
  Save,
  X,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PropTypes from 'prop-types';

// Shifts data will be fetched from API
const initialShifts = [];

const ShiftSchedule = ({ className, onAddShift, onEditShift, onDeleteShift }) => {
  const { toast } = useToast();
  const [shifts, setShifts] = useState(initialShifts);
  const [editingShift, setEditingShift] = useState(null);
  const [editedShift, setEditedShift] = useState(null);

  const handleAddNewShift = () => {
    const newShift = {
      id: `shift-${shifts.length + 1}`,
      name: "New Shift",
      timeRange: "00:00 AM - 00:00 PM",
      capacity: "0 seats",
      currentOccupancy: "0 seats (0%)",
      status: "inactive",
      staffAssigned: 0,
    };
    setShifts([...shifts, newShift]);
    setEditingShift(newShift.id);
    setEditedShift(newShift);
    onAddShift();
  };

  const handleEditShift = (shiftId) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (shift) {
      setEditingShift(shiftId);
      setEditedShift({ ...shift });
      onEditShift(shiftId);
    }
  };

  const handleSaveShift = () => {
    if (editingShift && editedShift) {
      setShifts(shifts.map(shift => 
        shift.id === editingShift ? editedShift : shift
      ));
      setEditingShift(null);
      setEditedShift(null);
      toast({
        title: "Shift Updated",
        description: "The shift has been successfully updated.",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingShift(null);
    setEditedShift(null);
  };

  const handleReallocateShift = (from, to) => {
    toast({
      title: "Reallocate Seats",
      description: `Seats reallocated from ${from} to ${to}.`,
    });
  };

  const handleDeleteShift = (shiftId) => {
    setShifts(shifts.filter(shift => shift.id !== shiftId));
    toast({
      title: "Shift Deleted",
      description: "The shift has been successfully deleted.",
    });
    onDeleteShift(shiftId);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Shift Management</CardTitle>
            <CardDescription>Configure library operating shifts</CardDescription>
          </div>
          <Button onClick={handleAddNewShift}>
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
                <TableHead>Shift Name</TableHead>
                <TableHead>Time Range</TableHead>
                <TableHead className="hidden md:table-cell">Capacity</TableHead>
                <TableHead className="hidden md:table-cell">Current Occupancy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">
                    {editingShift === shift.id ? (
                      <Input
                        value={editedShift?.name}
                        onChange={(e) => setEditedShift(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="h-8"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-muted-foreground" />
                        {shift.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingShift === shift.id ? (
                      <Input
                        value={editedShift?.timeRange}
                        onChange={(e) => setEditedShift(prev => prev ? { ...prev, timeRange: e.target.value } : null)}
                        className="h-8"
                      />
                    ) : (
                      shift.timeRange
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {editingShift === shift.id ? (
                      <Input
                        value={editedShift?.capacity}
                        onChange={(e) => setEditedShift(prev => prev ? { ...prev, capacity: e.target.value } : null)}
                        className="h-8"
                      />
                    ) : (
                      shift.capacity
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {shift.currentOccupancy}
                  </TableCell>
                  <TableCell>
                    <Badge variant={shift.status === 'active' ? 'default' : 'secondary'}>
                      {shift.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editingShift === shift.id ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSaveShift}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditShift(shift.id)}
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteShift(shift.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium mb-2">Auto Seat Reallocation</h4>
          <div className="flex flex-wrap gap-2 items-start">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => handleReallocateShift("Morning", "Evening")}
              className="flex items-center"
            >
              <RotateCw className="mr-1 h-3 w-3" />
              Morning → Evening
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => handleReallocateShift("Evening", "Late Evening")}
              className="flex items-center"
            >
              <RotateCw className="mr-1 h-3 w-3" />
              Evening → Late Evening
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center"
              onClick={() => toast({
                title: "Configure Auto-Reallocation",
                description: "Auto-reallocation settings opened."
              })}
            >
              Configure Auto-Reallocation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

ShiftSchedule.propTypes = {
  className: PropTypes.string,
  onAddShift: PropTypes.func,
  onEditShift: PropTypes.func,
  onDeleteShift: PropTypes.func
};

export default ShiftSchedule;
