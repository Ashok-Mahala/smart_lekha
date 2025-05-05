import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
  Settings,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Banknote,
  Smartphone,
  QrCode,
  User,
  CreditCard,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Download,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Printer,
  Plus,
  Receipt,
  Share2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { saveAs } from "file-saver";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import PropTypes from 'prop-types';

export const paymentRecordPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  studentId: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  paymentMethod: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'completed', 'failed', 'refunded']).isRequired,
  date: PropTypes.string.isRequired,
  transactionId: PropTypes.string
});

export const paymentResponsePropTypes = PropTypes.shape({
  success: PropTypes.bool.isRequired,
  message: PropTypes.string,
  data: paymentRecordPropTypes
});

// Remove mock data and add API call
const fetchPayments = async () => {
  try {
    const response = await fetch('/api/payments');
    
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
      throw new Error('API endpoint not available');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
};

const PaymentsPage = () => {
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
  const [editableDate, setEditableDate] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [collectedAmount, setCollectedAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState({
    duePayments: 0,
    collections: 0,
    expenses: 0
  });

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPayments();
        setPayments(data);
        
        // Calculate summary data from payments
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const summary = {
          duePayments: 0,
          collections: 0,
          expenses: 0
        };

        data.forEach(payment => {
          const paymentDate = new Date(payment.date);
          if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
            if (payment.status === 'pending') {
              summary.duePayments += payment.amount;
            } else if (payment.status === 'completed') {
              summary.collections += payment.amount;
            } else if (payment.status === 'failed') {
              summary.expenses += payment.amount;
            }
          }
        });

        setSummaryData(summary);
      } catch (error) {
        console.error('Error loading payments:', error);
        toast({
          title: "Error",
          description: "Failed to load payments",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, []);

  // Filter payments based on search query
  const filteredPayments = payments.filter((payment) => {
    const query = searchQuery.toLowerCase();
    return (
      payment.studentName.toLowerCase().includes(query) ||
      payment.studentId.toLowerCase().includes(query) ||
      payment.id.toLowerCase().includes(query)
    );
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
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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
      const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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

      setCurrentReceipt(paymentRecord);
      setShowReceiptPreview(true);

      const response = await fetch('/api/payments', {
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

      generateReceipt(paymentRecord);

      toast({
        title: "Payment Successful",
        description: `Payment of ₹${collectedAmount} recorded. Receipt No: ${receiptNumber}`,
      });

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

  // Remove hardcoded months array and use date-fns
  const getMonthName = (monthIndex) => {
    return format(new Date(2000, monthIndex, 1), 'MMMM');
  };

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

  // Filter payments based on search query, month, type, and status
  const filteredPaymentsHistory = payments.filter((payment) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (payment.studentName?.toLowerCase().includes(query) || false) ||
      (payment.studentId?.toLowerCase().includes(query) || false) ||
      (payment.description?.toLowerCase().includes(query) || false) ||
      payment.id.toLowerCase().includes(query);
    
    const paymentDate = payment.date ? new Date(payment.date) : null;
    const matchesMonth = !paymentDate || (
      paymentDate.getMonth() === selectedMonth && 
      paymentDate.getFullYear() === selectedYear
    );
    
    const matchesType = activeFilter === "all" || payment.type === activeFilter;
    const matchesStatus = selectedStatus === "all" || payment.status === selectedStatus;
    
    return matchesSearch && matchesMonth && matchesType && matchesStatus;
  });

  const handleExport = (format) => {
    toast({
      title: "Export Started",
      description: `Exporting payment history in ${format.toUpperCase()} format...`,
    });
  };

  const handleCardClick = (type) => {
    switch (type) {
      case "due":
        navigate("/due-payments");
        break;
      case "collections":
        navigate("/collections");
        break;
      case "expenses":
        navigate("/expenses");
        break;
      default:
        break;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Payments</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage all payment activities
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card 
            className="bg-gradient-to-tr from-red-50 via-rose-50 to-pink-50 border-red-200 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-red-300"
            onClick={() => handleCardClick("due")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-900">Due Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-xl sm:text-2xl font-bold flex items-center text-red-800">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  {formatRupee(summaryData.duePayments)}
                </div>
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-xs text-red-700 mt-2">Total pending payments</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-bl from-green-50 via-emerald-50 to-teal-50 border-green-200 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-green-300"
            onClick={() => handleCardClick("collections")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Collections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold flex items-center text-green-800">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  {formatRupee(summaryData.collections)}
                </div>
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-xs text-green-700 mt-2">Total collections this month</p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-tl from-amber-50 via-yellow-50 to-orange-50 border-amber-200 cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-amber-300"
            onClick={() => handleCardClick("expenses")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-900">Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold flex items-center text-amber-800">
                  <IndianRupee className="h-5 w-5 mr-1" />
                  {formatRupee(summaryData.expenses)}
                </div>
                <TrendingDown className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-xs text-amber-700 mt-2">Total expenses this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by student name, ID, or description..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="due">Due Payments</SelectItem>
                <SelectItem value="collection">Collections</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payment History Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Payment History</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Showing payments for {getMonthName(selectedMonth)} {selectedYear}
                </p>
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
                      <TableRow key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium whitespace-nowrap text-xs border-r border-gray-100">{payment.id}</TableCell>
                        <TableCell className="border-r border-gray-100">
                          <div>
                            <p className="font-medium text-xs">{payment.studentName}</p>
                            <p className="text-xs text-muted-foreground">{payment.studentId}</p>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-green-600 font-bold text-xs border-r border-gray-100">{formatRupee(payment.amount)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs border-r border-gray-100">
                          {payment.date ? format(new Date(payment.date), 'dd/MM/yyyy') : 
                           payment.dueDate ? format(new Date(payment.dueDate), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs border-r border-gray-100">{payment.method}</TableCell>
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
                                    title: 'Payment Receipt',
                                    text: `Payment Receipt for ${payment.studentName}`,
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
                          <p className="text-muted-foreground text-xs">No payments found matching the current filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-[800px] bg-white shadow-xl">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-emerald-100">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl">
                    <CreditCard className="h-7 w-7 text-emerald-600" />
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
                        <p className="text-sm font-medium">{editableDate}</p>
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

      {/* Receipt Preview */}
      {showReceiptPreview && currentReceipt && (
        <ReceiptPreview payment={currentReceipt} />
      )}
    </DashboardLayout>
  );
};

// Add PropTypes validation
PaymentsPage.propTypes = {
  currentReceipt: paymentRecordPropTypes,
  selectedPayment: paymentRecordPropTypes,
  paymentMethod: PropTypes.string,
  collectedAmount: PropTypes.string,
  paymentDate: PropTypes.string,
  editableAmount: PropTypes.string,
  editableDate: PropTypes.string,
  editableDescription: PropTypes.string,
  selectedMonth: PropTypes.number,
  selectedYear: PropTypes.number,
  activeFilter: PropTypes.string,
  selectedStatus: PropTypes.string
};

export default PaymentsPage;
