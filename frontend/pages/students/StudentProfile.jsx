import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { ArrowLeft, Phone, CreditCard, Calendar, Clock, Sofa, Download, FileText, User, BookOpen, MapPin, Shield, Edit, Save, X, Eraser } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import html2pdf from 'html2pdf.js';
import PropTypes from 'prop-types';
import { toast } from "@/components/ui/use-toast";

// Define PropTypes for Student
export const studentPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  phone: PropTypes.string.isRequired,
  whatsapp: PropTypes.string,
  seatNo: PropTypes.string.isRequired,
  lastActive: PropTypes.string.isRequired,
  photo: PropTypes.string.isRequired,
  address: PropTypes.string,
  course: PropTypes.string,
  admissionDate: PropTypes.string,
  fatherName: PropTypes.string,
  dateOfBirth: PropTypes.string,
  gender: PropTypes.string,
  studentId: PropTypes.string,
  shift: PropTypes.string,
  city: PropTypes.string,
  state: PropTypes.string,
  pincode: PropTypes.string,
  idProofType: PropTypes.string,
  idProofNumber: PropTypes.string,
  idProofFront: PropTypes.string,
  idProofBack: PropTypes.string,
  status: PropTypes.string,
  notes: PropTypes.string
});

const a4Style = {
  width: '210mm',
  minHeight: '297mm',
  padding: '10mm',
  margin: '0 auto',
  backgroundColor: 'white',
  boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  position: 'relative',
  fontSize: '12px',
  lineHeight: '1.4',
};

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = React.useState(null);
  const [signature, setSignature] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedStudent, setEditedStudent] = React.useState(null);
  const [studentSignature, setStudentSignature] = React.useState('');
  const [authoritySignature, setAuthoritySignature] = React.useState('');
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [currentSignature, setCurrentSignature] = React.useState(null);
  const canvasRef = React.useRef(null);
  const [isDrawingActive, setIsDrawingActive] = React.useState(false);
  const [lastX, setLastX] = React.useState(0);
  const [lastY, setLastY] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Replace the React.useEffect code with API call
  React.useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/students/${id}`);
        
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('API endpoint not available');
        }
        
        const studentData = await response.json();
        setStudent(studentData);
        setEditedStudent(studentData);
      } catch (error) {
        console.error("Error fetching student data:", error);
        toast({
          title: "Error",
          description: "Failed to load student data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchStudentData();
    }
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/students/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedStudent),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update student data');
      }
      
      const updatedStudent = await response.json();
      setStudent(updatedStudent);
    setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Student data updated successfully",
      });
    } catch (error) {
      console.error("Error updating student data:", error);
      toast({
        title: "Error",
        description: "Failed to update student data",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditedStudent(student);
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditedStudent(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('library-form');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `library_admission_${student?.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Hide buttons before generating PDF
    const buttons = element.querySelectorAll('button');
    buttons.forEach(button => button.style.display = 'none');

    html2pdf().set(opt).from(element).save().then(() => {
      // Show buttons again after PDF is generated
      buttons.forEach(button => button.style.display = '');
    });
  };

  const startDrawing = (e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawingActive(true);
    setLastX(x);
    setLastY(y);
  };

  const draw = (e) => {
    if (!isDrawingActive || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    setLastX(x);
    setLastY(y);
  };

  const stopDrawing = () => {
    setIsDrawingActive(false);
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const signature = canvas.toDataURL();
    if (currentSignature === 'student') {
      setStudentSignature(signature);
    } else if (currentSignature === 'authority') {
      setAuthoritySignature(signature);
    }
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentSignature === 'student') {
      setStudentSignature('');
    } else if (currentSignature === 'authority') {
      setAuthoritySignature('');
    }
  };

  const openSignaturePad = (type) => {
    setCurrentSignature(type);
    setIsDrawing(true);
  };

  const closeSignaturePad = () => {
    setIsDrawing(false);
    setCurrentSignature(null);
  };

  if (!student || !editedStudent) {
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

  const currentStudent = isEditing ? editedStudent : student;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
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
              <p className="text-muted-foreground">View and manage student details</p>
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
                  onClick={() => window.open(`https://wa.me/${student.whatsapp || student.phone}`, '_blank')}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    width="16" 
                    height="16" 
                    fill="currentColor"
                    className="h-4 w-4 mr-2"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDownloadPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
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
          {/* Left Column - Student Profile */}
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 border-b pb-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Personal Information</h3>
              </div>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-xl mb-4">
                  <img
                    src={currentStudent.photo || "/placeholder.svg"}
                    alt={currentStudent.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h2 className="text-xl font-bold">{currentStudent.name}</h2>
                <p className="text-muted-foreground">ID: {currentStudent.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Father's Name</p>
                  {isEditing ? (
                    <Input 
                      value={currentStudent.fatherName || ''} 
                      onChange={(e) => handleInputChange('fatherName', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">{currentStudent.fatherName || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={currentStudent.dateOfBirth || ''} 
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">
                      {currentStudent.dateOfBirth ? format(new Date(currentStudent.dateOfBirth), "dd MMM yyyy") : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  {isEditing ? (
                    <Select
                      value={currentStudent.gender || ''}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{currentStudent.gender || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 border-b pb-2 mb-4">
                <BookOpen className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Academic Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  {isEditing ? (
                    <Input 
                      value={currentStudent.studentId || ''} 
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">{currentStudent.studentId || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Course</p>
                  {isEditing ? (
                    <Input 
                      value={currentStudent.course || ''} 
                      onChange={(e) => handleInputChange('course', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">{currentStudent.course || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Shift</p>
                  {isEditing ? (
                    <Select
                      value={currentStudent.shift || ''}
                      onValueChange={(value) => handleInputChange('shift', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="afternoon">Afternoon</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{currentStudent.shift || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seat No</p>
                  {isEditing ? (
                    <Input 
                      value={currentStudent.seatNo || ''} 
                      onChange={(e) => handleInputChange('seatNo', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">{currentStudent.seatNo || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admission Date</p>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={currentStudent.admissionDate || ''} 
                      onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">
                      {currentStudent.admissionDate ? format(new Date(currentStudent.admissionDate), "dd MMM yyyy") : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {isEditing ? (
                    <Select
                      value={currentStudent.status || ''}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="font-medium">
                      {currentStudent.status || 'active'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 border-b pb-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Contact Information</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    {isEditing ? (
                      <Input 
                        type="email"
                        value={currentStudent.email || ''} 
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{currentStudent.email}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    {isEditing ? (
                      <Input 
                        value={currentStudent.phone || ''} 
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{currentStudent.phone}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    {isEditing ? (
                      <Input 
                        value={currentStudent.whatsapp || ''} 
                        onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{currentStudent.whatsapp || currentStudent.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Address</p>
                  {isEditing ? (
                    <Textarea 
                      value={currentStudent.address || ''} 
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">{currentStudent.address || '-'}</p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    {isEditing ? (
                      <Input 
                        value={currentStudent.city || ''} 
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{currentStudent.city || '-'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">State</p>
                    {isEditing ? (
                      <Input 
                        value={currentStudent.state || ''} 
                        onChange={(e) => handleInputChange('state', e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{currentStudent.state || '-'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pincode</p>
                    {isEditing ? (
                      <Input 
                        value={currentStudent.pincode || ''} 
                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{currentStudent.pincode || '-'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Identification */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 border-b pb-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Identification</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID Proof Type</p>
                  {isEditing ? (
                    <Select
                      value={currentStudent.idProofType || ''}
                      onValueChange={(value) => handleInputChange('idProofType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID proof type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aadhar">Aadhar Card</SelectItem>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="driving">Driving License</SelectItem>
                        <SelectItem value="voter">Voter ID</SelectItem>
                        <SelectItem value="pan">PAN Card</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{currentStudent.idProofType || '-'}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID Proof Number</p>
                  {isEditing ? (
                    <Input 
                      value={currentStudent.idProofNumber || ''} 
                      onChange={(e) => handleInputChange('idProofNumber', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">{currentStudent.idProofNumber || '-'}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">ID Proof Front</p>
                  <div className="h-32 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">ID Proof Front</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">ID Proof Back</p>
                  <div className="h-32 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">ID Proof Back</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form and T&C */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div id="library-form" style={a4Style} className="space-y-4">
                {/* Header */}
                <div className="text-center border-b pb-2">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="h-16 w-16">
                      <img 
                        src="/logo.png" 
                        alt="Library Logo" 
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Library Admission Form</h2>
                      <p className="text-xs text-muted-foreground">Academic Year 2024-2025</p>
                    </div>
                  </div>
                </div>

                {/* Photo and Basic Info Section */}
                <div className="flex gap-4">
                  {/* Photo Section */}
                  <div className="w-24 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
                    <div className="w-20 h-28 bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-xs text-muted-foreground text-center">Passport Size Photo</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">3.5 x 4.5 cm</p>
                  </div>

                  {/* Basic Info */}
                  <div className="flex-1 flex items-center">
                    <div className="w-full grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Student ID</Label>
                        <Input value={currentStudent.id} readOnly className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Admission Date</Label>
                        <Input 
                          value={currentStudent.admissionDate ? format(new Date(currentStudent.admissionDate), "dd MMM yyyy") : '-'} 
                          readOnly 
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Information */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Full Name</Label>
                    <Input value={currentStudent.name} readOnly className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Father's Name</Label>
                    <Input value={currentStudent.fatherName || '-'} readOnly className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Course</Label>
                    <Input value={currentStudent.course || '-'} readOnly className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Date of Birth</Label>
                    <Input 
                      value={currentStudent.dateOfBirth ? format(new Date(currentStudent.dateOfBirth), "dd MMM yyyy") : '-'} 
                      readOnly 
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Gender</Label>
                    <Input value={currentStudent.gender || '-'} readOnly className="h-8 text-sm" />
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-1">
                  <Label className="text-xs">Address</Label>
                  <Textarea value={currentStudent.address || '-'} readOnly className="h-16 text-sm" />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">City</Label>
                      <Input value={currentStudent.city || '-'} readOnly className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">State</Label>
                      <Input value={currentStudent.state || '-'} readOnly className="h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Pincode</Label>
                      <Input value={currentStudent.pincode || '-'} readOnly className="h-8 text-sm" />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Phone Number</Label>
                    <Input value={currentStudent.phone || '-'} readOnly className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">WhatsApp Number</Label>
                    <Input value={currentStudent.whatsapp || currentStudent.phone || '-'} readOnly className="h-8 text-sm" />
                  </div>
                </div>

                {/* ID Proof Information */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">ID Proof Type</Label>
                    <Input value={currentStudent.idProofType || '-'} readOnly className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">ID Proof Number</Label>
                    <Input value={currentStudent.idProofNumber || '-'} readOnly className="h-8 text-sm" />
                  </div>
                </div>

                <Separator className="my-2" />

                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Terms and Conditions</h4>
                  <div className="space-y-1 text-xs">
                    <p>1. The student agrees to pay the due amount within the specified due date.</p>
                    <p>2. Late payments will incur additional charges as per the institution's policy.</p>
                    <p>3. The student is responsible for maintaining their contact information up to date.</p>
                    <p>4. The institution reserves the right to take appropriate action for non-payment.</p>
                    <p>5. The student must maintain good conduct and follow all institutional rules.</p>
                    <p>6. The institution may suspend or terminate services for violation of terms.</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(Boolean(checked))}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the terms and conditions
                    </label>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Student Signature</Label>
                    <div 
                      className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50"
                      onClick={() => openSignaturePad('student')}
                    >
                      {studentSignature ? (
                        <img src={studentSignature} alt="Student Signature" className="h-full w-auto" />
                      ) : (
                        <p className="text-xs text-muted-foreground">Click to sign</p>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium">{currentStudent.name}</p>
                      <p className="text-xs text-muted-foreground">Student</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Authorities Signature</Label>
                    <div 
                      className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50"
                      onClick={() => openSignaturePad('authority')}
                    >
                      {authoritySignature ? (
                        <img src={authoritySignature} alt="Authority Signature" className="h-full w-auto" />
                      ) : (
                        <p className="text-xs text-muted-foreground">Click to sign</p>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium">Authorized Signatory</p>
                      <p className="text-xs text-muted-foreground">Institution</p>
                    </div>
                  </div>
                </div>

                {/* Date and Place */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Date</Label>
                    <Input type="date" value={format(new Date(), 'yyyy-MM-dd')} readOnly className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Place</Label>
                    <Input value={currentStudent.city || '-'} readOnly className="h-8 text-sm" />
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-muted-foreground mt-2">
                  <p>This is a computer-generated document and does not require a physical signature.</p>
                  <p>For any queries, please contact the library administration office.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile; 