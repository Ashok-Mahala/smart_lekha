import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, Calendar, Clock, User, Building2, Bookmark, FileText, IndianRupee, Image, Upload } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import PropTypes from 'prop-types';
import { getAvailableSeats } from "@/api/seats";
import { useToast } from "@/components/ui/use-toast";

const AddBookingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    fatherOrHusbandName: "",
    contactNo: "",
    email: "",
    gender: "",
    age: "",
    address: "",
    emergencyContact: "",
    property: "",
    seatNo: "",
    bookingType: "long", // long or short
    moveInDate: undefined,
    moveOutDate: undefined,
    shift: "",
    fee: "",
    collection: "",
    notes: "",
    whatsappReminder: false,
    profilePhoto: null,
    idPhotoFront: null,
    idPhotoBack: null,
  });

  const [previewUrls, setPreviewUrls] = useState({
    profilePhoto: "",
    idPhotoFront: "",
    idPhotoBack: "",
  });

  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [seats, setSeats] = useState([]);
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [studentsResponse, seatsResponse, shiftsResponse] = await Promise.all([
          fetch('/api/students'),
          fetch('/api/seats'),
          fetch('/api/shifts'),
        ]);
        
        if (!studentsResponse.ok || !seatsResponse.ok || !shiftsResponse.ok) {
          throw new Error('API endpoints not available');
        }
        
        const [studentsData, seatsData, shiftsData] = await Promise.all([
          studentsResponse.json(),
          seatsResponse.json(),
          shiftsResponse.json(),
        ]);
        
        setStudents(studentsData);
        setSeats(seatsData);
        setShifts(shiftsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch available seats
  useEffect(() => {
    const fetchAvailableSeats = async () => {
      try {
        setIsLoadingSeats(true);
        const data = await getAvailableSeats();
        setAvailableSeats(data);
      } catch (error) {
        console.error("Error fetching available seats:", error);
        toast({
          title: "Error",
          description: "Failed to load available seats",
          variant: "destructive",
        });
        setAvailableSeats([]);
      } finally {
        setIsLoadingSeats(false);
      }
    };

    fetchAvailableSeats();
  }, []);

  // Filter available seats based on selected section
  useEffect(() => {
    if (selectedSection && availableSeats.length > 0) {
      const filteredSeats = availableSeats.filter(seat => 
        seat.section === selectedSection && seat.status === "available"
      );
      
      if (filteredSeats.length === 0) {
        toast({
          title: "No seats available",
          description: `No available seats found in section ${selectedSection}`,
        });
      }
    }
  }, [selectedSection, availableSeats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      if (!formData.name || !formData.contactNo || !formData.property || !formData.seatNo || !formData.bookingType || !formData.moveInDate || !formData.shift || !formData.fee) {
        throw new Error("Please fill in all required fields");
      }

      const bookingData = {
        studentName: formData.name,
        fatherOrHusbandName: formData.fatherOrHusbandName,
        contactNo: formData.contactNo,
        email: formData.email,
        gender: formData.gender,
        age: formData.age,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        property: formData.property,
        seatNo: formData.seatNo,
        bookingType: formData.bookingType,
        moveInDate: formData.moveInDate ? format(formData.moveInDate, 'yyyy-MM-dd') : undefined,
        moveOutDate: formData.moveOutDate ? format(formData.moveOutDate, 'yyyy-MM-dd') : undefined,
        shift: formData.shift,
        fee: formData.fee,
        collection: formData.collection,
        notes: formData.notes,
        whatsappReminder: formData.whatsappReminder,
      };

      // Create form data for file uploads
      const formDataObj = new FormData();
      Object.keys(bookingData).forEach(key => {
        if (bookingData[key] !== undefined) {
          formDataObj.append(key, bookingData[key]);
        }
      });
      
      if (formData.profilePhoto) {
        formDataObj.append('profilePhoto', formData.profilePhoto);
      }
      
      if (formData.idPhotoFront) {
        formDataObj.append('idPhotoFront', formData.idPhotoFront);
      }
      
      if (formData.idPhotoBack) {
        formDataObj.append('idPhotoBack', formData.idPhotoBack);
      }

      // Send booking data to API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        body: formDataObj,
      });
      
      if (!response.ok) {
        throw new Error("Failed to create booking");
      }

      toast({
        title: "Booking Created",
        description: "The student booking has been created successfully.",
      });

      navigate('/students');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
    setFormData(prev => ({ ...prev, seatNo: "" })); // Reset seat selection when section changes
  };

  const handleFileChange = (field, file) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        [field]: file,
      }));

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => ({
        ...prev,
        [field]: url,
      }));
    }
  };

  // Get unique sections from available seats
  const sections = [...new Set(availableSeats.map(seat => seat.section))].sort();

  // Get seats filtered by selected section
  const filteredSeats = selectedSection 
    ? availableSeats.filter(seat => seat.section === selectedSection)
    : availableSeats;

  // Cleanup preview URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="default"
                onClick={() => navigate('/students/booking')}
                className="flex items-center gap-2 hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  New Booking
                </h1>
                <p className="text-muted-foreground text-lg">
                  Create a new student seat booking
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-8">
            {/* Personal Information Section */}
            <Card className="border-2 border-primary/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-bold text-primary">Personal Information</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  Enter the student's personal details and identification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="name"
                          placeholder="Enter student's full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fatherOrHusbandName" className="text-sm font-medium">Father/Husband Name</Label>
                        <Input
                          id="fatherOrHusbandName"
                          placeholder="Enter father's or husband's name"
                          value={formData.fatherOrHusbandName}
                          onChange={(e) => handleInputChange('fatherOrHusbandName', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="contactNo" className="text-sm font-medium">Contact Number <span className="text-red-500">*</span></Label>
                        <Input
                          id="contactNo"
                          type="tel"
                          placeholder="Enter contact number"
                          value={formData.contactNo}
                          onChange={(e) => handleInputChange('contactNo', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter email address"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => handleInputChange('gender', value)}
                        >
                          <SelectTrigger id="gender">
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
                        <Label htmlFor="age" className="text-sm font-medium">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="Enter age"
                          value={formData.age}
                          onChange={(e) => handleInputChange('age', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details Section */}
            <Card className="border-2 border-primary/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-bold text-primary">Booking Details</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  Select property, seat, and booking duration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="property" className="text-sm font-medium">Property <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.property}
                          onValueChange={(value) => handleInputChange('property', value)}
                          required
                      >
                          <SelectTrigger id="property">
                          <SelectValue placeholder="Select property" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sb2">SB2 Library</SelectItem>
                            <SelectItem value="sb1">SB1 Library</SelectItem>
                            <SelectItem value="main">Main Library</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="section" className="text-sm font-medium">Section</Label>
                        <Select
                          value={selectedSection}
                          onValueChange={handleSectionChange}
                          disabled={!formData.property || sections.length === 0}
                        >
                          <SelectTrigger id="section">
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            {sections.map((section) => (
                              <SelectItem key={section} value={section}>
                                Section {section}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seatNo" className="text-sm font-medium">Seat Number <span className="text-red-500">*</span></Label>
                      <div className="relative">
                      <Select
                        value={formData.seatNo}
                          onValueChange={(value) => handleInputChange('seatNo', value)}
                          disabled={isLoadingSeats || filteredSeats.length === 0}
                          required
                        >
                          <SelectTrigger id="seatNo">
                            {isLoadingSeats ? (
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading seats...</span>
                              </div>
                            ) : (
                              <SelectValue placeholder="Select seat number" />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {filteredSeats.map((seat) => (
                              <SelectItem key={seat.id} value={seat.id}>
                                {seat.number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bookingType" className="text-sm font-medium">Booking Type <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.bookingType}
                          onValueChange={(value) => handleInputChange('bookingType', value)}
                          required
                      >
                          <SelectTrigger id="bookingType">
                          <SelectValue placeholder="Select booking type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="long">Long Term</SelectItem>
                          <SelectItem value="short">Short Term</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shift" className="text-sm font-medium">Shift <span className="text-red-500">*</span></Label>
                      <Select
                        value={formData.shift}
                          onValueChange={(value) => handleInputChange('shift', value)}
                          required
                      >
                          <SelectTrigger id="shift">
                          <SelectValue placeholder="Select shift" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="morning">Morning (7AM - 2PM)</SelectItem>
                            <SelectItem value="evening">Evening (2PM - 10PM)</SelectItem>
                            <SelectItem value="late">Late Evening (2PM - 12AM)</SelectItem>
                            <SelectItem value="fullDay15">Full Day (7AM - 10PM)</SelectItem>
                            <SelectItem value="fullDay17">Full Day (7AM - 12AM)</SelectItem>
                        </SelectContent>
                      </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="moveInDate" className="text-sm font-medium">Move-In Date <span className="text-red-500">*</span></Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                              id="moveInDate"
                              variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                              !formData.moveInDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                              {formData.moveInDate ? format(formData.moveInDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={formData.moveInDate}
                              onSelect={(date) => handleInputChange('moveInDate', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="moveOutDate" className="text-sm font-medium">Move-Out Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                              id="moveOutDate"
                              variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                              !formData.moveOutDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                              {formData.moveOutDate ? format(formData.moveOutDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={formData.moveOutDate}
                              onSelect={(date) => handleInputChange('moveOutDate', date)}
                            initialFocus
                              disabled={(date) => formData.moveInDate ? date < formData.moveInDate : false}
                          />
                        </PopoverContent>
                      </Popover>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className="border-2 border-primary/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-bold text-primary">Payment Details</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  Enter fee and payment information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="fee" className="text-sm font-medium">Fee Amount <span className="text-red-500">*</span></Label>
                      <Input
                        id="fee"
                        type="number"
                          placeholder="Enter fee amount"
                        value={formData.fee}
                          onChange={(e) => handleInputChange('fee', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="collection" className="text-sm font-medium">Collection Amount</Label>
                      <Input
                        id="collection"
                        type="number"
                          placeholder="Enter collection amount"
                        value={formData.collection}
                          onChange={(e) => handleInputChange('collection', e.target.value)}
                      />
                    </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="border-2 border-primary/10 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-bold text-primary">Additional Notes</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  Add any additional information or notes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Enter any additional notes or comments"
                    className="min-h-[100px]"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isLoading} className="bg-gradient-to-r from-primary to-primary/80">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Booking...
                  </>
                ) : (
                  "Create Booking"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

// Add PropTypes validation
AddBookingPage.propTypes = {
  isLoading: PropTypes.bool,
  formData: PropTypes.shape({
    name: PropTypes.string,
    fatherOrHusbandName: PropTypes.string,
    contactNo: PropTypes.string,
    email: PropTypes.string,
    gender: PropTypes.string,
    age: PropTypes.string,
    address: PropTypes.string,
    emergencyContact: PropTypes.string,
    property: PropTypes.string,
    seatNo: PropTypes.string,
    bookingType: PropTypes.string,
    moveInDate: PropTypes.instanceOf(Date),
    moveOutDate: PropTypes.instanceOf(Date),
    shift: PropTypes.string,
    fee: PropTypes.string,
    collection: PropTypes.string,
    notes: PropTypes.string,
    whatsappReminder: PropTypes.bool,
    profilePhoto: PropTypes.instanceOf(File),
    idPhotoFront: PropTypes.instanceOf(File),
    idPhotoBack: PropTypes.instanceOf(File)
  }),
  previewUrls: PropTypes.shape({
    profilePhoto: PropTypes.string,
    idPhotoFront: PropTypes.string,
    idPhotoBack: PropTypes.string
  })
};

export default AddBookingPage; 