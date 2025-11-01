import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sofa, CheckCircle2, Users, MapPin, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getSeatsByProperty } from '@/api/seats';
import { changeStudentSeat } from '@/api/seats';
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
  const [isChangingSeat, setIsChangingSeat] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showAllSeats, setShowAllSeats] = useState(true);

  useEffect(() => {
    if (isOpen && propertyId && shift) {
      loadSeats();
      setSelectedSeat(currentSeat || null);
    }
  }, [isOpen, propertyId, shift, currentSeat]);

  const loadSeats = async () => {
    try {
      setIsLoading(true);
      const seatsData = await getSeatsByProperty(propertyId);
      setSeats(seatsData);
    } catch (error) {
      console.error("Error loading seats:", error);
      toast.error("Failed to load seats");
    } finally {
      setIsLoading(false);
    }
  };

  const getOccupyingStudent = (seat) => {
    if (!seat.currentAssignments || seat.currentAssignments.length === 0) {
      return null;
    }

    const assignmentForCurrentShift = seat.currentAssignments.find(
      assignment => assignment.shift?._id === shift?._id
    );

    return assignmentForCurrentShift?.student || null;
  };

  const handleSeatSelect = (seat) => {
    // If selecting the same seat, deselect it
    if (selectedSeat && selectedSeat._id === seat._id) {
      setSelectedSeat(null);
      return;
    }

    // Check if seat is occupied by another student
    const occupyingStudent = getOccupyingStudent(seat);
    if (occupyingStudent && occupyingStudent._id !== studentId) {
      toast.error(`This seat is currently occupied by ${occupyingStudent.fullName}`);
      return;
    }

    // Check if seat is available or is the current seat
    if (seat.status !== 'available' && seat._id !== currentSeat?._id) {
      toast.error("This seat is not available for assignment");
      return;
    }

    setSelectedSeat(seat);
  };

  const handleConfirmSelection = async () => {
    if (!selectedSeat) {
      toast.error("Please select a seat");
      return;
    }

    // If selecting the same seat, just close
    if (currentSeat && currentSeat._id === selectedSeat._id) {
      onClose();
      toast.info("You've kept your current seat");
      return;
    }

    try {
      setIsChangingSeat(true);

      const result = await changeStudentSeat({
        currentSeatId: currentSeat?._id,
        newSeatId: selectedSeat._id,
        studentId: studentId,
        shiftId: shift._id,
        reason: 'Student initiated seat change'
      });

      onSeatSelect(selectedSeat);
      onClose();
      toast.success("Seat changed successfully");
    } catch (error) {
      console.error("Error changing seat:", error);
      toast.error(error.response?.data?.message || "Failed to change seat");
    } finally {
      setIsChangingSeat(false);
    }
  };

  const getSeatStatusColor = (seat) => {
    if (seat._id === selectedSeat?._id) return 'bg-blue-100 border-blue-500 text-blue-900';
    
    const occupyingStudent = getOccupyingStudent(seat);
    
    if (occupyingStudent) {
      if (occupyingStudent._id === studentId) {
        return 'bg-purple-100 border-purple-500 text-purple-900';
      } else {
        return 'bg-red-100 border-red-500 text-red-900';
      }
    }
    
    if (seat.status === 'available') return 'bg-green-100 border-green-500 text-green-900';
    if (seat.status === 'occupied') return 'bg-red-100 border-red-500 text-red-900';
    return 'bg-gray-100 border-gray-300 text-gray-700';
  };

  const getSeatStatusIcon = (seat) => {
    if (seat._id === selectedSeat?._id) return <CheckCircle2 className="h-3 w-3" />;
    
    const occupyingStudent = getOccupyingStudent(seat);
    
    if (occupyingStudent) {
      if (occupyingStudent._id === studentId) {
        return <Users className="h-3 w-3" />;
      } else {
        return <AlertCircle className="h-3 w-3" />;
      }
    }
    
    if (seat.status === 'available') return <Sofa className="h-3 w-3" />;
    if (seat.status === 'occupied') return <Users className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  const getSeatStatusText = (seat) => {
    if (seat._id === selectedSeat?._id) return 'Selected';
    
    const occupyingStudent = getOccupyingStudent(seat);
    
    if (occupyingStudent) {
      if (occupyingStudent._id === studentId) {
        return 'Your Seat';
      } else {
        return `Occupied by ${occupyingStudent.firstName}`;
      }
    }
    
    if (seat.status === 'available') return 'Available';
    if (seat.status === 'occupied') return 'Occupied';
    return seat.status;
  };

  const isSeatSelectable = (seat) => {
    const occupyingStudent = getOccupyingStudent(seat);
    
    // Seat is selectable if:
    // 1. It's available, OR
    // 2. It's the current student's seat (to allow keeping same seat)
    return seat.status === 'available' || (occupyingStudent && occupyingStudent._id === studentId);
  };

  const getSeatTooltip = (seat) => {
    const occupyingStudent = getOccupyingStudent(seat);
    
    if (occupyingStudent) {
      if (occupyingStudent._id === studentId) {
        return 'Your current seat - Click to keep this seat';
      } else {
        return `Occupied by ${occupyingStudent.fullName} - Not available`;
      }
    }
    
    if (seat.status === 'available') return 'Available seat - Click to select';
    if (seat.status === 'occupied') return 'Occupied seat - Not available';
    return 'Seat information';
  };

  // Filter seats based on toggle
  const displayedSeats = showAllSeats 
    ? seats 
    : seats.filter(seat => isSeatSelectable(seat));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[96vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              {currentSeat ? 'Change Your Seat' : 'Select a Seat'} - {shift?.name}
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllSeats(!showAllSeats)}
              className="flex items-center gap-2"
            >
              {showAllSeats ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showAllSeats ? 'Show Available Only' : 'Show All Seats'}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Shift Information */}
          {shift && (
            <div className="bg-gray-50 rounded-lg p-3 flex-shrink-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <p className="font-medium text-sm">Selected Shift</p>
                  <p className="text-sm text-gray-600">
                    {shift.name} 
                    {shift.startTime && shift.endTime && ` (${shift.startTime} - ${shift.endTime})`}
                    {shift.fee && ` - ₹${shift.fee}`}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <Badge variant="outline" className="self-start sm:self-auto">
                    {seats.filter(seat => isSeatSelectable(seat)).length} seats available
                  </Badge>
                  {!showAllSeats && (
                    <Badge variant="secondary" className="self-start sm:self-auto">
                      Filtered: Available Only
                    </Badge>
                  )}
                </div>
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
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Your Seat</span>
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
              <span className="text-sm text-muted-foreground">Loading seats...</span>
            </div>
          ) : (
            <>
              {/* Seats Grid Container */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 p-1">
                  {displayedSeats.map((seat) => {
                    const isSelectable = isSeatSelectable(seat);
                    const tooltip = getSeatTooltip(seat);
                    
                    return (
                      <div
                        key={seat._id}
                        className={`
                          border rounded-lg p-2 transition-all duration-200
                          flex flex-col items-center justify-center min-h-[70px]
                          ${getSeatStatusColor(seat)}
                          ${isSelectable 
                            ? 'cursor-pointer hover:shadow-md hover:scale-105' 
                            : 'cursor-not-allowed opacity-60'
                          }
                        `}
                        onClick={() => {
                          if (isSelectable) {
                            handleSeatSelect(seat);
                          }
                        }}
                        title={tooltip}
                      >
                        {getSeatStatusIcon(seat)}
                        <span className="font-semibold text-sm mt-1">
                          {seat.seatNumber}
                        </span>
                        <span className="text-[10px] mt-0.5 capitalize text-center leading-tight">
                          {getSeatStatusText(seat)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {displayedSeats.length === 0 && !isLoading && (
                  <div className="text-center py-8 border rounded-lg bg-gray-50 mx-1">
                    <Sofa className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-muted-foreground font-medium">
                      {showAllSeats ? 'No seats found' : 'No available seats found'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {showAllSeats 
                        ? 'There are no seats configured for this property' 
                        : 'All seats are currently occupied for this shift'
                      }
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
                        <h4 className="font-semibold text-blue-900 text-sm">
                          {selectedSeat._id === currentSeat?._id ? 'Keeping Current Seat' : 'Selected New Seat'}
                        </h4>
                        <p className="text-blue-700 text-sm">
                          Seat <strong>{selectedSeat.seatNumber}</strong>
                          <span className="text-blue-600 text-xs ml-2">
                            (Row {selectedSeat.row + 1}, Col {selectedSeat.column + 1})
                          </span>
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 self-start sm:self-auto">
                        {selectedSeat._id === currentSeat?._id ? 'No Change' : 'Ready to Assign'}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Current Seat Info - Only show if changing seats */}
                {currentSeat && selectedSeat && currentSeat._id !== selectedSeat._id && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-amber-900 text-sm">Current Seat</h4>
                        <p className="text-amber-700 text-sm">
                          Seat <strong>{currentSeat.seatNumber}</strong> will be freed up
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 self-start sm:self-auto">
                        To Be Released
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
                  disabled={isChangingSeat}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmSelection}
                  disabled={!selectedSeat || isChangingSeat}
                  className="w-full sm:w-auto gap-2"
                >
                  {isChangingSeat ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {isChangingSeat 
                    ? 'Changing Seat...' 
                    : selectedSeat && selectedSeat._id === currentSeat?._id 
                      ? 'Keep This Seat' 
                      : 'Change Seat'
                  }
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