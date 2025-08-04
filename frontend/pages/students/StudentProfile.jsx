import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { ArrowLeft, Phone, Download, Edit, Save, X, Maximize2 } from 'lucide-react';
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

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [student, setStudent] = useState(location.state?.student || null);
  const [editedStudent, setEditedStudent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(!location.state?.student);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageOpen, setIsImageOpen] = useState(false);

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
    }
  }, [id, location.state]);

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
    setEditedStudent(prev => ({ ...prev, [field]: value }));
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

  if (!student) {
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
                    value={currentStudent.email || ''} 
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
                    value={currentStudent.phone || ''} 
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
                    value={currentStudent.aadharNumber || ''} 
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
                    value={currentStudent.institution || ''} 
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
                    value={currentStudent.course || ''} 
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
                    value={currentStudent.shift?.name || ''}
                    onValueChange={(value) => handleInputChange('shift', { ...currentStudent.shift, name: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning Shift">Morning Shift</SelectItem>
                      <SelectItem value="Afternoon Shift">Afternoon Shift</SelectItem>
                      <SelectItem value="Evening Shift">Evening Shift</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium mt-1">{student.shift?.name || '-'}</p>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Seat Number</Label>
                <p className="font-medium mt-1">{student.currentSeat?.seatNumber || '-'}</p>
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
                <p className="font-medium mt-1">₹{student.shift?.fee || '0'}</p>
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
    </DashboardLayout>
  );
};

export default StudentProfile;