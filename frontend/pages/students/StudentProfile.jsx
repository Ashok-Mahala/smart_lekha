import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { ArrowLeft, Phone, Download, Edit, Save, X, Maximize2, MapPin, Calendar, Clock, IndianRupee } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axios from '@/api/axios';
import { getStudentById, getDocumentUrl, updateStudent } from '@/api/students';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SeatSelectionModal from '@/components/seats/SeatSelectionModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Fixed API function to get shifts
const getShiftsByProperty = async (propertyId) => {
  try {
    const response = await axios.get(`/shifts?property=${propertyId}`);
    return response.data.data || response.data || [];
  } catch (error) {
    console.error('Error fetching shifts:', error);
    throw error;
  }
};

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState(null);
  const [editedStudent, setEditedStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [shifts, setShifts] = useState([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  // Get property ID from student's current assignment or localStorage
  const getPropertyId = () => {
    if (student?.currentAssignments?.[0]?.property) {
      return student.currentAssignments[0].property;
    }
    if (student?.currentAssignments?.[0]?.seat?.propertyId) {
      return student.currentAssignments[0].seat.propertyId;
    }
    return localStorage.getItem('selectedProperty');
  };

  // Get current assignment
  const getCurrentAssignment = () => {
    return student?.currentAssignments?.find(assignment => assignment.status === 'active') || null;
  };

  // Get current assignment for edited student
  const getEditedCurrentAssignment = () => {
    return editedStudent?.currentAssignments?.find(assignment => assignment.status === 'active') || null;
  };

  // Get payment for current assignment
  const getCurrentPayment = () => {
    const currentAssignment = getCurrentAssignment();
    if (!currentAssignment || !student?.paymentHistory) return null;
    
    // Find payment that matches the current assignment
    return student.paymentHistory.find(payment => 
      payment.assignment === currentAssignment._id && 
      payment.status !== 'refunded'
    );
  };

  // Get payment for a specific assignment
  const getPaymentForAssignment = (assignment) => {
    if (!assignment || !student?.paymentHistory) return null;
    
    return student.paymentHistory.find(payment => 
      payment.assignment === assignment._id
    );
  };

  // Get fee details for current assignment (combines assignment and payment data)
  const getCurrentFeeDetails = () => {
    const currentAssignment = getCurrentAssignment();
    const currentPayment = getCurrentPayment();
    
    if (currentPayment) {
      return {
        amount: currentPayment.amount,
        collected: currentPayment.collectedAmount,
        balance: currentPayment.balanceAmount,
        status: currentPayment.status
      };
    }
    
    // Fallback to assignment data if no payment found
    return {
      amount: currentAssignment?.shift?.fee || 0,
      collected: 0,
      balance: currentAssignment?.shift?.fee || 0,
      status: 'pending'
    };
  };

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setIsLoading(true);
        const data = await getStudentById(id);
        setStudent(data);
        setEditedStudent(data);
      } catch (error) {
        console.error("Error fetching student:", error);
        toast.error("Failed to load student data");
      } finally {
        setIsLoading(false);
      }
    };

    // Always fetch fresh data, don't rely on location.state
    fetchStudent();
  }, [id]);

  // Fetch shifts when student data is available
  useEffect(() => {
    const fetchShifts = async () => {
      const propertyId = getPropertyId();
      if (propertyId) {
        try {
          setIsLoadingShifts(true);
          const shiftsData = await getShiftsByProperty(propertyId);
          setShifts(shiftsData);
        } catch (error) {
          console.error("Error fetching shifts:", error);
          toast.error("Failed to load shifts");
        } finally {
          setIsLoadingShifts(false);
        }
      }
    };

    if (student) {
      fetchShifts();
    }
  }, [student]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Prepare the data for update - only send basic student info, not assignments
      const updateData = {
        firstName: editedStudent.firstName,
        lastName: editedStudent.lastName,
        email: editedStudent.email,
        phone: editedStudent.phone,
        aadharNumber: editedStudent.aadharNumber,
        institution: editedStudent.institution,
        course: editedStudent.course,
        status: editedStudent.status
      };

      await updateStudent(id, updateData);
      
      // FIX: Fetch the complete student data again after update
      const freshStudentData = await getStudentById(id);
      
      setStudent(freshStudentData);
      setEditedStudent(freshStudentData);
      setIsEditing(false);
      toast.success('Student updated successfully');
    } catch (error) {
      toast.error('Failed to update student');
      console.error("Error updating student:", error);
    }
  };

  const handleCancel = () => {
    setEditedStudent(student);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedStudent(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  };

  const handleSeatSelect = async (selectedSeat) => {
    try {
      // This would require a separate API call to update the assignment
      // For now, just update the local state
      const updatedAssignments = student.currentAssignments?.map(assignment => {
        if (assignment.status === 'active') {
          return {
            ...assignment,
            seat: selectedSeat
          };
        }
        return assignment;
      });

      const updatedStudent = {
        ...student,
        currentAssignments: updatedAssignments
      };

      setStudent(updatedStudent);
      setEditedStudent(updatedStudent);

      setIsSeatModalOpen(false);
      toast.success('Seat updated successfully');
    } catch (error) {
      console.error('Error updating seat:', error);
      toast.error('Failed to update seat');
    }
  };

  const handleImageClick = (doc) => {
    setSelectedImage(doc);
    setIsImageOpen(true);
  };

  const handleDownloadImage = () => {
    if (!selectedImage) return;
    
    const link = document.createElement('a');
    link.href = getDocumentUrl(selectedImage.url);
    link.download = selectedImage.originalName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get profile photo URL
  const getProfilePhotoUrl = () => {
    const profilePhoto = student?.documents?.find(doc => doc.type === 'profile_photo');
    if (profilePhoto) {
      return getDocumentUrl(profilePhoto.url);
    }
    
    // Fallback to any image document
    const anyImage = student?.documents?.find(doc => 
      doc.url && (doc.url.match(/\.(jpg|jpeg|png|gif)$/i))
    );
    
    return anyImage ? getDocumentUrl(anyImage.url) : "/placeholder.svg";
  };

  // Get seat history (completed assignments)
  const getSeatHistory = () => {
    return student?.assignmentHistory?.filter(assignment => assignment.status === 'completed') || [];
  };

  // Get payment history from paymentHistory array
  const getPaymentHistory = () => {
    return student?.paymentHistory || [];
  };

  // Get assignment-based payment history (for backward compatibility)
  const getAssignmentPaymentHistory = () => {
    const allAssignments = [
      ...(student?.currentAssignments || []),
      ...(student?.assignmentHistory || [])
    ];

    return allAssignments.map(assignment => {
      const payment = getPaymentForAssignment(assignment);
      return {
        assignment,
        payment,
        feeDetails: payment ? {
          amount: payment.amount,
          collected: payment.collectedAmount,
          balance: payment.balanceAmount,
          status: payment.status
        } : {
          amount: assignment.shift?.fee || 0,
          collected: 0,
          balance: assignment.shift?.fee || 0,
          status: 'pending'
        }
      };
    }).filter(item => item.feeDetails.amount > 0);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground">Loading student data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!student || !editedStudent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-2">
            <p className="text-muted-foreground">Student not found</p>
            <Button onClick={() => navigate('/students')}>Back to Students</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentAssignment = getCurrentAssignment();
  const editedCurrentAssignment = getEditedCurrentAssignment();
  const currentPayment = getCurrentPayment();
  const currentFeeDetails = getCurrentFeeDetails();
  const currentStudent = isEditing ? editedStudent : student;
  const seatHistory = getSeatHistory();
  const paymentHistory = getPaymentHistory();
  const assignmentPaymentHistory = getAssignmentPaymentHistory();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/students')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Student Profile</h1>
              <p className="text-muted-foreground">
                {student.firstName} {student.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = `tel:${student.phone}`}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleEdit}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="seat-history">Seat History</TabsTrigger>
            <TabsTrigger value="payment-history">Payment History</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 border-b pb-2 mb-4">
                  <h3 className="text-lg font-medium">Personal Information</h3>
                </div>
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-xl mb-4 relative group">
                    <img
                      src={getProfilePhotoUrl()}
                      alt={`${student.firstName} ${student.lastName}`}
                      className="h-full w-full object-cover cursor-pointer"
                      onClick={() => {
                        const photo = student.documents?.find(d => d.type === 'profile_photo');
                        if (photo) handleImageClick(photo);
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
                      <Maximize2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold">
                    {student.firstName} {student.lastName}
                  </h2>
                  <Badge variant="outline" className="mt-2">
                    {student.status || 'active'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    {isEditing ? (
                      <Input 
                        value={currentStudent?.email || ''} 
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium mt-1">{student.email}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Phone</Label>
                    {isEditing ? (
                      <Input 
                        value={currentStudent?.phone || ''} 
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium mt-1">{student.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Aadhar Number</Label>
                    {isEditing ? (
                      <Input 
                        value={currentStudent?.aadharNumber || ''} 
                        onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium mt-1">{student.aadharNumber || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Institution</Label>
                    {isEditing ? (
                      <Input 
                        value={currentStudent?.institution || ''} 
                        onChange={(e) => handleInputChange('institution', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium mt-1">{student.institution || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-2 border-b pb-2 mb-4">
                  <h3 className="text-lg font-medium">Assignment Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Course</Label>
                    {isEditing ? (
                      <Input 
                        value={currentStudent?.course || ''} 
                        onChange={(e) => handleInputChange('course', e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium mt-1">{student.course || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Shift</Label>
                    <div className="mt-1">
                      <p className="font-medium">
                        {currentAssignment?.shift?.name || '-'}
                        {currentAssignment?.shift?.startTime && currentAssignment?.shift?.endTime && (
                          <span className="text-sm text-muted-foreground ml-2">
                            ({currentAssignment.shift.startTime} - {currentAssignment.shift.endTime})
                          </span>
                        )}
                        {currentAssignment?.shift?.fee && (
                          <span className="text-sm text-muted-foreground ml-2">
                            - ₹{currentAssignment.shift.fee}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Seat Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {isEditing ? (
                        <>
                          <Input 
                            value={editedCurrentAssignment?.seat?.seatNumber || 'No seat assigned'}
                            className="flex-1"
                            readOnly
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsSeatModalOpen(true)}
                          >
                            <MapPin className="h-4 w-4 mr-1" />
                            Change Seat
                          </Button>
                        </>
                      ) : (
                        <p className="font-medium">{currentAssignment?.seat?.seatNumber || '-'}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Start Date</Label>
                    <p className="font-medium mt-1">
                      {currentAssignment?.startDate ? format(new Date(currentAssignment.startDate), "dd MMM yyyy") : '-'}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Total Fee</Label>
                    <p className="font-medium mt-1 text-lg">
                      ₹{currentFeeDetails.amount}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Paid Amount</Label>
                    <p className="font-medium mt-1 text-lg text-green-600">
                      ₹{currentFeeDetails.collected}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Balance</Label>
                    <p className="font-medium mt-1 text-lg text-red-600">
                      ₹{currentFeeDetails.balance}
                    </p>
                  </div>
                </div>

                {currentPayment && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Payment Status:</span>
                      <Badge 
                        variant={
                          currentPayment.status === 'completed' ? 'default' :
                          currentPayment.status === 'partial' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {currentPayment.status.toUpperCase()}
                      </Badge>
                    </div>
                    {currentPayment.transactionId && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-muted-foreground">Transaction ID:</span>
                        <span className="text-sm font-medium">{currentPayment.transactionId}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Seat History Tab */}
          <TabsContent value="seat-history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seat Assignment History</CardTitle>
                <CardDescription>
                  Complete history of all seat assignments for this student
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {seatHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No seat history found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {seatHistory.map((assignment, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="bg-primary/10 p-3 rounded-full">
                                <MapPin className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold">Seat {assignment.seat?.seatNumber}</p>
                                <p className="text-sm text-muted-foreground">
                                  {assignment.seat?.propertyId?.name} • Row {assignment.seat?.row + 1}, Column {assignment.seat?.column + 1}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(assignment.startDate), 'dd MMM yyyy')}
                                  </span>
                                  {assignment.endDate && (
                                    <span className="flex items-center gap-1">
                                      to {format(new Date(assignment.endDate), 'dd MMM yyyy')}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {assignment.shift?.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary">Completed</Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payment-history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Complete payment history across all assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {paymentHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No payment history found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paymentHistory.map((payment, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-full ${
                                payment.status === 'completed' ? 'bg-green-100' :
                                payment.status === 'partial' ? 'bg-yellow-100' :
                                'bg-red-100'
                              }`}>
                                <IndianRupee className={`h-6 w-6 ${
                                  payment.status === 'completed' ? 'text-green-600' :
                                  payment.status === 'partial' ? 'text-yellow-600' :
                                  'text-red-600'
                                }`} />
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {payment.description || 'Seat Rent Payment'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Seat {payment.seat?.seatNumber} • {payment.shift?.name}
                                </p>
                                <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Total:</span>
                                    <p className="font-medium">₹{payment.amount}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Paid:</span>
                                    <p className="font-medium text-green-600">₹{payment.collectedAmount}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Balance:</span>
                                    <p className="font-medium text-red-600">₹{payment.balanceAmount}</p>
                                  </div>
                                </div>
                                {payment.transactionId && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Transaction: {payment.transactionId}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={
                                  payment.status === 'completed' ? 'default' :
                                  payment.status === 'partial' ? 'secondary' :
                                  'destructive'
                                }
                              >
                                {payment.status.toUpperCase()}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {payment.paymentDate ? 
                                  format(new Date(payment.paymentDate), 'dd MMM yyyy') :
                                  format(new Date(payment.createdAt), 'dd MMM yyyy')
                                }
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Period: {format(new Date(payment.period.start), 'dd MMM')} - {format(new Date(payment.period.end), 'dd MMM yyyy')}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Documents</CardTitle>
                <CardDescription>
                  All uploaded documents and identification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {student.documents?.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div 
                        className="flex flex-col items-center text-center cursor-pointer"
                        onClick={() => handleImageClick(doc)}
                      >
                        <div className="bg-blue-100 p-3 rounded-full mb-3">
                          <Maximize2 className="h-6 w-6 text-blue-600" />
                        </div>
                        <Label className="text-sm text-muted-foreground capitalize mb-2">
                          {doc.type.replace(/_/g, ' ')}
                        </Label>
                        <p className="text-primary font-medium text-sm truncate w-full">
                          {doc.originalName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(doc.uploadedAt), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!student.documents || student.documents.length === 0) && (
                    <div className="col-span-3 text-center py-8 text-muted-foreground">
                      <p>No documents uploaded</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Image Viewer Modal */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] sm:max-w-[85vw] sm:max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>{selectedImage?.originalName || 'Document'}</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownloadImage}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center h-full overflow-auto">
            {selectedImage && (
              <img
                src={getDocumentUrl(selectedImage.url)}
                alt={selectedImage.originalName}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Seat Selection Modal */}
      <SeatSelectionModal
        isOpen={isSeatModalOpen}
        onClose={() => setIsSeatModalOpen(false)}
        onSeatSelect={handleSeatSelect}
        propertyId={getPropertyId()}
        shift={currentAssignment?.shift}
        currentSeat={currentAssignment?.seat}
        studentId={id}
      />
    </DashboardLayout>
  );
};

export default StudentProfile;