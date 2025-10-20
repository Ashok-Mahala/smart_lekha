import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  Bell,
  User,
  Shield,
  Users,
  Key,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HelpChat from "@/components/help/HelpChat";
import PropTypes from 'prop-types';
import { authService } from '@/services/authService';

export const PropertySelector = ({ selectedProperty, onPropertyChange, onMobileMenuToggle }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [adminUser, setAdminUser] = useState({
    id: "",
    name: "Admin User",
    email: "admin@example.com",
    role: "",
    avatar: "",
    lastLogin: ""
  });

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Remove the reload useEffect completely and handle it in the change handler

  const handlePropertyChange = (newPropertyId) => {
    // Only proceed if the property actually changed
    if (newPropertyId !== selectedProperty) {
      console.log('Property changing from', selectedProperty, 'to', newPropertyId);
      
      // Update the property in parent component and localStorage
      onPropertyChange(newPropertyId);
      localStorage.setItem('selectedProperty', newPropertyId);
      
      // Reload the page after a short delay to ensure state is saved
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  useEffect(() => {
    const loadProperties = () => {
      try {
        setLoading(true);
        const storedData = localStorage.getItem('properties');

        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const formattedProperties = parsedData.map(property => ({
            id: property._id || property.id,
            name: property.name,
            logo: Building2,
          }));

          setProperties(formattedProperties);

          const storedSelected = localStorage.getItem('selectedProperty');

          if (initialLoad) {
            if (storedSelected && storedSelected !== 'default') {
              onPropertyChange(storedSelected);
            } else if (formattedProperties.length > 0) {
              const firstPropertyId = formattedProperties[0].id;
              onPropertyChange(firstPropertyId);
              localStorage.setItem('selectedProperty', firstPropertyId);
            }
            setInitialLoad(false);
          }
        }
      } catch (error) {
        console.error("Error loading properties:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [onPropertyChange, initialLoad]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const selectedPropertyData = properties.find(p => p.id === selectedProperty) || 
                              (properties.length > 0 ? properties[0] : null);

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleProfileClick = useCallback(() => {
    navigate("/admin/profile");
  }, [navigate]);

  const handleSecuritySettings = useCallback(() => {
    navigate("/admin/security");
  }, [navigate]);

  const handleAccessControl = useCallback(() => {
    navigate("/admin/access-control");
  }, [navigate]);

  const handleTeamManagement = useCallback(() => {
    navigate("/admin/team");
  }, [navigate]);
  
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between w-full px-4 py-3 bg-white border-b">
      {/* Left Section - Property Selector & Mobile Menu */}
      <div className="flex items-center gap-2">
        {/* Mobile menu button - hidden on larger screens */}
        {/* <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 lg:hidden"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-4 w-4" />
        </Button> */}
        
        <Select value={selectedProperty} onValueChange={handlePropertyChange}>
          <SelectTrigger className="w-[160px] sm:w-[180px] lg:w-[220px] border-none shadow-none text-sm sm:text-lg font-semibold px-2 hover:bg-gray-50">
            <SelectValue>
              {selectedPropertyData?.name || "Select Property"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="w-[160px] sm:w-[180px] lg:w-[220px]">
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <property.logo className="h-4 w-4" />
                  <span className="truncate">{property.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right Section - Controls */}
      <div className="flex items-center gap-1 lg:gap-2">
        {/* Help Chat - Hidden on mobile, visible on tablet and up */}
        <div className="hidden md:block">
          <HelpChat />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 lg:w-80" align="end">
            <DropdownMenuLabel className="flex items-center justify-between py-2">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs"
                  onClick={handleMarkAllAsRead}
                >
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="p-2 cursor-pointer"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{notification.description}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-gray-500">No notifications</p>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu - Different versions for mobile and desktop */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* Mobile: Icon only, Desktop: Icon + Name */}
            <Button variant="ghost" className="h-9 px-2 gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={adminUser.avatar} alt={adminUser.name} />
                <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                  {adminUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              {/* Hide user name on mobile, show on tablet and up */}
              <span className="hidden sm:inline text-sm font-medium">
                {adminUser.name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 lg:w-56" align="end">
            <DropdownMenuLabel className="py-2">
              <div className="flex flex-col">
                <p className="text-sm font-medium">{adminUser.name}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {adminUser.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleProfileClick} className="text-sm py-2">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSecuritySettings} className="text-sm py-2">
                <Shield className="mr-2 h-4 w-4" />
                <span>Security</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTeamManagement} className="text-sm py-2">
                <Users className="mr-2 h-4 w-4" />
                <span>Team</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAccessControl} className="text-sm py-2">
                <Key className="mr-2 h-4 w-4" />
                <span>Access Control</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={isLoading}
              className="text-sm py-2 text-red-600 focus:text-red-600"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Logging out...
                </span>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

PropertySelector.propTypes = {
  selectedProperty: PropTypes.string.isRequired,
  onPropertyChange: PropTypes.func.isRequired,
  onMobileMenuToggle: PropTypes.func
};

PropertySelector.defaultProps = {
  onMobileMenuToggle: () => {}
};

export default PropertySelector;