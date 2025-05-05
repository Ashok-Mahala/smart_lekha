import React, { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

const StudentTable = () => {
  const { toast } = useToast();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusTypes, setStatusTypes] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusColors, setStatusColors] = useState({});
  const [priorityBadges, setPriorityBadges] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch students
        const studentsResponse = await fetch('/api/students');
        if (!studentsResponse.ok || !studentsResponse.headers.get('content-type')?.includes('application/json')) {
          throw new Error('API endpoint not available');
        }
        const studentsData = await studentsResponse.json();
        setStudents(studentsData);

        // Fetch status types and colors
        const statusResponse = await fetch('/api/status-types');
        if (statusResponse.ok && statusResponse.headers.get('content-type')?.includes('application/json')) {
          const statusData = await statusResponse.json();
          setStatusTypes(statusData.types);
          setStatusColors(statusData.colors);
        }

        // Fetch priority badges
        const priorityResponse = await fetch('/api/priority-badges');
        if (priorityResponse.ok && priorityResponse.headers.get('content-type')?.includes('application/json')) {
          const priorityData = await priorityResponse.json();
          setPriorityBadges(priorityData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Unable to connect to the server.');
        setStudents([]);
        setStatusTypes([]);
        setStatusColors({});
        setPriorityBadges({});
        toast({
          title: "Error",
          description: "Failed to load data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update the status badge to use the fetched colors
  const getStatusBadge = (status) => {
    const color = statusColors[status] || 'bg-gray-100 text-gray-800';
    return (
      <Badge className={`${color} px-2 py-1 text-xs capitalize`}>
        {status}
      </Badge>
    );
  };

  // Update the priority badge to use the fetched data
  const renderPriorityBadge = (priority) => {
    const badge = priorityBadges[priority] || { color: 'bg-gray-100', icon: 'Star' };
    return (
      <Badge className={`${badge.color} rounded-md px-2 py-1 text-xs flex items-center gap-1`}>
        <Star className="h-3 w-3" />
        <span className="capitalize">{priority}</span>
      </Badge>
    );
  };

  return (
    <div>
      {/* Update the status filter to use the fetched data */}
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {statusTypes.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default StudentTable; 