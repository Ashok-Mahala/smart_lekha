// components/SeatHistoryDialog.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  User, 
  Clock, 
  IndianRupee, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock4,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format, parseISO } from "date-fns";
import PropTypes from 'prop-types';
import { getSeatAssignmentHistory } from "@/api/seats";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const SeatHistoryDialog = ({ open, onOpenChange, seat }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

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

  // Get unique years and months from history
  const { years, months } = useMemo(() => {
    const yearSet = new Set();
    const monthSet = new Set();
    
    history.forEach(assignment => {
      const year = format(parseISO(assignment.startDate), 'yyyy');
      const month = format(parseISO(assignment.startDate), 'MMMM');
      yearSet.add(year);
      monthSet.add(month);
    });
    
    return {
      years: Array.from(yearSet).sort((a, b) => b.localeCompare(a)),
      months: Array.from(monthSet).sort()
    };
  }, [history]);

  // Filter history based on search and filters
  const filteredHistory = useMemo(() => {
    return history.filter(assignment => {
      // Search filter
      const studentName = `${assignment.student?.firstName || ''} ${assignment.student?.lastName || ''}`.toLowerCase();
      const studentEmail = assignment.student?.email?.toLowerCase() || '';
      const studentPhone = assignment.student?.phone || '';
      const shiftName = assignment.shift?.name?.toLowerCase() || '';
      
      const matchesSearch = !searchTerm || 
        studentName.includes(searchTerm.toLowerCase()) ||
        studentEmail.includes(searchTerm.toLowerCase()) ||
        studentPhone.includes(searchTerm) ||
        shiftName.includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
      
      // Payment filter
      const matchesPayment = paymentFilter === 'all' || 
        (paymentFilter === 'no_payment' && !assignment.payment) ||
        (assignment.payment?.status === paymentFilter);
      
      // Month filter
      const matchesMonth = monthFilter === 'all' || 
        format(parseISO(assignment.startDate), 'MMMM') === monthFilter;
      
      // Year filter
      const matchesYear = yearFilter === 'all' || 
        format(parseISO(assignment.startDate), 'yyyy') === yearFilter;

      return matchesSearch && matchesStatus && matchesPayment && matchesMonth && matchesYear;
    });
  }, [history, searchTerm, statusFilter, paymentFilter, monthFilter, yearFilter]);

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
      ...filteredHistory.map(item => [
        `${item.student?.firstName} ${item.student?.lastName}`,
        item.student?.email || '',
        item.student?.phone || '',
        item.shift?.name || '',
        format(parseISO(item.startDate), 'yyyy-MM-dd'),
        item.endDate ? format(parseISO(item.endDate), 'yyyy-MM-dd') : 'Present',
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

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setMonthFilter('all');
    setYearFilter('all');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="flex-shrink-0 p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Seat #{seat?.seatNumber} - Assignment History
                </DialogTitle>
                <DialogDescription>
                  Complete history of all assignments for this seat
                  {filteredHistory.length !== history.length && (
                    <span className="ml-2 text-primary">
                      ({filteredHistory.length} of {history.length} records)
                    </span>
                  )}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} size="sm">
                    Clear Filters
                  </Button>
                )}
                <Button variant="outline" onClick={exportHistory} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="flex-shrink-0 p-6 border-b">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by student name, email, phone, or shift..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Collapsible open={showFilters} onOpenChange={setShowFilters} className="sm:hidden">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <Filter className="h-4 w-4" />
                    Filters
                    {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Payment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="no_payment">No Payment</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {months.map(month => (
                          <SelectItem key={month} value={month}>{month}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {years.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="hidden sm:flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="no_payment">No Payment</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={monthFilter} onValueChange={setMonthFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {months.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Area - This is where the scroll should work */}
          <div className="flex-1 min-h-0 p-6">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Clock className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading history...</span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No assignments found</p>
                  <p className="text-sm">
                    {hasActiveFilters 
                      ? "Try adjusting your filters to see more results" 
                      : "No assignment history found for this seat."
                    }
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="mt-4">
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map((assignment, index) => (
                    <Card key={index} className="relative hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg truncate">
                                {assignment.student?.firstName} {assignment.student?.lastName}
                              </CardTitle>
                              <CardDescription className="flex flex-wrap items-center gap-4 mt-1">
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <Calendar className="h-3 w-3" />
                                  {format(parseISO(assignment.startDate), 'MMM dd, yyyy')}
                                  {' - '}
                                  {assignment.endDate ? 
                                    format(parseISO(assignment.endDate), 'MMM dd, yyyy') : 
                                    'Present'
                                  }
                                </span>
                                <span className="flex items-center gap-1 whitespace-nowrap">
                                  <Clock className="h-3 w-3" />
                                  {assignment.shift?.name}
                                  {assignment.shift?.startTime && ` (${assignment.shift.startTime} - ${assignment.shift.endTime})`}
                                </span>
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex flex-col items-start sm:items-end gap-2 min-w-0">
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="font-medium text-muted-foreground">Student Details</p>
                            <p className="truncate" title={assignment.student?.email}>
                              {assignment.student?.email || 'No email'}
                            </p>
                            <p>{assignment.student?.phone || 'No phone'}</p>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-medium text-muted-foreground">Fee Details</p>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span>Total:</span>
                                <span>₹{assignment.feeDetails?.amount || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Collected:</span>
                                <span>₹{assignment.feeDetails?.collected || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Balance:</span>
                                <span className={assignment.feeDetails?.balance > 0 ? 'text-red-600 font-medium' : ''}>
                                  ₹{assignment.feeDetails?.balance || 0}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-medium text-muted-foreground">Payment Info</p>
                            {assignment.payment ? (
                              <>
                                <p>Method: {assignment.payment.paymentMethod || 'N/A'}</p>
                                <p>Status: {assignment.payment.status}</p>
                                {assignment.payment.paymentDate && (
                                  <p>Date: {format(parseISO(assignment.payment.paymentDate), 'MMM dd, yyyy')}</p>
                                )}
                              </>
                            ) : (
                              <p className="text-muted-foreground">No payment record</p>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <p className="font-medium text-muted-foreground">Assignment Info</p>
                            <p>Started: {format(parseISO(assignment.startDate), 'MMM dd, yyyy')}</p>
                            <p>
                              {assignment.endDate 
                                ? `Ended: ${format(parseISO(assignment.endDate), 'MMM dd, yyyy')}`
                                : 'Currently Active'
                              }
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created: {format(parseISO(assignment.createdAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        
                        {assignment.documents && assignment.documents.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="font-medium text-sm text-muted-foreground mb-2">Documents:</p>
                            <div className="flex flex-wrap gap-2">
                              {assignment.documents.map((doc, docIndex) => (
                                <Badge key={docIndex} variant="outline" className="text-xs capitalize">
                                  {doc.type.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
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