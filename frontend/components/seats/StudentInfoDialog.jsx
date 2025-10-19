// components/StudentInfoDialog.jsx - Updated version
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  BookOpen, 
  IndianRupee,
  Clock,
  History,
  UserX,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import PropTypes from 'prop-types';
import { releaseStudentFromSeat } from "@/api/seats";

const StudentInfoDialog = ({ open, onOpenChange, student, seat, onDeassign, onEdit }) => {
  const [isDeassigning, setIsDeassigning] = useState(false);

  const handleDeassign = async () => {
    if (!student || !seat) return;
    
    if (!window.confirm(`Are you sure you want to deassign ${student.firstName} ${student.lastName} from seat ${seat.seatNumber}?`)) {
      return;
    }

    setIsDeassigning(true);
    try {
      await releaseStudentFromSeat(seat._id, {
        studentId: student._id,
        shiftId: seat.currentShift?._id
      });
      
      onDeassign?.(student._id, seat._id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deassigning student:', error);
      alert('Failed to deassign student. Please try again.');
    } finally {
      setIsDeassigning(false);
    }
  };

  const handleEdit = () => {
    onEdit?.(student, seat);
    onOpenChange(false);
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl font-bold">Student Details</DialogTitle>
          </div>
          <DialogDescription>
            Student information and seat assignment details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">
                    {student.firstName} {student.lastName}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {student.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {student.phone}
                    </span>
                  </div>
                </div>
                <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                  {student.status}
                </Badge>
              </div>

              {(student.institution || student.course) && (
                <div className="pt-2 border-t">
                  <p className="font-medium text-sm text-muted-foreground mb-1">Education</p>
                  <p className="text-sm">
                    {student.institution && `${student.institution}`}
                    {student.course && student.institution && ` • `}
                    {student.course && `${student.course}`}
                  </p>
                </div>
              )}

              {student.aadharNumber && (
                <div className="pt-2 border-t">
                  <p className="font-medium text-sm text-muted-foreground mb-1">Aadhar Number</p>
                  <p className="text-sm">{student.aadharNumber}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seat Assignment Info */}
          {seat && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Seat Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Seat #{seat.seatNumber}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3" />
                      Assigned on {format(new Date(seat.bookingDate || seat.updatedAt), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {seat.type} Seat
                  </Badge>
                </div>

                {seat.currentShift && (
                  <div className="pt-2 border-t">
                    <p className="font-medium text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Shift Details
                    </p>
                    <p className="text-sm">
                      {seat.currentShift.name} ({seat.currentShift.startTime} - {seat.currentShift.endTime})
                    </p>
                  </div>
                )}

                {seat.feeDetails && (
                  <div className="pt-2 border-t">
                    <p className="font-medium text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      Fee Details
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p>₹{seat.feeDetails.amount || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Collected</p>
                        <p>₹{seat.feeDetails.collected || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p>₹{seat.feeDetails.balance || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {student.documents && student.documents.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {student.documents.map((doc, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {doc.type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
          {seat && (
            <Button 
              variant="destructive" 
              onClick={handleDeassign}
              disabled={isDeassigning}
              className="flex items-center gap-2"
            >
              <UserX className="h-4 w-4" />
              {isDeassigning ? 'Deassigning...' : 'Deassign Student'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

StudentInfoDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  student: PropTypes.object,
  seat: PropTypes.object,
  onDeassign: PropTypes.func,
  onEdit: PropTypes.func
};

export default StudentInfoDialog;