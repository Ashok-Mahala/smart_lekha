import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { 
  Loader2, 
  Upload, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Camera, 
  File,
  GraduationCap,
  BookOpen,
  Search,
  IndianRupee
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { getShifts } from '@/api/shifts';
import { getSeatsByProperty as getAvailableSeats } from '@/api/seats';
import { createStudent, searchStudentsForAssignment } from "@/api/students";

const AddStudentPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSeatDialog, setShowSeatDialog] = useState(false);
  
  // Student form state - same as AvailableSeatDialog
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shift, setShift] = useState('');
  const [course, setCourse] = useState('');
  const [institution, setInstitution] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [identityProof, setIdentityProof] = useState(null);
  const [fee, setFee] = useState('');
  const [existingStudents, setExistingStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(true); // Always true for add student page
  
  // State for shifts and seats
  const [availableShifts, setAvailableShifts] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  
  const profilePhotoRef = useRef(null);
  const identityProofRef = useRef(null);

  // Load shifts when component mounts
  useEffect(() => {
    const loadShifts = async () => {
      setIsLoadingShifts(true);
      try {
        const shiftsData = await getShifts();
        if (shiftsData && shiftsData.length > 0) {
          setAvailableShifts(shiftsData);
        }
      } catch (error) {
        console.error('Failed to load shifts:', error);
        toast({
          title: "Error",
          description: "Failed to load shifts",
          variant: "destructive",
        });
      } finally {
        setIsLoadingShifts(false);
      }
    };
    
    loadShifts();
  }, [toast]);

  // Load seats when dialog opens
  useEffect(() => {
    if (showSeatDialog) {
      loadSeats();
    }
  }, [showSeatDialog]);

  // Update fee when shift changes - same as AvailableSeatDialog
  useEffect(() => {
    if (shift) {
      const selectedShift = availableShifts.find(s => s._id === shift);
      if (selectedShift) {
        setFee(selectedShift.fee?.toString() || '');
      }
    } else {
      setFee('');
    }
  }, [shift, availableShifts]);

  const loadSeats = async () => {
    setIsLoadingSeats(true);
    try {
      const params = {
        date: new Date().toISOString().split('T')[0],
        shift: shift || availableShifts[0]?._id
      };
      
      const seatsData = await getAvailableSeats(params);
      
      if (seatsData && seatsData.length > 0) {
        const sectionMap = {};
        seatsData.forEach(seat => {
          if (!sectionMap[seat.section]) {
            sectionMap[seat.section] = [];
          }
          sectionMap[seat.section].push({
            id: seat.id,
            number: seat.seatNumber,
            status: seat.status,
            ...seat
          });
        });
        
        const formattedSeats = Object.keys(sectionMap).map(section => ({
          section,
          seats: sectionMap[section]
        }));
        
        setAvailableSeats(formattedSeats);
      } else {
        // Fallback to default seats
        setAvailableSeats([
          { section: 'A', seats: [
            { id: 'A1', number: 'A1', status: 'available' },
            { id: 'A2', number: 'A2', status: 'available' },
            { id: 'A3', number: 'A3', status: 'available' }
          ]},
          { section: 'B', seats: [
            { id: 'B1', number: 'B1', status: 'available' },
            { id: 'B2', number: 'B2', status: 'available' },
            { id: 'B3', number: 'B3', status: 'available' }
          ]}
        ]);
      }
    } catch (error) {
      console.error('Failed to load seats:', error);
      toast({
        title: "Error",
        description: "Failed to load seats",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSeats(false);
    }
  };

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
    }
  };

  const triggerFileInput = (ref) => {
    ref.current?.click();
  };

  const handleSeatSelect = (seat) => {
    // Set the selected seat - you can store this in state if needed
    console.log('Selected seat:', seat);
    setShowSeatDialog(false);
    toast({
      title: "Seat Selected",
      description: `Seat ${seat.number} has been selected`,
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required fields - same as AvailableSeatDialog
      if (!name || !email || !phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required student information",
          variant: "destructive",
        });
        return;
      }

      // Create student data - same as AvailableSeatDialog
      const studentData = {
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || '',
        email,
        phone,
        course,
        institution,
        aadharNumber,
        status: 'active'
      };

      // Create FormData for student creation - same as AvailableSeatDialog
      const studentFormData = new FormData();
      studentFormData.append('firstName', studentData.firstName);
      studentFormData.append('lastName', studentData.lastName);
      studentFormData.append('email', studentData.email);
      studentFormData.append('phone', studentData.phone);
      studentFormData.append('course', studentData.course || '');
      studentFormData.append('institution', studentData.institution || '');
      studentFormData.append('aadharNumber', studentData.aadharNumber || '');
      
      if (profilePhoto) {
        studentFormData.append('documents', profilePhoto);
      }
      if (identityProof) {
        studentFormData.append('documents', identityProof);
      }

      // Create new student - same API call as AvailableSeatDialog
      const newStudent = await createStudent(studentFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('New student created:', newStudent);

      toast({
        title: "Success",
        description: "Student added successfully",
      });
      
      navigate('/students');
      
    } catch (error) {
      console.error('Failed to add student:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            <h1 className="text-3xl font-bold">Add New Student</h1>
            <p className="text-muted-foreground">
              Fill in the details to register a new student
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>
              Please provide all the required information about the student
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-8">
                {/* Student Information Section - Same as AvailableSeatDialog */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Student Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter full name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter email address"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Phone *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter phone number"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Educational Information - Same as AvailableSeatDialog */}
                      <div className="space-y-2">
                        <Label htmlFor="institution" className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-primary" />
                          Institution
                        </Label>
                        <Input
                          id="institution"
                          value={institution}
                          onChange={(e) => setInstitution(e.target.value)}
                          placeholder="Enter institution name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="course" className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          Course
                        </Label>
                        <Input
                          id="course"
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          placeholder="Enter course name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="aadhar">
                          Aadhar Number
                        </Label>
                        <Input
                          id="aadhar"
                          value={aadharNumber}
                          onChange={(e) => setAadharNumber(e.target.value)}
                          placeholder="Enter Aadhar number"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assignment Details Section - Same as AvailableSeatDialog */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Assignment Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="shift">
                          Shift *
                        </Label>
                        <Select value={shift} onValueChange={setShift} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shift" />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingShifts ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading shifts...</span>
                              </div>
                            ) : availableShifts.length > 0 ? (
                              availableShifts.map((shiftItem) => (
                                <SelectItem 
                                  key={shiftItem._id} 
                                  value={shiftItem._id}
                                >
                                  {shiftItem.name} ({shiftItem.startTime} - {shiftItem.endTime}) - ₹{shiftItem.fee}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-center text-muted-foreground">
                                No shifts available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fee" className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4" />
                          Fee
                        </Label>
                        <Input
                          id="fee"
                          type="number"
                          value={fee}
                          onChange={(e) => setFee(e.target.value)}
                          placeholder="Fee amount"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="seat">
                          Seat Number
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="seat"
                            placeholder="Select a seat"
                            readOnly
                          />
                          <Dialog open={showSeatDialog} onOpenChange={setShowSeatDialog}>
                            <DialogTrigger asChild>
                              <Button variant="outline" disabled={isLoadingSeats}>
                                {isLoadingSeats ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                  </>
                                ) : (
                                  "Select Seat"
                                )}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Select a Seat</DialogTitle>
                                <DialogDescription>
                                  Choose an available seat for the student
                                </DialogDescription>
                              </DialogHeader>
                              {isLoadingSeats ? (
                                <div className="flex items-center justify-center p-8">
                                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                  <span>Loading seat map...</span>
                                </div>
                              ) : availableSeats.length > 0 ? (
                                <div className="space-y-4 py-4">
                                  {availableSeats.map(section => (
                                    <div key={section.section} className="space-y-2">
                                      <h4 className="font-medium">Section {section.section}</h4>
                                      <div className="grid grid-cols-5 gap-2">
                                        {section.seats.map(seat => (
                                          <Button
                                            key={seat.id}
                                            variant={seat.status === "occupied" ? "outline" : "default"}
                                            className={`h-12 ${
                                              seat.status === "occupied" 
                                                ? "opacity-50 cursor-not-allowed" 
                                                : "cursor-pointer"
                                            }`}
                                            disabled={seat.status === "occupied"}
                                            onClick={() => handleSeatSelect(seat)}
                                          >
                                            {seat.number}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                  No seats available
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information Section - Same as AvailableSeatDialog */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold flex items-center gap-2">
                      <File className="h-5 w-5 text-primary" />
                      Additional Information
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>
                        Profile Photo
                      </Label>
                      <div>
                        <input
                          type="file"
                          ref={profilePhotoRef}
                          onChange={(e) => handleFileChange(e, setProfilePhoto)}
                          accept="image/*,.pdf"
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          className="w-full flex items-center gap-2"
                          onClick={() => triggerFileInput(profilePhotoRef)}
                          type="button"
                        >
                          <Camera className="h-4 w-4" />
                          {profilePhoto ? profilePhoto.name : 'Upload Profile Photo'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Identity Proof
                      </Label>
                      <div>
                        <input
                          type="file"
                          ref={identityProofRef}
                          onChange={(e) => handleFileChange(e, setIdentityProof)}
                          accept="image/*"
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          className="w-full flex items-center gap-2"
                          onClick={() => triggerFileInput(identityProofRef)}
                          type="button"
                        >
                          <Camera className="h-4 w-4" />
                          {identityProof ? identityProof.name : 'Upload Identity Proof'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/students')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Student...
                    </>
                  ) : (
                    'Add Student'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddStudentPage;