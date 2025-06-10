import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Calendar, Clock, User, Building2, ArrowLeft, Pencil, Trash2, Edit, Bookmark, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PropTypes from "prop-types";

const StudentBookingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/smlekha/bookings');
        
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('API endpoint not available');
        }
        
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load bookings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Filter bookings based on search term and status
  const filteredBookings = React.useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = 
        booking.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.seatNo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || booking.bookingType === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, bookings]);

  const getStatusBadge = (status) => {
    const variants = {
      active: "default",
      pending: "secondary",
      cancelled: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const variants = {
      paid: "default",
      pending: "secondary",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handleEdit = (id) => {
    navigate(`/students/booking/edit/${id}`);
  };

  const handleCreateBooking = async (bookingData) => {
    try {
      const response = await fetch('/smlekha/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create booking');
      }
      
      const newBooking = await response.json();
      setBookings(prevBookings => [...prevBookings, newBooking]);
      
      toast({
        title: "Success",
        description: "Booking created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBooking = async (bookingId, bookingData) => {
    try {
      const response = await fetch(`/smlekha/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update booking');
      }
      
      const updatedBooking = await response.json();
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId ? updatedBooking : booking
        )
      );
      
      toast({
        title: "Success",
        description: "Booking updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      const response = await fetch(`/smlekha/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete booking');
      }
      
      setBookings(prevBookings => 
        prevBookings.filter(booking => booking.id !== bookingId)
      );
      
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete booking",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => navigate('/students')}
                  className="flex items-center gap-2 hover:bg-primary/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                    Student Bookings
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Manage and track all student seat bookings
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card 
              className="bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-blue-500/5 hover:from-blue-500/10 hover:via-blue-500/15 hover:to-blue-500/10 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-blue-500/10 relative overflow-hidden group"
              onClick={() => {
                setStatusFilter('all');
                setSearchTerm('');
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-500/70 bg-clip-text text-transparent">
                      {filteredBookings.length}
                    </p>
                  </div>
                  <div className="rounded-full bg-gradient-to-br from-blue-500/10 to-blue-500/20 p-3 ring-1 ring-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Bookmark className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="bg-gradient-to-br from-green-500/5 via-green-500/10 to-green-500/5 hover:from-green-500/10 hover:via-green-500/15 hover:to-green-500/10 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-green-500/10 relative overflow-hidden group"
              onClick={() => navigate('/students/booking/add')}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">New Booking</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-500/70 bg-clip-text text-transparent">
                      Create
                    </p>
                  </div>
                  <div className="rounded-full bg-gradient-to-br from-green-500/10 to-green-500/20 p-3 ring-1 ring-green-500/20 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="bg-gradient-to-br from-purple-500/5 via-purple-500/10 to-purple-500/5 hover:from-purple-500/10 hover:via-purple-500/15 hover:to-purple-500/10 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-purple-500/10 relative overflow-hidden group"
              onClick={() => {
                setStatusFilter('long');
                setSearchTerm('');
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Total Collection</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-purple-500/70 bg-clip-text text-transparent">
                      ₹{filteredBookings.reduce((sum, b) => sum + b.collection, 0)}
                    </p>
                  </div>
                  <div className="rounded-full bg-gradient-to-br from-purple-500/10 to-purple-500/20 p-3 ring-1 ring-purple-500/20 group-hover:scale-110 transition-transform duration-300">
                    <IndianRupee className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters Section */}
        <Card className="border-none shadow-sm bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border border-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-11 bg-background/50 border-primary/20"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] h-11 bg-background/50 border-primary/20">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-0">
            <div className="rounded-lg border shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="border-r">Student Name</TableHead>
                    <TableHead className="border-r">Property</TableHead>
                    <TableHead className="border-r">Seat No</TableHead>
                    <TableHead className="border-r">Booking Type</TableHead>
                    <TableHead className="border-r">Booking Date</TableHead>
                    <TableHead className="border-r">Move In Date</TableHead>
                    <TableHead className="border-r">Shift</TableHead>
                    <TableHead className="border-r">Fee</TableHead>
                    <TableHead className="border-r">Collection</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-16">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-10 w-10 animate-spin text-primary" />
                          <p className="text-muted-foreground text-lg">Loading bookings...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredBookings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-16">
                        <div className="flex flex-col items-center gap-3">
                          <Bookmark className="h-10 w-10 text-muted-foreground" />
                          <p className="text-muted-foreground text-lg">No bookings found</p>
                          <Button 
                            variant="outline" 
                            onClick={() => navigate('/students/booking/add')} 
                            className="mt-2 gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Create New Booking
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBookings.map((booking) => (
                      <TableRow 
                        key={booking.id} 
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="border-r py-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{booking.studentName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border-r py-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.property}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border-r py-4">
                          <Badge variant="outline" className="font-medium">
                            {booking.seatNo}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-r py-4">
                          <Badge 
                            variant={booking.bookingType === "long" ? "default" : "secondary"}
                            className="font-medium"
                          >
                            {booking.bookingType}
                          </Badge>
                        </TableCell>
                        <TableCell className="border-r py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(booking.bookingDate), "PPP")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border-r py-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(booking.moveInDate), "PPP")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border-r py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.shift}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border-r py-4">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">₹{booking.fee}</span>
                          </div>
                        </TableCell>
                        <TableCell className="border-r py-4">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">₹{booking.collection}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(booking.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the booking
                                    and remove the data from our servers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteBooking(booking.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

StudentBookingPage.propTypes = {
  isLoading: PropTypes.bool,
  searchTerm: PropTypes.string,
  statusFilter: PropTypes.string,
  bookings: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    studentName: PropTypes.string.isRequired,
    property: PropTypes.string.isRequired,
    seatNo: PropTypes.string.isRequired,
    bookingType: PropTypes.string.isRequired,
    bookingDate: PropTypes.string.isRequired,
    moveInDate: PropTypes.string.isRequired,
    shift: PropTypes.string.isRequired,
    fee: PropTypes.number.isRequired,
    collection: PropTypes.number.isRequired
  }))
};

export default StudentBookingPage; 