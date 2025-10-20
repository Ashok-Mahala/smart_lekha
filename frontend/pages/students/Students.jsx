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
  User
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
import { format } from "date-fns";
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

      console.log("imageUrl",imageUrl);
    return imageUrl;
    
  };

  const getPaymentStatus = (student) => {
    const overduePayment = overduePaymentsMap[student._id];
    if (overduePayment) {
      return {
        status: 'overdue',
        amount: overduePayment.amount,
        dueDate: overduePayment.dueDate
      };
    }

    const currentAssignment = student.currentAssignments?.find(assignment => 
      assignment.status === 'active'
    );

    if (currentAssignment) {
      const balance = currentAssignment.feeDetails?.balance || 0;
      
      if (balance > 0) {
        return {
          status: balance === currentAssignment.feeDetails?.amount ? 'pending' : 'partial',
          amount: balance,
          dueDate: currentAssignment.payment?.dueDate
        };
      }
    }

    return {
      status: 'paid',
      amount: 0,
      dueDate: null
    };
  };

  const renderPaymentStatus = (paymentStatus) => {
    const { status, amount, dueDate } = paymentStatus;
    
    switch (status) {
      case 'overdue':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            ₹{amount}
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            ₹{amount}
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            ₹{amount}
          </Badge>
        );
      case 'paid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Paid
          </Badge>
        );
      default:
        return '-';
    }
  };

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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Student Management</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Total Students: {students.length}
              </div>
              {/* <Button onClick={() => navigate('/students/add')}>
                <UserPlus className="h-4 w-4 mr-2" /> Add Student
              </Button> */}
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Students</CardTitle>
                <Input
                  placeholder="Search students..."
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
                    <TableHead>Profile Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Seat</TableHead>
                    <TableHead>Shift</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pending Payment</TableHead>
                    <TableHead>Total Fee</TableHead>
                    <TableHead>Paid Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">No students found</p>
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

                      return (
                        <TableRow
                          key={student._id}
                          onClick={() => handleStudentClick(student._id)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <TableCell>
                            <ProfilePhotoWithFallback student={student} />
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.fullName}
                          </TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{student.phone}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {seat?.seatNumber || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {shift
                              ? `${shift.name} (${shift.startTime} - ${shift.endTime})`
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={student.status === 'active' ? 'default' : 'secondary'}
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {renderPaymentStatus(paymentStatus)}
                          </TableCell>
                          <TableCell>
                            {feeDetails ? (
                              <span className="text-sm font-medium">₹{feeDetails.amount}</span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {feeDetails ? (
                              <span className="text-sm text-green-600">₹{feeDetails.collected}</span>
                            ) : (
                              '-'
                            )}
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