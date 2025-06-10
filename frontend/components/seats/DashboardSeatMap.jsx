import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sofa, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import PropTypes from 'prop-types';
import { getAllSeats } from "@/smlekha/seats";

// Individual seat component for better reusability
const SeatItem = ({ seat, selected, onSelect }) => {
  const isSelectable = seat.status === "available";
  
  return (
    <button
      className={cn(
        "w-8 h-8 md:w-12 md:h-12 rounded-t-lg border-2 flex items-center justify-center relative transition-all",
        seat.zone === "right" ? "border-purple-500 bg-purple-50 hover:bg-purple-100" : "border-blue-500 bg-blue-50 hover:bg-blue-100",
        seat.status === "available" && "bg-green-50 hover:bg-green-100",
        seat.status === "occupied" && "border-red-500 bg-red-50 cursor-not-allowed",
        seat.status === "reserved" && "border-amber-500 bg-amber-50 cursor-not-allowed",
        seat.status === "maintenance" && "border-slate-400 bg-slate-100 cursor-not-allowed",
        selected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      onClick={() => isSelectable && onSelect(seat.id)}
      disabled={!isSelectable}
      title={seat.user ? `${seat.user}` : undefined}
    >
      <span className="text-xs font-medium">{seat.number}</span>
      {seat.timeRemaining && (
        <span className="absolute -bottom-6 text-[10px] font-medium px-1 py-0.5 rounded-sm bg-amber-100 text-amber-700">
          {seat.timeRemaining}m
        </span>
      )}
    </button>
  );
};

SeatItem.propTypes = {
  seat: PropTypes.shape({
    id: PropTypes.string.isRequired,
    number: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    zone: PropTypes.string,
    user: PropTypes.string,
    timeRemaining: PropTypes.number
  }).isRequired,
  selected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired
};

// Format raw seat data into the structure expected by the component
const formatSeatData = (seats) => {
  if (!seats || !seats.length) return [];
  
  // Group seats by row numbers
  const seatsByRow = {};
  seats.forEach(seat => {
    const rowNumber = seat.rowNumber || Math.ceil(parseInt(seat.number) / 7);
    if (!seatsByRow[rowNumber]) {
      seatsByRow[rowNumber] = [];
    }
    seatsByRow[rowNumber].push(seat);
  });
  
  // Group rows into pairs
  const groups = [];
  const rowNumbers = Object.keys(seatsByRow).map(Number).sort((a, b) => a - b);
  
  for (let i = 0; i < rowNumbers.length; i += 2) {
    const groupNumber = Math.ceil((rowNumbers[i] || 0) / 2);
    const rows = [];
    
    // Add first row in the pair
    if (seatsByRow[rowNumbers[i]]) {
      rows.push({
        rowNumber: rowNumbers[i],
        seats: seatsByRow[rowNumbers[i]]
      });
      }
      
    // Add second row if it exists
    if (rowNumbers[i + 1] && seatsByRow[rowNumbers[i + 1]]) {
      rows.push({
        rowNumber: rowNumbers[i + 1],
        seats: seatsByRow[rowNumbers[i + 1]]
          });
        }
    
    if (rows.length > 0) {
    groups.push({ groupNumber, rows });
    }
  }
  
  return groups;
};

// Legend component for status indicators
const SeatStatusLegend = () => (
  <div className="flex flex-wrap gap-2 mb-4">
    <Badge variant="outline" className="bg-white border-green-500 text-green-600">
      Available
    </Badge>
    <Badge variant="outline" className="bg-red-100 border-red-500 text-red-600">
      Occupied
    </Badge>
    <Badge variant="outline" className="bg-amber-100 border-amber-500 text-amber-600">
      Reserved
    </Badge>
    <Badge variant="outline" className="bg-slate-100 border-slate-400 text-slate-500">
      Maintenance
    </Badge>
  </div>
);

const DashboardSeatMap = ({ className }) => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatLayout, setSeatLayout] = useState([]);
  const [property, setProperty] = useState("sb2");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getAllSeats();
        const formattedData = formatSeatData(data);
        setSeatLayout(formattedData);
      } catch (err) {
        console.error("Error fetching seats:", err);
        setError("Failed to load seat data. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load seat data",
          variant: "destructive",
        });
        setSeatLayout([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSeats();
  }, [property]);
  
  const toggleSeatSelection = (seatId) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  const handlePropertyChange = (value) => {
    setProperty(value);
  };

  const handleActionClick = (action) => {
    if (selectedSeats.length === 0) {
    toast({
        title: "No seats selected",
        description: "Please select at least one seat",
        variant: "destructive"
    });
      return;
    }
    
    // Placeholder for future API integration
    toast({
      title: "Action triggered",
      description: `${action} action on ${selectedSeats.length} seats`
    });
    
    // Clear selection after action
    setSelectedSeats([]);
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
      <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  if (seatLayout.length === 0) {
    return (
      <div className="p-4 border border-gray-200 bg-gray-50 text-gray-500 rounded-md">
        No seat data available
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold">Interactive Seat Map</h3>
          <p className="text-sm text-muted-foreground">Click on available seats to select/deselect</p>
        </div>
        <Select value={property} onValueChange={handlePropertyChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="sb2">SB2 Library</SelectItem>
            <SelectItem value="sb1">SB1 Library</SelectItem>
            <SelectItem value="main">Main Library</SelectItem>
            </SelectContent>
          </Select>
      </div>
      
        <SeatStatusLegend />
      
      <div className="overflow-x-auto">
        <div className="flex flex-col gap-6 md:gap-8 min-w-[600px] max-w-6xl mx-auto">
          {seatLayout.map((group) => (
            <div key={`group-${group.groupNumber}`} className="relative">
              <div className="absolute -left-2 md:-left-10 top-1/2 -translate-y-1/2 text-xs md:text-sm font-medium text-muted-foreground">
                {group.groupNumber * 2 - 1}-{group.groupNumber * 2}
              </div>
              
              <div className="space-y-4 md:space-y-6">
                {group.rows.map((row) => (
                  <div key={`row-${row.rowNumber}`} className="flex gap-4 md:gap-6">
                    <div className="flex gap-2 md:gap-4">
                      {row.seats.filter(seat => seat.zone === 'left').map((seat) => (
                        <SeatItem
                          key={seat.id}
                          seat={seat}
                          selected={selectedSeats.includes(seat.id)}
                          onSelect={toggleSeatSelection}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 md:gap-4">
                      {row.seats.filter(seat => seat.zone === 'right').map((seat) => (
                        <SeatItem
                          key={seat.id}
                          seat={seat}
                          selected={selectedSeats.includes(seat.id)}
                          onSelect={toggleSeatSelection}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => handleActionClick('book')}
          disabled={selectedSeats.length === 0}
        >
          <Sofa className="h-4 w-4 mr-2" />
          Book Selected
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => setSelectedSeats([])}
          disabled={selectedSeats.length === 0}
        >
          Clear Selection ({selectedSeats.length})
        </Button>
      </div>
    </div>
  );
};

DashboardSeatMap.propTypes = {
  className: PropTypes.string
};

export default DashboardSeatMap;
