import React, { createContext, useContext } from 'react';
import * as api from '../api';
import PropTypes from 'prop-types';

// Create a context for API services
const ApiContext = createContext();

// Provider component
export const ApiProvider = ({ children }) => {
  // You can add authentication, error handling, or other API-related logic here
  
  const value = {
    students: api,
    seats: api,
    shifts: api,
    payments: api,
    notifications: api,
    reports: api,
  };
  
  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};

ApiProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Hook for using the API context
export const useApi = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

// Export individual API hooks for better developer experience
export const useStudentsApi = () => useApi().students;
export const useSeatsApi = () => useApi().seats;
export const useShiftsApi = () => useApi().shifts;
export const usePaymentsApi = () => useApi().payments;
export const useNotificationsApi = () => useApi().notifications;
export const useReportsApi = () => useApi().reports;
