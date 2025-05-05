import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Calendar, Clock, Home } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import PropTypes from 'prop-types';

const PreBookedSeatDialog = ({ isOpen, onClose, student, seatNumber }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="relative">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <DialogHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold">Pre-booked Seat {seatNumber}</DialogTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
                  Pre-booked
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

            {/* Booking Details */}
            <Card className="p-4">
              <h4 className="text-sm font-semibold mb-4 text-muted-foreground">Booking Details</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Booking Date</p>
                    <p className="text-sm text-muted-foreground">{student.bookingDate || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Move In Date</p>
                    <p className="text-sm text-muted-foreground">{student.moveInDate || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Valid Until</p>
                    <p className="text-sm text-muted-foreground">{student.validUntil || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Additional Notes */}
            {student.notes && (
              <Card className="p-4">
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Notes</h4>
                <p className="text-sm text-muted-foreground">{student.notes}</p>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

PreBookedSeatDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  student: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    photoUrl: PropTypes.string,
    bookingDate: PropTypes.string,
    moveInDate: PropTypes.string,
    validUntil: PropTypes.string,
    notes: PropTypes.string
  }).isRequired,
  seatNumber: PropTypes.string.isRequired
};

export default PreBookedSeatDialog; 