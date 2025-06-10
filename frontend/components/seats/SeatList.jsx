import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getSeats, bookSeat, releaseSeat } from '../../smlekha/seats';
import { Table, Button, Input, Spinner, Badge } from '../ui';
import { toast } from 'sonner';

const SeatList = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  const {
    data: seats,
    loading,
    error,
    execute: fetchSeats
  } = useApi(getSeats);

  useEffect(() => {
    fetchSeats(filters);
  }, [fetchSeats, filters]);

  const handleBookSeat = async (seatId) => {
    try {
      await bookSeat(seatId);
      toast.success('Seat booked successfully');
      fetchSeats(filters);
    } catch (error) {
      toast.error(error.error?.message || 'Failed to book seat');
    }
  };

  const handleReleaseSeat = async (seatId) => {
    try {
      await releaseSeat(seatId);
      toast.success('Seat released successfully');
      fetchSeats(filters);
    } catch (error) {
      toast.error(error.error?.message || 'Failed to release seat');
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
        <Button onClick={() => fetchSeats(filters)} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Seats</h2>
        <div className="flex gap-4">
          <Input
            type="search"
            placeholder="Search seats..."
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
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Seat Number</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Current User</Table.HeaderCell>
            <Table.HeaderCell>Last Updated</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {seats?.data?.map((seat) => (
            <Table.Row key={seat._id}>
              <Table.Cell>{seat.seatNumber}</Table.Cell>
              <Table.Cell>
                <Badge
                  variant={
                    seat.status === 'available'
                      ? 'success'
                      : seat.status === 'occupied'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {seat.status}
                </Badge>
              </Table.Cell>
              <Table.Cell>{seat.currentUser?.name || '-'}</Table.Cell>
              <Table.Cell>
                {new Date(seat.updatedAt).toLocaleString()}
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-2">
                  {seat.status === 'available' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBookSeat(seat._id)}
                    >
                      Book
                    </Button>
                  ) : seat.status === 'occupied' ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReleaseSeat(seat._id)}
                    >
                      Release
                    </Button>
                  ) : null}
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default SeatList; 