import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  UserPlus,
  Loader2,
  AlertCircle,
  User,
  IndianRupee,
  Calendar,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { getDocumentUrl, getStudentById, getStudentsByProperty } from "@/api/students";
import { getOverduePayments } from "@/api/payments";
import { API_CONFIG } from "@/api/config";

const StudentsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const propertyId = localStorage.getItem("selectedProperty");
        if (!propertyId) throw new Error("No property selected");

        const [studentList, overduePaymentsData] = await Promise.all([
          getStudentsByProperty(propertyId),
          getOverduePayments()
        ]);

        // The API returns { students: [] } structure
        setStudents(studentList.students || []);
        setOverduePayments(overduePaymentsData.data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to load student data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create a map of overdue payments for quick lookup
  const overduePaymentsMap = useMemo(() => {
    const map = {};
    overduePayments.forEach(payment => {
      map[payment.student] = payment;
    });
    return map;
  }, [overduePayments]);

  const filteredStudents = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return students
      .map(s => ({ 
        ...s, 
        fullName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
        // Get the first active assignment for display
        currentAssignment: s.currentAssignments?.find(assignment => 
          assignment.status === 'active'
        ) || null
      }))
      .filter(student =>
        student.fullName.toLowerCase().includes(search) ||
        student._id?.toLowerCase().includes(search) ||
        student.email?.toLowerCase().includes(search) ||
        student.phone?.toLowerCase().includes(search)
      );  
  }, [students, searchTerm]);

  const handleStudentClick = async (id) => {
    try {
      // First fetch the student data
      const student = await getStudentById(id);
      
      // Then navigate to the profile page with the data
      navigate(`/students/profile/${id}`, { state: { student } });
    } catch (error) {
      console.error("Error fetching student:", error);
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive"
      });
    }
  };

  const getProfilePhotoUrl = (documents) => {
    if (!documents || documents.length === 0) {
      return null;
    }

    // Try to find profile photo first
    let profileDoc = documents.find(d => d.type === 'profile_photo');
    
    // If no profile photo found, use the first image document
    if (!profileDoc) {
      profileDoc = documents.find(d => 
        d.url && (d.url.match(/\.(jpg|jpeg|png|gif)$/i) || 
                 d.originalName?.match(/\.(jpg|jpeg|png|gif)$/i))
      );
    }

    // If still no image found, use the first document
    if (!profileDoc && documents.length > 0) {
      profileDoc = documents[0];
    }

    if (!profileDoc?.url) {
      return null;
    }

    // Construct full URL for the image
    const baseUrl = API_CONFIG.baseURL.replace(/\/$/, '');
    const imageUrl = profileDoc.url.startsWith('/') 
      ? `${baseUrl}${profileDoc.url}`
      : `${baseUrl}/${profileDoc.url}`;

    return imageUrl;
  };

  // Enhanced payment status calculation
  const getPaymentStatus = (student) => {
    const overduePayment = overduePaymentsMap[student._id];
    if (overduePayment) {
      return {
        status: 'overdue',
        amount: overduePayment.balanceAmount || overduePayment.amount,
        dueDate: overduePayment.dueDate,
        isOverdue: true
      };
    }

    const currentAssignment = student.currentAssignments?.find(assignment => 
      assignment.status === 'active'
    );

    if (currentAssignment) {
      const feeDetails = currentAssignment.feeDetails;
      if (feeDetails) {
        const { amount, collected, balance } = feeDetails;
        
        if (balance > 0) {
          // Check if payment is overdue
          const isOverdue = currentAssignment.payment?.dueDate && 
                           new Date() > new Date(currentAssignment.payment.dueDate);
          
          return {
            status: isOverdue ? 'overdue' : (collected === 0 ? 'pending' : 'partial'),
            amount: balance,
            dueDate: currentAssignment.payment?.dueDate,
            isOverdue
          };
        } else if (collected > 0 && collected === amount) {
          return {
            status: 'paid',
            amount: 0,
            dueDate: null,
            isOverdue: false
          };
        }
      }
    }

    return {
      status: 'pending',
      amount: 0,
      dueDate: null,
      isOverdue: false
    };
  };

  const renderPaymentStatus = (paymentStatus) => {
    const { status, amount, dueDate, isOverdue } = paymentStatus;
    
    switch (status) {
      case 'overdue':
        const overdueDays = dueDate ? differenceInDays(new Date(), new Date(dueDate)) : 0;
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
              <AlertCircle className="h-3 w-3" />
              ₹{amount}
            </Badge>
            {overdueDays > 0 && (
              <span className="text-xs text-red-600">
                {overdueDays} day{overdueDays !== 1 ? 's' : ''} overdue
              </span>
            )}
          </div>
        );
      case 'pending':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 w-fit">
              ₹{amount}
            </Badge>
            <span className="text-xs text-yellow-600">Pending</span>
          </div>
        );
      case 'partial':
        return (
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 w-fit">
              ₹{amount}
            </Badge>
            <span className="text-xs text-blue-600">Partial Payment</span>
          </div>
        );
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <IndianRupee className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      default:
        return '-';
    }
  };

  // Calculate statistics for the header
  const statistics = useMemo(() => {
    const totalStudents = students.length;
    const studentsWithPayments = students.filter(student => {
      const paymentStatus = getPaymentStatus(student);
      return paymentStatus.status !== 'paid';
    }).length;
    
    const totalPendingAmount = students.reduce((sum, student) => {
      const paymentStatus = getPaymentStatus(student);
      return sum + paymentStatus.amount;
    }, 0);

    const overdueCount = students.filter(student => {
      const paymentStatus = getPaymentStatus(student);
      return paymentStatus.isOverdue;
    }).length;

    return {
      totalStudents,
      studentsWithPayments,
      totalPendingAmount,
      overdueCount
    };
  }, [students]);

  // Fixed: Using state to track image loading errors
  const ProfilePhotoWithFallback = ({ student }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    const photoUrl = getProfilePhotoUrl(student.documents);

    // Reset states when photoUrl changes
    useEffect(() => {
      setImageError(false);
      setImageLoaded(false);
    }, [photoUrl]);

    if (!photoUrl || imageError) {
      return (
        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center border">
          <User className="h-5 w-5 text-gray-500" />
        </div>
      );
    }

    return (
      <img
        src={photoUrl}
        alt={student.fullName}
        className="h-10 w-10 rounded-full object-cover border"
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        style={{ display: imageLoaded ? 'block' : 'none' }}
      />
    );
  };

  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading student data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Student Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage and monitor student assignments and payments
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/students/add')}>
                <UserPlus className="h-4 w-4 mr-2" /> Add Student
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                    <p className="text-2xl font-bold">{statistics.totalStudents}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                    <p className="text-2xl font-bold">{statistics.studentsWithPayments}</p>
                  </div>
                  <IndianRupee className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                    <p className="text-2xl font-bold">₹{statistics.totalPendingAmount}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                    <p className="text-2xl font-bold">{statistics.overdueCount}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Students Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Students</CardTitle>
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Photo</TableHead>
                    <TableHead>Student Details</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Fee Details</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">No students found</p>
                          {searchTerm && (
                            <p className="text-sm text-muted-foreground">
                              Try adjusting your search terms
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map(student => {
                      const currentAssignment = student.currentAssignment;
                      const seat = currentAssignment?.seat;
                      const shift = currentAssignment?.shift;
                      const paymentStatus = getPaymentStatus(student);
                      const feeDetails = currentAssignment?.feeDetails;

                      // Calculate assignment duration
                      const assignmentDuration = currentAssignment?.startDate ? 
                        differenceInDays(new Date(), new Date(currentAssignment.startDate)) : 0;

                      return (
                        <TableRow
                          key={student._id}
                          onClick={() => handleStudentClick(student._id)}
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <TableCell>
                            <ProfilePhotoWithFallback student={student} />
                          </TableCell>
                          
                          {/* Student Details */}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">{student.fullName}</span>
                              <span className="text-xs text-muted-foreground">{student.email}</span>
                              <span className="text-xs text-muted-foreground">{student.phone}</span>
                              <Badge 
                                variant={student.status === 'active' ? 'default' : 'secondary'}
                                className="w-fit mt-1 text-xs"
                              >
                                {student.status}
                              </Badge>
                            </div>
                          </TableCell>
                          
                          {/* Assignment Details */}
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium">Seat {seat?.seatNumber || '-'}</span>
                              </div>
                              {shift && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {shift.name}
                                </div>
                              )}
                              {currentAssignment?.startDate && (
                                <div className="text-xs text-muted-foreground">
                                  Since {format(new Date(currentAssignment.startDate), 'dd MMM')}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Payment Status */}
                          <TableCell>
                            {renderPaymentStatus(paymentStatus)}
                          </TableCell>
                          
                          {/* Fee Details */}
                          <TableCell>
                            {feeDetails ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Total:</span>
                                  <span className="font-medium">₹{feeDetails.amount}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Paid:</span>
                                  <span className="font-medium text-green-600">₹{feeDetails.collected}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Balance:</span>
                                  <span className="font-medium text-red-600">₹{feeDetails.balance}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No fee details</span>
                            )}
                          </TableCell>
                          
                          {/* Duration */}
                          <TableCell>
                            <div className="flex flex-col items-center text-center">
                              <span className="text-lg font-bold text-blue-600">
                                {assignmentDuration}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                day{assignmentDuration !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentsPage;