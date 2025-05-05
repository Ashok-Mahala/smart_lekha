import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import {
  getStaff,
  updateStaffRole,
  deleteStaff
} from '../../api/staff';
import { Table, Button, Input, Spinner, Badge, Modal } from '../ui';
import { toast } from 'sonner';

const StaffList = () => {
  const [filters, setFilters] = useState({
    role: '',
    search: '',
    status: ''
  });
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const {
    data: staff,
    loading,
    error,
    execute: fetchStaff
  } = useApi(getStaff);

  const handleRoleChange = async (staffId, newRole) => {
    try {
      await updateStaffRole(staffId, newRole);
      toast.success('Staff role updated successfully');
      fetchStaff(filters);
    } catch (error) {
      toast.error(error.error?.message || 'Failed to update staff role');
    }
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;

    try {
      await deleteStaff(selectedStaff._id);
      toast.success('Staff member deleted successfully');
      setShowDeleteModal(false);
      setSelectedStaff(null);
      fetchStaff(filters);
    } catch (error) {
      toast.error(error.error?.message || 'Failed to delete staff member');
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
        <Button onClick={() => fetchStaff(filters)} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Staff Members</h2>
        <div className="flex gap-4">
          <Input
            type="search"
            placeholder="Search staff..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-64"
          />
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
            className="border rounded-md px-3 py-2"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Role</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {staff?.data?.map((member) => (
            <Table.Row key={member._id}>
              <Table.Cell>{member.name}</Table.Cell>
              <Table.Cell>{member.email}</Table.Cell>
              <Table.Cell>
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member._id, e.target.value)}
                  className="border rounded-md px-2 py-1"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </Table.Cell>
              <Table.Cell>
                <Badge
                  variant={member.status === 'active' ? 'success' : 'destructive'}
                >
                  {member.status}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStaff(member);
                      setShowDeleteModal(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedStaff(null);
        }}
        title="Delete Staff Member"
      >
        <div className="p-4">
          <p>Are you sure you want to delete {selectedStaff?.name}?</p>
          <p className="text-sm text-gray-500 mt-2">
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedStaff(null);
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
    </div>
  );
};

export default StaffList; 