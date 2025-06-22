import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Sofa, User, Lock, Unlock, Calendar, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import StudentInfoDialog from './StudentInfoDialog';
import PreBookedSeatDialog from './PreBookedSeatDialog';
import AvailableSeatDialog from './AvailableSeatDialog';
import PropTypes from 'prop-types';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { bookSeat, reserveSeat, releaseSeat } from "@/api/seats";
import { getShifts } from "@/api/shifts";

const normalizeSeats = (rawSeats) => {
  return rawSeats.map((seat) => ({
    id: seat._id || `${seat.row}-${seat.column}`, _id: seat._id,
    seatNumber: seat.seatNumber || seat.number || `${seat.row}-${seat.column}`,
    row: Number(seat.row),
    column: Number(seat.column),
    status: seat.status || 'available',
    student: seat.student || null,
    propertyId: seat.propertyId,
  }));
};

const InteractiveSeatMap = ({ 
  className, 
  config = { 
    rows: 6, 
    columns: 20,
    layout: Array(6).fill().map(() => Array(20).fill(true)) // Default layout if not provided
  },
  seats: initialSeats = [],
  onSeatSelect, 
  onSeatUpdate,
  onSeatDelete,
  showOnlyAvailable = false ,
  onConfirm
}) => {
  const [seats, setSeats] = useState(normalizeSeats(initialSeats));
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));
  const [shifts, setShifts] = useState([]);
  const [selectedShift, setSelectedShift] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [isPreBookDialogOpen, setIsPreBookDialogOpen] = useState(false);
  const [isAvailableDialogOpen, setIsAvailableDialogOpen] = useState(false);
  const [selectedSeatForPreBook, setSelectedSeatForPreBook] = useState(null);
  const [selectedAvailableSeat, setSelectedAvailableSeat] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialSeats && initialSeats.length > 0) {
      setSeats(normalizeSeats(initialSeats));
    }
  }, [initialSeats]);

  useEffect(() => {
    const loadShifts = async () => {
      try {
        const response = await getShifts();
        
        if (response.success && response.data) {
          setShifts(response.data);
          if (response.data.length > 0) {
            setSelectedShift(response.data[0]._id);
          }
        }
      } catch (error) {
        console.error('Failed to load shifts:', error);
      }
    };
    

    loadShifts();

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

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

const handleSeatClick = (seat) => {
  if (seat.status === 'locked') return;

  if (seat.status === 'reserved') {
    setSelectedSeatForPreBook(seat);
    setIsPreBookDialogOpen(true);
  } else if (seat.status === 'occupied') {
    setSelectedStudent(seat.student);
    setIsStudentDialogOpen(true);
  } else if (seat.status === 'available') {
    setSelectedAvailableSeat(seat);
    setIsAvailableDialogOpen(true);
  }
  
  if (onSeatSelect) onSeatSelect(seat.id);
};

  const handlePreBookConfirm = async (bookingDetails) => {
    if (!bookingDetails.name || !bookingDetails.email || !bookingDetails.phone || !bookingDetails.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const updatedSeat = await reserveSeat(selectedSeatForPreBook._id || selectedSeatForPreBook.id, {
        studentId: `temp-${Date.now()}`,
        until: bookingDetails.date,
        name: bookingDetails.name,
        email: bookingDetails.email,
        phone: bookingDetails.phone,
        date: bookingDetails.date
      });

      // Update local state
      const updatedSeats = seats.map(s => 
        s.id === selectedSeatForPreBook.id ? { ...s, status: 'reserved', student: {
          id: `temp-${Date.now()}`,
          name: bookingDetails.name,
          email: bookingDetails.email,
          phone: bookingDetails.phone
        }} : s
      );
      
      setSeats(updatedSeats);
      
      if (onSeatUpdate) {
        onSeatUpdate(selectedSeatForPreBook.id, updatedSeat);
      }

      toast({
        title: "Success",
        description: `Seat ${selectedSeatForPreBook.number} pre-booked successfully for ${bookingDetails.name}`,
      });
    } catch (error) {
      console.error('Error reserving seat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reserve seat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsPreBookDialogOpen(false);
      setSelectedSeatForPreBook(null);
    }
  };

  const handleAvailableSeatConfirm = async (bookingDetails) => {
    try {
      setIsLoading(true);
      if (onConfirm) await onConfirm();

    } catch (error) {
      console.error('Error booking seat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to book seat",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsAvailableDialogOpen(false);
      setSelectedAvailableSeat(null);
    }
  };

  const handleStudentDialogClose = () => {
    setIsStudentDialogOpen(false);
    setSelectedStudent(null);
  };

  const handlePreBookDialogClose = () => {
    setIsPreBookDialogOpen(false);
    setSelectedSeatForPreBook(null);
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

  const renderSeats = () => {
    const { rows = 6, columns = 20, layout = Array(rows).fill().map(() => Array(columns).fill(true)) } = config || {};
    const seatGrid = [];
  
    for (let row = 0; row < rows; row++) {
      const seatRow = [];
  
      for (let col = 0; col < columns; col++) {
        const hasSeat = layout[row]?.[col] !== false;
        
        if (!hasSeat) {
          // For empty spaces, render nothing (or a div with no styling)
          seatRow.push(<div key={`empty-${row}-${col}`} className="w-full aspect-square" />);
          continue;
        }
  
        const seat = seats.find(s => s.row === row && s.column === col);
        
        if (!seat) {
          seatRow.push(
            <div 
              key={`missing-${row}-${col}`} 
              className="w-full aspect-square bg-red-100 border border-red-300 rounded-sm flex items-center justify-center"
            >
              <Lock className="h-3 w-3 text-red-500" />
            </div>
          );
          continue;
        }
  
        if (showOnlyAvailable && seat.status !== 'available') {
          continue;
        }
  
        seatRow.push(
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
                    <span className="text-xs mt-1">{seat.seatNumber}</span> {/* Changed to seat.seatNumber */}
                    {seat.student && (
                      <span className="text-[10px] truncate max-w-full px-1">
                        {seat.student.name?.split(' ')[0] || 'Student'}
                      </span>
                    )}
                  </div>
                  <div className={getSeatBorderColor(seat)}></div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="text-xs">
                  <p className="font-semibold">Seat #{seat.seatNumber}</p> {/* Changed to seat.seatNumber */}
                  <p>Status: {getSeatStatus(seat)}</p>
                  {seat.student && <p>Student: {seat.student.name || 'Unknown'}</p>}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
  
      seatGrid.push(
        <div key={`row-${row}`} className="grid gap-2" style={{ 
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
        }}>
          {seatRow}
        </div>
      );
    }
  
    return seatGrid;
  };

  if (isLoading && !seats.length) {
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

  if (!seats.length) {
    return (
      <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
        <p>No seat data available. Please try again later.</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card className="p-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-semibold">Seat Booking</h3>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
          </div>
          {shifts.length > 0 && (
            <div className="w-full md:w-auto">
              <Select 
                value={selectedShift} 
                onValueChange={(value) => setSelectedShift(value)}
              >
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Select shift">
                    {selectedShift && shifts.find(s => s._id === selectedShift)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {shifts.map(shift => (
                    <SelectItem key={shift._id} value={shift._id}>
                      {shift.name} ({shift.startTime} - {shift.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedShift && (
                <p className="text-xs text-muted-foreground mt-1">
                  {shifts.find(s => s._id === selectedShift)?.startTime} - 
                  {shifts.find(s => s._id === selectedShift)?.endTime}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-2">
        {renderSeats()}
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
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-gray-100 rounded-sm"></div>
          <span className="text-xs">Empty Space</span>
        </div>
      </div>

    {/* Dialogs */}
    <StudentInfoDialog
      open={isStudentDialogOpen}
      onOpenChange={(open) => setIsStudentDialogOpen(open)}
      student={selectedStudent}
    />

    <PreBookedSeatDialog
      open={isPreBookDialogOpen}
      onOpenChange={setIsPreBookDialogOpen}
      onConfirm={handlePreBookConfirm}
      seatNumber={selectedSeatForPreBook?.seatNumber}
    />

    <AvailableSeatDialog
      open={isAvailableDialogOpen}
      onOpenChange={setIsAvailableDialogOpen}
      onConfirm={onConfirm}
      seatNumber={selectedAvailableSeat?.seatNumber}
      shifts={shifts}
      seatId={selectedAvailableSeat?._id}
    />
    </div>
  );
};

InteractiveSeatMap.propTypes = {
  className: PropTypes.string,
  config: PropTypes.shape({
    rows: PropTypes.number,
    columns: PropTypes.number,
    layout: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.bool)),
  }),
  seats: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    number: PropTypes.string,
    row: PropTypes.number,
    column: PropTypes.number,
    status: PropTypes.string,
    student: PropTypes.object,
  })),
  onSeatSelect: PropTypes.func,
  onConfirm: PropTypes.func.isRequired,
  onSeatUpdate: PropTypes.func,
  onSeatDelete: PropTypes.func,
  showOnlyAvailable: PropTypes.bool
};

export default InteractiveSeatMap;