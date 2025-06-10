import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InteractiveSeatMap from "@/components/seats/InteractiveSeatMap";
import LayoutConfigurator from "@/components/dashboard/LayoutConfigurator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Sofa, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import PropTypes from 'prop-types';

export const layoutConfigPropTypes = PropTypes.shape({
  rows: PropTypes.number.isRequired,
  columns: PropTypes.number.isRequired,
  aisleWidth: PropTypes.number.isRequired,
  seatWidth: PropTypes.number.isRequired,
  seatHeight: PropTypes.number.isRequired,
  gap: PropTypes.number.isRequired
});

// Default configuration when API is not available
const defaultLayoutConfig = {
    rows: 14,
    columns: 7,
    gap: 2,
    showNumbers: true,
    showStatus: true,
    layout: Array(14).fill(null).map(() => Array(7).fill(true))
};

const fetchSeatStats = async () => {
  try {
    const response = await fetch('/smlekha/seats/stats');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching seat stats:', error);
    return {
      total: 0,
      available: 0,
      occupied: 0,
      prebooked: 0
    };
  }
};

const SeatsPage = () => {
  const [activeTab, setActiveTab] = useState("view");
  const [layoutConfig, setLayoutConfig] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [selectedShift, setSelectedShift] = useState('morning');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
    reserved: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [layoutResponse, statsResponse] = await Promise.all([
          fetch('/smlekha/seats/layout'),
          fetch('/smlekha/seats/stats'),
        ]);
        
        if (!layoutResponse.ok || !statsResponse.ok) {
          throw new Error('API endpoints not available');
        }
        
        const layoutData = await layoutResponse.json();
        const statsData = await statsResponse.json();
        
        setLayoutConfig(layoutData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching seat data:', error);
        setError('Failed to load seat data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLayoutSave = async (config) => {
    try {
      const response = await fetch('/smlekha/layout-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to save layout configuration');
      }

      setLayoutConfig(config);
      setActiveTab("view");
      toast({
        title: "Success",
        description: "Layout configuration saved successfully",
      });
    } catch (error) {
      console.error('Error saving layout config:', error);
      toast({
        title: "Error",
        description: "Failed to save layout configuration",
        variant: "destructive",
      });
      
      // Save locally even if API fails
    setLayoutConfig(config);
    setActiveTab("view");
    }
  };

  const handleCardClick = (type) => {
    setActiveTab("view");
    setFilterStatus(type);
  };

  const handleSeatSelect = (seatId) => {
    console.log('Selected seat:', seatId);
  };

  const handleUpdateSeat = async (seatId, seatData) => {
    try {
      const response = await fetch(`/smlekha/seats/${seatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seatData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update seat');
      }
      
      const updatedSeat = await response.json();
      setLayoutConfig(prevConfig => ({
        ...prevConfig,
        seats: prevConfig.seats.map(seat => 
          seat.id === seatId ? updatedSeat : seat
        ),
      }));
      
      // Refresh stats after updating seat
      const statsResponse = await fetch('/smlekha/seats/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error updating seat:', error);
      toast({
        title: "Error",
        description: "Failed to update seat",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSeat = async (seatId) => {
    try {
      const response = await fetch(`/smlekha/seats/${seatId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete seat');
      }
      
      setLayoutConfig(prevConfig => ({
        ...prevConfig,
        seats: prevConfig.seats.filter(seat => seat.id !== seatId),
      }));
      
      // Refresh stats after deleting seat
      const statsResponse = await fetch('/smlekha/seats/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error deleting seat:', error);
      toast({
        title: "Error",
        description: "Failed to delete seat",
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Seat Management</h1>
          <p className="text-muted-foreground">
            Monitor library seating arrangements
          </p>
          {error && (
            <p className="text-sm text-yellow-600 mt-2">
              {error}
            </p>
          )}
        </div>

        {/* Modern Seat Status Cards */}
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
              <div className="text-3xl font-bold text-amber-600">{stats.total}</div>
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

        {/* Tabs for View and Configuration */}
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
                <InteractiveSeatMap 
                  showOnlyAvailable={filterStatus === 'available'}
                  onSeatSelect={handleSeatSelect}
                  className="mt-4"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="configure">
            <LayoutConfigurator 
              onSave={handleLayoutSave}
              initialConfig={layoutConfig}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SeatsPage;
