import React, { useRef, useEffect } from 'react';
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
import { CalendarIcon, BookOpen, GraduationCap, Clock, User, Mail, Phone, Camera, File, ChevronDown, IndianRupee } from "lucide-react";
import PropTypes from 'prop-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  getSeatsByProperty,
  bulkCreateSeats,
  bulkUpdateSeats,
  bookSeat,
  reserveSeat,
  releaseSeat,
  getSeatStats,
  getShifts,
  updateSeatStatus,
  deleteSeat
} from "@/api/seats";

const AvailableSeatDialog = ({ open, onOpenChange, onConfirm, seatNumber, shifts = [] }) => {
  const [date, setDate] = React.useState(new Date());
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [shift, setShift] = React.useState('');
  const [course, setCourse] = React.useState('');
  const [institution, setInstitution] = React.useState('');
  const [aadharNumber, setAadharNumber] = React.useState('');
  const [profilePhoto, setProfilePhoto] = React.useState(null);
  const [identityProof, setIdentityProof] = React.useState(null);
  const [showAdditionalInfo, setShowAdditionalInfo] = React.useState(false);
  const [fee, setFee] = React.useState('');
  const [collectedFee, setCollectedFee] = React.useState('');
  
  
  const profilePhotoRef = useRef(null);
  const identityProofRef = useRef(null);

  // Update fee and collected fee when shift changes
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

  const handleConfirm = () => {
    onConfirm({
      date,
      name,
      email,
      phone,
      shift,
      course,
      institution,
      aadharNumber,
      profilePhoto,
      identityProof,
      fee: parseFloat(fee) || 0,
      collectedFee: parseFloat(collectedFee) || 0
    });
    onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl font-bold">Book Seat {seatNumber}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Reserve space for focused learning
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter your email address"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </div>

          {/* Educational Information Section */}
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
                  placeholder="Enter your institution name"
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
                  placeholder="Enter your course name"
                />
              </div>
            </div>
          </div>

          {/* Booking Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Booking Details
            </h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="shift" className="text-right">
                  Shift
                </Label>
                <Select value={shift} onValueChange={setShift}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select your shift" />
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
                  Start Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="col-span-3 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Select your Start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="rounded-md border"
                        classNames={{
                          months: "flex flex-col space-y-4",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground",
                          day_outside: "text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
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
                placeholder="Enter fee amount"
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
                  placeholder="Enter collected fee amount"
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="w-full flex items-center justify-between" 
              onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            >
              <span className="text-lg font-semibold flex items-center gap-2">
                <File className="h-5 w-5 text-primary" />
                Additional Information (Optional)
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdditionalInfo ? 'rotate-180' : ''}`} />
            </Button>
            
            {showAdditionalInfo && (
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
                    placeholder="Enter your Aadhar number"
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
                      accept="image/*,.pdf"
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full flex items-center gap-2"
                      onClick={() => triggerFileInput(identityProofRef)}
                    >
                      <File className="h-4 w-4" />
                      {identityProof ? identityProof.name : 'Upload Identity Proof'}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Upload Aadhar, Passport, or Driving License</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-primary hover:bg-primary/90">
            Confirm Study Booking
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
  shifts: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      fee: PropTypes.number.isRequired, // Added fee to propTypes
    })
  ),
};

AvailableSeatDialog.defaultProps = {
  shifts: [],
};

export default AvailableSeatDialog;