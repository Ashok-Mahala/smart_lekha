import React, { useState, useEffect, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Sofa, User, Lock, Calendar, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import StudentInfoDialog from './StudentInfoDialog';
import PreBookedSeatDialog from './PreBookedSeatDialog';
import AvailableSeatDialog from './AvailableSeatDialog';
import PropTypes from 'prop-types';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { bookSeat, reserveSeat } from "@/api/seats";
import { getShifts } from "@/api/shifts";

const InteractiveSeatMap = ({ 
  className, 
  config: propConfig = {},
  //config = { rows: 6, columns: 20, layout: Array(6).fill().map(() => Array(20).fill(true)),numberingDirection: 'horizontal',...propConfig },
  seats: initialSeats = [],
  onSeatSelect, onSeatUpdate, onSeatDelete,
  showOnlyAvailable = false, onConfirm
  }) => {
  const config = { rows: 6,columns: 20,numberingDirection: 'horizontal',layout: Array(6).fill().map(() => Array(20).fill(true)), ...propConfig};

  const calculateSeatNumbers = useMemo(() => {
    const seatNumbers = {};
    let counter = 1;
    
    // Use the numberingDirection from config
    if (config.numberingDirection === 'horizontal') {
      // Horizontal numbering (left to right, top to bottom)
      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.columns; col++) {
          if (config.layout[row]?.[col]) {
            seatNumbers[`${row}-${col}`] = counter++;
          }
        }
      }
    } else {
      // Vertical numbering (top to bottom, left to right)
      for (let col = 0; col < config.columns; col++) {
        for (let row = 0; row < config.rows; row++) {
          if (config.layout[row]?.[col]) {
            seatNumbers[`${row}-${col}`] = counter++;
          }
        }
      }
    }
    
    return seatNumbers;
  }, [config.rows, config.columns, config.layout, config.numberingDirection]); // Add numberingDirection to dependencies
    
  // normalizeSeats to use calculated seat numbers if not provided
  const normalizeSeats = (rawSeats) => {
    return rawSeats.map(seat => {
      const calculatedNumber = calculateSeatNumbers[`${seat.row}-${seat.column}`];
      return {
        id: seat._id, 
        _id: seat._id,
        seatNumber: seat.seatNumber || calculatedNumber?.toString() || `${seat.row}-${seat.column}`,
        row: Number(seat.row), 
        column: Number(seat.column),
        status: seat.status || 'available',
        student: seat.currentStudent || null,
        booking: seat.booking || null,
        bookingDate: seat.bookingDate || seat.updatedAt,
        propertyId: seat.propertyId,
      };
    });
  };

  const [seats, setSeats] = useState(normalizeSeats(initialSeats));
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
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
    initialSeats?.length && setSeats(normalizeSeats(initialSeats)); 
  }, [initialSeats, calculateSeatNumbers]);

  useEffect(() => {
    const loadShifts = async () => {
      try {
        const response = await getShifts();
        if (response.success && response.data) {
          setShifts(response.data);
          if (response.data.length > 0) setSelectedShift(response.data[0]._id);
        }
      } catch (error) { console.error('Failed to load shifts:', error); }
    };
    loadShifts();
  }, []);

  // Helper to round time to nearest hour (e.g., "07:58" becomes "08:00")
  const roundTimeToHour = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    if (minutes >= 30) {
      return `${String(hours + 1).padStart(2, '0')}:00`;
    }
    return `${String(hours).padStart(2, '0')}:00`;
  };

  // Check if shift is full day (00:00-23:59 or spans midnight)
  const isFullDayShift = (shift) => {
    if (!shift) return false;
    const start = shift.startTime;
    const end = shift.endTime;
    return (start === '00:00' && end === '23:59') || 
          (start === '00:00' && end === '24:00');
  };

  const filteredSeats = useMemo(() => {
    const currentShift = shifts.find(s => s._id === selectedShift);
    
    return seats.map(seat => {
      // If seat has no booking, return as-is
      if (!seat.booking || !seat.booking.shift) return seat;
  
      const bookingShift = shifts.find(s => s._id === seat.booking.shift._id);
      if (!bookingShift) return seat;
  
      const isFullDay = isFullDayShift(bookingShift);
      const isCurrentShift = bookingShift._id === selectedShift;
      const is24HourShift = currentShift && isFullDayShift(currentShift);
  
      if (isFullDay) {
        // Full-day bookings should show as occupied in all shifts (red)
        return {
          ...seat,
          status: 'occupied',
          booking: {
            ...seat.booking,
            isFullDay: true
          }
        };
      }
  
      if (isCurrentShift) {
        // Seat is booked for this specific shift (red)
        return {
          ...seat,
          status: 'occupied'
        };
      }
  
      if (is24HourShift) {
        // In 24-hour shift view, show partially booked seats as reserved (orange)
        return {
          ...seat,
          status: 'reserved',
          student: null, // Don't show student details for other shifts
          booking: {
            ...seat.booking,
            isPartiallyBooked: true
          }
        };
      }
  
      // Seat is booked for another shift - show as available (green)
      return {
        ...seat,
        status: 'available',
        student: null,
        booking: null
      };
    }).filter(seat => 
      !showOnlyAvailable || seat.status === 'available'
    );
  }, [seats, showOnlyAvailable, selectedShift, shifts]);

  const handleSeatClick = (seat) => {
    if (seat.status === 'locked') return;
    if (seat.status === 'reserved') { setSelectedSeatForPreBook(seat); setIsPreBookDialogOpen(true); }
    else if (seat.status === 'occupied') { setSelectedStudent(seat.student); setIsStudentDialogOpen(true); }
    else if (seat.status === 'available') { setSelectedAvailableSeat(seat); setIsAvailableDialogOpen(true); }
    onSeatSelect?.(seat.id);
  };

  const handlePreBookConfirm = async (bookingDetails) => {
    if (!bookingDetails.name || !bookingDetails.email || !bookingDetails.phone || !bookingDetails.date) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      setIsLoading(true);
      const updatedSeat = await reserveSeat(selectedSeatForPreBook._id, {
        studentId: `temp-${Date.now()}`, until: bookingDetails.date,
        name: bookingDetails.name, email: bookingDetails.email, phone: bookingDetails.phone, date: bookingDetails.date
      });
      const updatedSeats = seats.map(s => s.id === selectedSeatForPreBook.id ? { 
        ...s, status: 'reserved', student: {
          id: `temp-${Date.now()}`, name: bookingDetails.name, email: bookingDetails.email, phone: bookingDetails.phone
        } 
      } : s);
      setSeats(updatedSeats);
      onSeatUpdate?.(selectedSeatForPreBook.id, updatedSeat);
      toast({ title: "Success", description: `Seat ${selectedSeatForPreBook.seatNumber} pre-booked successfully` });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to reserve seat", variant: "destructive" });
    } finally {
      setIsLoading(false); setIsPreBookDialogOpen(false); setSelectedSeatForPreBook(null);
    }
  };

  const getSeatStatus = (seat) => seat.status === 'available' ? 'Available' : 
    seat.status === 'occupied' ? 'Occupied' : 
    seat.status === 'reserved' ? 'Reserved' : 
    seat.status === 'locked' ? 'Locked' : 'Unknown';

  const getSeatColor = (seat) => {
    const isFullDay = seat.booking?.isFullDay;
    const isPartiallyBooked = seat.booking?.isPartiallyBooked;
    
    return cn(
      "transition-colors duration-200 border-2",
      seat.status === 'available' && 'bg-green-50 border-green-500 hover:bg-green-100',
      seat.status === 'occupied' && 'bg-red-200 border-red-800',
      seat.status === 'reserved' && isPartiallyBooked && 'bg-amber-100 border-amber-600',
      seat.status === 'reserved' && !isPartiallyBooked && 'bg-amber-100 border-amber-600 border-2 border-dashed',
      seat.status === 'locked' && 'bg-gray-200 border-gray-500'
    );
  };

  const getSeatIcon = (seat) => {
    if (seat.status === 'available') return <Sofa className="h-5 w-5 text-green-600" />;
    if (seat.status === 'occupied') return <User className="h-5 w-5 text-red-600" />;
    if (seat.status === 'reserved') return <Calendar className="h-5 w-5 text-amber-600" />;
    if (seat.status === 'locked') return <Lock className="h-5 w-5 text-gray-600" />;
    return null;
  };

  const renderSeats = () => {
    const { rows = 6, columns = 20, layout = Array(rows).fill().map(() => Array(columns).fill(true)) } = config || {};
    
    // Create a 2D array of seats based on numbering direction
    const seatGrid = Array(rows).fill().map((_, row) => 
      Array(columns).fill().map((_, col) => {
        if (layout[row]?.[col] === false) return null;
        return filteredSeats.find(s => s.row === row && s.column === col);
      })
    );
  
    return seatGrid.map((row, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {row.map((seat, colIndex) => {
          if (seat === null) return <div key={`empty-${rowIndex}-${colIndex}`} className="w-full aspect-square" />;
          if (!seat) return (
            <div key={`missing-${rowIndex}-${colIndex}`} className="w-full aspect-square bg-red-100 border border-red-300 rounded-sm flex items-center justify-center">
              <Lock className="h-3 w-3 text-red-500" />
            </div>
          );
  
          return (
            <TooltipProvider key={seat.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className={`w-full aspect-square rounded-md relative group ${getSeatColor(seat)}`} 
                    onClick={() => handleSeatClick(seat)} disabled={seat.status === 'locked'}>
                    <div className="flex flex-col items-center justify-center h-full p-1">
                      {getSeatIcon(seat)}
                      <span className="text-xs mt-1 font-medium">
                        {seat.seatNumber}
                      </span>
                      {seat.student && <span className="text-[10px] font-medium truncate max-w-full px-1">{seat.student.firstName || 'Student'}</span>}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px]">
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">Seat #{seat.seatNumber}</p>
                    {seat.status === 'occupied' && seat.student && (
                      <>
                        <p>Student: {seat.student.firstName} {seat.student.lastName}</p>
                        <p>Contact: {seat.student.phone}</p>
                        {seat.booking?.isFullDay ? (
                          <p>Booked for full day</p>
                        ) : (
                          <p>Shift: {seat.booking?.shift?.name} ({seat.booking?.shift?.startTime}-{seat.booking?.shift?.endTime})</p>
                        )}
                      </>
                    )}
                    {seat.status === 'reserved' && seat.booking?.isPartiallyBooked && (
                      <p>Booked in another shift ({seat.booking?.shift?.name})</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    ));
  };

  if (isLoading && !seats.length) return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin mr-2" />
      <span>Loading seat map...</span>
    </div>
  );

  if (error) return (
    <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
      <p>{error}</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>Retry</Button>
    </div>
  );

  if (!seats.length) return (
    <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-700">
      <p>No seat data available. Please try again later.</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>Retry</Button>
    </div>
  );

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
              <Select value={selectedShift} onValueChange={setSelectedShift}>
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
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-2">{renderSeats()}</div>

      <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
        {['available', 'occupied', 'partially-booked', 'reserved', 'locked'].map(status => (
          <div key={status} className="flex items-center gap-1">
            <div className={`w-4 h-4 ${
              status === 'available' ? 'bg-green-50 border-green-500' :
              status === 'occupied' ? 'bg-red-200 border-red-800' :
              status === 'partially-booked' ? 'bg-amber-100 border-amber-600' :
              status === 'reserved' ? 'bg-amber-100 border-amber-600 border-2 border-dashed' :
              'bg-gray-200 border-gray-500'
            } border-2 rounded-sm`}></div>
            <span className="text-xs capitalize">{status.replace('-', ' ')}</span>
          </div>
        ))}
      </div>

      <StudentInfoDialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen} student={selectedStudent} />
      <PreBookedSeatDialog open={isPreBookDialogOpen} onOpenChange={setIsPreBookDialogOpen} 
        onConfirm={handlePreBookConfirm} seatNumber={selectedSeatForPreBook?.seatNumber} />
      <AvailableSeatDialog open={isAvailableDialogOpen} onOpenChange={setIsAvailableDialogOpen} 
        onConfirm={onConfirm} seatNumber={selectedAvailableSeat?.seatNumber} shifts={shifts} 
        seatId={selectedAvailableSeat?._id} />
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
    seatNumber: PropTypes.string,
    row: PropTypes.number,
    column: PropTypes.number,
    status: PropTypes.string,
    student: PropTypes.object,
    booking: PropTypes.object,
    bookingDate: PropTypes.string,
  })),
  onSeatSelect: PropTypes.func,
  onConfirm: PropTypes.func.isRequired,
  onSeatUpdate: PropTypes.func,
  onSeatDelete: PropTypes.func,
  showOnlyAvailable: PropTypes.bool
};

export default InteractiveSeatMap;