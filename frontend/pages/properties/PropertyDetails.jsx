import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateProperty } from '@/api/properties';
import { 
  Building2, 
  Users, 
  Sofa, 
  IndianRupee, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  User, 
  Shield, 
  Key,
  Edit,
  Trash2,
  ArrowLeft,
  Calendar,
  FileText,
  Settings,
  BarChart2,
  Save,
  X,
  Plus,
  Search,
  MoreVertical,
  Star,
  ChevronRight
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PropTypes from 'prop-types';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddManager, setShowAddManager] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddFacility, setShowAddFacility] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newFacility, setNewFacility] = useState('');
  const [newRule, setNewRule] = useState('');
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: '',
    email: '',
    phone: ''
  });
  const [newManager, setNewManager] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    avatar: ''
  });

  // Load property from localStorage
  useEffect(() => {
    const properties = JSON.parse(localStorage.getItem("properties")) || [];
    const property = properties.find((p) => (p._id || p.id) === id);
    
    if (property) {
      // Set up property details with API data
      setPropertyDetails({
        ...property,
        manager: Array.isArray(property.manager) ? property.manager : property.manager ? [property.manager] : [],
        staff: property.staff || [],
        occupiedSeats: 0, // Will be added in future
        totalStudents: 0, // Will be added in future
        monthlyRevenue: 0, // Will be added in future
      });
    } else {
      toast.error("Property not found");
    }
    setLoading(false);
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <p className="text-muted-foreground">Loading property details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!propertyDetails) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Property Not Found</h1>
            <p className="text-muted-foreground mb-4">The property you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/properties')}>Back to Properties</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSave = async () => {
    try {
      // Call the API function to update the property
      const dataToSend = {
        ...propertyDetails,
        // Make sure manager is properly formatted as array
        manager: Array.isArray(propertyDetails.manager) ? propertyDetails.manager : [],
      };
      const updatedProperty = await updateProperty(id, dataToSend);
      
      // Update localStorage for immediate UI consistency
      const properties = JSON.parse(localStorage.getItem("properties")) || [];
      const updatedProperties = properties.map(p => 
        (p._id || p.id) === id ? updatedProperty : p
      );
      localStorage.setItem("properties", JSON.stringify(updatedProperties));
      
      // Update state with the returned property data
      setPropertyDetails(updatedProperty);
      
      toast.success("Property details updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating property:', error);
      
      // Handle specific error cases
      const errorMessage = error.response?.data?.message || error.message || "Failed to update property details";
      
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        toast.error("Unauthorized: Please login again");
      } else if (errorMessage.includes('404')) {
        toast.error("Property not found");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleAddManager = (managerData) => {
    if (!managerData.name.trim() || !managerData.role.trim()) {
      toast.error("Please fill in name and role fields");
      return;
    }
    
    setPropertyDetails(prev => ({
      ...prev,
      manager: [...(prev.manager || []), managerData] // Add to manager array
    }));
    
    setShowAddManager(false);
    toast.success("Manager added successfully");
  };

  const handleAddStaff = (staffData) => {
    if (!staffData.name.trim() || !staffData.role.trim()) {
      toast.error("Please fill in name and role fields");
      return;
    }
    
    setPropertyDetails(prev => ({
      ...prev,
      staff: [...(prev.staff || []), staffData] // No id field
    }));
    
    setShowAddStaff(false);
    setNewStaff({ name: '', role: '', email: '', phone: '' });
    toast.success("Staff member added successfully");
  };

  const handleAddFacility = (facilityName) => {
    if (!facilityName.trim()) {
      toast.error("Please enter a facility name");
      return;
    }
    
    setPropertyDetails(prev => ({
      ...prev,
      facilities: [...prev.facilities, facilityName.trim()]
    }));
    setShowAddFacility(false);
    setNewFacility(''); // Reset the input field
    toast.success("Facility added successfully");
  };

  const handleAddRule = (ruleText) => {
    if (!ruleText.trim()) {
      toast.error("Please enter a rule");
      return;
    }
    
    setPropertyDetails(prev => ({
      ...prev,
      rules: [...prev.rules, ruleText.trim()]
    }));
    setShowAddRule(false);
    setNewRule(''); // Reset the input field
    toast.success("Rule added successfully");
  };
  

  const handleDeleteManager = (index) => {
    setPropertyDetails(prev => ({
      ...prev,
      manager: prev.manager.filter((_, i) => i !== index)
    }));
    toast.success("Manager removed successfully");
  };

  const handleDeleteStaff = (index) => {
    setPropertyDetails(prev => ({
      ...prev,
      staff: prev.staff.filter((_, i) => i !== index)
    }));
    toast.success("Staff member removed successfully");
  };

  const handleDeleteFacility = (facility) => {
    setPropertyDetails(prev => ({
      ...prev,
      facilities: prev.facilities.filter(f => f !== facility)
    }));
    toast.success("Facility removed successfully");
  };

  const handleDeleteRule = (rule) => {
    setPropertyDetails(prev => ({
      ...prev,
      rules: prev.rules.filter(r => r !== rule)
    }));
    toast.success("Rule removed successfully");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{propertyDetails.name}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {propertyDetails.type} • {propertyDetails.address}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Property
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Seats</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Sofa className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Input 
                  type="number" 
                  value={propertyDetails.totalSeats}
                  onChange={(e) => setPropertyDetails(prev => ({ ...prev, totalSeats: parseInt(e.target.value) }))}
                  className="w-24 bg-white/50"
                />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-700">{propertyDetails.totalSeats}</div>
                  <p className="text-xs text-blue-600/80">
                    {propertyDetails.occupiedSeats || 0} currently occupied
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total Students</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {propertyDetails.totalStudents}
              </div>
              <p className="text-xs text-green-600/80">
                Active members
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Monthly Revenue</CardTitle>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">
                ₹{propertyDetails.monthlyRevenue}
              </div>
              <p className="text-xs text-purple-600/80">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-none shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Opening Hours</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-2">
                  <Input 
                    value={propertyDetails.openingHours}
                    onChange={(e) => setPropertyDetails(prev => ({ ...prev, openingHours: e.target.value }))}
                    className="bg-white/50"
                    placeholder="Enter opening hours"
                  />
                  {/* <Select>
                    <SelectTrigger className="bg-white/50">
                      <SelectValue placeholder="Select schedule type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24/7">24/7</SelectItem>
                      <SelectItem value="custom">Custom Hours</SelectItem>
                      <SelectItem value="weekday">Weekday Schedule</SelectItem>
                    </SelectContent>
                  </Select> */}
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-700">{propertyDetails.openingHours}</div>
                  <p className="text-xs text-orange-600/80">
                    {propertyDetails.openingHours === "24" ? "Always open" : "Check schedule"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
            <TabsTrigger value="staff" className="rounded-md">Staff</TabsTrigger>
            <TabsTrigger value="facilities" className="rounded-md">Facilities</TabsTrigger>
            <TabsTrigger value="rules" className="rounded-md">Rules</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-md">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Property Information
                </CardTitle>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddManager(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manager
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Address</Label>
                          <Input 
                            value={propertyDetails.address}
                            onChange={(e) => setPropertyDetails(prev => ({ ...prev, address: e.target.value }))}
                            className="bg-muted/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Phone</Label>
                          <Input 
                            value={propertyDetails.phone}
                            onChange={(e) => setPropertyDetails(prev => ({ ...prev, phone: e.target.value }))}
                            className="bg-muted/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Email</Label>
                          <Input 
                            value={propertyDetails.email}
                            onChange={(e) => setPropertyDetails(prev => ({ ...prev, email: e.target.value }))}
                            className="bg-muted/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Website</Label>
                          <Input 
                            value={propertyDetails.website}
                            onChange={(e) => setPropertyDetails(prev => ({ ...prev, website: e.target.value }))}
                            className="bg-muted/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Description</Label>
                          <Textarea 
                            value={propertyDetails.description}
                            onChange={(e) => setPropertyDetails(prev => ({ ...prev, description: e.target.value }))}
                            className="bg-muted/50"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                          <span className="text-sm">{propertyDetails.address}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Phone className="h-5 w-5 text-primary" />
                          <span className="text-sm">{propertyDetails.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Mail className="h-5 w-5 text-primary" />
                          <span className="text-sm">{propertyDetails.email}</span>
                        </div>
                        {propertyDetails.website && (
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Building2 className="h-5 w-5 text-primary" />
                            <a href={propertyDetails.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                              {propertyDetails.website}
                            </a>
                          </div>
                        )}
                        {propertyDetails.description && (
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm">{propertyDetails.description}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Property Managers
                </CardTitle>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddManager(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manager
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {propertyDetails.manager && propertyDetails.manager.length > 0 ? (
                    propertyDetails.manager.map((manager, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={manager.avatar} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {manager.name ? manager.name.split(' ').map(n => n[0]).join('') : 'M'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input 
                                    value={manager.name || ''}
                                    onChange={(e) => {
                                      setPropertyDetails(prev => ({
                                        ...prev,
                                        manager: prev.manager.map((m, i) => 
                                          i === index ? { ...m, name: e.target.value } : m
                                        )
                                      }));
                                    }}
                                    className="bg-white/50"
                                  />
                                  <Input 
                                    value={manager.role || ''}
                                    onChange={(e) => {
                                      setPropertyDetails(prev => ({
                                        ...prev,
                                        manager: prev.manager.map((m, i) => 
                                          i === index ? { ...m, role: e.target.value } : m
                                        )
                                      }));
                                    }}
                                    className="bg-white/50"
                                  />
                                </div>
                              ) : (
                                <>
                                  <p className="font-medium">{manager.name}</p>
                                  <p className="text-sm text-muted-foreground">{manager.role}</p>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {manager.phone && (
                                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                                  <Phone className="h-4 w-4" />
                                </Button>
                              )}
                              {manager.email && (
                                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              {isEditing && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteManager(index)}
                                  className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {(manager.email || manager.phone) && (
                            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                              {manager.email && <span>{manager.email}</span>}
                              {manager.email && manager.phone && <span>•</span>}
                              {manager.phone && <span>{manager.phone}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No managers added yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Staff Members</CardTitle>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddStaff(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Staff
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {propertyDetails.staff && propertyDetails.staff.length > 0 ? (
                    propertyDetails.staff.map((member, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Avatar>
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback>
                            {member.name ? member.name.split(' ').map(n => n[0]).join('') : 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input 
                                    value={member.name || ''}
                                    onChange={(e) => {
                                      setPropertyDetails(prev => ({
                                        ...prev,
                                        staff: prev.staff.map((s, i) => 
                                          i === index ? { ...s, name: e.target.value } : s
                                        )
                                      }));
                                    }}
                                    className="bg-white"
                                  />
                                  <Input 
                                    value={member.role || ''}
                                    onChange={(e) => {
                                      setPropertyDetails(prev => ({
                                        ...prev,
                                        staff: prev.staff.map((s, i) => 
                                          i === index ? { ...s, role: e.target.value } : s
                                        )
                                      }));
                                    }}
                                    className="bg-white"
                                  />
                                </div>
                              ) : (
                                <>
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-sm text-muted-foreground">{member.role}</p>
                                  {member.email && <p className="text-sm text-muted-foreground">{member.email}</p>}
                                  {member.phone && <p className="text-sm text-muted-foreground">{member.phone}</p>}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {member.phone && (
                                <Button variant="ghost" size="sm">
                                  <Phone className="h-4 w-4" />
                                </Button>
                              )}
                              {member.email && (
                                <Button variant="ghost" size="sm">
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              {isEditing && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteStaff(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No staff members added yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facilities" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Available Facilities</CardTitle>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddFacility(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Facility
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {propertyDetails.facilities && propertyDetails.facilities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {propertyDetails.facilities.map((facility, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {facility}
                        {isEditing && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleDeleteFacility(facility)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No facilities added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Property Rules</CardTitle>
                {isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setShowAddRule(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {propertyDetails.rules && propertyDetails.rules.length > 0 ? (
                  <ul className="space-y-2">
                    {propertyDetails.rules.map((rule, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="mt-1">•</div>
                        <div className="flex-1 flex items-center justify-between">
                          <span>{rule}</span>
                          {isEditing && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteRule(rule)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No rules added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Property Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] flex items-center justify-center">
                        <p className="text-muted-foreground">Chart will be displayed here</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px] flex items-center justify-center">
                        <p className="text-muted-foreground">Chart will be displayed here</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Manager Dialog */}
      <Dialog open={showAddManager} onOpenChange={(open) => {
        setShowAddManager(open);
        if (!open) setNewManager({ name: '', role: '', email: '', phone: '', avatar: '' });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Manager</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="manager-name">Name *</Label>
              <Input 
                id="manager-name" 
                placeholder="Enter manager name" 
                value={newManager.name}
                onChange={(e) => setNewManager(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manager-role">Role *</Label>
              <Input 
                id="manager-role" 
                placeholder="Enter manager role" 
                value={newManager.role}
                onChange={(e) => setNewManager(prev => ({ ...prev, role: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manager-email">Email</Label>
              <Input 
                id="manager-email" 
                type="email"
                placeholder="Enter manager email" 
                value={newManager.email}
                onChange={(e) => setNewManager(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="manager-phone">Phone</Label>
              <Input 
                id="manager-phone" 
                placeholder="Enter manager phone" 
                value={newManager.phone}
                onChange={(e) => setNewManager(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddManager(false);
              setNewManager({ name: '', role: '', email: '', phone: '', avatar: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={() => handleAddManager(newManager)}>
              Add Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaff} onOpenChange={(open) => {
        setShowAddStaff(open);
        if (!open) setNewStaff({ name: '', role: '', email: '', phone: '' });
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staff-name">Name *</Label>
              <Input 
                id="staff-name" 
                placeholder="Enter staff name" 
                value={newStaff.name}
                onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="staff-role">Role *</Label>
              <Input 
                id="staff-role" 
                placeholder="Enter staff role" 
                value={newStaff.role}
                onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="staff-email">Email</Label>
              <Input 
                id="staff-email" 
                type="email"
                placeholder="Enter staff email" 
                value={newStaff.email}
                onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="staff-phone">Phone</Label>
              <Input 
                id="staff-phone" 
                placeholder="Enter staff phone" 
                value={newStaff.phone}
                onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddStaff(false);
              setNewStaff({ name: '', role: '', email: '', phone: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={() => handleAddStaff(newStaff)}>
              Add Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Facility Dialog */}
      <Dialog open={showAddFacility} onOpenChange={(open) => {
        setShowAddFacility(open);
        if (!open) setNewFacility(''); // Reset when dialog closes
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Facility</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="facility">Facility Name</Label>
              <Input 
                id="facility" 
                placeholder="Enter facility name" 
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddFacility(newFacility);
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddFacility(false);
              setNewFacility('');
            }}>
              Cancel
            </Button>
            <Button onClick={() => handleAddFacility(newFacility)}>
              Add Facility
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rule Dialog */}
      <Dialog open={showAddRule} onOpenChange={(open) => {
        setShowAddRule(open);
        if (!open) setNewRule(''); // Reset when dialog closes
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Rule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rule">Rule</Label>
              <Textarea 
                id="rule" 
                placeholder="Enter property rule" 
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddRule(false);
              setNewRule('');
            }}>
              Cancel
            </Button>
            <Button onClick={() => handleAddRule(newRule)}>
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

PropertyDetails.propTypes = {
  showAddManager: PropTypes.bool,
  showAddStaff: PropTypes.bool,
  showAddFacility: PropTypes.bool,
  searchQuery: PropTypes.string,
  property: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    contact: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    seats: PropTypes.number.isRequired,
    students: PropTypes.number.isRequired,
    revenue: PropTypes.number.isRequired,
    rating: PropTypes.number.isRequired,
    managers: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired
    })).isRequired,
    staff: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired
    })).isRequired,
    facilities: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      availability: PropTypes.string.isRequired,
      lastMaintenance: PropTypes.string.isRequired,
      iconColor: PropTypes.string.isRequired
    })).isRequired
  })
};

export default PropertyDetails;