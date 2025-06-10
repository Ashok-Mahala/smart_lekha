import React, { useState, useEffect } from 'react';
import { useEntityManager } from '../../hooks/useEntityManager';
import {
  getShifts,
  deleteShift,
  updateShiftStatus
} from '.././api/shifts';
import { Table, Button, Input, Spinner, Badge, Modal, Card } from '../ui';
import { toast } from 'sonner';

const ShiftList = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date: ''
  });
  const [selectedShift, setSelectedShift] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const {
    data: shifts,
    loading,
    error,
    fetchData,
    deleteEntity,
    updateStatus
  } = useEntityManager('shift', {
    get: getShifts,
    create: null, // Not implemented in this view
    update: null, // Not implemented in this view
    delete: deleteShift
  });

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  const handleDelete = async () => {
    if (!selectedShift) return;

    try {
      await deleteEntity(selectedShift._id);
      setShowDeleteModal(false);
      setSelectedShift(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedShift || !newStatus) return;

    try {
      await updateStatus(selectedShift._id, newStatus);
      setShowStatusModal(false);
      setSelectedShift(null);
      setNewStatus('');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (loading && !shifts?.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !shifts?.length) {
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
        <h2 className="text-2xl font-bold">Shifts</h2>
        <div className="flex gap-4">
          <Input
            type="search"
            placeholder="Search shifts..."
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
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts?.data?.map((shift) => (
          <Card key={shift._id} className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{shift.staff?.name || 'Unassigned'}</h3>
                <p className="text-sm text-gray-500">{shift.zone?.name || 'No Zone'}</p>
              </div>
              <Badge
                variant={
                  shift.status === 'completed'
                    ? 'success'
                    : shift.status === 'in-progress'
                    ? 'warning'
                    : shift.status === 'cancelled'
                    ? 'destructive'
                    : 'default'
                }
              >
                {shift.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Date:</span> {new Date(shift.date).toLocaleDateString()}</p>
              <p><span className="font-medium">Start Time:</span> {shift.startTime}</p>
              <p><span className="font-medium">End Time:</span> {shift.endTime}</p>
              <p><span className="font-medium">Duration:</span> {shift.duration} hours</p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedShift(shift);
                  setNewStatus(shift.status);
                  setShowStatusModal(true);
                }}
              >
                Update Status
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setSelectedShift(shift);
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
          setSelectedShift(null);
        }}
        title="Delete Shift"
      >
        <div className="p-4">
          <p>Are you sure you want to delete this shift?</p>
          <p className="text-sm text-gray-500 mt-2">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedShift(null);
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
          setSelectedShift(null);
          setNewStatus('');
        }}
        title="Update Shift Status"
      >
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            >
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowStatusModal(false);
                setSelectedShift(null);
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

export default ShiftList; 