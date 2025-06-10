import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  IndianRupee, 
  Search,
  AlertCircle,
  ArrowLeft,
  Filter,
  Download,
  Calendar,
  CreditCard,
  Wallet,
  Banknote,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Smartphone,
  Building2,
  FileText,
  MessageCircle,
  Printer,
  Share2,
  Clock,
  Bell,
  ChevronLeft,
  ChevronRight,
  QrCode,
  User,
  Loader2,
  Receipt
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { saveAs } from "file-saver";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Define PropTypes for PaymentRecord
const paymentRecordPropTypes = PropTypes.shape({
  studentId: PropTypes.string.isRequired,
  studentName: PropTypes.string.isRequired,
  seatNo: PropTypes.string.isRequired,
  dueAmount: PropTypes.string.isRequired,
  collectedAmount: PropTypes.string.isRequired,
  paymentMethod: PropTypes.string.isRequired,
  paymentDate: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  timestamp: PropTypes.string.isRequired,
  receiptNumber: PropTypes.string.isRequired,
  balanceAmount: PropTypes.string.isRequired,
  paymentStatus: PropTypes.string.isRequired,
  transactionId: PropTypes.string,
  paymentMode: PropTypes.string.isRequired
});

// Define PropTypes for PaymentResponse
const paymentResponsePropTypes = PropTypes.shape({
  success: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  receiptNumber: PropTypes.string.isRequired,
  paymentId: PropTypes.string.isRequired,
  transactionId: PropTypes.string
});

// Remove mock data and add API call
const fetchDuePayments = async () => {
  try {
    const response = await fetch('/smlekha/due-payments');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching due payments:', error);
    return [];
  }
};

const DuePaymentsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [reminderType, setReminderType] = useState("email");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeFilter, setActiveFilter] = useState("all");
  const [showBulkReminderModal, setShowBulkReminderModal] = useState(false);
  const [reminderTemplate, setReminderTemplate] = useState("default");
  const [customMessage, setCustomMessage] = useState("");
  const [reminderFrequency, setReminderFrequency] = useState("once");
  const [reminderDays, setReminderDays] = useState([]);
  const [upiId, setUpiId] = useState("");
  const [upiAmount, setUpiAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [changeAmount, setChangeAmount] = useState(0);
  const [walletType, setWalletType] = useState("");
  const [walletNumber, setWalletNumber] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [editableAmount, setEditableAmount] = useState("");
  const [editableDueDate, setEditableDueDate] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [collectedAmount, setCollectedAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [duePayments, setDuePayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    totalDue: 0,
    monthlyDue: 0,
    upcomingDue: 0
  });
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Remove hardcoded months array and use date-fns
  const getMonthName = (monthIndex) => {
    return format(new Date(2000, monthIndex, 1), 'MMMM');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch due payments
        const paymentsResponse = await fetch('/smlekha/due-payments');
        if (!paymentsResponse.ok || !paymentsResponse.headers.get('content-type')?.includes('application/json')) {
          throw new Error('API endpoint not available');
        }
        const paymentsData = await paymentsResponse.json();
        setDuePayments(paymentsData);

        // Fetch payment methods
        const methodsResponse = await fetch('/smlekha/payment-methods');
        if (methodsResponse.ok && methodsResponse.headers.get('content-type')?.includes('application/json')) {
          const methodsData = await methodsResponse.json();
          setPaymentMethods(methodsData);
        }

        // Calculate summary data
        const today = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(today.getDate() + 7);
        
        const summary = {
          totalDue: 0,
          monthlyDue: 0,
          upcomingDue: 0
        };

        paymentsData.forEach(payment => {
          const paymentDate = new Date(payment.dueDate);
          const amount = parseFloat(payment.amount);
          
          summary.totalDue += amount;
          
          if (paymentDate.getMonth() === selectedMonth && 
              paymentDate.getFullYear() === selectedYear) {
            summary.monthlyDue += amount;
          }
          
          if (paymentDate > today && paymentDate <= sevenDaysFromNow) {
            summary.upcomingDue += amount;
          }
        });

        setSummaryData(summary);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Unable to connect to the server.');
        setDuePayments([]);
        setPaymentMethods([]);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, selectedYear]);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Filter payments based on search query, status, and active filter
  const filteredPayments = duePayments.filter((payment) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      payment.studentName.toLowerCase().includes(query) ||
      payment.studentId.toLowerCase().includes(query) ||
      payment.seatNo.toLowerCase().includes(query);
    
    const matchesStatus = selectedStatus === "all" || payment.status === selectedStatus;
    
    // Additional filtering based on active card
    let matchesFilter = true;
    if (activeFilter === "monthly") {
      const paymentDate = new Date(payment.dueDate);
      matchesFilter = paymentDate.getMonth() === selectedMonth && 
                     paymentDate.getFullYear() === selectedYear;
    } else if (activeFilter === "upcoming") {
      const paymentDate = new Date(payment.dueDate);
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      matchesFilter = paymentDate > today && paymentDate <= sevenDaysFromNow;
    }
    
    return matchesSearch && matchesStatus && matchesFilter;
  });

  // Format Indian Rupee
  const formatRupee = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper function for status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case "Overdue":
        return <Badge variant="destructive" className="bg-red-500/10 text-red-500">Overdue</Badge>;
      case "Pending":
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const handleCollectPayment = (payment) => {
    setSelectedPayment(payment);
    setEditableAmount(payment.amount.toString());
    setEditableDueDate(payment.dueDate);
    setEditableDescription(payment.description);
    setShowPaymentModal(true);
  };

  // Validation functions
  const validateUpi = () => {
    return upiId && upiAmount && parseFloat(upiAmount) === selectedPayment.amount;
  };

  const validateCard = () => {
    return cardNumber.length === 16 && cardExpiry && cardCvv.length === 3;
  };

  const validateCash = () => {
    const received = parseFloat(cashReceived);
    return received && received >= selectedPayment.amount;
  };

  const validateWallet = () => {
    return walletType && walletNumber;
  };

  const validateQrCode = () => {
    return qrCode;
  };

  // Update the generateReceipt function
  const generateReceipt = (payment) => {
    const receipt = `
      SEATFLOW PAYMENT RECEIPT
      ========================
      
      Receipt Details:
      ---------------
      Receipt No: ${payment.receiptNumber}
      Date: ${format(new Date(payment.timestamp), 'dd/MM/yyyy hh:mm a')}
      Transaction ID: ${payment.transactionId || 'N/A'}
      Status: ${payment.paymentStatus}
      
      Student Details:
      ---------------
      Name: ${payment.studentName}
      ID: ${payment.studentId}
      Seat No: ${payment.seatNo}
      
      Payment Details:
      ---------------
      Due Amount: ₹${payment.dueAmount}
      Amount Paid: ₹${payment.collectedAmount}
      Balance Amount: ₹${payment.balanceAmount}
      Payment Method: ${payment.paymentMethod}
      Payment Mode: ${payment.paymentMode}
      Payment Date: ${format(new Date(payment.paymentDate), 'dd/MM/yyyy')}
      Description: ${payment.description}
      
      Transaction Details:
      ------------------
      Transaction Time: ${format(new Date(payment.timestamp), 'hh:mm:ss a')}
      Payment Status: ${payment.paymentStatus}
      ${payment.transactionId ? `Transaction ID: ${payment.transactionId}` : ''}
      
      ========================
      Thank you for your payment!
      This is a computer generated receipt.
      Please keep this receipt for your records.
      ========================
    `;

    const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `receipt_${payment.receiptNumber}.txt`);
  };

  // Add receipt preview component
  const ReceiptPreview = ({ payment }) => {
    return (
      <Dialog open={showReceiptPreview} onOpenChange={setShowReceiptPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt Preview</DialogTitle>
          </DialogHeader>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-emerald-600">SEATFLOW PAYMENT RECEIPT</h2>
              <div className="border-t border-gray-200 my-4"></div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Receipt Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Receipt No</p>
                    <p className="font-medium">{payment.receiptNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{format(new Date(payment.timestamp), 'dd/MM/yyyy hh:mm a')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="font-medium">{payment.transactionId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium text-emerald-600">{payment.paymentStatus}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Student Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{payment.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID</p>
                    <p className="font-medium">{payment.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Seat No</p>
                    <p className="font-medium">{payment.seatNo}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Payment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Due Amount</p>
                    <p className="font-medium">₹{payment.dueAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount Paid</p>
                    <p className="font-medium text-emerald-600">₹{payment.collectedAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Balance Amount</p>
                    <p className="font-medium">₹{payment.balanceAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium">{payment.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Mode</p>
                    <p className="font-medium">{payment.paymentMode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Date</p>
                    <p className="font-medium">{format(new Date(payment.paymentDate), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-700">{payment.description}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 my-6"></div>
            <div className="text-center text-sm text-gray-500">
              <p>Thank you for your payment!</p>
              <p>This is a computer generated receipt.</p>
              <p>Please keep this receipt for your records.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Update the handlePaymentSubmit function with enhanced error handling
  const handlePaymentSubmit = async () => {
    if (!paymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (!collectedAmount || parseFloat(collectedAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const dueAmount = parseFloat(editableAmount);
    const paidAmount = parseFloat(collectedAmount);

    if (paidAmount > dueAmount) {
      toast({
        title: "Error",
        description: "Collected amount cannot be greater than due amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate a unique receipt number
      const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Create payment record
      const paymentRecord = {
        studentId: selectedPayment.studentId,
        studentName: selectedPayment.studentName,
        seatNo: selectedPayment.seatNo,
        dueAmount: editableAmount,
        collectedAmount: collectedAmount,
        balanceAmount: (dueAmount - paidAmount).toString(),
        paymentMethod: paymentMethod,
        paymentMode: paymentMethod === "CASH" ? "Cash" : "Digital",
        paymentDate: paymentDate,
        description: editableDescription,
        timestamp: new Date().toISOString(),
        receiptNumber: receiptNumber,
        paymentStatus: "Completed",
        transactionId: transactionId,
      };

      // Show receipt preview
      setCurrentReceipt(paymentRecord);
      setShowReceiptPreview(true);

      // Send payment data to backend
      const response = await fetch('/smlekha/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRecord),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment processing failed');
      }

      // Generate and download receipt
      generateReceipt(paymentRecord);

      // Show success message
      toast({
        title: "Payment Successful",
        description: `Payment of ₹${collectedAmount} recorded. Receipt No: ${receiptNumber}`,
      });

      // Close the modal
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setPaymentMethod("");
      setCollectedAmount("");
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setEditableDescription("");

    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast({
          title: "Network Error",
          description: "Unable to connect to the server. Please check your internet connection.",
          variant: "destructive",
        });
      } else if (error instanceof SyntaxError) {
        toast({
          title: "Server Error",
          description: "Invalid response from server. Please try again later.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to process payment",
          variant: "destructive",
        });
      }
    }
  };

  const handleScheduleReminder = (payment) => {
    setSelectedPayment(payment);
    setShowReminderModal(true);
  };

  const handleReminderSubmit = () => {
    toast({
      title: "Reminder Scheduled",
      description: `Reminder set for ${reminderDate} at ${reminderTime} via ${reminderType}`,
    });
    setShowReminderModal(false);
    setSelectedPayment(null);
    setReminderDate("");
    setReminderTime("");
  };

  const handleExport = (format) => {
    toast({
      title: "Export Started",
      description: `Exporting data in ${format.toUpperCase()} format...`,
    });
  };

  const handleCardClick = (filter) => {
    setActiveFilter(filter);
  };

  const handleBulkReminder = () => {
    setShowBulkReminderModal(true);
  };

  const handleBulkReminderSubmit = () => {
    toast({
      title: "Bulk Reminder Scheduled",
      description: `Reminders have been scheduled for ${filteredPayments.length} payments`,
    });
    setShowBulkReminderModal(false);
    setReminderDate("");
    setReminderTime("");
    setCustomMessage("");
    setReminderTemplate("default");
    setReminderFrequency("once");
    setReminderDays([]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="shrink-0">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Due Payments</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Track and manage pending payments
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth} className="shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-center min-w-[120px]">
                <p className="font-medium">{getMonthName(selectedMonth)} {selectedYear}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleNextMonth} className="shrink-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("pdf")}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("excel")}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("print")}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Reminders
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card 
            className={`border-amber-200 cursor-pointer transition-all hover:shadow-md ${
              activeFilter === "total" ? "ring-2 ring-amber-500" : ""
            }`}
            onClick={() => handleCardClick("total")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Total Due Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-xl sm:text-2xl font-bold flex items-center text-red-600">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  {formatRupee(summaryData.totalDue)}
                </div>
                <AlertCircle className="h-6 w-6 text-amber-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total pending payments</p>
            </CardContent>
          </Card>

          <Card 
            className={`border-blue-200 cursor-pointer transition-all hover:shadow-md ${
              activeFilter === "monthly" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => handleCardClick("monthly")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">{getMonthName(selectedMonth)}'s Due Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold flex items-center text-red-600">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  {formatRupee(summaryData.monthlyDue)}
                </div>
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Due for {getMonthName(selectedMonth)} {selectedYear}</p>
            </CardContent>
          </Card>

          <Card 
            className={`border-green-200 cursor-pointer transition-all hover:shadow-md ${
              activeFilter === "upcoming" ? "ring-2 ring-green-500" : ""
            }`}
            onClick={() => handleCardClick("upcoming")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold">Upcoming Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold flex items-center text-red-600">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  {formatRupee(summaryData.upcomingDue)}
                </div>
                <AlertCircle className="h-6 w-6 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Due in next 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by student name, ID, or seat no..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus} className="w-full sm:w-[180px]">
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Pending Payments</CardTitle>
                {activeFilter !== "all" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing {activeFilter === "total" ? "all" : activeFilter === "monthly" ? getMonthName(selectedMonth) + "'s" : "upcoming"} payments
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-amber-500 text-amber-500 hover:bg-amber-50 w-full sm:w-auto"
                  onClick={() => handleBulkReminder()}
                >
                  <Bell className="h-4 w-4 mr-1" />
                  Bulk Reminder
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-gray-200 hover:bg-transparent">
                    <TableHead className="whitespace-nowrap text-xs font-semibold text-gray-600 border-r border-gray-200">Seat No</TableHead>
                    <TableHead className="whitespace-nowrap text-xs font-semibold text-gray-600 border-r border-gray-200">Student</TableHead>
                    <TableHead className="whitespace-nowrap text-xs font-semibold text-gray-600 border-r border-gray-200">Amount</TableHead>
                    <TableHead className="whitespace-nowrap text-xs font-semibold text-gray-600 border-r border-gray-200">Due Date</TableHead>
                    <TableHead className="whitespace-nowrap text-xs font-semibold text-gray-600 border-r border-gray-200">Payment Mode</TableHead>
                    <TableHead className="whitespace-nowrap text-xs font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.seatNo} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium whitespace-nowrap text-xs border-r border-gray-100">{payment.seatNo}</TableCell>
                        <TableCell className="border-r border-gray-100">
                          <div>
                            <p className="font-medium text-xs">{payment.studentName}</p>
                            <p className="text-xs text-muted-foreground">{payment.studentId}</p>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-green-600 font-bold text-xs border-r border-gray-100">{formatRupee(payment.amount)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs border-r border-gray-100">
                          {payment.dueDate ? format(new Date(payment.dueDate), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs border-r border-gray-100">{payment.paymentMethod}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                              onClick={() => {
                                setCurrentReceipt(payment);
                                setShowReceiptPreview(true);
                              }}
                            >
                              <Receipt className="h-3 w-3 mr-1" />
                              Receipt
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({
                                    title: 'Due Payment Receipt',
                                    text: `Due Payment Receipt for ${payment.studentName}`,
                                    url: window.location.href,
                                  });
                                } else {
                                  toast({
                                    title: "Share",
                                    description: "Sharing is not supported on this device",
                                  });
                                }
                              }}
                            >
                              <Share2 className="h-3 w-3 mr-1" />
                              Share
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="h-8 w-8 text-gray-300" />
                          <p className="text-muted-foreground text-xs">No due payments found matching the current filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Modal */}
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <Card className="w-full max-w-[800px] bg-white shadow-xl">
              <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-emerald-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-xl">
                      <Wallet className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl font-bold text-emerald-800">Collect Payment</CardTitle>
                      <p className="text-sm text-emerald-600">Complete the payment details below</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-600 text-lg sm:text-xl px-4 py-1.5">
                    {selectedPayment.seatNo}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 space-y-3">
                {/* Student Details Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-blue-50 rounded-md">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Student Details</h3>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Name</p>
                        <p className="font-medium text-gray-800 text-sm">{selectedPayment.studentName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Student ID</p>
                        <p className="font-medium text-gray-800 text-sm">{selectedPayment.studentId}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Contact</p>
                        <p className="font-medium text-gray-800 text-sm">+91 98765 43210</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Admission Date</p>
                        <p className="font-medium text-gray-800 text-sm">15 July 2023</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Shift</p>
                        <p className="font-medium text-gray-800 text-sm">Morning</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 mb-0.5">Time</p>
                        <p className="font-medium text-gray-800 text-sm">9:00 AM - 2:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Details Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-purple-50 rounded-md">
                      <CreditCard className="h-4 w-4 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Payment Details</h3>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-gray-500">Due Amount</p>
                        <div className="flex items-center gap-1">
                          <span className="text-lg font-bold text-red-500">₹</span>
                          <p className="text-lg font-bold text-red-500">{editableAmount}</p>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-gray-500">Collected Amount</p>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-500">₹</span>
                          <Input 
                            type="number"
                            value={collectedAmount}
                            onChange={(e) => setCollectedAmount(e.target.value)}
                            className="text-lg font-bold text-emerald-500 pl-6 h-8 border-emerald-200 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-gray-500">Due Date</p>
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1.5 rounded-md border border-gray-200 h-8">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <p className="text-sm font-medium">{editableDueDate}</p>
                        </div>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-gray-500">Payment Date</p>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <Input 
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="text-sm font-medium pl-8 h-8 border-gray-200 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-500">Description</p>
                      <Input 
                        value={editableDescription}
                        onChange={(e) => setEditableDescription(e.target.value)}
                        className="text-sm font-medium h-8 border-gray-200 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1.5 bg-amber-50 rounded-md">
                      <CreditCard className="h-4 w-4 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Payment Method</h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Button
                      variant={paymentMethod === "CASH" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("CASH")}
                      className={`h-12 flex flex-col items-center justify-center gap-0.5 ${
                        paymentMethod === "CASH" ? "bg-emerald-600 hover:bg-emerald-700" : "hover:bg-emerald-50"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Banknote className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-medium">Cash</span>
                    </Button>
                    <Button
                      variant={paymentMethod === "PHONEPE" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("PHONEPE")}
                      className={`h-12 flex flex-col items-center justify-center gap-0.5 ${
                        paymentMethod === "PHONEPE" ? "bg-[#5F259F] hover:bg-[#5F259F]/90" : "hover:bg-[#5F259F]/5"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#5F259F]/10 flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-[#5F259F]" />
                      </div>
                      <span className="text-xs font-medium">PhonePe</span>
                    </Button>
                    <Button
                      variant={paymentMethod === "PAYTM" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("PAYTM")}
                      className={`h-12 flex flex-col items-center justify-center gap-0.5 ${
                        paymentMethod === "PAYTM" ? "bg-[#00BAF2] hover:bg-[#00BAF2]/90" : "hover:bg-[#00BAF2]/5"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-[#00BAF2]/10 flex items-center justify-center">
                        <Smartphone className="h-4 w-4 text-[#00BAF2]" />
                      </div>
                      <span className="text-xs font-medium">Paytm</span>
                    </Button>
                    <Button
                      variant={paymentMethod === "UPI" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("UPI")}
                      className={`h-12 flex flex-col items-center justify-center gap-0.5 ${
                        paymentMethod === "UPI" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                        <QrCode className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-xs font-medium">UPI</span>
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-1.5 pt-3 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full sm:w-auto hover:bg-gray-100 h-8 text-sm"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePaymentSubmit}
                    disabled={!paymentMethod}
                    className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 h-8 text-sm ${
                      !paymentMethod ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Confirm Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reminder Modal */}
        {showReminderModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <Card className="w-[500px]">
              <CardHeader>
                <CardTitle>Schedule Reminder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Student</p>
                  <p className="text-lg">{selectedPayment.studentName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-2xl font-bold">{formatRupee(selectedPayment.amount)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Reminder Type</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={reminderType === "whatsapp" ? "default" : "outline"}
                      onClick={() => setReminderType("whatsapp")}
                      className={`h-10 ${reminderType === "whatsapp" ? "bg-[#25D366] hover:bg-[#25D366]/90" : ""}`}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                    <Button
                      variant={reminderType === "sms" ? "default" : "outline"}
                      onClick={() => setReminderType("sms")}
                      className="h-10"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      SMS
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Date</p>
                  <Input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Time</p>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowReminderModal(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      toast({
                        title: "Reminder Sent",
                        description: `Immediate reminder sent to ${selectedPayment.studentName} via ${reminderType}`,
                      });
                      setShowReminderModal(false);
                    }}
                  >
                    Remind Now
                  </Button>
                  <Button onClick={handleReminderSubmit} disabled={!reminderDate || !reminderTime}>
                    Schedule Reminder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk Reminder Modal */}
        {showBulkReminderModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <Card className="w-[600px]">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Schedule Bulk Reminder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Selected Payments</p>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-lg font-semibold">{filteredPayments.length} payments</p>
                      <p className="text-sm text-muted-foreground">Total amount: {formatRupee(filteredPayments.reduce((sum, p) => sum + p.amount, 0))}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Reminder Type</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={reminderType === "whatsapp" ? "default" : "outline"}
                        onClick={() => setReminderType("whatsapp")}
                        className={`h-10 ${reminderType === "whatsapp" ? "bg-[#25D366] hover:bg-[#25D366]/90" : ""}`}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                      <Button
                        variant={reminderType === "sms" ? "default" : "outline"}
                        onClick={() => setReminderType("sms")}
                        className="h-10"
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        SMS
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Reminder Template</p>
                  <Select value={reminderTemplate} onValueChange={setReminderTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Reminder</SelectItem>
                      <SelectItem value="friendly">Friendly Reminder</SelectItem>
                      <SelectItem value="urgent">Urgent Reminder</SelectItem>
                      <SelectItem value="final">Final Notice</SelectItem>
                      <SelectItem value="custom">Custom Message</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reminderTemplate === "custom" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Custom Message</p>
                    <Textarea
                      placeholder="Enter your custom reminder message..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Reminder Frequency</p>
                  <Select value={reminderFrequency} onValueChange={setReminderFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Send Once</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom Schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reminderFrequency === "custom" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Select Days</p>
                    <div className="flex flex-wrap gap-2">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                        <Button
                          key={day}
                          variant={reminderDays.includes(day) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (reminderDays.includes(day)) {
                              setReminderDays(reminderDays.filter(d => d !== day));
                            } else {
                              setReminderDays([...reminderDays, day]);
                            }
                          }}
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Date</p>
                    <Input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Time</p>
                    <Input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowBulkReminderModal(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => {
                      toast({
                        title: "Bulk Reminder Sent",
                        description: `Immediate reminders sent to ${filteredPayments.length} payments via ${reminderType}`,
                      });
                      setShowBulkReminderModal(false);
                    }}
                  >
                    Remind Now
                  </Button>
                  <Button 
                    onClick={handleBulkReminderSubmit} 
                    disabled={!reminderDate || !reminderTime || (reminderFrequency === "custom" && reminderDays.length === 0)}
                  >
                    Schedule Reminders
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showReceiptPreview && currentReceipt && (
          <ReceiptPreview payment={currentReceipt} />
        )}
      </div>
    </DashboardLayout>
  );
};

// Add PropTypes validation
DuePaymentsPage.propTypes = {
  selectedPayment: paymentRecordPropTypes,
  currentReceipt: paymentRecordPropTypes,
  paymentMethod: PropTypes.string,
  paymentDate: PropTypes.string,
  collectedAmount: PropTypes.string,
  editableAmount: PropTypes.string,
  editableDueDate: PropTypes.string,
  editableDescription: PropTypes.string
};

export default DuePaymentsPage; 