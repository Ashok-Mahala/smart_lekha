import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import PropTypes from 'prop-types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, Calendar, Clock, Users, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const attendanceRecordPropTypes = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  studentId: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired
  }).isRequired,
  date: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['present', 'absent', 'late']).isRequired,
  checkInTime: PropTypes.string,
  checkOutTime: PropTypes.string,
  activities: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.oneOf(['check-in', 'check-out']).isRequired,
    timestamp: PropTypes.string.isRequired,
    location: PropTypes.string
  })),
  notes: PropTypes.string
});

const AttendancePage = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [date, setDate] = useState(new Date());
  const [status, setStatus] = useState('present');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [shift, setShift] = useState("morning");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAttendanceRecords();
  }, [selectedStudent]);

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/smlekha/attendance/student/${selectedStudent}`);
      if (!response.ok) throw new Error('Failed to fetch attendance records');
      const data = await response.json();
      setAttendanceRecords(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordAttendance = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/smlekha/attendance/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          date,
          status,
          notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to record attendance');

      toast({
        title: 'Success',
        description: 'Attendance recorded successfully',
      });

      fetchAttendanceRecords();
      setNotes('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record attendance',
        variant: 'destructive',
      });
    }
  };

  const handleRecordActivity = async (type) => {
    try {
      const response = await fetch('/smlekha/attendance/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          type,
          location: 'Main Entrance',
        }),
      });

      if (!response.ok) throw new Error('Failed to record activity');

      toast({
        title: 'Success',
        description: `${type === 'check-in' ? 'Check-in' : 'Check-out'} recorded successfully`,
      });

      fetchAttendanceRecords();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to record activity',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceRecords(prev => prev.map(student => 
      student._id === studentId ? { ...student, status: newStatus } : student
    ));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Attendance has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Attendance</h1>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceRecords.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {attendanceRecords.filter(s => s.status === "present").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {attendanceRecords.filter(s => s.status === "absent").length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Attendance Records</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage student attendance for {format(date, "PPP")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Select value={shift} onValueChange={setShift}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="morning">Morning Shift</SelectItem>
                    <SelectItem value="afternoon">Afternoon Shift</SelectItem>
                    <SelectItem value="evening">Evening Shift</SelectItem>
                    </SelectContent>
                  </Select>

                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Attendance"
                  )}
                </Button>
              </div>
                </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                  />
                </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>{student.studentId._id}</TableCell>
                        <TableCell>{student.studentId.name}</TableCell>
                        <TableCell>
                          <Select
                            value={student.status}
                            onValueChange={(value) => handleStatusChange(student._id, value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">Present</SelectItem>
                              <SelectItem value="absent">Absent</SelectItem>
                              <SelectItem value="late">Late</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {student.checkInTime
                            ? format(new Date(student.checkInTime), 'hh:mm a')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {student.checkOutTime
                            ? format(new Date(student.checkOutTime), 'hh:mm a')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={student.notes || ''}
                            onChange={(e) => {
                              setAttendanceRecords(prev => prev.map(s => 
                                s._id === student._id ? { ...s, notes: e.target.value } : s
                              ));
                            }}
                            placeholder="Add notes..."
                            className="w-[200px]"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </div>
          </CardContent>
          </Card>
    </div>
    </DashboardLayout>
  );
};

AttendancePage.propTypes = {};

export default AttendancePage; 