import React, { useState, useRef, useEffect } from "react";
import Sidebar from "./Sidebar";
import { PropertySelector } from "./PropertySelector";
import { properties } from "@/data/properties";
import PropTypes from 'prop-types';

const DashboardLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState("default");
  const [isLoading, setIsLoading] = useState(true);
  const sidebarRef = useRef(null);
  const mainContentRef = useRef(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
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
      // Only close sidebar on mobile when clicking outside
      if (window.innerWidth < 768) {
        if (sidebarRef.current && 
            !sidebarRef.current.contains(event.target) && 
            !isCollapsed) {
          setIsCollapsed(true);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed]);

  return (
    <div className="flex min-h-screen h-screen bg-background overflow-hidden">
      <div ref={sidebarRef}>
        <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      </div>
      <div ref={mainContentRef} className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4 px-4 py-3">
            {/* Mobile menu button - always visible on mobile */}
            <button
              onClick={toggleSidebar}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <PropertySelector 
              selectedProperty={selectedProperty} 
              onPropertyChange={handlePropertyChange} 
              isLoading={isLoading}
            />
          </div>
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