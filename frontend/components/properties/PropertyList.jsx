import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import {
  getProperties,
  deleteProperty,
  updatePropertySettings
} from '../../api/properties';
import { Table, Button, Input, Spinner, Badge, Modal, Card } from '../ui';
import { toast } from 'sonner';

const PropertyList = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    type: ''
  });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({});

  const {
    data: properties,
    loading,
    error,
    execute: fetchProperties
  } = useApi(getProperties);

  const handleDelete = async () => {
    if (!selectedProperty) return;

    try {
      await deleteProperty(selectedProperty._id);
      toast.success('Property deleted successfully');
      setShowDeleteModal(false);
      setSelectedProperty(null);
      fetchProperties(filters);
    } catch (error) {
      toast.error(error.error?.message || 'Failed to delete property');
    }
  };

  const handleSettingsUpdate = async () => {
    if (!selectedProperty) return;

    try {
      await updatePropertySettings(selectedProperty._id, settings);
      toast.success('Property settings updated successfully');
      setShowSettingsModal(false);
      setSelectedProperty(null);
      setSettings({});
      fetchProperties(filters);
    } catch (error) {
      toast.error(error.error?.message || 'Failed to update property settings');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Error: {error.message}</p>
        <Button onClick={() => fetchProperties(filters)} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Properties</h2>
        <div className="flex gap-4">
          <Input
            type="search"
            placeholder="Search properties..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-64"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="border rounded-md px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="library">Library</option>
            <option value="study-center">Study Center</option>
            <option value="coworking">Coworking Space</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties?.data?.map((property) => (
          <Card key={property._id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{property.name}</h3>
                <p className="text-sm text-gray-500">{property.address}</p>
              </div>
              <Badge
                variant={
                  property.status === 'active'
                    ? 'success'
                    : property.status === 'maintenance'
                    ? 'warning'
                    : 'destructive'
                }
              >
                {property.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Type:</span> {property.type}</p>
              <p><span className="font-medium">Total Seats:</span> {property.totalSeats}</p>
              <p><span className="font-medium">Available Seats:</span> {property.availableSeats}</p>
              <p><span className="font-medium">Occupancy Rate:</span> {property.occupancyRate}%</p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProperty(property);
                  setSettings(property.settings || {});
                  setShowSettingsModal(true);
                }}
              >
                Settings
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedProperty(property);
                  setShowDeleteModal(true);
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProperty(null);
        }}
        title="Delete Property"
      >
        <div className="p-4">
          <p>Are you sure you want to delete {selectedProperty?.name}?</p>
          <p className="text-sm text-gray-500 mt-2">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedProperty(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showSettingsModal}
        onClose={() => {
          setShowSettingsModal(false);
          setSelectedProperty(null);
          setSettings({});
        }}
        title="Property Settings"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Operating Hours</label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="time"
                value={settings.openingTime || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, openingTime: e.target.value }))}
              />
              <Input
                type="time"
                value={settings.closingTime || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, closingTime: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Booking Settings</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.allowAdvanceBooking || false}
                  onChange={(e) => setSettings(prev => ({ ...prev, allowAdvanceBooking: e.target.checked }))}
                />
                <span className="text-sm">Allow advance booking</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.requireApproval || false}
                  onChange={(e) => setSettings(prev => ({ ...prev, requireApproval: e.target.checked }))}
                />
                <span className="text-sm">Require approval for bookings</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowSettingsModal(false);
                setSelectedProperty(null);
                setSettings({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSettingsUpdate}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PropertyList; 