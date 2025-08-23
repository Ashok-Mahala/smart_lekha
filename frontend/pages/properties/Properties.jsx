import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Building2, Users, Sofa, IndianRupeeIcon, Edit, Trash2, MoreVertical, LayoutGrid, List } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import AddPropertyDialog from '@/components/properties/AddPropertyDialog';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PropTypes from 'prop-types';
import { getProperties, createProperty, deleteProperty } from '@/api/properties';

const PropertiesPage = () => {
  const navigate = useNavigate();
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProperties()
      .then((data) => setProperties(data))
      .catch(() => toast.error('Failed to fetch properties'))
      .finally(() => setLoading(false));
  }, []);

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProperty = async (property) => {
    try {
      setLoading(true);
      const newProperty = await createProperty(property);
  
      setProperties((prev) => {
        const updated = [...prev, {
          id: newProperty._id,
          name: newProperty.name,
          logo: Building2
        }];
  
        // Store updated list in localStorage
        localStorage.setItem('properties', JSON.stringify(updated));
  
        // If no property is selected, set the new one as selected
        const storedSelected = localStorage.getItem('selectedProperty');
        if (!storedSelected || storedSelected === 'default') {
          localStorage.setItem('selectedProperty', newProperty._id);
        }
  
        return updated;
      });
  
      toast.success('Property added successfully');
    } catch (error) {
      toast.error('Failed to add property');
    } finally {
      setLoading(false);
    }
  };
  

  const handlePropertyClick = (property) => {
    navigate(`/properties/${property._id}`);
  };

  // Delete Property
  const handleDeleteProperty = async (propertyId, e) => {
    e.stopPropagation(); // Prevent triggering the card click
    
    // Confirmation dialog
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }
  
    try {
      setLoading(true);
      await deleteProperty(propertyId);
      
      // Update local state
      setProperties(prev => prev.filter(prop => prop._id !== propertyId));
      
      // Update localStorage
      const updatedProperties = properties.filter(prop => prop._id !== propertyId);
      localStorage.setItem('properties', JSON.stringify(updatedProperties));
      
      toast.success('Property deleted successfully');
    } catch (error) {
      console.error('Error deleting property:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete property';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overview statistics
  const totalProperties = properties.length;
  const totalSeats = properties.reduce((acc, prop) => acc + (prop.seats || 0), 0);
  const totalStudents = properties.reduce((acc, prop) => acc + (prop.students || 0), 0);
  const totalRevenue = properties.reduce((acc, prop) => acc + (prop.revenue || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Property Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your library properties and locations
            </p>
          </div>
          <Button onClick={() => setShowAddProperty(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="properties" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Properties List
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Properties List Tab */}
          <TabsContent value="properties">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <motion.div
              key={property.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePropertyClick(property)}
            >
              <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${property.logoColor} bg-opacity-10`}>
                      {/* <property.logo className="h-5 w-5" /> */}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">{property.name}</CardTitle>
                      <CardDescription>{property.location}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/properties/${property._id}`);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => handleDeleteProperty(property._id, e)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Property
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                      <Sofa className="h-4 w-4 mb-1" />
                          <span className="text-sm font-medium">{property.seats} Seats</span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                      <Users className="h-4 w-4 mb-1" />
                          <span className="text-sm font-medium">{property.students} Students</span>
                    </div>
                    {/* <div className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
                      <IndianRupeeIcon className="h-4 w-4 mb-1" />
                      <span className="text-sm font-medium"> ₹ {property.revenue != null ? property.revenue.toLocaleString() : '0'} </span>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalProperties}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Seats</CardTitle>
                  <Sofa className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSeats}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStudents}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <IndianRupeeIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Property Distribution Chart */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Property Distribution</CardTitle>
                <CardDescription>Overview of property locations and capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Property distribution chart will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Property Dialog */}
        <AddPropertyDialog
          open={showAddProperty}
          onOpenChange={setShowAddProperty}
          onAddProperty={handleAddProperty}
        />
      </div>
    </DashboardLayout>
  );
};

// Add PropTypes validation
PropertiesPage.propTypes = {
  showAddProperty: PropTypes.bool,
  searchQuery: PropTypes.string,
  selectedProperty: PropTypes.string,
  totalProperties: PropTypes.number,
  totalSeats: PropTypes.number,
  totalStudents: PropTypes.number,
  totalRevenue: PropTypes.number
};

export default PropertiesPage; 