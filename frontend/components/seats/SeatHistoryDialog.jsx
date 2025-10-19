// components/SeatHistoryDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  User, 
  Clock, 
  IndianRupee, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock4,
  Download
} from "lucide-react";
import { format } from "date-fns";
import PropTypes from 'prop-types';
import { getSeatAssignmentHistory } from "@/api/seats";

const SeatHistoryDialog = ({ open, onOpenChange, seat }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && seat?._id) {
      loadHistory();
    }
  }, [open, seat]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await getSeatAssignmentHistory(seat._id);
      setHistory(response.data || []);
    } catch (error) {
      console.error('Error loading seat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: "default", icon: CheckCircle, label: "Active" },
      completed: { variant: "secondary", icon: CheckCircle, label: "Completed" },
      cancelled: { variant: "destructive", icon: XCircle, label: "Cancelled" }
    };
    
    const config = statusConfig[status] || { variant: "outline", icon: Clock4, label: status };
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatus = (payment) => {
    if (!payment) return { variant: "outline", label: "No Payment" };
    
    const statusConfig = {
      pending: { variant: "secondary", label: "Pending" },
      completed: { variant: "default", label: "Paid" },
      partial: { variant: "outline", label: "Partial" },
      failed: { variant: "destructive", label: "Failed" },
      refunded: { variant: "destructive", label: "Refunded" }
    };
    
    return statusConfig[payment.status] || { variant: "outline", label: "Unknown" };
  };

  const exportHistory = () => {
    const csvContent = [
      ['Student Name', 'Email', 'Phone', 'Shift', 'Start Date', 'End Date', 'Status', 'Amount', 'Collected', 'Balance', 'Payment Status'],
      ...history.map(item => [
        `${item.student?.firstName} ${item.student?.lastName}`,
        item.student?.email || '',
        item.student?.phone || '',
        item.shift?.name || '',
        format(new Date(item.startDate), 'yyyy-MM-dd'),
        item.endDate ? format(new Date(item.endDate), 'yyyy-MM-dd') : 'Present',
        item.status,
        item.feeDetails?.amount || 0,
        item.feeDetails?.collected || 0,
        item.feeDetails?.balance || 0,
        item.payment?.status || 'No Payment'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seat-${seat.seatNumber}-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Seat #{seat?.seatNumber} - Assignment History
              </DialogTitle>
              <DialogDescription>
                Complete history of all assignments for this seat
              </DialogDescription>
            </div>
            <Button variant="outline" onClick={exportHistory} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Clock className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No assignment history found for this seat.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((assignment, index) => (
                <Card key={index} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {assignment.student?.firstName} {assignment.student?.lastName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(assignment.startDate), 'MMM dd, yyyy')}
                              {' - '}
                              {assignment.endDate ? 
                                format(new Date(assignment.endDate), 'MMM dd, yyyy') : 
                                'Present'
                              }
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {assignment.duration}
                            </span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(assignment.status)}
                        {assignment.payment && (
                          <Badge variant={getPaymentStatus(assignment.payment).variant}>
                            {getPaymentStatus(assignment.payment).label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Student Details</p>
                        <p>{assignment.student?.email}</p>
                        <p>{assignment.student?.phone}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Shift & Period</p>
                        <p>{assignment.shift?.name}</p>
                        <p>{assignment.shift?.startTime} - {assignment.shift?.endTime}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          Fee Details
                        </p>
                        <div className="space-y-1">
                          <p>Total: ₹{assignment.feeDetails?.amount || 0}</p>
                          <p>Collected: ₹{assignment.feeDetails?.collected || 0}</p>
                          <p>Balance: ₹{assignment.feeDetails?.balance || 0}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium text-muted-foreground">Payment Info</p>
                        {assignment.payment ? (
                          <>
                            <p>Method: {assignment.payment.paymentMethod}</p>
                            <p>Amount: ₹{assignment.payment.amount}</p>
                            {assignment.payment.paymentDate && (
                              <p>Date: {format(new Date(assignment.payment.paymentDate), 'MMM dd, yyyy')}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">No payment record</p>
                        )}
                      </div>
                    </div>
                    
                    {assignment.documents && assignment.documents.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="font-medium text-sm text-muted-foreground mb-2">Documents:</p>
                        <div className="flex flex-wrap gap-2">
                          {assignment.documents.map((doc, docIndex) => (
                            <Badge key={docIndex} variant="outline" className="text-xs">
                              {doc.type.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                      Assignment {assignment.status} • 
                      Created {format(new Date(assignment.createdAt), 'MMM dd, yyyy HH:mm')}
                      {assignment.createdBy && ` • By ${assignment.createdBy.name}`}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

SeatHistoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  seat: PropTypes.object
};

export default SeatHistoryDialog;