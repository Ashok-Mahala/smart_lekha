// Seats API Service
import { toast } from "sonner";

// Transform seats to format expected by SeatRow component
export const formatSeatsForRow = (seats, rowNumber) => {
  // Filter seats for current row (1-14)
  const rowSeats = seats.filter(seat => {
    const seatNum = parseInt(seat.number.replace(/[^\d]/g, ''));
    return Math.floor(seatNum / 100) === rowNumber;
  });
  
  // Left side has 3 columns (seats 1-3)
  const leftRowSeats = rowSeats.slice(0, 3);
  
  // Right side has 4 columns (seats 6-9) with 2-seat gap (seats 4-5)
  const rightRowSeats = rowSeats.slice(5, 9);
  
  return {
    leftRowSeats,
    rightRowSeats,
    rowNumber
  };
};

// Get all seats
export const getAllSeats = async () => {
  try {
    const response = await fetch('/smlekha/seats');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching seats:", error);
    toast.error("Failed to fetch seats");
    return [];
  }
};

// Get seat by ID
export const getSeatById = async (id) => {
  try {
    const response = await fetch(`/smlekha/seats/${id}`);
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching seat details:", error);
    toast.error("Failed to fetch seat details");
    return null;
  }
};

// Get seats by floor
export const getSeatsByFloor = async (floor) => {
  try {
    const response = await fetch(`/smlekha/seats/floor/${floor}`);
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching seats by floor:", error);
    toast.error("Failed to fetch seats for this floor");
    return [];
  }
};

// Get available seats
export const getAvailableSeats = async () => {
  try {
    const response = await fetch('/smlekha/seats/available');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching available seats:", error);
    toast.error("Failed to fetch available seats");
    return [];
  }
};

// Reserve seat
export const reserveSeat = async (seatId, studentId, startTime, endTime) => {
  try {
    const response = await fetch(`/smlekha/seats/${seatId}/reserve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId,
        startTime,
        endTime
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to reserve seat');
    }
    
    const result = await response.json();
    toast.success("Seat reserved successfully");
    return result.success;
  } catch (error) {
    console.error("Error reserving seat:", error);
    toast.error("Failed to reserve seat");
    return false;
  }
};

// Release seat
export const releaseSeat = async (seatId) => {
  try {
    const response = await fetch(`/smlekha/seats/${seatId}/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to release seat');
    }
    
    const result = await response.json();
    toast.success("Seat released successfully");
    return result.success;
  } catch (error) {
    console.error("Error releasing seat:", error);
    toast.error("Failed to release seat");
    return false;
  }
};

// Mark seat as maintenance
export const markSeatMaintenance = async (seatId, isInMaintenance) => {
  try {
    const response = await fetch(`/smlekha/seats/${seatId}/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        isInMaintenance
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update seat maintenance status');
    }
    
    const result = await response.json();
    toast.success(isInMaintenance ? "Seat marked for maintenance" : "Seat maintenance completed");
    return result.success;
  } catch (error) {
    console.error("Error updating seat maintenance:", error);
    toast.error("Failed to update seat maintenance status");
    return false;
  }
};