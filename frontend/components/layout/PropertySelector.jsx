import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building2, 
  LifeBuoy, 
  User, 
  LogOut, 
  MessageCircle, 
  Settings, 
  Key, 
  Shield, 
  Users, 
  Clock,
  Bell,
  Info,
  Check,
  Filter,
  AlertCircle,
  Calendar,
  BookOpen,
  X,
  CreditCard
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

export const PropertySelector = ({ selectedProperty, onPropertyChange }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [adminUser, setAdminUser] = useState({
    id: "",
    name: "",
    email: "",
    role: "",
    avatar: "",
    lastLogin: ""
  });

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Load properties from localStorage on component mount
  useEffect(() => {
    const loadProperties = () => {
      try {
        setLoading(true);
        const storedData = localStorage.getItem('properties');
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const formattedProperties = parsedData.map(property => ({
            id: property._id,
            name: property.name,
            logo: Building2,
            // ... other property mappings ...
          }));
          
          setProperties(formattedProperties);

          // Check for existing selection in localStorage
          const storedSelected = localStorage.getItem('selected_property');
          
          if (initialLoad) {
            if (storedSelected && storedSelected !== 'default') {
              onPropertyChange(storedSelected);
            } else if (formattedProperties.length > 0) {
              const firstPropertyId = formattedProperties[0].id;
              onPropertyChange(firstPropertyId);
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
  }, [onPropertyChange, initialLoad]); // Add initialLoad to dependencies

  // Update localStorage whenever selectedProperty changes
  useEffect(() => {
    if (selectedProperty && !initialLoad) {
      localStorage.setItem('selected_property', selectedProperty);
    }
  }, [selectedProperty, initialLoad]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  // Ensure we have a selected property when properties load
  const selectedPropertyData = properties.find(p => p.id === selectedProperty) || 
                              (properties.length > 0 ? properties[0] : null);
  const PropertyLogo = selectedPropertyData?.logo || Building2;

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' ? true : !n.isRead
  );

  // Handler functions
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
    await authService.signOut();
    navigate('/login'); // or router.push('/login');
  } catch (err) {
    console.error('Logout failed:', err);
    navigate('/login'); // still redirect to login even if logout request fails
  }
};

  return (
    <div className="flex items-center justify-between w-full px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      {/* Left Section - Property Selector */}
      <div className="flex items-center gap-4">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedPropertyData?.logoColor} bg-opacity-10 shadow-sm`}>
          <PropertyLogo className="h-6 w-6" />
        </div>
        <div>
          <Select value={selectedProperty} onValueChange={onPropertyChange}>
            <SelectTrigger className="h-auto p-0 border-none bg-transparent text-2xl font-bold hover:bg-transparent focus:ring-0">
              <SelectValue>
                {selectedPropertyData?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  <div className="flex items-center gap-2">
                    <property.logo className={`h-4 w-4 ${property.logoColor}`} />
                    <span>{property.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-1">Dashboard Overview</p>
        </div>
      </div>

      {/* Right Section - Controls */}
      <div className="flex items-center gap-6">
        {/* Help Chat */}
        <HelpChat />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative group p-2">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-purple-100 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                  <Bell className="h-5 w-5 text-purple-600 group-hover:text-purple-700 transition-colors relative z-10" />
                </div>
              </div>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center justify-between">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Notifications</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    You have {unreadCount} unread messages
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-xs"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex items-start gap-3 p-3"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-${notification.color}-100`}>
                      {notification.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                    </div>
                    {!notification.isRead && (
                      <div className={`h-2 w-2 rounded-full bg-${notification.color}-500`} />
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">No notifications available</p>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button 
                variant="secondary" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/notifications')}
              >
                View all notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative group p-0">
              <Avatar className="h-9 w-9 relative">
                <AvatarImage src={adminUser.avatar} alt={adminUser.name} />
                <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
                  {adminUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-30 transition-all duration-300 group-hover:duration-200"></div>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{adminUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {adminUser.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSecuritySettings}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Security</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTeamManagement}>
                <Users className="mr-2 h-4 w-4" />
                <span>Team</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAccessControl}>
                <Key className="mr-2 h-4 w-4" />
                <span>Access Control</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              disabled={isLoading}
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
  onPropertyChange: PropTypes.func.isRequired
};

export default PropertySelector; 