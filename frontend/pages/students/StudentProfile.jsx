import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { ArrowLeft, Phone, Download, Edit, Save, X, Maximize2, MapPin } from 'lucide-react';
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

// Fixed API function to get shifts
const getShiftsByProperty = async (propertyId) => {
  try {
    const response = await axios.get(`/shifts?property=${propertyId}`);
    return response.data.data || response.data || []; // Handle different response structures
  } catch (error) {
    console.error('Error fetching shifts:', error);
    throw error;
  }
};

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState(location.state?.student || null);
  const [editedStudent, setEditedStudent] = useState(location.state?.student || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(!location.state?.student);
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

  useEffect(() => {
    if (!location.state?.student) {
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
      fetchStudent();
    } else {
      setEditedStudent(location.state.student);
    }
  }, [id, location.state]);

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

    if (student || location.state?.student) {
      fetchShifts();
    }
  }, [student, location.state?.student]);

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

      const response = await updateStudent(id, updateData);
      setStudent(response.data);
      setEditedStudent(response.data);
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

      setEditedStudent(prev => ({
        ...prev,
        currentAssignments: updatedAssignments
      }));

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
  const currentStudent = isEditing ? editedStudent : student;

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
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 border-b pb-2 mb-4">
              <h3 className="text-lg font-medium">Payment Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Total Fee</Label>
                <p className="font-medium mt-1">
                  ₹{currentAssignment?.feeDetails?.amount || 
                    currentAssignment?.shift?.fee || '0'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Paid Amount</Label>
                <p className="font-medium mt-1 text-green-600">
                  ₹{currentAssignment?.feeDetails?.collected || '0'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Balance</Label>
                <p className="font-medium mt-1 text-red-600">
                  ₹{currentAssignment?.feeDetails?.balance || '0'}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <p className="font-medium mt-1">
                  <Badge variant={
                    currentAssignment?.feeDetails?.balance === 0 ? 'default' : 
                    currentAssignment?.feeDetails?.balance > 0 ? 'destructive' : 'outline'
                  }>
                    {currentAssignment?.feeDetails?.balance === 0 ? 'Paid' : 
                     currentAssignment?.feeDetails?.balance > 0 ? 'Pending' : 'Unknown'}
                  </Badge>
                </p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 border-b pb-2 mb-4">
              <h3 className="text-lg font-medium">Documents</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {student.documents?.map((doc, index) => (
                <div key={index} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => handleImageClick(doc)}
                  >
                    <div>
                      <Label className="text-sm text-muted-foreground capitalize">
                        {doc.type.replace('_', ' ')}
                      </Label>
                      <p className="text-primary font-medium mt-1">
                        {doc.originalName}
                      </p>
                    </div>
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
              {(!student.documents || student.documents.length === 0) && (
                <p className="text-muted-foreground col-span-2 text-center py-4">
                  No documents uploaded
                </p>
              )}
            </div>
          </div>
        </div>
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