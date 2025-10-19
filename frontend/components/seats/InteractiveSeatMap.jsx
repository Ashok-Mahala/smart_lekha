import React, { useState, useEffect, useMemo } from 'react';
import { cn } from "@/lib/utils";
import { Sofa, User, Lock, Calendar, Loader2, Clock, Info } from "lucide-react";
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
        currentAssignments: seat.currentAssignments || [], // Added for new structure
        booking: seat.booking || null,
        bookingDate: seat.bookingDate || seat.updatedAt,
        propertyId: seat.propertyId,
        type: seat.type || 'standard',
        features: seat.features || []
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
  const [hoveredSeat, setHoveredSeat] = useState(null);

  useEffect(() => {
    initialSeats?.length && setSeats(normalizeSeats(initialSeats));
  }, [initialSeats, calculateSeatNumbers]);

  useEffect(() => {
    const loadShifts = async () => {
      try {
        // Get property ID from localStorage - it's stored as a simple string
        const propertyId = localStorage.getItem('selectedProperty');
        
        console.log('Property ID from localStorage:', propertyId); // Debug log
        
        if (!propertyId) {
          console.warn('No property selected in localStorage');
          toast({
            title: "No Property Selected",
            description: "Please select a property first",
            variant: "destructive"
          });
          return;
        }
  
        // No need to parse JSON - it's already a string ID
        console.log('Loading shifts for property ID:', propertyId);
        
        const response = await getShifts(propertyId);
        console.log('Shifts API response:', response); // Debug log
        
        if (response.success && response.data) {
          setShifts(response.data);
          if (response.data.length > 0) setSelectedShift(response.data[0]._id);
        } else {
          console.warn('Unexpected API response format:', response);
          toast({
            title: "Unexpected Response",
            description: "Could not load shifts data",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Failed to load shifts:', error);
        toast({
          title: "Error Loading Shifts",
          description: error.message || "Please try again later",
          variant: "destructive"
        });
      }
    };
    
    loadShifts();
  }, []);

  const isFullDayShift = (shift) => {
    if (!shift) return false;
    return (shift.startTime === '00:00' && (shift.endTime === '23:59' || shift.endTime === '24:00'));
  };

  const getSeatStatus = (seat, currentShift) => {
    // Use currentAssignments instead of currentStudents for new structure
    const assignments = seat.currentAssignments || seat.currentStudents || [];
    
    const bookingInfo = assignments.find(cs => {
      const shift = shifts.find(s => s._id === cs.shift?._id);
      return isFullDayShift(shift);
    });

    const has24hBooking = !!bookingInfo;
    const currentShiftBooking = assignments.find(cs => cs.shift?._id === selectedShift);
    const isIn24hShiftView = currentShift && isFullDayShift(currentShift);

    if (has24hBooking) {
      return {
        status: 'occupied',
        isPrebookOnly: true,
        student: bookingInfo.student,
        booking: { shift: bookingInfo.shift }
      };
    }

    if (isIn24hShiftView && assignments.length > 0) {
      return {
        status: 'reserved',
        isPrebookOnly: true
      };
    }

    if (currentShiftBooking) {
      return {
        status: 'occupied',
        isPrebookOnly: false,
        student: currentShiftBooking.student,
        booking: { shift: currentShiftBooking.shift }
      };
    }

    return {
      status: seat.status === 'maintenance' ? 'locked' : 'available',
      isPrebookOnly: false
    };
  };

  const filteredSeats = useMemo(() => {
    const currentShift = shifts.find(s => s._id === selectedShift);
    
    return seats.map(seat => {
      const statusInfo = getSeatStatus(seat, currentShift);
      return {
        ...seat,
        ...statusInfo
      };
    }).filter(seat => !showOnlyAvailable || seat.status === 'available');
  }, [seats, showOnlyAvailable, selectedShift, shifts]);

  const handleSeatClick = (seat) => {
    if (seat.status === 'locked') {
      toast({
        title: "Seat Locked",
        description: "This seat is under maintenance and cannot be booked.",
        variant: "destructive"
      });
      return;
    }
    
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
      toast({ 
        title: "Error", 
        description: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await reserveSeat(selectedSeatForPreBook._id, {
        studentId: `temp-${Date.now()}`,
        until: bookingDetails.date,
        name: bookingDetails.name,
        email: bookingDetails.email,
        phone: bookingDetails.phone,
        shiftId: selectedShift
      });
      
      toast({ 
        title: "Success", 
        description: `Seat ${selectedSeatForPreBook.seatNumber} pre-booked successfully.` 
      });
      
      // Refresh seats data
      onConfirm?.();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to reserve seat", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
      setIsPreBookDialogOpen(false);
      setSelectedSeatForPreBook(null);
    }
  };

  const getSeatColor = (seat) => cn(
    "transition-all duration-200 border-2 transform hover:scale-105 cursor-pointer",
    seat.status === 'available' && 'bg-green-50 border-green-500 hover:bg-green-100 hover:border-green-600 shadow-sm',
    seat.status === 'occupied' && 'bg-red-200 border-red-800 hover:bg-red-300',
    seat.status === 'reserved' && 'bg-amber-100 border-amber-600 hover:bg-amber-200',
    seat.status === 'locked' && 'bg-gray-200 border-gray-500 cursor-not-allowed hover:scale-100'
  );

  const getSeatIcon = (seat) => {
    if (seat.status === 'available') return <Sofa className="h-4 w-4 text-green-600" />;
    if (seat.status === 'occupied') return <User className="h-4 w-4 text-red-600" />;
    if (seat.status === 'reserved') return <Calendar className="h-4 w-4 text-amber-600" />;
    if (seat.status === 'locked') return <Lock className="h-4 w-4 text-gray-600" />;
    return null;
  };

  const getSeatFeatures = (seat) => {
    if (!seat.features || seat.features.length === 0) return null;
    
    const featureIcons = {
      power_outlet: '⚡',
      table: '📋',
      extra_space: '📦',
      window: '🪟',
      aisle: '🚶'
    };
    
    return (
      <div className="flex gap-1 justify-center mt-1">
        {seat.features.slice(0, 2).map((feature, index) => (
          <span key={index} className="text-xs" title={feature.replace('_', ' ')}>
            {featureIcons[feature] || '⭐'}
          </span>
        ))}
        {seat.features.length > 2 && (
          <span className="text-xs" title={seat.features.slice(2).join(', ').replace(/_/g, ' ')}>
            +{seat.features.length - 2}
          </span>
        )}
      </div>
    );
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
                  <button 
                    className={`w-full aspect-square rounded-md relative group ${getSeatColor(seat)}`} 
                    onClick={() => handleSeatClick(seat)}
                    onMouseEnter={() => setHoveredSeat(seat.id)}
                    onMouseLeave={() => setHoveredSeat(null)}
                    disabled={seat.status === 'locked'}
                  >
                    <div className="flex flex-col items-center justify-center h-full p-1">
                      {getSeatIcon(seat)}
                      <span className="text-xs mt-1 font-medium">{seat.seatNumber}</span>
                      {seat.student && (
                        <span className="text-[10px] truncate max-w-full">
                          {seat.student.firstName}
                        </span>
                      )}
                      {getSeatFeatures(seat)}
                    </div>
                    
                    {/* Loading indicator */}
                    {isLoading && selectedSeatForPreBook?._id === seat.id && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-md flex items-center justify-center">
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[300px]">
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">Seat #{seat.seatNumber}</p>
                    <p className="capitalize">Type: {seat.type}</p>
                    
                    {seat.status === 'occupied' && seat.student && (
                      <>
                        <p>Student: {seat.student.firstName} {seat.student.lastName}</p>
                        <p>Contact: {seat.student.phone}</p>
                        {seat.booking?.shift && (
                          <p>Shift: {seat.booking.shift.name} ({seat.booking.shift.startTime}-{seat.booking.shift.endTime})</p>
                        )}
                      </>
                    )}
                    
                    {seat.status === 'available' && (
                      <p className="text-green-600">Click to book this seat</p>
                    )}
                    
                    {seat.status === 'reserved' && (
                      <p className="text-amber-600">Pre-booked - Click for details</p>
                    )}
                    
                    {seat.features && seat.features.length > 0 && (
                      <div className="mt-1 pt-1 border-t">
                        <p className="font-medium">Features:</p>
                        <p>{seat.features.map(f => f.replace('_', ' ')).join(', ')}</p>
                      </div>
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Seat Booking Dashboard</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {currentDate}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <Select value={selectedShift} onValueChange={setSelectedShift}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map(shift => (
                  <SelectItem key={shift._id} value={shift._id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{shift.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({shift.startTime}-{shift.endTime}) - ₹{shift.fee}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="space-y-2 p-2 bg-muted/20 rounded-lg">
        {renderSeats()}
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 flex-wrap">
        {[
          { status: 'available', label: 'Available', color: 'bg-green-50 border-green-500' },
          { status: 'occupied', label: 'Occupied', color: 'bg-red-200 border-red-800' },
          { status: 'reserved', label: 'Reserved', color: 'bg-amber-100 border-amber-600' },
          { status: 'locked', label: 'Maintenance', color: 'bg-gray-200 border-gray-500' }
        ].map(({ status, label, color }) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-sm border-2 ${color}`} />
            <span className="text-sm capitalize">{label}</span>
          </div>
        ))}
      </div>

      <StudentInfoDialog 
        open={isStudentDialogOpen} 
        onOpenChange={setIsStudentDialogOpen} 
        student={selectedStudent} 
      />
      
      <PreBookedSeatDialog 
        open={isPreBookDialogOpen} 
        onOpenChange={setIsPreBookDialogOpen} 
        onConfirm={handlePreBookConfirm} 
        seatNumber={selectedSeatForPreBook?.seatNumber} 
        isLoading={isLoading}
      />
      
      <AvailableSeatDialog 
        open={isAvailableDialogOpen} 
        onOpenChange={setIsAvailableDialogOpen} 
        onConfirm={onConfirm} 
        seatNumber={selectedAvailableSeat?.seatNumber} 
        shifts={shifts} 
        seatId={selectedAvailableSeat?._id}
        propertyId={seats[0]?.propertyId} // Pass property ID to dialog
      />
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