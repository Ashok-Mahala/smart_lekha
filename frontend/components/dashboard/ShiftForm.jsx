import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const ShiftForm = ({ shift, onSubmit, onCancel }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: shift?.name || '',
    startTime: shift?.startTime || '',
    endTime: shift?.endTime || '',
    property: '' // Will be set from localStorage
  });

  // Get property from localStorage on component mount
  useEffect(() => {
    const selectedProperty = localStorage.getItem('selected_property');
    if (!selectedProperty) {
      toast({
        title: "Error",
        description: "No property selected",
        variant: "destructive",
      });
      onCancel();
      return;
    }
    setFormData(prev => ({ ...prev, property: selectedProperty }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startTime || !formData.endTime) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast({
        title: "Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    if (!formData.property) {
      toast({
        title: "Error",
        description: "No property selected",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      name: formData.name,
      startTime: formData.startTime,
      endTime: formData.endTime,
      property: formData.property
    });
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{shift ? 'Edit Shift' : 'Create New Shift'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Shift Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {shift ? 'Update Shift' : 'Create Shift'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftForm;