import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sofa, CheckCircle2, Users } from 'lucide-react';
import { getSeatsByProperty, updateSeatStatus } from '@/api/seats';
import { toast } from "sonner";

const SeatSelectionModal = ({ 
  isOpen, 
  onClose, 
  onSeatSelect, 
  propertyId, 
  shift,
  currentSeat 
}) => {
  const [seats, setSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);

  useEffect(() => {
    if (isOpen && propertyId) {
      loadSeats();
    }
  }, [isOpen, propertyId, shift]);

  useEffect(() => {
    if (currentSeat) {
      setSelectedSeat(currentSeat);
    }
  }, [currentSeat]);

  const loadSeats = async () => {
    try {
      setIsLoading(true);
      const seatsData = await getSeatsByProperty(propertyId);
      
      // Filter available seats for the selected shift
      const availableSeats = seatsData.filter(seat => 
        seat.status === 'available' || seat._id === currentSeat?._id
      );
      
      setSeats(availableSeats);
    } catch (error) {
      console.error("Error loading seats:", error);
      toast.error("Failed to load available seats");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatSelect = (seat) => {
    setSelectedSeat(seat);
  };

  const handleConfirmSelection = async () => {
    if (!selectedSeat) {
      toast.error("Please select a seat");
      return;
    }

    try {
      // If changing from an existing seat, free up the old seat
      if (currentSeat && currentSeat._id !== selectedSeat._id) {
        await updateSeatStatus(currentSeat._id, { status: 'available' });
      }

      // Assign the new seat
      await updateSeatStatus(selectedSeat._id, { 
        status: 'occupied',
        studentId: id // You'll need to pass student id as prop
      });

      onSeatSelect(selectedSeat);
      onClose();
      toast.success("Seat assigned successfully");
    } catch (error) {
      console.error("Error assigning seat:", error);
      toast.error("Failed to assign seat");
    }
  };

  const getSeatStatusColor = (seat) => {
    if (seat._id === selectedSeat?._id) return 'bg-blue-100 border-blue-500 text-blue-900';
    if (seat.status === 'available') return 'bg-green-100 border-green-500 text-green-900';
    if (seat.status === 'occupied') return 'bg-red-100 border-red-500 text-red-900';
    return 'bg-gray-100 border-gray-500 text-gray-900';
  };

  const getSeatStatusIcon = (seat) => {
    if (seat._id === selectedSeat?._id) return <CheckCircle2 className="h-4 w-4" />;
    if (seat.status === 'available') return <Sofa className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select a Seat</DialogTitle>
          <DialogDescription>
            Choose an available seat for {shift?.name || 'the selected shift'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seat Status Legend */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Occupied</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Loading available seats...</span>
            </div>
          ) : (
            <>
              {/* Seats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-2">
                {seats.map((seat) => (
                  <div
                    key={seat._id}
                    className={`
                      border-2 rounded-lg p-3 cursor-pointer transition-all duration-200
                      hover:shadow-md flex flex-col items-center justify-center
                      ${getSeatStatusColor(seat)}
                      ${seat.status === 'occupied' && seat._id !== currentSeat?._id ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    onClick={() => {
                      if (seat.status !== 'occupied' || seat._id === currentSeat?._id) {
                        handleSeatSelect(seat);
                      }
                    }}
                  >
                    {getSeatStatusIcon(seat)}
                    <span className="font-semibold mt-1 text-sm">
                      {seat.seatNumber}
                    </span>
                    <span className="text-xs mt-1 capitalize">
                      {seat._id === selectedSeat?._id ? 'Selected' : seat.status}
                    </span>
                  </div>
                ))}
              </div>

              {seats.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No available seats found for this shift
                </div>
              )}

              {/* Selected Seat Info */}
              {selectedSeat && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900">Selected Seat</h4>
                  <p className="text-blue-700">
                    Seat Number: <strong>{selectedSeat.seatNumber}</strong>
                  </p>
                  <p className="text-blue-700 text-sm">
                    Row: {selectedSeat.row + 1}, Column: {selectedSeat.column + 1}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmSelection}
                  disabled={!selectedSeat}
                >
                  Assign Seat
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SeatSelectionModal;