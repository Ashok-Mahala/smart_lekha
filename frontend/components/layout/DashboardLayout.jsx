import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import { PropertySelector } from "./PropertySelector";
import { properties } from "@/data/properties";
import PropTypes from 'prop-types';

const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState("default");
  const [isLoading, setIsLoading] = useState(true);
  const mainContentRef = useRef(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        // Replace with actual API call
        // const response = await fetch('/smlekha/properties');
        // const data = await response.json();
        // If properties are loaded and there's at least one
        if (properties.length > 0) {
          setSelectedProperty(properties[0].id);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handlePropertyChange = (value) => {
    setSelectedProperty(value);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mainContentRef.current && !mainContentRef.current.contains(event.target)) {
        setIsCollapsed(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex min-h-screen h-screen bg-background overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      <div ref={mainContentRef} className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <PropertySelector 
            selectedProperty={selectedProperty} 
            onPropertyChange={handlePropertyChange} 
            isLoading={isLoading}
          />
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired
};

export default DashboardLayout;
