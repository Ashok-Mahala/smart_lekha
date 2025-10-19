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
import { getStudentById, getDocumentUrl } from '@/api/students';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SeatSelectionModal from '@/components/seats/SeatSelectionModal';

// Update the API function to match your existing endpoint
const getShiftsByProperty = async (propertyId) => {
  const response = await axios.get(`/shifts?property=${propertyId}`);
  return response.data.data; // Access the data property from your API response
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

  // Get property ID from student data or localStorage
  const getPropertyId = () => {
    return student?.propertyId || localStorage.getItem('selectedProperty');
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
      const response = await axios.put(`/students/${id}`, editedStudent);
      setStudent(response.data);
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

  const handleShiftChange = (value) => {
    // Find the selected shift object from the shifts array
    const selectedShift = shifts.find(shift => shift._id === value);
    setEditedStudent(prev => ({ 
      ...prev, 
      shift: selectedShift
    }));
  };

  const handleSeatSelect = (selectedSeat) => {
    setEditedStudent(prev => ({
      ...prev,
      currentSeat: selectedSeat
    }));
    setIsSeatModalOpen(false);
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

  // Format shift time for display
  const formatShiftTime = (shift) => {
    if (!shift.startTime || !shift.endTime) return shift.name || '';
    
    try {
      const startTime = format(new Date(`2000-01-01T${shift.startTime}`), 'hh:mm a');
      const endTime = format(new Date(`2000-01-01T${shift.endTime}`), 'hh:mm a');
      return `${shift.name} (${startTime} - ${endTime})`;
    } catch (error) {
      return shift.name || '';
    }
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

  const currentStudent = isEditing ? editedStudent : student;

  // Get current shift value for the select
  const getCurrentShiftValue = () => {
    if (!currentStudent?.shift) return '';
    return currentStudent.shift._id || '';
  };

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
                  src={getDocumentUrl(student.booking?.documents?.find(d => d.type === 'profile_photo')?.url) || "/placeholder.svg"}
                  alt={`${student.firstName} ${student.lastName}`}
                  className="h-full w-full object-cover cursor-pointer"
                  onClick={() => {
                    const photo = student.booking?.documents?.find(d => d.type === 'profile_photo');
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

          {/* Academic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 border-b pb-2 mb-4">
              <h3 className="text-lg font-medium">Academic Information</h3>
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
                {isEditing ? (
                  <Select
                    value={getCurrentShiftValue()}
                    onValueChange={handleShiftChange}
                    disabled={isLoadingShifts}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={
                        isLoadingShifts ? "Loading shifts..." : "Select shift"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.length > 0 ? (
                        shifts.map((shift) => (
                          <SelectItem key={shift._id} value={shift._id}>
                            {formatShiftTime(shift)} {shift.fee ? `- ₹${shift.fee}` : ''}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-shifts" disabled>
                          No shifts available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <p className="font-medium">
                      {student.shift?.name || '-'}
                      {student.shift?.startTime && student.shift?.endTime && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({format(new Date(`2000-01-01T${student.shift.startTime}`), 'hh:mm a')} - {format(new Date(`2000-01-01T${student.shift.endTime}`), 'hh:mm a')})
                        </span>
                      )}
                      {student.shift?.fee && (
                        <span className="text-sm text-muted-foreground ml-2">
                          - ₹{student.shift.fee}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Seat Number</Label>
                <div className="flex items-center gap-2 mt-1">
                  {isEditing ? (
                    <>
                      <Input 
                        value={currentStudent?.currentSeat?.seatNumber || 'No seat assigned'}
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
                    <p className="font-medium">{student.currentSeat?.seatNumber || '-'}</p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Admission Date</Label>
                <p className="font-medium mt-1">
                  {student.booking?.startDate ? format(new Date(student.booking.startDate), "dd MMM yyyy") : '-'}
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
                <Label className="text-sm text-muted-foreground">Fee Amount</Label>
                <p className="font-medium mt-1">
                  ₹{student.shift?.fee || 
                    (student.booking?.shift?.fee ? student.booking.shift.fee : '0')}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Payment Status</Label>
                <p className="font-medium mt-1">
                  <Badge variant={student.payment?.status === 'completed' ? 'default' : 'destructive'}>
                    {student.payment?.status || 'pending'}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Payment Method</Label>
                <p className="font-medium mt-1">{student.payment?.paymentMethod || '-'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Payment Date</Label>
                <p className="font-medium mt-1">
                  {student.payment?.paymentDate ? format(new Date(student.payment.paymentDate), "dd MMM yyyy") : '-'}
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
              {student.booking?.documents?.map((doc, index) => (
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
        shift={currentStudent?.shift}
        currentSeat={currentStudent?.currentSeat}
        studentId={id}
      />
    </DashboardLayout>
  );
};

export default StudentProfile;