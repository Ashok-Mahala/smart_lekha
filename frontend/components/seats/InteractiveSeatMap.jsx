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
import { reserveSeat } from "@/api/seats";
import { getShifts } from "@/api/shifts";

const InteractiveSeatMap = ({ className, config: propConfig = {}, seats: initialSeats = [], onSeatSelect, onSeatUpdate, showOnlyAvailable = false, onConfirm }) => {
  const config = {
    rows: 6,
    columns: 20,
    numberingDirection: 'horizontal',
    layout: Array(6).fill().map(() => Array(20).fill(true)),
    ...propConfig
  };

  const calculateSeatNumbers = useMemo(() => {
    const seatNumbers = {};
    let counter = 1;
    if (config.numberingDirection === 'horizontal') {
      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.columns; col++) {
          if (config.layout[row]?.[col]) {
            seatNumbers[`${row}-${col}`] = counter++;
          }
        }
      }
    } else {
      for (let col = 0; col < config.columns; col++) {
        for (let row = 0; row < config.rows; row++) {
          if (config.layout[row]?.[col]) {
            seatNumbers[`${row}-${col}`] = counter++;
          }
        }
      }
    }
    return seatNumbers;
  }, [config]);

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
        currentStudents: seat.currentStudents || [],
        booking: seat.booking || null,
        bookingDate: seat.bookingDate || seat.updatedAt,
        propertyId: seat.propertyId
      };
    });
  };

  const [seats, setSeats] = useState(normalizeSeats(initialSeats));
  const [currentDate] = useState(new Date().toLocaleDateString());
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
      } catch (error) {
        console.error('Failed to load shifts:', error);
      }
    };
    loadShifts();
  }, []);

  const isFullDayShift = (shift) => {
    if (!shift) return false;
    return (shift.startTime === '00:00' && (shift.endTime === '23:59' || shift.endTime === '24:00'));
  };

  const filteredSeats = useMemo(() => {
    const currentShift = shifts.find(s => s._id === selectedShift);
  
    return seats.map(seat => {
      const bookingInfo = seat.currentStudents.find(cs => {
        const shift = shifts.find(s => s._id === cs.shift._id);
        return isFullDayShift(shift);
      });
  
      const has24hBooking = !!bookingInfo;
  
      const currentShiftBooking = seat.currentStudents.find(cs => cs.shift._id === selectedShift);
  
      const isIn24hShiftView = currentShift && isFullDayShift(currentShift);
  
      if (has24hBooking) {
        return {
          ...seat,
          status: 'occupied',
          isPrebookOnly: true,
          student: bookingInfo.student,
          booking: {
            shift: bookingInfo.shift
          }
        };
      }
  
      if (isIn24hShiftView && seat.currentStudents.length > 0) {
        return {
          ...seat,
          status: 'reserved',
          isPrebookOnly: true
        };
      }
  
      if (currentShiftBooking) {
        return {
          ...seat,
          status: 'occupied',
          isPrebookOnly: false,
          student: currentShiftBooking.student,
          booking: {
            shift: currentShiftBooking.shift
          }
        };
      }
  
      return {
        ...seat,
        status: 'available',
        isPrebookOnly: false
      };
    }).filter(seat => !showOnlyAvailable || seat.status === 'available');
  }, [seats, showOnlyAvailable, selectedShift, shifts]);
  
  const handleSeatClick = (seat) => {
    if (seat.status === 'locked') return;
    if (seat.isPrebookOnly || seat.status === 'reserved') {
      setSelectedSeatForPreBook(seat);
      setIsPreBookDialogOpen(true);
    } else if (seat.status === 'occupied') {
      setSelectedStudent(seat.student);
      setIsStudentDialogOpen(true);
    } else if (seat.status === 'available') {
      setSelectedAvailableSeat(seat);
      setIsAvailableDialogOpen(true);
    }
    onSeatSelect?.(seat.id);
  };

  const handlePreBookConfirm = async (bookingDetails) => {
    if (!bookingDetails.name || !bookingDetails.email || !bookingDetails.phone || !bookingDetails.date) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    try {
      setIsLoading(true);
      await reserveSeat(selectedSeatForPreBook._id, {
        studentId: `temp-${Date.now()}`,
        until: bookingDetails.date,
        name: bookingDetails.name,
        email: bookingDetails.email,
        phone: bookingDetails.phone
      });
      toast({ title: "Success", description: `Seat ${selectedSeatForPreBook.seatNumber} pre-booked.` });
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to reserve seat", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsPreBookDialogOpen(false);
      setSelectedSeatForPreBook(null);
    }
  };

  const getSeatColor = (seat) => cn(
    "transition-colors duration-200 border-2",
    seat.status === 'available' && 'bg-green-50 border-green-500 hover:bg-green-100',
    seat.status === 'occupied' && 'bg-red-200 border-red-800',
    seat.status === 'reserved' && 'bg-amber-100 border-amber-600',
    seat.status === 'locked' && 'bg-gray-200 border-gray-500'
  );

  const getSeatIcon = (seat) => {
    if (seat.status === 'available') return <Sofa className="h-5 w-5 text-green-600" />;
    if (seat.status === 'occupied') return <User className="h-5 w-5 text-red-600" />;
    if (seat.status === 'reserved') return <Calendar className="h-5 w-5 text-amber-600" />;
    if (seat.status === 'locked') return <Lock className="h-5 w-5 text-gray-600" />;
    return null;
  };

  const renderSeats = () => {
    const seatGrid = Array(config.rows).fill().map((_, row) =>
      Array(config.columns).fill().map((_, col) => {
        if (!config.layout[row]?.[col]) return null;
        return filteredSeats.find(s => s.row === row && s.column === col);
      })
    );

    return seatGrid.map((row, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${config.columns}, minmax(0, 1fr))` }}>
        {row.map((seat, colIndex) => {
         if (!seat) return <div key={`empty-${rowIndex}-${colIndex}`} className="w-full aspect-square" />;
          return (
            <TooltipProvider key={seat.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className={`w-full aspect-square rounded-md relative group ${getSeatColor(seat)}`} onClick={() => handleSeatClick(seat)}>
                    <div className="flex flex-col items-center justify-center h-full p-1">
                      {getSeatIcon(seat)}
                      <span className="text-xs mt-1 font-medium">{seat.seatNumber}</span>
                      {seat.student && <span className="text-[10px] truncate max-w-full">{seat.student.firstName}</span>}
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
                        {seat.booking?.shift && <p>Shift: {seat.booking.shift.name} ({seat.booking.shift.startTime}-{seat.booking.shift.endTime})</p>}
                      </>
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

  return (
    <div className={className}>
      <Card className="p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">Seat Booking</h3>
            <p className="text-sm text-muted-foreground">{currentDate}</p>
          </div>
          <div>
            <Select value={selectedShift} onValueChange={setSelectedShift}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map(shift => (
                  <SelectItem key={shift._id} value={shift._id}>{shift.name} ({shift.startTime}-{shift.endTime})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="space-y-2">{renderSeats()}</div>

      <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
        {['available', 'occupied', 'reserved', 'locked'].map(status => (
          <div key={status} className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded-sm border-2 ${
              status === 'available' ? 'bg-green-50 border-green-500' :
              status === 'occupied' ? 'bg-red-200 border-red-800' :
              status === 'reserved' ? 'bg-amber-100 border-amber-600' :
              'bg-gray-200 border-gray-500'
            }`} />
            <span className="text-xs capitalize">{status}</span>
          </div>
        ))}
      </div>

      <StudentInfoDialog open={isStudentDialogOpen} onOpenChange={setIsStudentDialogOpen} student={selectedStudent} />
      <PreBookedSeatDialog open={isPreBookDialogOpen} onOpenChange={setIsPreBookDialogOpen} onConfirm={handlePreBookConfirm} seatNumber={selectedSeatForPreBook?.seatNumber} />
      <AvailableSeatDialog open={isAvailableDialogOpen} onOpenChange={setIsAvailableDialogOpen} onConfirm={onConfirm} seatNumber={selectedAvailableSeat?.seatNumber} shifts={shifts} seatId={selectedAvailableSeat?._id} />
    </div>
  );
};

InteractiveSeatMap.propTypes = {
  className: PropTypes.string,
  config: PropTypes.object,
  seats: PropTypes.array,
  onSeatSelect: PropTypes.func,
  onConfirm: PropTypes.func.isRequired,
  onSeatUpdate: PropTypes.func,
  showOnlyAvailable: PropTypes.bool
};

export default InteractiveSeatMap;
