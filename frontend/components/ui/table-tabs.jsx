import React from 'react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const TableTabs = ({ activeTab, onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (value) => {
    if (onTabChange) {
      onTabChange(value);
    }
    navigate(`/students/${value}`);
  };

  return (
    <Tabs
      defaultValue={activeTab || 'active'}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="active">Active Students</TabsTrigger>
        <TabsTrigger value="booking">Booking</TabsTrigger>
        <TabsTrigger value="old">Old Students</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

TableTabs.propTypes = {
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func
};

export default TableTabs; 