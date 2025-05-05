import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';
import { 
  Loader2, 
  Upload, 
  ArrowLeft, 
  User, 
  BookOpen, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Building2,
  Shield,
  CreditCard,
  X,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { studentSchema } from '@/lib/validations';
import { apiService } from '@/services/api';
import { handleFormErrors } from '@/lib/errorHandler';
import { getActiveShifts } from '@/api/shifts';
import { getAvailableSeats, getSeatsBySection } from '@/api/seats';

const AddStudentPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [idProofFrontPreview, setIdProofFrontPreview] = useState(null);
  const [idProofBackPreview, setIdProofBackPreview] = useState(null);
  const [showSeatDialog, setShowSeatDialog] = useState(false);
  
  // State for shifts and seats
  const [availableShifts, setAvailableShifts] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  
  // Load shifts when component mounts
  useEffect(() => {
    const loadShifts = async () => {
      setIsLoadingShifts(true);
      try {
        const shiftsData = await getActiveShifts();
        if (shiftsData && shiftsData.length > 0) {
          setAvailableShifts(shiftsData.map(shift => ({
            id: shift.id,
            name: shift.name
          })));
        } else {
          // Fallback to default shifts if API doesn't return any
          setAvailableShifts([
            { id: 'morning', name: 'Morning Shift' },
            { id: 'afternoon', name: 'Afternoon Shift' },
            { id: 'evening', name: 'Evening Shift' }
          ]);
        }
      } catch (error) {
        console.error('Failed to load shifts:', error);
        toast({
          title: "Error",
          description: "Failed to load shifts",
          variant: "destructive",
        });
        // Set default shifts if API fails
        setAvailableShifts([
          { id: 'morning', name: 'Morning Shift' },
          { id: 'afternoon', name: 'Afternoon Shift' },
          { id: 'evening', name: 'Evening Shift' }
        ]);
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
  
  const loadSeats = async () => {
    setIsLoadingSeats(true);
    try {
      // Try to get available seats from API
      const params = {
        date: new Date().toISOString().split('T')[0],
        shift: form.watch('shift') || 'morning'
      };
      
      const seatsData = await getAvailableSeats(params);
      
      if (seatsData && seatsData.length > 0) {
        // Group seats by section
        const sectionMap = {};
        seatsData.forEach(seat => {
          if (!sectionMap[seat.section]) {
            sectionMap[seat.section] = [];
          }
          sectionMap[seat.section].push({
            id: seat.id,
            status: seat.status,
            ...seat
          });
        });
        
        // Convert to array format for rendering
        const formattedSeats = Object.keys(sectionMap).map(section => ({
          section,
          seats: sectionMap[section]
        }));
        
        setAvailableSeats(formattedSeats);
      } else {
        // If no seats available, get all seats by section as fallback
        const sections = ['A', 'B', 'C']; // Default sections
        const sectionData = await Promise.all(
          sections.map(async section => {
            try {
              const seats = await getSeatsBySection(section);
              return {
                section,
                seats: seats.map(seat => seat.seatNumber || seat) // Handle different API responses
              };
            } catch (error) {
              return { section, seats: [`${section}1`, `${section}2`, `${section}3`, `${section}4`, `${section}5`] };
            }
          })
        );
        setAvailableSeats(sectionData);
      }
    } catch (error) {
      console.error('Failed to load seats:', error);
      toast({
        title: "Error",
        description: "Failed to load seats",
        variant: "destructive",
      });
      // Set default seats if API fails
      setAvailableSeats([
        { section: 'A', seats: ['A1', 'A2', 'A3', 'A4', 'A5'] },
        { section: 'B', seats: ['B1', 'B2', 'B3', 'B4', 'B5'] },
        { section: 'C', seats: ['C1', 'C2', 'C3', 'C4', 'C5'] }
      ]);
    } finally {
      setIsLoadingSeats(false);
    }
  };

  // Initialize form with react-hook-form and zod validation
  const form = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      // Personal Information
      name: "",
      fatherName: "",
      dateOfBirth: new Date(),
      gender: "male",
      
      // Academic Information
      studentId: "",
      admissionDate: new Date(),
      course: "",
      shift: "morning",
      seatNo: "",
      
      // Contact Information
      email: "",
      phone: "",
      whatsapp: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      
      // Identification
      idProofType: "aadhar",
      idProofNumber: "",
      
      // Additional Information
      status: "active",
      notes: "",
    }
  });

  // File state is managed separately from form data
  const [photo, setPhoto] = useState(null);
  const [idProofFront, setIdProofFront] = useState(null);
  const [idProofBack, setIdProofBack] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        toast({
          title: "Invalid File",
          description: "Please upload a valid image file (JPEG, PNG, GIF)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setPhoto(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdProofFrontChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validFileTypes.includes(file.type)) {
        toast({
          title: "Invalid File",
          description: "Please upload a valid file (PDF, JPEG, PNG)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setIdProofFront(file);
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setIdProofFrontPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setIdProofFrontPreview(null);
      }
    }
  };

  const handleIdProofBackChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validFileTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validFileTypes.includes(file.type)) {
        toast({
          title: "Invalid File",
          description: "Please upload a valid file (PDF, JPEG, PNG)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setIdProofBack(file);
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setIdProofBackPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setIdProofBackPreview(null);
      }
    }
  };

  const handleSeatSelect = (seatId) => {
    form.setValue('seatNo', seatId);
    setShowSeatDialog(false);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      // Create a FormData object for file uploads
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.keys(data).forEach(key => {
        if (key === 'dateOfBirth' || key === 'admissionDate') {
          formData.append(key, data[key].toISOString());
        } else {
          formData.append(key, data[key]);
        }
      });
      
      // Add file fields if they exist
      if (photo) formData.append('photo', photo);
      if (idProofFront) formData.append('idProofFront', idProofFront);
      if (idProofBack) formData.append('idProofBack', idProofBack);
      
      // Call API using the enhanced error handling
      await apiService.students.createStudent(formData, {
        form, // Pass the form for field-level errors
        showToast: true,
      });
      
      toast({
        title: "Success",
        description: "Student added successfully",
      });
      
      navigate('/students');
    } catch (error) {
      // Our error handling is now within apiService through withErrorHandling
      // No need for manual error handling here
      console.error('Failed to add student:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add PropTypes validation
  AddStudentPage.propTypes = {
    isSubmitting: PropTypes.bool,
    photoPreview: PropTypes.string,
    idProofFrontPreview: PropTypes.string,
    idProofBackPreview: PropTypes.string,
    showSeatDialog: PropTypes.bool,
    formData: PropTypes.shape({
      name: PropTypes.string.isRequired,
      fatherName: PropTypes.string.isRequired,
      dateOfBirth: PropTypes.instanceOf(Date).isRequired,
      gender: PropTypes.string.isRequired,
      studentId: PropTypes.string.isRequired,
      admissionDate: PropTypes.instanceOf(Date).isRequired,
      course: PropTypes.string.isRequired,
      shift: PropTypes.string.isRequired,
      seatNo: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      phone: PropTypes.string.isRequired,
      whatsapp: PropTypes.string,
      address: PropTypes.string.isRequired,
      city: PropTypes.string.isRequired,
      state: PropTypes.string.isRequired,
      pincode: PropTypes.string.isRequired,
      idProofFront: PropTypes.instanceOf(File),
      idProofBack: PropTypes.instanceOf(File),
      idProofType: PropTypes.string.isRequired,
      idProofNumber: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      notes: PropTypes.string,
      photo: PropTypes.instanceOf(File)
    }).isRequired
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="max-h-[600px] overflow-y-auto pr-4 space-y-8">
                {/* Personal Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Personal Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="name"
                          name="name"
                          value={form.watch('name')}
                          onChange={form.handleChange('name')}
                          placeholder="Enter student's full name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fatherName">Father's/Husband's Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="fatherName"
                          name="fatherName"
                          value={form.watch('fatherName')}
                          onChange={form.handleChange('fatherName')}
                          placeholder="Enter father's/husband's name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth <span className="text-red-500">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {form.watch('dateOfBirth') ? (
                                format(form.watch('dateOfBirth'), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={form.watch('dateOfBirth')}
                              onSelect={(date) => form.setValue('dateOfBirth', date || new Date())}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                        <Select
                          value={form.watch('gender')}
                          onValueChange={(value) => form.setValue('gender', value)}
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
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="photo">Student Photo</Label>
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-3 h-32 w-40 relative">
                          {photoPreview ? (
                            <>
                              <img 
                                src={photoPreview} 
                                alt="Student photo preview" 
                                className="h-full w-auto object-contain"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 hover:bg-background"
                                onClick={() => {
                                  setPhotoPreview(null);
                                  form.setValue('photo', null);
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                              <p className="text-xs text-muted-foreground text-center mb-1">
                                Drag & drop or click to upload
                              </p>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => document.getElementById('photo')?.click()}
                              >
                                <Upload className="mr-1 h-3 w-3" />
                                Upload Photo
                              </Button>
                            </>
                          )}
                          <input
                            type="file"
                            id="photo"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: Square image, max 5MB (JPEG, PNG, GIF)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Academic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Academic Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentId">Student ID <span className="text-red-500">*</span></Label>
                        <Input
                          id="studentId"
                          name="studentId"
                          value={form.watch('studentId')}
                          onChange={form.handleChange('studentId')}
                          placeholder="Enter student ID"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admissionDate">Admission Date <span className="text-red-500">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-start text-left font-normal"
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {form.watch('admissionDate') ? (
                                format(form.watch('admissionDate'), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={form.watch('admissionDate')}
                              onSelect={(date) => form.setValue('admissionDate', date || new Date())}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="course">Course <span className="text-red-500">*</span></Label>
                        <Input
                          id="course"
                          name="course"
                          value={form.watch('course')}
                          onChange={form.handleChange('course')}
                          placeholder="Enter course name"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="shift">Shift <span className="text-red-500">*</span></Label>
                        <Select
                          value={form.watch('shift')}
                          onValueChange={(value) => form.setValue('shift', value)}
                          disabled={isLoadingShifts}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isLoadingShifts ? "Loading shifts..." : "Select shift"} />
                          </SelectTrigger>
                          <SelectContent>
                            {isLoadingShifts ? (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading shifts...</span>
                              </div>
                            ) : availableShifts.length > 0 ? (
                              availableShifts.map(shift => (
                                <SelectItem key={shift.id} value={shift.id}>
                                  {shift.name}
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
                        <Label htmlFor="seatNo">Seat Number</Label>
                        <div className="flex gap-2">
                          <Input
                            id="seatNo"
                            name="seatNo"
                            value={form.watch('seatNo')}
                            onChange={form.handleChange('seatNo')}
                            placeholder="Enter seat number"
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
                                            key={seat}
                                            variant={seat.status === "occupied" ? "outline" : "default"}
                                            className={`h-12 ${
                                              seat.status === "occupied" 
                                                ? "opacity-50 cursor-not-allowed" 
                                                : "cursor-pointer"
                                            }`}
                                            disabled={seat.status === "occupied"}
                                            onClick={() => handleSeatSelect(seat)}
                                          >
                                            {seat}
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
                
                {/* Contact Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Contact Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={form.watch('email')}
                          onChange={form.handleChange('email')}
                          placeholder="Enter student's email"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={form.watch('phone')}
                          onChange={form.handleChange('phone')}
                          placeholder="Enter student's phone number"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp Number</Label>
                        <Input
                          id="whatsapp"
                          name="whatsapp"
                          value={form.watch('whatsapp')}
                          onChange={form.handleChange('whatsapp')}
                          placeholder="Enter WhatsApp number (if different from phone)"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="address">Address <span className="text-red-500">*</span></Label>
                        <Textarea
                          id="address"
                          name="address"
                          value={form.watch('address')}
                          onChange={form.handleChange('address')}
                          placeholder="Enter student's address"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            value={form.watch('city')}
                            onChange={form.handleChange('city')}
                            placeholder="City"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            name="state"
                            value={form.watch('state')}
                            onChange={form.handleChange('state')}
                            placeholder="State"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode"
                            name="pincode"
                            value={form.watch('pincode')}
                            onChange={form.handleChange('pincode')}
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Additional Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Additional Information</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="idProofType">ID Proof Type <span className="text-red-500">*</span></Label>
                        <Select
                          value={form.watch('idProofType')}
                          onValueChange={(value) => form.setValue('idProofType', value)}
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
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="idProofNumber">ID Proof Number <span className="text-red-500">*</span></Label>
                        <Input
                          id="idProofNumber"
                          name="idProofNumber"
                          value={form.watch('idProofNumber')}
                          onChange={form.handleChange('idProofNumber')}
                          placeholder="Enter ID proof number"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>ID Proof Documents</Label>
                        <div className="flex gap-6">
                          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4 h-48 w-72 relative">
                            {idProofFrontPreview ? (
                              <>
                                <img 
                                  src={idProofFrontPreview} 
                                  alt="ID proof front preview" 
                                  className="h-full w-auto object-contain"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                                  onClick={() => {
                                    setIdProofFrontPreview(null);
                                    form.setValue('idProofFront', null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground text-center mb-2">
                                  Front side
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="default"
                                  onClick={() => document.getElementById('idProofFront')?.click()}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload
                                </Button>
                              </>
                            )}
                            <input
                              type="file"
                              id="idProofFront"
                              accept="image/*,.pdf"
                              onChange={handleIdProofFrontChange}
                              className="hidden"
                            />
                          </div>

                          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-4 h-48 w-72 relative">
                            {idProofBackPreview ? (
                              <>
                                <img 
                                  src={idProofBackPreview} 
                                  alt="ID proof back preview" 
                                  className="h-full w-auto object-contain"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                                  onClick={() => {
                                    setIdProofBackPreview(null);
                                    form.setValue('idProofBack', null);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground text-center mb-2">
                                  Back side
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="default"
                                  onClick={() => document.getElementById('idProofBack')?.click()}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload
                                </Button>
                              </>
                            )}
                            <input
                              type="file"
                              id="idProofBack"
                              accept="image/*,.pdf"
                              onChange={handleIdProofBackChange}
                              className="hidden"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Accepted formats: PDF, JPEG, PNG (max 5MB)
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={form.watch('status')}
                          onValueChange={(value) => form.setValue('status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          value={form.watch('notes')}
                          onChange={form.handleChange('notes')}
                          placeholder="Enter any additional notes about the student"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/students/list')}
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