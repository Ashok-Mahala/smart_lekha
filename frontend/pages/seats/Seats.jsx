import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InteractiveSeatMap from "@/components/seats/InteractiveSeatMap";
import LayoutConfigurator from "@/components/dashboard/LayoutConfigurator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Sofa, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { getLayout, saveLayout } from "@/api/layouts";
import { 
  getSeatsByProperty,
  bulkCreateSeats,
  bulkUpdateSeats,
  bookSeat,
  reserveSeat,
  releaseSeat,
  getSeatStats,
  getShifts,
  updateSeatStatus,
  deleteSeat
} from "@/api/seats";

// Generate default layout configuration based on total seats
const generateDefaultLayout = (propertyId, totalSeats = 50) => {
  const columns = Math.min(7, Math.ceil(Math.sqrt(totalSeats)));
  const rows = Math.ceil(totalSeats / columns);
  
  // Create a layout with all seats initially available
  const layout = Array(rows).fill().map(() => Array(columns).fill(true));
  
  return {
    rows,
    columns,
    aisleWidth: 2,
    seatWidth: 1,
    seatHeight: 1,
    gap: 1,
    showNumbers: true,
    showStatus: true,
    layout, // This 2D array defines where seats can exist (true) and where they can't (false)
    propertyId
  };
};

const SeatsPage = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [layoutConfig, setLayoutConfig] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    prebooked: 0,
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [seats, setSeats] = useState([]);

  // Load data from localStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const selectedPropertyId = localStorage.getItem('selected_property');
        if (!selectedPropertyId) {
          throw new Error('No property selected');
        }

        const storedProperties = localStorage.getItem('properties');
        if (!storedProperties) {
          throw new Error('No properties found');
        }

        const properties = JSON.parse(storedProperties);
        const property = properties.find(p => p._id === selectedPropertyId);
        
        if (!property) {
          throw new Error('Selected property not found');
        }

        setSelectedProperty(property);

        // Load layout and seats
        const [layoutData, seatsData] = await Promise.all([
          getLayout(property._id).catch(() => null),
          getSeatsByProperty(property._id).catch(() => [])
        ]);

        // If no layout exists, create a default one
        if (!layoutData) {
          const defaultLayout = generateDefaultLayout(property._id, property.totalSeats);
          const savedLayout = await saveLayout(property._id, defaultLayout);
          setLayoutConfig(savedLayout);
          
          // Create only seats where layout allows (where layout[row][col] is true)
          const seatsToCreate = [];
          let seatNumber = 1;
          
          for (let row = 0; row < savedLayout.rows; row++) {
            for (let col = 0; col < savedLayout.columns; col++) {
              if (savedLayout.layout[row][col]) {
                seatsToCreate.push({
                  seatId: seatNumber,
                  propertyId: property._id,
                  number: seatNumber,
                  status: 'available',
                  row,
                  column: col
                });
                seatNumber++;
              }
            }
          }
          
          const createdSeats = await bulkCreateSeats(seatsToCreate);
          setSeats(createdSeats);
        } else {
          setLayoutConfig(layoutData);
          setSeats(seatsData);
        }

        // Load stats
        const statsData = await getSeatStats(property._id);
        setStats(statsData);
      } catch (error) {
        setError(error.message);
        console.error('Error loading seat data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCardClick = (type) => {
    setActiveTab("view");
    setFilterStatus(type);
  };

  const handleSeatSelect = (seatId) => {
    console.log('Selected seat:', seatId);
  };

  const handleSaveLayout = async (config) => {
    if (!selectedProperty) return;
    
    try {
      setIsLoading(true);
      
      // 1. Save layout configuration
      const savedConfig = await saveLayout(selectedProperty._id, config);
      setLayoutConfig(savedConfig);
      
      // 2. Get current seats
      const existingSeats = await getSeatsByProperty(selectedProperty._id);
      
      // 3. Prepare updates - create a plain array of updates
      const updates = existingSeats.map(seat => ({
        id: seat._id,
        updates: {
          status: 'available',
          deletedAt: null,
          propertyId: selectedProperty._id,
          seatNumber: seat.seatNumber,
          row: seat.row,
          column: seat.column
        }
      }));
  
      console.log('Prepared updates:', updates);
      
      // 4. Call bulkUpdateSeats with the array directly
      const response = await bulkUpdateSeats(updates);
      console.log('Update response:', response);
  
      // 5. Refresh data
      const [updatedSeats, newStats] = await Promise.all([
        getSeatsByProperty(selectedProperty._id),
        getSeatStats(selectedProperty._id)
      ]);
      
      setSeats(updatedSeats);
      setStats(newStats);
      
      toast({
        title: "Success",
        description: `Updated ${updates.length} seats successfully.`,
      });
  
    } catch (error) {
      console.error('Update failed:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update seats",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateSeat = async (seatId, seatData) => {
    if (!selectedProperty) return;
    
    try {
      const updatedSeat = await updateSeatStatus(seatId, seatData.status);
      
      setSeats(prevSeats => 
        prevSeats.map(s => s.id === seatId ? updatedSeat : s)
      );
      
      // Refresh stats
      const stats = await getSeatStats(selectedProperty._id);
      setStats(stats);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to update seat",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSeat = async (seatId) => {
    if (!selectedProperty) return;
    
    try {
      await deleteSeat(seatId);
      
      setSeats(prevSeats => prevSeats.filter(s => s.id !== seatId));
      
      // Refresh stats
      const stats = await getSeatStats(selectedProperty._id);
      setStats(stats);
    } catch (error) { 
      toast({
        title: "Error",
        description: error.message || "Failed to delete seat",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span className="ml-2">Loading seat management...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !selectedProperty) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <p className="text-red-500">
            {error || 'No property selected. Please select a property first.'}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Filter seats based on status if filter is applied
  const filteredSeats = filterStatus && filterStatus !== 'total' 
    ? seats.filter(seat => seat.status === filterStatus)
    : seats;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Seat Management - {selectedProperty.name}</h1>
          {error && (
            <p className="text-sm text-yellow-600 mt-2">
              {error}
            </p>
          )}
        </div>

        {/* Seat Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className={cn(
              "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer transition-all duration-200 hover:shadow-lg",
              filterStatus === 'total' && "ring-2 ring-blue-500"
            )}
            onClick={() => handleCardClick('total')}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-blue-900">Total Seats</CardTitle>
                <Sofa className="w-5 h-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.total || selectedProperty.totalSeats}</div>
              <p className="text-xs text-blue-700 mt-2">Library capacity</p>
            </CardContent>
          </Card>

          <Card 
            className={cn(
              "bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer transition-all duration-200 hover:shadow-lg",
              filterStatus === 'available' && "ring-2 ring-green-500"
            )}
            onClick={() => handleCardClick('available')}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-green-900">Available Seats</CardTitle>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.available}</div>
              <p className="text-xs text-green-700 mt-2">Ready for use</p>
            </CardContent>
          </Card>

          <Card 
            className={cn(
              "bg-gradient-to-br from-red-50 to-red-100 border-red-200 cursor-pointer transition-all duration-200 hover:shadow-lg",
              filterStatus === 'occupied' && "ring-2 ring-red-500"
            )}
            onClick={() => handleCardClick('occupied')}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-red-900">Occupied Seats</CardTitle>
                <Users className="w-5 h-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.occupied}</div>
              <p className="text-xs text-red-700 mt-2">Currently in use</p>
            </CardContent>
          </Card>

          <Card 
            className={cn(
              "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer transition-all duration-200 hover:shadow-lg",
              filterStatus === 'prebooked' && "ring-2 ring-purple-500"
            )}
            onClick={() => handleCardClick('prebooked')}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-purple-900">Pre-booked</CardTitle>
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.prebooked}</div>
              <p className="text-xs text-purple-700 mt-2">Reserved for later</p>
            </CardContent>
          </Card>
        </div>

        {/* View/Configure Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="view">View Layout</TabsTrigger>
            <TabsTrigger value="configure">Configure Layout</TabsTrigger>
          </TabsList>
          
          <TabsContent value="view">
            <Card>
              <CardHeader>
                <CardTitle>Seat Map</CardTitle>
              </CardHeader>
              <CardContent>
                {layoutConfig ? (
                  <InteractiveSeatMap 
                    config={layoutConfig}
                    seats={filteredSeats}
                    showOnlyAvailable={filterStatus === 'available'}
                    onSeatSelect={handleSeatSelect}
                    onSeatUpdate={handleUpdateSeat}
                    onSeatDelete={handleDeleteSeat}
                    className="mt-4"
                  />
                ) : (
                  <p className="text-muted-foreground">No layout configuration available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="configure">
            {layoutConfig ? (
              <LayoutConfigurator 
                onSave={handleSaveLayout}
                initialConfig={layoutConfig}
              />
            ) : (
              <p className="text-muted-foreground">No layout configuration available to edit</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SeatsPage;