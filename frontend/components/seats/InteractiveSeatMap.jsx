import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Sofa, User, Lock, Unlock, Calendar, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StudentInfoDialog from './StudentInfoDialog';
import PreBookedSeatDialog from './PreBookedSeatDialog';
import AvailableSeatDialog from './AvailableSeatDialog';
import PropTypes from 'prop-types';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

// Shifts will be fetched from API
const shifts = [];

const InteractiveSeatMap = ({ className, onSeatSelect, showOnlyAvailable = false }) => {
  const [seats, setSeats] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));
  const [selectedShift, setSelectedShift] = useState(shifts[0]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isPreBookDialogOpen, setIsPreBookDialogOpen] = useState(false);
  const [isAvailableDialogOpen, setIsAvailableDialogOpen] = useState(false);
  const [selectedSeatForPreBook, setSelectedSeatForPreBook] = useState(null);
  const [selectedAvailableSeat, setSelectedAvailableSeat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/smlekha/seats');
        
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('API endpoint not available');
      }

        const data = await response.json();
        setSeats(data);
      } catch (error) {
        console.error('Error fetching seats:', error);
        setError('Unable to load seat data.');
        toast({
          title: "Error",
          description: "Failed to load seat data.",
          variant: "destructive",
        });
        
        // Initialize with empty seats array when API fails
        setSeats([]);
      } finally {
        setIsLoading(false);
      }
  };

    // Update date and time
    const updateDateTime = () => {
      const now = new Date();
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      setCurrentDate(now.toLocaleDateString('en-US', options));
    };

    fetchSeats();
    updateDateTime();

    // Update time every minute
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSeatClick = (seat) => {
    if (seat.status === 'locked') {
      return;
    }

    // Handle different seat statuses
    if (seat.status === 'reserved') {
      setSelectedSeatForPreBook(seat);
      setIsPreBookDialogOpen(true);
      setSelectedSeats([]);
    } else if (seat.status === 'occupied') {
      setSelectedStudent(seat.student);
      setIsStudentDialogOpen(true);
      setSelectedSeats([]);
    } else if (seat.status === 'available') {
      setSelectedAvailableSeat(seat);
      setIsAvailableDialogOpen(true);
      setSelectedSeats([]);
    }
    
    if (onSeatSelect) {
      onSeatSelect(seat.id);
    }
  };

  const handlePreBookConfirm = async (bookingDetails) => {
    // Validate booking details
    if (!bookingDetails.name || !bookingDetails.email || !bookingDetails.phone || !bookingDetails.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/smlekha/seats/${selectedSeatForPreBook.id}/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: bookingDetails.name,
          email: bookingDetails.email,
          phone: bookingDetails.phone,
          date: bookingDetails.date
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reserve seat');
      }

      // Update seat status locally
    setSeats(seats.map(seat => 
      seat.id === selectedSeatForPreBook.id 
        ? { 
            ...seat, 
              status: 'reserved', 
            student: { 
              id: `PRE-${Date.now()}`, 
              name: bookingDetails.name,
              email: bookingDetails.email,
              phone: bookingDetails.phone,
              bookingDate: bookingDetails.date
            }
          }
        : seat
    ));

      toast({
        title: "Success",
        description: `Seat ${selectedSeatForPreBook.number} pre-booked successfully for ${bookingDetails.name}`,
    });

    } catch (error) {
      console.error('Error reserving seat:', error);
      toast({
        title: "Error",
        description: "Failed to reserve seat",
        variant: "destructive",
      });
    }

    setIsPreBookDialogOpen(false);
    setSelectedSeatForPreBook(null);
  };

  const handleStudentDialogClose = () => {
    setIsStudentDialogOpen(false);
    setSelectedStudent(null);
  };

  const handlePreBookDialogClose = () => {
    setIsPreBookDialogOpen(false);
    setSelectedSeatForPreBook(null);
  };

  const handleAvailableSeatConfirm = async (bookingDetails) => {
    // Validate booking details
    if (!bookingDetails.name || !bookingDetails.email || !bookingDetails.phone || !bookingDetails.shift || !bookingDetails.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/smlekha/seats/${selectedAvailableSeat.id}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: bookingDetails.name,
          email: bookingDetails.email,
          phone: bookingDetails.phone,
          shift: bookingDetails.shift,
          date: bookingDetails.date
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to book seat');
      }

      // Update seat status locally
    setSeats(seats.map(seat => 
      seat.id === selectedAvailableSeat.id 
        ? { 
            ...seat, 
            status: 'occupied', 
            student: { 
              id: `ST-${Date.now()}`, 
              name: bookingDetails.name,
              email: bookingDetails.email,
              phone: bookingDetails.phone,
              shift: bookingDetails.shift,
              bookingDate: bookingDetails.date
            }
          }
        : seat
    ));

      toast({
        title: "Success",
        description: `Seat ${selectedAvailableSeat.number} booked successfully for ${bookingDetails.name}`,
    });

    } catch (error) {
      console.error('Error booking seat:', error);
      toast({
        title: "Error",
        description: "Failed to book seat",
        variant: "destructive",
      });
    }

    setIsAvailableDialogOpen(false);
    setSelectedAvailableSeat(null);
  };

  const handleAvailableDialogClose = () => {
    setIsAvailableDialogOpen(false);
    setSelectedAvailableSeat(null);
  };

  const getSeatStatus = (seat) => {
    if (seat.status === 'available') return 'Available';
    if (seat.status === 'occupied') return 'Occupied';
    if (seat.status === 'reserved') return 'Reserved';
    if (seat.status === 'locked') return 'Locked';
    return 'Unknown';
  };

  const getSeatColor = (seat) => {
    return cn(
      "transition-colors duration-200 border-2",
      seat.status === 'available' && 'bg-green-50 border-green-500 hover:bg-green-100',
      seat.status === 'occupied' && 'bg-red-50 border-red-500',
      seat.status === 'reserved' && 'bg-amber-50 border-amber-500',
      seat.status === 'locked' && 'bg-gray-100 border-gray-400'
    );
  };

  const getSeatBorderColor = (seat) => {
    return cn(
      "absolute inset-0 opacity-0 border-2 rounded-md transition-opacity duration-200",
      seat.status === 'available' && 'border-green-500 group-hover:opacity-100',
      seat.status === 'occupied' && 'border-red-500 group-hover:opacity-100',
      seat.status === 'reserved' && 'border-amber-500 group-hover:opacity-100',
      seat.status === 'locked' && 'border-gray-400'
    );
  };

  const getSeatIcon = (seat) => {
    if (seat.status === 'available') {
      return <Sofa className="h-4 w-4 text-green-500" />;
    }
    if (seat.status === 'occupied') {
      return <User className="h-4 w-4 text-red-500" />;
    }
    if (seat.status === 'reserved') {
      return <Calendar className="h-4 w-4 text-amber-500" />;
    }
    if (seat.status === 'locked') {
      return <Lock className="h-4 w-4 text-gray-500" />;
    }
    return null;
  };

  if (isLoading) {
  return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading seat map...</span>
            </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
        <p>{error}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
                </div>
    );
  }

  if (!seats || seats.length === 0) {
    return (
      <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
        <p>No seat data available. Please try again later.</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
                </div>
    );
  }

  // Group seats into rows of 8
  const rows = [];
  for (let i = 0; i < seats.length; i += 8) {
    rows.push(seats.slice(i, i + 8));
  }

  return (
    <div className={className}>
      <Card className="p-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-semibold">Seat Booking</h3>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
          </div>
          <div className="w-full md:w-auto">
            <Select value={selectedShift.id} onValueChange={(value) => setSelectedShift(shifts.find(s => s.id === value))}>
              <SelectTrigger className="w-full md:w-[240px]">
              <SelectValue placeholder="Select shift" />
            </SelectTrigger>
            <SelectContent>
                {shifts.map(shift => (
                <SelectItem key={shift.id} value={shift.id}>
                  {shift.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
            <p className="text-xs text-muted-foreground mt-1">{selectedShift?.time || 'Select a shift'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-8 gap-2">
        {rows.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {row.map((seat) => {
              // Filter out non-available seats if showOnlyAvailable is true
              if (showOnlyAvailable && seat.status !== 'available') {
                return null;
              }

              return (
          <TooltipProvider key={seat.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                        className={`w-full aspect-square rounded-md relative group ${getSeatColor(seat)}`}
                  onClick={() => handleSeatClick(seat)}
                  disabled={seat.status === 'locked'}
                >
                        <div className="flex flex-col items-center justify-center h-full">
                          {getSeatIcon(seat)}
                          <span className="text-xs mt-1">{seat.number}</span>
                  {seat.student && (
                            <span className="text-[10px] truncate max-w-full px-1">
                              {seat.student.name.split(' ')[0]}
                            </span>
                  )}
                  </div>
                        <div className={getSeatBorderColor(seat)}></div>
                </button>
              </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="text-xs">
                        <p className="font-semibold">Seat #{seat.number}</p>
                        <p>Status: {getSeatStatus(seat)}</p>
                  {seat.student && (
                          <p>Student: {seat.student.name}</p>
                        )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-50 border-2 border-green-500 rounded-sm"></div>
          <span className="text-xs">Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-50 border-2 border-red-500 rounded-sm"></div>
          <span className="text-xs">Occupied</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-amber-50 border-2 border-amber-500 rounded-sm"></div>
          <span className="text-xs">Reserved</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-100 border-2 border-gray-400 rounded-sm"></div>
          <span className="text-xs">Locked</span>
        </div>
      </div>

      {/* Dialogs */}
        <StudentInfoDialog
        isOpen={isStudentDialogOpen} 
        onClose={handleStudentDialogClose} 
          student={selectedStudent}
        />

        <PreBookedSeatDialog
        isOpen={isPreBookDialogOpen} 
        onClose={handlePreBookDialogClose} 
          onConfirm={handlePreBookConfirm}
        seatNumber={selectedSeatForPreBook?.number}
        />

        <AvailableSeatDialog
        isOpen={isAvailableDialogOpen} 
        onClose={handleAvailableDialogClose} 
          onConfirm={handleAvailableSeatConfirm}
        seatNumber={selectedAvailableSeat?.number}
        shifts={shifts}
      />
      </div>
  );
};

InteractiveSeatMap.propTypes = {
  className: PropTypes.string,
  onSeatSelect: PropTypes.func,
  showOnlyAvailable: PropTypes.bool
};

export default InteractiveSeatMap;