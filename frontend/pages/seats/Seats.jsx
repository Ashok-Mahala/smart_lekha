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
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);

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

        const [layoutData, seatsData, statsData] = await Promise.all([
          getLayout(property._id).catch(() => null),
          getSeatsByProperty(property._id).catch(() => []),
          getSeatStats(property._id).catch(() => ({
            total: 0,
            available: 0,
            occupied: 0,
            reserved: 0,
          }))
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
          setStats({
            total: createdSeats.length,
            available: createdSeats.length,
            occupied: 0,
            reserved: 0,
          });
        } else {
          setLayoutConfig(layoutData);
          setSeats(seatsData);
          setStats(statsData);
        }
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
    setFilterStatus(type === "total" ? "all" : type);
    setSelectedSeat(null); // Clear selection when changing filters
  };

  const handleSeatSelect = (seat) => {
    setSelectedSeat(seat);
  };

  const refreshSeatData = async () => {
    if (!selectedProperty) return;
    
    try {
      const [seatsData, statsData] = await Promise.all([
        getSeatsByProperty(selectedProperty._id),
        getSeatStats(selectedProperty._id)
      ]);
      setSeats(seatsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error refreshing seat data:', error);
    }
  };

  const handleSaveLayout = async (newConfig) => {
    if (!selectedProperty) return;
    
    try {
      setIsLoading(true);
      
      const savedConfig = await saveLayout(selectedProperty._id, newConfig);
      setLayoutConfig(savedConfig);
      
      const seatsToCreate = [];
      const seatsToUpdate = [];
      const seatsToDelete = [];
      let seatNumber = 1;
      
      const existingSeatsMap = new Map();
      seats.forEach(seat => {
        existingSeatsMap.set(`${seat.row}-${seat.column}`, seat);
      });
      
      for (let row = 0; row < savedConfig.rows; row++) {
        for (let col = 0; col < savedConfig.columns; col++) {
          const positionKey = `${row}-${col}`;
          const existingSeat = existingSeatsMap.get(positionKey);
          
          if (savedConfig.layout[row][col]) {
            if (existingSeat) {
              seatsToUpdate.push({
                id: existingSeat._id,
                updates: {
                  status: existingSeat.status,
                  seatNumber: existingSeat.seatNumber || seatNumber.toString()
                }
              });
            } else {
              seatsToCreate.push({
                propertyId: selectedProperty._id,
                seatNumber: seatNumber.toString(),
                row,
                column: col,
                status: 'available'
              });
            }
            seatNumber++;
          } else if (existingSeat) {
            seatsToDelete.push(existingSeat._id);
          }
        }
      }
  
      await Promise.all([
        seatsToCreate.length > 0 ? bulkCreateSeats(seatsToCreate) : Promise.resolve(),
        seatsToUpdate.length > 0 ? bulkUpdateSeats(seatsToUpdate) : Promise.resolve(),
        seatsToDelete.length > 0 ? Promise.all(seatsToDelete.map(id => deleteSeat(id))) : Promise.resolve()
      ]);
  
      await refreshSeatData();
      
      toast({
        title: "Success",
        description: `Layout saved. Created ${seatsToCreate.length}, updated ${seatsToUpdate.length}, deleted ${seatsToDelete.length} seats.`,
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
  
  const handleUpdateSeat = async (seatId, updates) => {
    if (!selectedProperty) return;
    
    try {
      await updateSeatStatus(seatId, updates);
      await refreshSeatData();
      toast({
        title: "Success",
        description: "Seat status updated successfully",
      });
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
      await refreshSeatData();
      toast({
        title: "Success",
        description: "Seat deleted successfully",
      });
    } catch (error) { 
      toast({
        title: "Error",
        description: error.message || "Failed to delete seat",
        variant: "destructive",
      });
    }
  };

  const filteredSeats = filterStatus === "all" 
    ? seats 
    : seats.filter(seat => seat.status === filterStatus);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Seat Management - {selectedProperty.name}</h1>
          {error && <p className="text-sm text-yellow-600 mt-2">{error}</p>}
        </div>

        {/* Seat Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { type: "total", label: "Total Seats", icon: <Sofa className="w-5 h-5" /> },
            { type: "available", label: "Available", icon: <CheckCircle2 className="w-5 h-5" /> },
            { type: "occupied", label: "Occupied", icon: <Users className="w-5 h-5" /> },
            { type: "reserved", label: "Reserved", icon: <Calendar className="w-5 h-5" /> }
          ].map((card) => (
            <Card 
              key={card.type}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                filterStatus === (card.type === "total" ? "all" : card.type) && "ring-2 ring-primary",
                card.type === "total" ? "bg-blue-50 border-blue-200" :
                card.type === "available" ? "bg-green-50 border-green-200" :
                card.type === "occupied" ? "bg-red-50 border-red-200" : "bg-purple-50 border-purple-200"
              )}
              onClick={() => handleCardClick(card.type)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className={cn(
                    "text-sm font-medium",
                    card.type === "total" ? "text-blue-900" :
                    card.type === "available" ? "text-green-900" :
                    card.type === "occupied" ? "text-red-900" : "text-purple-900"
                  )}>
                    {card.label}
                  </CardTitle>
                  {React.cloneElement(card.icon, {
                    className: cn(
                      "w-5 h-5",
                      card.type === "total" ? "text-blue-600" :
                      card.type === "available" ? "text-green-600" :
                      card.type === "occupied" ? "text-red-600" : "text-purple-600"
                    )
                  })}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {stats[card.type] || 0}
                </div>
                <p className={cn(
                  "text-xs mt-2",
                  card.type === "total" ? "text-blue-700" :
                  card.type === "available" ? "text-green-700" :
                  card.type === "occupied" ? "text-red-700" : "text-purple-700"
                )}>
                  {card.type === "total" ? "Library capacity" : 
                   card.type === "available" ? "Ready for use" : 
                   card.type === "occupied" ? "Currently in use" : "Reserved for later"}
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
                    selectedSeat={selectedSeat}
                    onSeatSelect={handleSeatSelect}
                    onSeatUpdate={handleUpdateSeat}
                    onSeatDelete={handleDeleteSeat}
                    onConfirm={refreshSeatData}
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