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
      title: "Bank Accounts",
      icon: Landmark,
      href: "/bank-accounts",
    },
    {
      title: "Reports",
      icon: BarChart4,
      href: "/reports",
    },
    {
      title: "Attendance",
      icon: ClipboardCheck,
      href: "/attendance",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/settings",
    },
  ];

  return (
    <aside 
      className={cn(
        "h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 z-50",
        isCollapsed ? "w-16" : "w-64",
        "md:relative fixed top-0 left-0",
        "md:translate-x-0",
        isCollapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"
      )}
    >
      <div className="px-4 py-5 flex items-center justify-between border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-sidebar-primary" />
            <span className="font-bold text-lg text-sidebar-foreground">Smart Lekha</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent md:block hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar} 
            className="text-sidebar-foreground hover:text-white hover:bg-sidebar-accent md:hidden block"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink 
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center"
                )}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    toggleSidebar();
                  }
                }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </Button>
      </div>
    </aside>
  );
};

Sidebar.propTypes = {
  isCollapsed: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired
};

export default Sidebar;
