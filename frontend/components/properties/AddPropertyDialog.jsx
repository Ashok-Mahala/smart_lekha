import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Phone, Mail, User, Building2, Clock, Globe, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import PropTypes from 'prop-types';

const AddPropertyDialog = ({ open, onOpenChange, onAddProperty }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [propertyDetails, setPropertyDetails] = useState({
    name: '',
    type: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    openingHours: '',
    totalSeats: 0,
    facilities: [],
    rules: [],
    manager: {
      name: '',
      role: '',
      email: '',
      phone: '',
      avatar: ''
    },
    images: []
  });

  const handleAddProperty = () => {
    //toast.error("Please fill name, type and address fields");
    if (!propertyDetails.name || !propertyDetails.type || !propertyDetails.address) {
      toast.error("Please fill name, type and address fields");
      return;
    }

    const location = {
      lat: parseFloat(propertyDetails.latitude) || 0,
      lng: parseFloat(propertyDetails.longitude) || 0
    };

    onAddProperty({
      ...propertyDetails,
      location
    });
    onOpenChange(false);
    toast.success("Property added successfully");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Add New Property
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  value={propertyDetails.name}
                  onChange={(e) => setPropertyDetails(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter property name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Property Type *</Label>
                <Select
                  value={propertyDetails.type}
                  onValueChange={(value) => setPropertyDetails(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="library">Library</SelectItem>
                    <SelectItem value="study-center">Study Center</SelectItem>
                    <SelectItem value="co-working">Co-working Space</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={propertyDetails.description}
                onChange={(e) => setPropertyDetails(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter property description"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={propertyDetails.phone}
                  onChange={(e) => setPropertyDetails(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={propertyDetails.email}
                  onChange={(e) => setPropertyDetails(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={propertyDetails.website}
                onChange={(e) => setPropertyDetails(prev => ({ ...prev, website: e.target.value }))}
                placeholder="Enter website URL"
              />
            </div>
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={propertyDetails.address}
                onChange={(e) => setPropertyDetails(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter property address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  value={propertyDetails.latitude}
                  onChange={(e) => setPropertyDetails(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="Enter latitude (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  value={propertyDetails.longitude}
                  onChange={(e) => setPropertyDetails(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="Enter longitude (optional)"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manager" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="managerName">Manager Name</Label>
                <Input
                  id="managerName"
                  value={propertyDetails.manager.name}
                  onChange={(e) => setPropertyDetails(prev => ({
                    ...prev,
                    manager: { ...prev.manager, name: e.target.value }
                  }))}
                  placeholder="Enter manager name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerRole">Role</Label>
                <Input
                  id="managerRole"
                  value={propertyDetails.manager.role}
                  onChange={(e) => setPropertyDetails(prev => ({
                    ...prev,
                    manager: { ...prev.manager, role: e.target.value }
                  }))}
                  placeholder="Enter manager role"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="managerEmail">Email</Label>
                <Input
                  id="managerEmail"
                  type="email"
                  value={propertyDetails.manager.email}
                  onChange={(e) => setPropertyDetails(prev => ({
                    ...prev,
                    manager: { ...prev.manager, email: e.target.value }
                  }))}
                  placeholder="Enter manager email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerPhone">Phone</Label>
                <Input
                  id="managerPhone"
                  value={propertyDetails.manager.phone}
                  onChange={(e) => setPropertyDetails(prev => ({
                    ...prev,
                    manager: { ...prev.manager, phone: e.target.value }
                  }))}
                  placeholder="Enter manager phone"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerAvatar">Avatar URL</Label>
              <Input
                id="managerAvatar"
                value={propertyDetails.manager.avatar}
                onChange={(e) => setPropertyDetails(prev => ({
                  ...prev,
                  manager: { ...prev.manager, avatar: e.target.value }
                }))}
                placeholder="Enter avatar image URL"
              />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openingHours">Opening Hours</Label>
              <Input
                id="openingHours"
                value={propertyDetails.openingHours}
                onChange={(e) => setPropertyDetails(prev => ({ ...prev, openingHours: e.target.value }))}
                placeholder="Enter opening hours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalSeats">Total Seats</Label>
              <Input
                id="totalSeats"
                type="number"
                value={propertyDetails.totalSeats}
                onChange={(e) => setPropertyDetails(prev => ({ ...prev, totalSeats: parseInt(e.target.value) }))}
                placeholder="Enter total number of seats"
              />
            </div>

            <div className="space-y-2">
              <Label>Facilities</Label>
              <div className="flex flex-wrap gap-2">
                {['Wi-Fi', 'Air Conditioning', 'Power Outlets', 'Printing Services', 'Study Rooms', 'Cafeteria', 'Parking'].map((facility) => (
                  <Button
                    key={facility}
                    variant={propertyDetails.facilities.includes(facility) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setPropertyDetails(prev => ({
                        ...prev,
                        facilities: prev.facilities.includes(facility)
                          ? prev.facilities.filter(f => f !== facility)
                          : [...prev.facilities, facility]
                      }));
                    }}
                  >
                    {facility}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rules</Label>
              <div className="flex flex-wrap gap-2">
                {['No food or drinks', 'Maintain silence', 'Keep belongings with you', 'No smoking', 'Follow COVID-19 guidelines'].map((rule) => (
                  <Button
                    key={rule}
                    variant={propertyDetails.rules.includes(rule) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setPropertyDetails(prev => ({
                        ...prev,
                        rules: prev.rules.includes(rule)
                          ? prev.rules.filter(r => r !== rule)
                          : [...prev.rules, rule]
                      }));
                    }}
                  >
                    {rule}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddProperty}>
            Add Property
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

AddPropertyDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onAddProperty: PropTypes.func.isRequired
};

export default AddPropertyDialog; 