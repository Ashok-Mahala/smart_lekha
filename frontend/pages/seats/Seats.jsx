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

const generateDefaultLayout = (propertyId, totalSeats = 50) => {
  const columns = Math.min(7, Math.ceil(Math.sqrt(totalSeats)));
  const rows = Math.ceil(totalSeats / columns);
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
    layout,
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

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const selectedPropertyId = localStorage.getItem('selected_property');
        if (!selectedPropertyId) throw new Error('No property selected');

        const storedProperties = localStorage.getItem('properties');
        if (!storedProperties) throw new Error('No properties found');

        const properties = JSON.parse(storedProperties);
        const property = properties.find(p => p._id === selectedPropertyId);
        if (!property) throw new Error('Selected property not found');

        setSelectedProperty(property);

        const [layoutData, seatsData] = await Promise.all([
          getLayout(property._id).catch(() => null),
          getSeatsByProperty(property._id).catch(() => [])
        ]);

        if (!layoutData) {
          const defaultLayout = generateDefaultLayout(property._id, property.totalSeats);
          const savedLayout = await saveLayout(property._id, defaultLayout);
          setLayoutConfig(savedLayout);
          
          const seatsToCreate = [];
          let seatNumber = 1;
          
          for (let row = 0; row < savedLayout.rows; row++) {
            for (let col = 0; col < savedLayout.columns; col++) {
              if (savedLayout.layout[row][col]) {
                seatsToCreate.push({
                  propertyId: property._id,
                  seatNumber: seatNumber.toString(),
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

  const handleSaveLayout = async (newConfig) => {
    if (!selectedProperty) return;
    
    try {
      setIsLoading(true);
      
      // 1. Save layout configuration
      const savedConfig = await saveLayout(selectedProperty._id, newConfig);
      setLayoutConfig(savedConfig);
      
      // 2. Prepare all seat operations
      const seatsToCreate = [];
      const seatsToUpdate = [];
      const seatsToDelete = [];
      let seatNumber = 1;
      
      // Create a map of existing seats by position
      const existingSeatsMap = new Map();
      seats.forEach(seat => {
        existingSeatsMap.set(`${seat.row}-${seat.column}`, seat);
      });
      
      // 3. Process all seats in new layout
      for (let row = 0; row < savedConfig.rows; row++) {
        for (let col = 0; col < savedConfig.columns; col++) {
          const positionKey = `${row}-${col}`;
          const existingSeat = existingSeatsMap.get(positionKey);
          
          if (savedConfig.layout[row][col]) {
            // Seat exists in new layout
            if (existingSeat) {
              // Update existing seat if needed
              seatsToUpdate.push({
                id: existingSeat._id,
                updates: {
                  status: 'available', // or keep existing status
                  seatNumber: existingSeat.seatNumber || seatNumber.toString()
                }
              });
            } else {
              // Create new seat
              seatsToCreate.push({
                propertyId: selectedProperty._id,
                seatNumber: seatNumber.toString(),
                number: seatNumber,
                row,
                column: col,
                status: 'available'
              });
            }
            seatNumber++;
          } else if (existingSeat) {
            // Seat exists but not in new layout - mark for deletion
            seatsToDelete.push({
              id: existingSeat._id,
              updates: {
                status: 'deleted'
              }
            });
          }
        }
      }
  
      // 4. Execute all operations
      const creationPromise = seatsToCreate.length > 0 
        ? bulkCreateSeats(seatsToCreate)
        : Promise.resolve([]);
        
      const updatePromise = seatsToUpdate.length > 0 
        ? bulkUpdateSeats(seatsToUpdate)
        : Promise.resolve([]);
        
      const deletePromise = seatsToDelete.length > 0 
        ? bulkUpdateSeats(seatsToDelete)
        : Promise.resolve([]);
  
      const [createdSeats, updatedSeats, deletedSeats] = await Promise.all([
        creationPromise,
        updatePromise,
        deletePromise
      ]);
  
      // 5. Refresh all data
      const updatedSeatsList = await getSeatsByProperty(selectedProperty._id);
      setSeats(updatedSeatsList);
      
      const statsData = await getSeatStats(selectedProperty._id);
      setStats(statsData);
      
      toast({
        title: "Success",
        description: `Layout saved. Created ${createdSeats.length}, updated ${updatedSeats.length}, deleted ${deletedSeats.length} seats.`,
      });
  
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save layout",
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
      setSeats(prevSeats => prevSeats.map(s => s.id === seatId ? updatedSeat : s));
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

  const filteredSeats = filterStatus && filterStatus !== 'total' 
    ? seats.filter(seat => seat.status === filterStatus)
    : seats;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Seat Management - {selectedProperty.name}</h1>
          {error && <p className="text-sm text-yellow-600 mt-2">{error}</p>}
        </div>

        {/* Seat Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {['total', 'available', 'occupied', 'prebooked'].map((type) => (
            <Card 
              key={type}
              className={cn(
                `bg-gradient-to-br from-${type === 'total' ? 'blue' : type === 'available' ? 'green' : type === 'occupied' ? 'red' : 'purple'}-50 to-${type === 'total' ? 'blue' : type === 'available' ? 'green' : type === 'occupied' ? 'red' : 'purple'}-100 border-${type === 'total' ? 'blue' : type === 'available' ? 'green' : type === 'occupied' ? 'red' : 'purple'}-200 cursor-pointer transition-all duration-200 hover:shadow-lg`,
                filterStatus === type && `ring-2 ring-${type === 'total' ? 'blue' : type === 'available' ? 'green' : type === 'occupied' ? 'red' : 'purple'}-500`
              )}
              onClick={() => handleCardClick(type)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-sm font-medium text-${type === 'total' ? 'blue' : type === 'available' ? 'green' : type === 'occupied' ? 'red' : 'purple'}-900`}>
                    {type === 'total' ? 'Total' : type === 'available' ? 'Available' : type === 'occupied' ? 'Occupied' : 'Pre-booked'} Seats
                  </CardTitle>
                  {type === 'total' ? <Sofa className={`w-5 h-5 text-${type === 'total' ? 'blue' : type === 'available' ? 'green' : type === 'occupied' ? 'red' : 'purple'}-600`} /> :
                   type === 'available' ? <CheckCircle2 className={`w-5 h-5 text-${type === 'total' ? 'blue' : type === 'available' ? 'green' : type === 'occupied' ? 'red' : 'purple'}-600`} /> :
                   type === 'occupied' ? <Users className={`w-5 h-5 text-${type === 'total' ? 'blue' : type === 'available' ? 'green' : type === 'occupied' ? 'red' : 'purple'}-600`} /> :
                   <Calendar className={`w-5 h-5 text-${type === 'total' ? 'blue' : type === 'available' ? 'green' : type === 'occupied' ? 'red' : 'purple'}-600`} />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {stats[type === 'total' ? 'total' : type === 'available' ? 'available' : type === 'occupied' ? 'occupied' : 'prebooked'] || (type === 'total' ? selectedProperty.totalSeats : 0)}
                </div>
                <p className={`text-xs text-${type === 'total' ? 'blue' : type === 'available' ? 'green' : type === 'occupied' ? 'red' : 'purple'}-700 mt-2`}>
                  {type === 'total' ? 'Library capacity' : 
                   type === 'available' ? 'Ready for use' : 
                   type === 'occupied' ? 'Currently in use' : 'Reserved for later'}
                </p>
              </CardContent>
            </Card>
          ))}
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
                    onConfirm={async () => {
                      const freshSeats = await getSeatsByProperty(selectedProperty._id);
                      setSeats(freshSeats);
                      const stats = await getSeatStats(selectedProperty._id);
                      setStats(stats);
                    }}
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
                initialConfig={{
                  ...layoutConfig,
                  seatNumbers: seats.reduce((acc, seat) => {
                    acc[`${seat.row}-${seat.column}`] = seat.seatNumber;
                    return acc;
                  }, {})
                }}
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