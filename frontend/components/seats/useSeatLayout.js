import { useEffect, useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";

// Constants
const statuses = ["available", "occupied", "reserved"];

const useSeatLayout = () => {
  const [layout, setLayout] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLayout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/smlekha/seats/layout');
      
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('API endpoint not available');
      }
      
      const data = await response.json();
      setLayout(data);
    } catch (error) {
      console.error('Error fetching seat layout:', error);
      setError('Failed to load seat layout');
    } finally {
      setIsLoading(false);
    }
  };

  const updateLayout = async (layoutData) => {
    try {
      const response = await fetch('/smlekha/seats/layout', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(layoutData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update seat layout');
      }
      
      const updatedLayout = await response.json();
      setLayout(updatedLayout);
      
      return updatedLayout;
    } catch (error) {
      console.error('Error updating seat layout:', error);
      throw error;
    }
  };

  const addSeat = async (seatData) => {
    try {
      const response = await fetch('/smlekha/seats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seatData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add seat');
      }
      
      const newSeat = await response.json();
      setLayout(prevLayout => ({
        ...prevLayout,
        seats: [...prevLayout.seats, newSeat],
      }));
      
      return newSeat;
    } catch (error) {
      console.error('Error adding seat:', error);
      throw error;
        }
  };

  const updateSeat = async (seatId, seatData) => {
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
      setLayout(prevLayout => ({
        ...prevLayout,
        seats: prevLayout.seats.map(seat => 
          seat.id === seatId ? updatedSeat : seat
        ),
      }));
      
      return updatedSeat;
    } catch (error) {
      console.error('Error updating seat:', error);
      throw error;
    }
  };

  const deleteSeat = async (seatId) => {
    try {
      const response = await fetch(`/smlekha/seats/${seatId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete seat');
      }

      setLayout(prevLayout => ({
        ...prevLayout,
        seats: prevLayout.seats.filter(seat => seat.id !== seatId),
      }));
    } catch (error) {
      console.error('Error deleting seat:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchLayout();
  }, []);

    return {
    layout,
    isLoading,
    error,
    fetchLayout,
    updateLayout,
    addSeat,
    updateSeat,
    deleteSeat,
    };
  };

export default useSeatLayout;
