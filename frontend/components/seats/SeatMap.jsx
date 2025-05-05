import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import PropTypes from "prop-types";

// Define types for the components
const Seat = ({ seat, isSelected, onToggle }) => {
  const getStatusClass = () => {
    if (isSelected) return "bg-primary-100 border-primary-500";
    switch (seat.status) {
      case "available": return "bg-green-100 border-green-500 hover:bg-green-200";
      case "occupied": return "bg-gray-100 border-gray-400 opacity-50 cursor-not-allowed";
      case "reserved": return "bg-blue-100 border-blue-500 opacity-50 cursor-not-allowed";
      case "locked": return "bg-red-100 border-red-500 opacity-50 cursor-not-allowed";
      default: return "";
    }
  };

  return (
    <button
      className={`w-8 h-8 md:w-10 md:h-10 rounded flex items-center justify-center text-xs border ${getStatusClass()}`}
      onClick={() => seat.status === "available" && onToggle(seat.id)}
      disabled={seat.status !== "available"}
    >
      {seat.label}
    </button>
  );
};

Seat.propTypes = {
  seat: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['available', 'occupied', 'reserved', 'locked']).isRequired
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

const SeatRow = ({ row, selectedSeats, toggleSeatSelection }) => {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {row.seats.map((seat) => (
        <Seat
          key={seat.id}
          seat={seat}
          isSelected={selectedSeats.includes(seat.id)}
          onToggle={toggleSeatSelection}
        />
      ))}
    </div>
  );
};

SeatRow.propTypes = {
  row: PropTypes.shape({
    rowNumber: PropTypes.string.isRequired,
    seats: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['available', 'occupied', 'reserved', 'locked']).isRequired
    })).isRequired
  }).isRequired,
  selectedSeats: PropTypes.arrayOf(PropTypes.string).isRequired,
  toggleSeatSelection: PropTypes.func.isRequired
};

// Function to generate seat data
const generateSingleFloorSeats = () => {
  const rows = ["A", "B", "C", "D", "E"];
  return rows.map(rowNumber => {
    const seatsPerRow = 12;
    const seats = Array.from({ length: seatsPerRow }, (_, i) => {
      const id = `${rowNumber}${i + 1}`;
      const status = Math.random() > 0.3 ? "available" : 
                     Math.random() > 0.5 ? "occupied" : 
                     Math.random() > 0.5 ? "reserved" : "locked";
      
      return {
        id,
        label: `${i + 1}`,
        status
      };
    });
    
    return { rowNumber, seats };
  });
};

// SeatLegend component
const SeatLegend = () => {
  return (
    <div className="flex flex-wrap gap-4 mb-4 md:mb-6">
      <div className="flex items-center">
        <div className="w-4 h-4 rounded bg-green-100 border border-green-500 mr-2"></div>
        <span className="text-xs">Available</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded bg-gray-100 border border-gray-400 mr-2"></div>
        <span className="text-xs">Occupied</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded bg-blue-100 border border-blue-500 mr-2"></div>
        <span className="text-xs">Reserved</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded bg-red-100 border border-red-500 mr-2"></div>
        <span className="text-xs">Locked</span>
      </div>
    </div>
  );
};

// ShiftSelector component
const ShiftSelector = ({ value, onChange }) => {
  return (
    <div className="flex border rounded-md overflow-hidden">
      <button
        className={`px-3 py-1 text-sm ${value === "morning" ? "bg-primary text-white" : "bg-gray-50"}`}
        onClick={() => onChange("morning")}
      >
        Morning
      </button>
      <button
        className={`px-3 py-1 text-sm ${value === "afternoon" ? "bg-primary text-white" : "bg-gray-50"}`}
        onClick={() => onChange("afternoon")}
      >
        Afternoon
      </button>
      <button
        className={`px-3 py-1 text-sm ${value === "evening" ? "bg-primary text-white" : "bg-gray-50"}`}
        onClick={() => onChange("evening")}
      >
        Evening
      </button>
    </div>
  );
};

ShiftSelector.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

// Main SeatMap component
const SeatMap = ({ className }) => {
  const [selectedShift, setSelectedShift] = useState("morning");
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  // Use the toast hook correctly
  const { toast } = useToast();
  
  const seatRows = generateSingleFloorSeats();
  
  const toggleSeatSelection = (seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  };
  
  const handleReserveSeats = () => {
    if (!selectedSeats.length) return;
    toast({
      title: "Seats Reserved",
      description: `${selectedSeats.length} seat(s) reserved successfully.`,
    });
    setSelectedSeats([]);
  };
  
  const handleLockSeats = () => {
    if (!selectedSeats.length) return;
    toast({
      title: "Seats Locked",
      description: `${selectedSeats.length} seat(s) locked successfully.`,
    });
    setSelectedSeats([]);
  };

  // Helper function for className concatenation if cn utility is missing
  const combinedClassName = cn ? 
    cn("bg-white rounded-lg p-4 md:p-6 shadow-sm border", className) : 
    `bg-white rounded-lg p-4 md:p-6 shadow-sm border ${className || ""}`;
  
  return (
    <div className={combinedClassName}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold">Seat Availability</h2>
          <div className="flex items-center mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
            <span className="text-xs md:text-sm text-muted-foreground">Live updates</span>
          </div>
        </div>
        <ShiftSelector value={selectedShift} onChange={setSelectedShift} />
      </div>
      
      {/* Legend */}
      <SeatLegend />
      
      {/* Seat Rows */}
      <div className="overflow-x-auto">
        <div className="flex flex-col gap-6 md:gap-8 min-w-[600px] max-w-6xl mx-auto">
          {seatRows.map((row) => (
            <div key={row.rowNumber} className="relative">
              <div className="absolute -left-2 md:-left-10 top-1/2 -translate-y-1/2 text-xs md:text-sm font-medium text-muted-foreground">
                Row {row.rowNumber}
              </div>
              <div className="space-y-4 md:space-y-6">
                <SeatRow
                  key={row.rowNumber}
                  row={row}
                  selectedSeats={selectedSeats}
                  toggleSeatSelection={toggleSeatSelection}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Actions */}
      <div className="mt-6 md:mt-10 flex flex-wrap justify-end gap-2">
        <div className="text-sm text-muted-foreground mr-auto">
          {selectedSeats.length} seat{selectedSeats.length !== 1 ? "s" : ""} selected
        </div>
        <Button 
          variant="outline" 
          disabled={!selectedSeats.length} 
          onClick={handleReserveSeats}
          className="px-4 py-2 border rounded"
        >
          Reserve Selected
        </Button>
        <Button 
          disabled={!selectedSeats.length} 
          onClick={handleLockSeats}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Lock Selected
        </Button>
      </div>
    </div>
  );
};

SeatMap.propTypes = {
  className: PropTypes.string
};

export default SeatMap;
