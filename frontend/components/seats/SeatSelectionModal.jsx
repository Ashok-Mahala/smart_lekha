import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sofa, CheckCircle2, Users, MapPin } from 'lucide-react';
import { getSeatsByProperty, updateSeatStatus } from '@/api/seats';
import { toast } from "sonner";

const SeatSelectionModal = ({ 
  isOpen, 
  onClose, 
  onSeatSelect, 
  propertyId, 
  shift,
  currentSeat,
  studentId
}) => {
  const [seats, setSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);

  useEffect(() => {
    if (isOpen && propertyId) {
      loadSeats();
      setSelectedSeat(currentSeat || null);
    }
  }, [isOpen, propertyId, shift, currentSeat]);

  const loadSeats = async () => {
    try {
      setIsLoading(true);
      const seatsData = await getSeatsByProperty(propertyId);
      
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
      if (currentSeat && currentSeat._id !== selectedSeat._id) {
        await updateSeatStatus(currentSeat._id, { status: 'available' });
      }

      await updateSeatStatus(selectedSeat._id, { 
        status: 'occupied',
        studentId: studentId
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
    return 'bg-gray-100 border-gray-300 text-gray-700';
  };

  const getSeatStatusIcon = (seat) => {
    if (seat._id === selectedSeat?._id) return <CheckCircle2 className="h-3 w-3" />;
    if (seat.status === 'available') return <Sofa className="h-3 w-3" />;
    return <Users className="h-3 w-3" />;
  };

  const isSeatSelectable = (seat) => {
    return seat.status === 'available' || seat._id === currentSeat?._id;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Select a Seat
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Shift Information */}
          {shift && (
            <div className="bg-gray-50 rounded-lg p-3 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <p className="font-medium text-sm">Selected Shift</p>
                  <p className="text-sm text-gray-600">
                    {shift.name} {shift.fee && `- ₹${shift.fee}`}
                  </p>
                </div>
                <Badge variant="outline" className="self-start sm:self-auto">
                  {seats.length} seats available
                </Badge>
              </div>
            </div>
          )}

          {/* Seat Status Legend */}
          <div className="flex flex-wrap gap-3 text-xs justify-center sm:justify-start flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Occupied</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 flex-1">
              <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
              <span className="text-sm text-muted-foreground">Loading available seats...</span>
            </div>
          ) : (
            <>
              {/* Seats Grid Container */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 p-1">
                  {seats.map((seat) => (
                    <div
                      key={seat._id}
                      className={`
                        border rounded-lg p-2 transition-all duration-200
                        flex flex-col items-center justify-center min-h-[70px]
                        ${getSeatStatusColor(seat)}
                        ${isSeatSelectable(seat) 
                          ? 'cursor-pointer hover:shadow-md hover:scale-105' 
                          : 'cursor-not-allowed opacity-60'
                        }
                      `}
                      onClick={() => {
                        if (isSeatSelectable(seat)) {
                          handleSeatSelect(seat);
                        }
                      }}
                    >
                      {getSeatStatusIcon(seat)}
                      <span className="font-semibold text-sm mt-1">
                        {seat.seatNumber}
                      </span>
                      <span className="text-[10px] mt-0.5 capitalize text-center leading-tight">
                        {seat._id === selectedSeat?._id ? 'Selected' : seat.status}
                      </span>
                    </div>
                  ))}
                </div>

                {seats.length === 0 && !isLoading && (
                  <div className="text-center py-8 border rounded-lg bg-gray-50 mx-1">
                    <Sofa className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-muted-foreground font-medium">No available seats found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All seats are currently occupied for this shift
                    </p>
                  </div>
                )}
              </div>

              {/* Information Sections */}
              <div className="space-y-3 flex-shrink-0">
                {/* Selected Seat Info */}
                {selectedSeat && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-blue-900 text-sm">Selected Seat</h4>
                        <p className="text-blue-700 text-sm">
                          Seat <strong>{selectedSeat.seatNumber}</strong>
                          <span className="text-blue-600 text-xs ml-2">
                            (Row {selectedSeat.row + 1}, Col {selectedSeat.column + 1})
                          </span>
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 self-start sm:self-auto">
                        Ready to Assign
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Current Seat Info */}
                {currentSeat && currentSeat._id !== selectedSeat?._id && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-amber-900 text-sm">Current Seat</h4>
                        <p className="text-amber-700 text-sm">
                          Seat <strong>{currentSeat.seatNumber}</strong> will be freed up
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 self-start sm:self-auto">
                        Current
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons - Fixed at bottom */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t flex-shrink-0">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmSelection}
                  disabled={!selectedSeat}
                  className="w-full sm:w-auto gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
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