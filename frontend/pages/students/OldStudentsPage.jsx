import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, ArrowLeft, Users, AlertCircle, UserCheck, Phone, Calendar, Building2, GraduationCap, Loader2, UserX, Clock, CalendarDays } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const OldStudentsPage = ({ students = [] }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [oldStudents, setOldStudents] = useState([]);
  const [statusTypes, setStatusTypes] = useState([]);
  const [statusBadgeVariants, setStatusBadgeVariants] = useState({});

  const filteredStudents = useMemo(() => {
    return oldStudents.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || student.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [oldStudents, searchTerm, statusFilter]);

  // Calculate statistics
  const totalOldStudents = oldStudents.length;
  const selectedStudents = oldStudents.filter(student => {
    const currentDate = new Date();
    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const evictionDate = new Date(student.graduationDate);
    return evictionDate >= oneWeekAgo && evictionDate <= currentDate;
  }).length;
  const inactiveStudents = oldStudents.filter(student => {
    const currentDate = new Date();
    const oneMonthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    const evictionDate = new Date(student.lastActiveDate);
    return evictionDate >= oneMonthAgo && evictionDate <= currentDate;
  }).length;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch old students
        const studentsResponse = await fetch('/api/students/old');
        if (!studentsResponse.ok || !studentsResponse.headers.get('content-type')?.includes('application/json')) {
          throw new Error('API endpoint not available');
        }
        const studentsData = await studentsResponse.json();
        setOldStudents(studentsData);

        // Fetch status types and badge variants
        const statusResponse = await fetch('/api/status-types');
        if (statusResponse.ok && statusResponse.headers.get('content-type')?.includes('application/json')) {
          const statusData = await statusResponse.json();
          setStatusTypes([
            { value: 'all', label: 'All Status' },
            ...statusData.types.map(status => ({
              value: status,
              label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
            }))
          ]);
          setStatusBadgeVariants(statusData.badgeVariants);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/students/old/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'old_students_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Old student data has been exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewStudent = (studentId) => {
    navigate(`/students/profile/${studentId}`);
  };

  const handleRowClick = (studentId) => {
    handleViewStudent(studentId);
  };

  const handleBackToActive = async (studentId) => {
    try {
      const response = await fetch(`/api/students/${studentId}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to reactivate student');
      }
      
      toast({
        title: "Success",
        description: "Student has been moved back to active status",
      });
      
      // Refresh the student list
      const fetchResponse = await fetch('/api/students/old');
      if (fetchResponse.ok && fetchResponse.headers.get('content-type')?.includes('application/json')) {
        const data = await fetchResponse.json();
        setOldStudents(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move student back to active status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const variant = statusBadgeVariants[status] || "default";
    return (
      <Badge variant={variant}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ["ID", "Name", "Email", "Registration Date", "Status", "Notes"];
    const rows = filteredStudents.map(student => [
      student.id,
      student.name,
      student.email,
      student.registrationDate,
      student.status,
      student.notes || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "old_students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="default"
            onClick={() => navigate('/students')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Old Students</h1>
            <p className="text-muted-foreground">
              View and manage records of graduated and inactive students
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="cursor-pointer" onClick={() => setStatusFilter("all")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Old Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOldStudents}</div>
                <p className="text-xs text-muted-foreground">
                  All old student records
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="cursor-pointer" onClick={() => setStatusFilter("selected")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Week Eviction</CardTitle>
                <CalendarDays className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{selectedStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Students evicted in the last week
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card className="cursor-pointer" onClick={() => setStatusFilter("inactive")}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Month Eviction</CardTitle>
                <UserX className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{inactiveStudents}</div>
                <p className="text-xs text-muted-foreground">
                  Students evicted in the last month
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top Bar - Search and Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search old students by name, ID, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusTypes.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Student Table */}
        <Card>
          <CardHeader>
            <CardTitle>Old Students</CardTitle>
            <CardDescription>
              {filteredStudents.length} old students found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px] border-r border-dashed">Photo</TableHead>
                      <TableHead className="w-[120px] border-r border-dashed">Student ID</TableHead>
                      <TableHead className="w-[200px] border-r border-dashed">Name</TableHead>
                      <TableHead className="w-[120px] border-r border-dashed">Status</TableHead>
                      <TableHead className="w-[120px] border-r border-dashed">Admission Date</TableHead>
                      <TableHead className="w-[120px] border-r border-dashed">Eviction Date</TableHead>
                      <TableHead className="w-[120px] border-r border-dashed">Last Active</TableHead>
                      <TableHead className="w-[150px] bg-muted/50">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow 
                        key={student.id} 
                        className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
                        onClick={() => handleRowClick(student.id)}
                      >
                        <TableCell className="py-3 border-r border-dashed">
                          <div className="flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-primary/50 transition-colors">
                              <img
                                src={student.photo || "/placeholder.svg"}
                                alt={student.name}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 border-r border-dashed">
                          <span className="font-medium text-primary">{student.id}</span>
                        </TableCell>
                        <TableCell className="py-3 border-r border-dashed">
                          <div>
                            <p className="font-medium hover:text-primary cursor-pointer" onClick={(e) => {
                              e.stopPropagation();
                              handleViewStudent(student.id);
                            }}>{student.name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 border-r border-dashed">
                          {getStatusBadge(student.status)}
                        </TableCell>
                        <TableCell className="py-3 border-r border-dashed">{student.admissionDate}</TableCell>
                        <TableCell className="py-3 border-r border-dashed">
                          {student.status === 'selected' ? student.graduationDate : 
                           student.status === 'inactive' ? student.lastActiveDate : 
                           'N/A'}
                        </TableCell>
                        <TableCell className="py-3 border-r border-dashed">{student.lastActive}</TableCell>
                        <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleBackToActive(student.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              Back to Active
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

OldStudentsPage.propTypes = {
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      registrationDate: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      notes: PropTypes.string
    })
  )
};

export default OldStudentsPage; 