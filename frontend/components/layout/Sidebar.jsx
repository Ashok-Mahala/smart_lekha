import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  BookOpen, 
  CreditCard, 
  BarChart4, 
  Settings, 
  LogOut,
  Menu,
  Receipt,
  TrendingUp,
  TrendingDown,
  X,
  Building2,
  ClipboardCheck,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Landmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PropTypes from 'prop-types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const location = useLocation();

  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
    },
    {
      title: "Properties",
      icon: Building2,
      href: "/properties",
    },
    {
      title: "Students",
      icon: Users,
      href: "/students",
    },
    {
      title: "Seat Management",
      icon: BookOpen,
      href: "/seats",
    },
    {
      title: "Shifts",
      icon: CalendarClock,
      href: "/shifts",
    },
    {
      title: "Payments",
      icon: CreditCard,
      href: "/payments",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  const NavItem = ({ item, isCollapsed }) => {
    const isActive = location.pathname === item.href;

    const navLinkContent = (
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors border border-transparent",
          isActive 
            ? "bg-blue-600 text-white shadow-md" 
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-gray-200",
          isCollapsed && "justify-center"
        )}
      >
        <item.icon className="w-6 h-6 flex-shrink-0" />
        {!isCollapsed && <span className="truncate font-medium">{item.title}</span>}
      </div>
    );

    // If sidebar is collapsed on desktop, show tooltip on hover
    if (isCollapsed && window.innerWidth >= 768) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink 
              to={item.href}
              className="block"
              onClick={() => {
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
            >
              {navLinkContent}
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" align="center" className="bg-gray-900 text-white">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    // If sidebar is expanded or on mobile, no tooltip needed
    return (
      <NavLink 
        to={item.href}
        className="block"
        onClick={() => {
          if (window.innerWidth < 768) {
            toggleSidebar();
          }
        }}
      >
        {navLinkContent}
      </NavLink>
    );
  };

  const isMobile = window.innerWidth < 768;

  return (
    <TooltipProvider>
      {/* Mobile Overlay */}
      {!isCollapsed && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "h-screen flex flex-col transition-all duration-300 z-50",
          // Background colors
          "bg-white shadow-xl",
          // Mobile: fixed overlay with icons only
          "fixed top-0 left-0 transform transition-transform md:relative md:transform-none",
          // Widths
          isMobile ? "w-20" : "md:w-64", // Mobile: icons only, Desktop: full width when expanded
          // Show/hide on mobile
          isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0",
          // Desktop collapsed width
          !isMobile && isCollapsed && "md:w-20"
        )}
      >
        {/* Header */}
        <div className="px-4 py-5 flex items-center justify-between border-b border-gray-200 bg-white">
          {/* Logo - Only show on desktop when expanded or mobile when open */}
          {(!isCollapsed || isMobile) ? (
            <div className="flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-blue-600" />
              {!isMobile && !isCollapsed && (
                <span className="font-bold text-lg text-gray-900">Smart Lekha</span>
              )}
            </div>
          ) : null}
          
          {/* Close button - visible when sidebar is open */}
          {(!isCollapsed || isMobile) && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar} 
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavItem 
                  item={item} 
                  isCollapsed={isMobile ? true : isCollapsed} // Force icons-only on mobile
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-white">
          <Button 
            variant="ghost" 
            className={cn(
              "w-full text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg border border-transparent hover:border-gray-200",
              (isMobile || isCollapsed) ? "justify-center px-3" : "justify-start px-3"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(isMobile || isCollapsed) ? null : <span className="ml-2 font-medium">Logout</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
};

Sidebar.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired
};

export default Sidebar;