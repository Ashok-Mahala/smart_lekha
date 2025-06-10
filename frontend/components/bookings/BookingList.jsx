import React, { useState, useEffect } from 'react';
import { useEntityManager } from '../../hooks/useEntityManager';
import {
  getBookings,
  deleteBooking,
  updateBookingStatus
} from '../../smlekha/bookings';
import { Table, Button, Input, Spinner, Badge, Modal, Card } from '../ui';
import { toast } from 'sonner';

const BookingList = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date: ''
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const {
    data: bookings,
    loading,
    error,
    fetchData,
    deleteEntity,
    updateStatus
  } = useEntityManager('booking', {
    get: getBookings,
    create: null, // Not implemented in this view
    update: null, // Not implemented in this view
    delete: deleteBooking
  });

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  const handleDelete = async () => {
    if (!selectedBooking) return;

    try {
      await deleteEntity(selectedBooking._id);
      setShowDeleteModal(false);
      setSelectedBooking(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedBooking || !newStatus) return;

    try {
      await updateStatus(selectedBooking._id, newStatus);
      setShowStatusModal(false);
      setSelectedBooking(null);
      setNewStatus('');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (loading && !bookings?.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !bookings?.length) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Error: {error.message}</p>
        <Button onClick={() => fetchData(filters)} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bookings</h2>
        <div className="flex gap-4">
          <Input
            type="search"
            placeholder="Search bookings..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-64"
          />
          <Input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
            className="w-48"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings?.data?.map((booking) => (
          <Card key={booking._id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{booking.user?.name || 'Anonymous'}</h3>
                <p className="text-sm text-gray-500">{booking.seat?.number || 'No Seat'}</p>
              </div>
              <Badge
                variant={
                  booking.status === 'confirmed'
                    ? 'success'
                    : booking.status === 'pending'
                    ? 'warning'
                    : booking.status === 'cancelled'
                    ? 'destructive'
                    : 'default'
                }
              >
                {booking.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Date:</span> {new Date(booking.date).toLocaleDateString()}</p>
              <p><span className="font-medium">Start Time:</span> {booking.startTime}</p>
              <p><span className="font-medium">End Time:</span> {booking.endTime}</p>
              <p><span className="font-medium">Duration:</span> {booking.duration} hours</p>
              <p><span className="font-medium">Zone:</span> {booking.zone?.name || 'No Zone'}</p>
              <p><span className="font-medium">Property:</span> {booking.property?.name || 'No Property'}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBooking(booking);
                  setNewStatus(booking.status);
                  setShowStatusModal(true);
                }}
              >
                Update Status
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedBooking(booking);
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
          setSelectedBooking(null);
        }}
        title="Delete Booking"
      >
        <div className="p-4">
          <p>Are you sure you want to delete this booking?</p>
          <p className="text-sm text-gray-500 mt-2">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedBooking(null);
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
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedBooking(null);
          setNewStatus('');
        }}
        title="Update Booking Status"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusModal(false);
                setSelectedBooking(null);
                setNewStatus('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
            >
              Update Status
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BookingList; 