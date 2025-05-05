import React from 'react';
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
import { CalendarIcon, BookOpen, GraduationCap, Clock, User, Mail, Phone } from "lucide-react";
import PropTypes from 'prop-types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AvailableSeatDialog = ({ open, onOpenChange, onConfirm, seatNumber }) => {
  const [date, setDate] = React.useState(new Date());
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [shift, setShift] = React.useState('');
  const [course, setCourse] = React.useState('');
  const [institution, setInstitution] = React.useState('');

  const handleConfirm = () => {
    onConfirm({
      date,
      name,
      email,
      phone,
      shift,
      course,
      institution,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl font-bold">Book Study Seat {seatNumber}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Reserve your study space for focused learning
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
                  Study Shift
                </Label>
                <Select value={shift} onValueChange={setShift}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select your study shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning Shift (07:00 AM - 02:00 PM)</SelectItem>
                    <SelectItem value="evening8">Evening Shift (08 Hours)</SelectItem>
                    <SelectItem value="evening10">Evening Shift (10 Hours)</SelectItem>
                    <SelectItem value="full15">Full Day Shift (15 Hours)</SelectItem>
                    <SelectItem value="full17">Full Day Shift (17 Hours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Study Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="col-span-3 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Select your study date</span>}
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
            </div>
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
};

export default AvailableSeatDialog; 