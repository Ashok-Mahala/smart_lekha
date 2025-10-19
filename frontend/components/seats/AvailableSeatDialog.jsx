import React, { useRef, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, BookOpen, GraduationCap, Clock, User, Mail, Phone, Camera, File, ChevronDown, IndianRupee, Search } from "lucide-react";
import PropTypes from 'prop-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  assignStudentToSeat,
  getSeatsByProperty
} from "@/api/seats";
import { 
  createStudent,
  searchStudentsForAssignment
} from "@/api/students";

const AvailableSeatDialog = ({ open, onOpenChange, seatNumber, seatId, shifts = [], propertyId, onConfirm }) => {
  const [date, setDate] = useState(new Date());
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
  const [collectedFee, setCollectedFee] = useState('');
  const [existingStudents, setExistingStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const profilePhotoRef = useRef(null);
  const identityProofRef = useRef(null);

  // Load existing students when dialog opens
  useEffect(() => {
    if (open && propertyId) {
      loadExistingStudents();
    }
  }, [open, propertyId]);

  // Update fee when shift changes
  useEffect(() => {
    if (shift) {
      const selectedShift = shifts.find(s => s._id === shift);
      if (selectedShift) {
        setFee(selectedShift.fee?.toString() || '');
        setCollectedFee(selectedShift.fee?.toString() || '');
      }
    } else {
      setFee('');
      setCollectedFee('');
    }
  }, [shift, shifts]);

  const loadExistingStudents = async () => {
    try {
      // Use the new search function or updated getStudentsByProperty
      const response = await searchStudentsForAssignment(propertyId, '');
      setExistingStudents(response.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      let studentId = selectedStudent;
  
      // If creating new student, create student first
      if (isCreatingNew || !selectedStudent) {
        if (!name || !email || !phone) {
          alert('Please fill in all required student information');
          setIsLoading(false);
          return;
        }
  
        // Create student data
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
  
        // Create FormData for student creation if files are present
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
  
        // Create new student
        const newStudent = await createStudent(studentFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        console.log('New student response:', newStudent);
        
        // FIX: Access the student ID correctly from the response
        studentId = newStudent.data._id;
        console.log('Student ID to use for assignment:', studentId);
      }
  
      // Now assign student to seat
      const assignmentData = {
        studentId: studentId,
        shiftId: shift,
        startDate: date.toISOString(),
        feeDetails: {
          amount: parseFloat(fee),
          collected: parseFloat(collectedFee),
          balance: parseFloat(fee) - parseFloat(collectedFee)
        }
        // REMOVED: createdBy: 'user' - this was causing the error
      };
  
      console.log('Sending assignment data:', assignmentData);
  
      await assignStudentToSeat(seatId, assignmentData);
  
      onOpenChange(false);
      onConfirm();
      
      // Reset form
      resetForm();
      
    } catch (error) {
      console.error('Assignment failed:', error);
      alert(error.response?.data?.message || 'Assignment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setShift('');
    setCourse('');
    setInstitution('');
    setAadharNumber('');
    setProfilePhoto(null);
    setIdentityProof(null);
    setFee('');
    setCollectedFee('');
    setSelectedStudent('');
    setSearchQuery('');
    setIsCreatingNew(false);
    setDate(new Date());
  };

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
    }
  };

  const triggerFileInput = (ref) => {
    ref.current.click();
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudent(studentId);
    if (studentId) {
      setIsCreatingNew(false);
      const student = existingStudents.find(s => s._id === studentId);
      if (student) {
        setName(`${student.firstName} ${student.lastName}`.trim());
        setEmail(student.email);
        setPhone(student.phone);
        setCourse(student.course || '');
        setInstitution(student.institution || '');
        setAadharNumber(student.aadharNumber || '');
      }
    }
  };

  const filteredStudents = existingStudents.filter(student =>
    student.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.phone?.includes(searchQuery)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl font-bold">Assign Seat {seatNumber}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Assign a student to this seat
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Student Selection Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Select Student
            </h3>
            
            {/* Search and Select Existing Student */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingNew(true);
                    setSelectedStudent('');
                    setName('');
                    setEmail('');
                    setPhone('');
                    setCourse('');
                    setInstitution('');
                    setAadharNumber('');
                  }}
                >
                  New Student
                </Button>
              </div>

              {!isCreatingNew && searchQuery && (
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {filteredStudents.map(student => (
                    <div
                      key={student._id}
                      className={`p-2 cursor-pointer hover:bg-accent ${
                        selectedStudent === student._id ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleStudentSelect(student._id)}
                    >
                      <div className="font-medium">{student.firstName} {student.lastName}</div>
                      <div className="text-sm text-muted-foreground">{student.email} • {student.phone}</div>
                    </div>
                  ))}
                  {filteredStudents.length === 0 && (
                    <div className="p-2 text-muted-foreground text-center">
                      No students found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Student Information Section (shown when creating new or when student is selected) */}
          {(isCreatingNew || selectedStudent) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {isCreatingNew ? 'New Student Information' : 'Student Information'}
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Educational Information Section */}
          {(isCreatingNew || selectedStudent) && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Educational Information
              </h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="institution" className="text-right">
                    Institution
                  </Label>
                  <Input
                    id="institution"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter institution name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="course" className="text-right">
                    Course
                  </Label>
                  <Input
                    id="course"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter course name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Assignment Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Assignment Details
            </h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shift" className="text-right">
                  Shift *
                </Label>
                <Select value={shift} onValueChange={setShift} required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shiftItem) => (
                      <SelectItem 
                        key={shiftItem._id} 
                        value={shiftItem._id}
                      >
                        {shiftItem.name} ({shiftItem.startTime} - {shiftItem.endTime}) - ₹{shiftItem.fee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Start Date *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="col-span-3 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Select start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fee" className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    <IndianRupee className="h-4 w-4" /> Fee
                  </span>
                </Label>
                <Input
                  id="fee"
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="col-span-3"
                  placeholder="Fee amount"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="collectedFee" className="text-right">
                  <span className="flex items-center justify-end gap-1">
                    <IndianRupee className="h-4 w-4" /> Collected Fee
                  </span>
                </Label>
                <Input
                  id="collectedFee"
                  type="number"
                  value={collectedFee}
                  onChange={(e) => setCollectedFee(e.target.value)}
                  className="col-span-3"
                  placeholder="Collected fee amount"
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section (only for new students) */}
          {isCreatingNew && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold flex items-center gap-2">
                  <File className="h-5 w-5 text-primary" />
                  Additional Information
                </span>
              </div>

              <div className="grid gap-4 pt-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="aadhar" className="text-right">
                    Aadhar No.
                  </Label>
                  <Input
                    id="aadhar"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter Aadhar number"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Profile Photo
                  </Label>
                  <div className="col-span-3">
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
                    >
                      <Camera className="h-4 w-4" />
                      {profilePhoto ? profilePhoto.name : 'Upload Profile Photo'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">
                    Identity Proof
                  </Label>
                  <div className="col-span-3">
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
                    >
                      <Camera className="h-4 w-4" />
                      {identityProof ? identityProof.name : 'Upload Identity Proof'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="bg-primary hover:bg-primary/90"
            disabled={isLoading || !shift || !date || (!selectedStudent && (!name || !email || !phone))}
          >
            {isLoading ? 'Assigning...' : 'Assign Student'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

AvailableSeatDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  seatNumber: PropTypes.string.isRequired,
  seatId: PropTypes.string.isRequired,
  propertyId: PropTypes.string.isRequired,
  shifts: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      fee: PropTypes.number.isRequired,
    })
  ),
};

AvailableSeatDialog.defaultProps = {
  shifts: [],
};

export default AvailableSeatDialog;