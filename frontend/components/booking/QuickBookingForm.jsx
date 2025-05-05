import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, X, Loader2, User, MapPin, Clock4, Bookmark, AlertCircle, CheckCircle2, Camera, Phone, Mail, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PropTypes from 'prop-types';

const QuickBookingForm = ({ onClose }) => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStudentId, setIsLoadingStudentId] = useState(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSeatAvailable, setIsSeatAvailable] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    contactNumber: '',
    profilePhoto: null,
    seatId: '',
    date: undefined,
    startTime: '',
    endTime: '',
    shift: '',
    notes: ''
  });

  // Fetch last student ID and generate new one
  useEffect(() => {
    const fetchLastStudentId = async () => {
      try {
        // Replace with actual API call
        const mockLastId = 'STD20230099';
        const newId = generateNextStudentId(mockLastId);
        setFormData(prev => ({ ...prev, studentId: newId }));
      } catch (error) {
        console.error('Error fetching last student ID:', error);
        const currentYear = new Date().getFullYear();
        const fallbackId = `STD${currentYear}0001`;
        setFormData(prev => ({ ...prev, studentId: fallbackId }));
      } finally {
        setIsLoadingStudentId(false);
      }
    };

    fetchLastStudentId();
  }, []);

  // Check seat availability when relevant fields change
  useEffect(() => {
    const checkSeatAvailability = async () => {
      if (!formData.seatId || !formData.date || !formData.startTime || !formData.endTime) {
        setIsSeatAvailable(null);
        return;
      }

      setIsCheckingAvailability(true);
      try {
        // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        const isAvailable = Math.random() > 0.3; // Mock availability check
        setIsSeatAvailable(isAvailable);
      } catch (error) {
        console.error('Error checking seat availability:', error);
        setIsSeatAvailable(null);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    const debounceTimer = setTimeout(checkSeatAvailability, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.seatId, formData.date, formData.startTime, formData.endTime]);

  const generateNextStudentId = (lastId) => {
    const year = lastId.substring(3, 7);
    const number = parseInt(lastId.substring(7));
    const currentYear = new Date().getFullYear().toString();
    
    if (year !== currentYear) {
      return `STD${currentYear}0001`;
    }
    
    const nextNumber = (number + 1).toString().padStart(4, '0');
    return `STD${currentYear}${nextNumber}`;
  };

  // Shifts will be fetched from API
  const shifts = [];

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  // Update booking page
  const updateBookingPage = async (booking) => {
    try {
      // Simulate API call to update booking page
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Log the update
      console.log('Booking page updated:', {
        timestamp: new Date(),
        booking,
        action: 'booking_created'
      });

      // Update the seat status in the InteractiveSeatMap
      const event = new CustomEvent('seatStatusUpdate', {
        detail: {
          seatId: booking.seatId,
          status: 'occupied',
          student: {
            id: booking.studentId,
            name: booking.studentName,
            status: 'active'
          }
        }
      });
      window.dispatchEvent(event);

    } catch (error) {
      console.error('Error updating booking page:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.studentId || !formData.seatId || !formData.date || !formData.startTime || !formData.endTime || !formData.shift) {
        throw new Error('Please fill in all required fields');
      }

      if (!isSeatAvailable) {
        throw new Error('Selected seat is not available for the chosen time slot');
      }

      const startTime = parseInt(formData.startTime.split(':')[0]);
      const endTime = parseInt(formData.endTime.split(':')[0]);
      if (endTime <= startTime) {
        throw new Error('End time must be after start time');
      }

      // Format the date and time for the API
      const formattedDate = formData.date ? format(formData.date, 'yyyy-MM-dd') : '';
      const bookingData = {
        id: `BK${Date.now()}`,
        studentId: formData.studentId,
        studentName: 'John Doe', // Replace with actual student name from API
        seatId: formData.seatId,
        date: formattedDate,
        startTime: `${formattedDate}T${formData.startTime}:00`,
        endTime: `${formattedDate}T${formData.endTime}:00`,
        shift: formData.shift,
        status: 'active',
        notes: formData.notes,
        createdAt: new Date().toISOString()
      };

      // Simulate API call to create booking
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update booking page
      await updateBookingPage(bookingData);

      // Show success state
      setBookingData(bookingData);
      setShowSuccess(true);
      toast.success('Booking created successfully!');
      
      // Close form after delay
      setTimeout(() => {
        onClose();
        navigate('/bookings', { 
          state: { 
            message: 'Booking created successfully',
            bookingId: bookingData.id 
          } 
        });
      }, 2000);

    } catch (error) {
      console.error('Booking error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create booking');
      toast.error('Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should not exceed 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, profilePhoto: file }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      setFormData(prev => ({ ...prev, profilePhoto: file }));
      toast.success('Profile photo uploaded successfully');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Quick Booking
        </h2>
        <p className="text-sm text-muted-foreground mt-2">Book a seat in just a few clicks</p>
      </motion.div>
      
      {showSuccess && bookingData ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">Booking Created Successfully!</h3>
          <div className="text-sm text-muted-foreground">
            <p>Booking ID: {bookingData.id}</p>
            <p>Seat: {bookingData.seatId}</p>
            <p>Date: {format(new Date(bookingData.date), 'PPP')}</p>
            <p>Time: {bookingData.startTime.split('T')[1].slice(0, 5)} - {bookingData.endTime.split('T')[1].slice(0, 5)}</p>
          </div>
          <p className="text-sm text-muted-foreground">Redirecting to bookings page...</p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <AnimatePresence>
        {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <Tabs defaultValue="student" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="student" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Student Info
              </TabsTrigger>
              <TabsTrigger value="booking" className="flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Booking Details
              </TabsTrigger>
              <TabsTrigger value="time" className="flex items-center gap-2">
                <Clock4 className="h-4 w-4" />
                Time Selection
              </TabsTrigger>
            </TabsList>

            <TabsContent value="student">
              <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
            <div className="space-y-2">
                        <Label htmlFor="studentId" className="text-sm font-medium flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Student ID <span className="text-red-500">*</span>
                        </Label>
              <div className="relative">
                <Input
                  id="studentId"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  placeholder="Enter student ID"
                  required
                  className={cn(
                    "focus:ring-2 focus:ring-primary/20",
                    isLoadingStudentId && "animate-pulse"
                  )}
                  disabled={isLoadingStudentId}
                />
                {isLoadingStudentId && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-generated ID based on previous records
              </p>
            </div>

            <div className="space-y-2">
                        <Label htmlFor="studentName" className="text-sm font-medium flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          Student Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="studentName"
                          value={formData.studentName}
                          onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                          placeholder="Enter student name"
                          required
                          className="focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contactNumber" className="text-sm font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          Contact Number <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="contactNumber"
                          value={formData.contactNumber}
                          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                          placeholder="Enter contact number"
                          required
                          type="tel"
                          pattern="[0-9]{10}"
                          className="focus:ring-2 focus:ring-primary/20"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter 10-digit mobile number
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="profilePhoto" className="text-sm font-medium flex items-center gap-2">
                          <Camera className="h-4 w-4 text-primary" />
                          Profile Photo
                        </Label>
                        <div 
                          className="relative w-40 h-40 mx-auto rounded-full overflow-hidden border-2 border-dashed border-gray-300 hover:border-primary/50 transition-colors cursor-pointer"
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                        >
                          {formData.profilePhoto ? (
                            <motion.img
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              src={URL.createObjectURL(formData.profilePhoto)}
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="w-full h-full flex flex-col items-center justify-center bg-gray-50"
                            >
                              <Camera className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-xs text-gray-500 text-center px-4">
                                Drag & drop or click to upload
                              </p>
                            </motion.div>
                          )}
                          <input
                            type="file"
                            id="profilePhoto"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            Click or drag to upload profile photo
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Max size: 5MB, Format: JPG, PNG
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="booking">
              <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="seatId" className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          Seat Number <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
              <Input
                id="seatId"
                value={formData.seatId}
                onChange={(e) => setFormData({ ...formData, seatId: e.target.value })}
                placeholder="Enter seat number"
                required
                            className={cn(
                              "focus:ring-2 focus:ring-primary/20",
                              isCheckingAvailability && "animate-pulse"
                            )}
                          />
                          {isCheckingAvailability && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                          )}
                          {isSeatAvailable === true && (
                            <CheckCircle2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
                          )}
                          {isSeatAvailable === false && (
                            <X className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
                          )}
            </div>
                        {isSeatAvailable === true && (
                          <p className="text-xs text-green-500">Seat is available for selected time slot</p>
                        )}
                        {isSeatAvailable === false && (
                          <p className="text-xs text-red-500">Seat is not available for selected time slot</p>
                        )}
        </div>

            <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-primary" />
                          Date <span className="text-red-500">*</span>
                        </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal focus:ring-2 focus:ring-primary/20",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData({ ...formData, date })}
                    initialFocus
                              disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
                      </div>
            </div>

                    <div className="space-y-6">
            <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Shift <span className="text-red-500">*</span>
                        </Label>
              <Select
                value={formData.shift}
                onValueChange={(value) => setFormData({ ...formData, shift: value })}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id}>
                      {shift.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          Additional Notes
                        </Label>
                        <Input
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Additional notes (optional)"
                          className="focus:ring-2 focus:ring-primary/20"
                        />
          </div>
        </div>
          </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="time">
              <Card className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Clock4 className="h-4 w-4 text-primary" />
                        Start Time <span className="text-red-500">*</span>
                      </Label>
              <Select
                value={formData.startTime}
                onValueChange={(value) => setFormData({ ...formData, startTime: value })}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Clock4 className="h-4 w-4 text-primary" />
                        End Time <span className="text-red-500">*</span>
                      </Label>
              <Select
                value={formData.endTime}
                onValueChange={(value) => setFormData({ ...formData, endTime: value })}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
                className="min-w-[120px]"
            >
              Cancel
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              type="submit"
                disabled={isSubmitting || !isSeatAvailable}
                className="min-w-[120px] bg-primary hover:bg-primary/90"
            >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Create Booking'
                )}
            </Button>
          </motion.div>
        </div>
      </form>
      )}
    </div>
  );
};

QuickBookingForm.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default QuickBookingForm; 