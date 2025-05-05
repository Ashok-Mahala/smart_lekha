import React from 'react';
import QuickBookingForm from '@/components/booking/QuickBookingForm';
import { useNavigate } from 'react-router-dom';

const NewBookingPage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/bookings');
  };

  return <QuickBookingForm onClose={handleClose} />;
};

export default NewBookingPage; 