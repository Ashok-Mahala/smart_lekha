import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Calendar, Clock, Home, BookOpen, GraduationCap, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PreBookedSeatDialog from "./PreBookedSeatDialog";
import PropTypes from 'prop-types';

const StudentInfoDialog = ({ isOpen, onClose, student, seatNumber }) => {
  const navigate = useNavigate();

  const handleBookSeat = () => {
    navigate('/students/add', { state: { seatNumber } });
  };

  if (student.status === 'pre-booked') {
    return (
      <PreBookedSeatDialog
        isOpen={isOpen}
        onClose={onClose}
        student={student}
        seatNumber={seatNumber}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="relative">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <DialogHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold">Seat {seatNumber}</DialogTitle>
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  Available
                </Badge>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6">
            {/* Student Basic Info */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={student.photoUrl || undefined} />
                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{student.name}</h3>
                <p className="text-sm text-muted-foreground">ID: {student.id}</p>
              </div>
            </div>

            {/* Contact Information */}
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-4 text-muted-foreground">Contact Information</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{student.phone}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Academic Information */}
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-4 text-muted-foreground">Academic Information</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Department</p>
                    <p className="text-sm text-muted-foreground">{student.department}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Year</p>
                    <p className="text-sm text-muted-foreground">{student.year}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Additional Information */}
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-4 text-muted-foreground">Additional Information</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">{student.status}</p>
                  </div>
                </div>
                {student.notes && (
                  <div className="flex items-center space-x-3">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Notes</p>
                      <p className="text-sm text-muted-foreground">{student.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Action Button */}
            <Button
              className="w-full"
              onClick={handleBookSeat}
            >
              Book This Seat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

StudentInfoDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  student: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    photoUrl: PropTypes.string,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    department: PropTypes.string.isRequired,
    year: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    notes: PropTypes.string
  }).isRequired,
  seatNumber: PropTypes.string.isRequired
};

export default StudentInfoDialog; 