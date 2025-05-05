import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, Calendar, Clock, User, Building2, Bookmark, FileText, IndianRupee, Mail, Phone, MapPin, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import PropTypes from "prop-types";

const EditBookingPage = ({ formData = {} }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    address: "",
    course: "",
    admissionDate: "",
    fatherName: "",
    dateOfBirth: "",
    gender: "",
    studentId: "",
    shift: "",
    city: "",
    state: "",
    pincode: "",
    idProofType: "",
    idProofNumber: "",
    status: "",
    notes: ""
  });

  useEffect(() => {
    const fetchBookingAndStudentData = async () => {
      setIsLoading(true);
      try {
        // TODO: Implement actual API calls
        // 1. Fetch the booking data using the id from useParams()
        // 2. Use the studentId from the booking to fetch the student data
        // 3. Set both the booking and student data in state
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load booking and student data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingAndStudentData();
  }, [id, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Booking Updated",
        description: "The student booking has been updated successfully.",
      });

      navigate('/students/booking');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update booking. Please try again.",
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="default"
              onClick={() => navigate('/students/booking')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Booking</h1>
              <p className="text-muted-foreground">
                Update student booking details
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {/* Student Information Section */}
              <Card className="border-2 border-primary/10 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-bold text-primary">Student Information</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    View student details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Student ID</Label>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{studentData.studentId}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Email</Label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{studentData.email}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Phone</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{studentData.phone}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Address</Label>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{studentData.address}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Course</Label>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{studentData.course}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Admission Date</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{format(new Date(studentData.admissionDate), "PPP")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information Section */}
              <Card className="border-2 border-primary/10 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-bold text-primary">Personal Information</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    Update the student's personal details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="name"
                          value={formData.studentName}
                          onChange={(e) => handleInputChange("studentName", e.target.value)}
                          placeholder="Enter student's name"
                          required
                          className="focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fatherOrHusbandName" className="text-sm font-medium">Father's/Husband's Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="fatherOrHusbandName"
                          value={formData.fatherOrHusbandName}
                          onChange={(e) => handleInputChange("fatherOrHusbandName", e.target.value)}
                          placeholder="Enter father's/husband's name"
                          required
                          className="focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactNo" className="text-sm font-medium">Contact Number <span className="text-red-500">*</span></Label>
                        <Input
                          id="contactNo"
                          value={formData.contactNo}
                          onChange={(e) => handleInputChange("contactNo", e.target.value)}
                          placeholder="Enter contact number"
                          required
                          className="focus:ring-2 focus:ring-primary/20"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="checkbox"
                            id="whatsappReminder"
                            checked={formData.whatsappReminder}
                            onChange={(e) => handleInputChange("whatsappReminder", e.target.checked)}
                            className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary/20"
                          />
                          <Label htmlFor="whatsappReminder" className="text-xs text-muted-foreground">
                            Enable WhatsApp fee reminder
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-sm font-medium">Gender <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => handleInputChange("gender", value)}
                        >
                          <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                    Update the booking information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="property" className="text-sm font-medium">Property <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.property}
                          onValueChange={(value) => handleInputChange("property", value)}
                        >
                          <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select property" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Property A">Property A</SelectItem>
                            <SelectItem value="Property B">Property B</SelectItem>
                            <SelectItem value="Property C">Property C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="seatNo" className="text-sm font-medium">Seat Number</Label>
                        <Select
                          value={formData.seatNo}
                          onValueChange={(value) => handleInputChange("seatNo", value)}
                        >
                          <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select seat" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A101">A101</SelectItem>
                            <SelectItem value="A102">A102</SelectItem>
                            <SelectItem value="B201">B201</SelectItem>
                            <SelectItem value="B202">B202</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bookingType" className="text-sm font-medium">Booking Type <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.bookingType}
                          onValueChange={(value) => handleInputChange("bookingType", value)}
                        >
                          <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select booking type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="long">Long Term</SelectItem>
                            <SelectItem value="short">Short Term</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shift" className="text-sm font-medium">Shift <span className="text-red-500">*</span></Label>
                        <Select
                          value={formData.shift}
                          onValueChange={(value) => handleInputChange("shift", value)}
                        >
                          <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select shift" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Morning">Morning</SelectItem>
                            <SelectItem value="Afternoon">Afternoon</SelectItem>
                            <SelectItem value="Evening">Evening</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Move In Date <span className="text-red-500">*</span></Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal focus:ring-2 focus:ring-primary/20",
                                !formData.moveInDate && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {formData.moveInDate ? (
                                format(new Date(formData.moveInDate), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={new Date(formData.moveInDate)}
                              onSelect={(date) => handleInputChange("moveInDate", date?.toISOString())}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Move Out Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal focus:ring-2 focus:ring-primary/20",
                                !formData.moveOutDate && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {formData.moveOutDate ? (
                                format(new Date(formData.moveOutDate), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={new Date(formData.moveOutDate)}
                              onSelect={(date) => handleInputChange("moveOutDate", date?.toISOString())}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Details Section */}
              <Card className="border-2 border-primary/10 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-bold text-primary">Payment Details</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    Update the payment information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fee" className="text-sm font-medium">Fee (₹) <span className="text-red-500">*</span></Label>
                        <Input
                          id="fee"
                          type="number"
                          value={formData.fee}
                          onChange={(e) => handleInputChange("fee", e.target.value)}
                          placeholder="Enter fee amount"
                          required
                          className="focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="collection" className="text-sm font-medium">Collection (₹)</Label>
                        <Input
                          id="collection"
                          type="number"
                          value={formData.collection}
                          onChange={(e) => handleInputChange("collection", e.target.value)}
                          placeholder="Enter collection amount"
                          className="focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => handleInputChange("notes", e.target.value)}
                          placeholder="Add any additional notes or special requirements"
                          className="focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-end gap-4 pt-4"
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/students/booking')}
                  className="hover:bg-primary/10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Booking
                </Button>
              </motion.div>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

EditBookingPage.propTypes = {
  formData: PropTypes.shape({
    id: PropTypes.string,
    studentId: PropTypes.string,
    seatId: PropTypes.string,
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    status: PropTypes.string,
    // Add other booking properties as needed
  })
};

export default EditBookingPage; 