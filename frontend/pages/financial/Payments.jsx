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
  Search,
  Banknote,
  Smartphone,
  QrCode,
  User,
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  Share2,
  Download,
  Filter,
  MoreHorizontal,
  Loader2,
  RefreshCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { jsPDF } from "jspdf";
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

// Import the existing API service
import paymentService from '@/api/payments';

export const paymentRecordPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  studentId: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  paymentMethod: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending', 'completed', 'failed', 'refunded', 'partial']).isRequired,
  date: PropTypes.string.isRequired,
  transactionId: PropTypes.string
});

export const paymentResponsePropTypes = PropTypes.shape({
  success: PropTypes.bool.isRequired,
  message: PropTypes.string,
  data: paymentRecordPropTypes
});

const PaymentsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeFilter, setActiveFilter] = useState("all");
  const [collectedAmount, setCollectedAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryData, setSummaryData] = useState({
    duePayments: 0,
    collections: 0,
    expenses: 0
  });

  // Load payments and stats on component mount and filter changes
  useEffect(() => {
    loadPaymentsAndStats();
  }, [selectedMonth, selectedYear, selectedStatus, activeFilter]);

  const loadPaymentsAndStats = async () => {
    try {
      setIsLoading(true);
      
      const startDate = startOfMonth(new Date(selectedYear, selectedMonth));
      const endDate = endOfMonth(new Date(selectedYear, selectedMonth));
      
      const [paymentsResponse, statsResponse] = await Promise.all([
        paymentService.getPayments({
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          search: searchQuery || undefined
        }),
        paymentService.getDashboardStats({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      ]);
      
      // Handle response structure
      const paymentsData = paymentsResponse.success ? paymentsResponse.data : paymentsResponse;
      const statsData = statsResponse.success ? statsResponse.data : statsResponse;
      
      setPayments(paymentsData || []);
      setSummaryData(statsData?.summary || { duePayments: 0, collections: 0, expenses: 0 });
    } catch (error) {
      console.error('Error loading payments:', error);
      toast({
        title: "Error",
        description: "Failed to load payments data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPaymentsAndStats();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filter payments based on search query for immediate UI response
  const filteredPayments = payments.filter((payment) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      payment.studentName?.toLowerCase().includes(query) ||
      payment.studentId?.toLowerCase().includes(query) ||
      payment.seatNo?.toLowerCase().includes(query) ||
      payment.transactionId?.toLowerCase().includes(query)
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
    const statusConfig = {
      "completed": { variant: "default", className: "bg-green-500", label: "Completed" },
      "pending": { variant: "outline", className: "border-amber-500 text-amber-500", label: "Pending" },
      "failed": { variant: "destructive", className: "bg-red-500", label: "Failed" },
      "partial": { variant: "outline", className: "border-blue-500 text-blue-500", label: "Partial" },
      "refunded": { variant: "outline", className: "border-gray-500 text-gray-500", label: "Refunded" }
    };
    
    const config = statusConfig[status] || { variant: "outline", className: "", label: "Unknown" };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Generate PDF receipt
  const generatePDFReceipt = async (payment) => {
    try {
      // Get enhanced receipt data from backend
      const receiptResponse = await paymentService.getReceipt(payment.id);
      const receiptData = receiptResponse.data;

      const doc = new jsPDF();
      
      // Colors
      const primaryColor = [0, 102, 204]; // Blue
      const secondaryColor = [76, 175, 80]; // Green
      const textColor = [51, 51, 51];
      const lightColor = [240, 240, 240];

      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('SEATFLOW PAYMENT RECEIPT', 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text('Smart Library Management System', 105, 22, { align: 'center' });

      // Receipt Details
      let yPosition = 45;
      
      doc.setTextColor(...textColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RECEIPT DETAILS', 15, yPosition);
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const receiptDetails = [
        { label: 'Receipt Number', value: receiptData.receiptNumber },
        { label: 'Transaction ID', value: receiptData.transactionId },
        { label: 'Payment Date', value: format(new Date(receiptData.paymentDate), 'dd/MM/yyyy') },
        { label: 'Status', value: receiptData.status.toUpperCase() }
      ];
      
      receiptDetails.forEach(detail => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${detail.label}:`, 15, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(detail.value, 60, yPosition);
        yPosition += 6;
      });

      // Property Details
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('LIBRARY DETAILS', 15, yPosition);
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const propertyDetails = [
        { label: 'Library Name', value: receiptData.propertyName },
        { label: 'Address', value: receiptData.propertyAddress },
        { label: 'Seat Number', value: receiptData.seatNo },
        { label: 'Shift', value: receiptData.shiftName }
      ];
      
      propertyDetails.forEach(detail => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${detail.label}:`, 15, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(detail.value, 50, yPosition);
        yPosition += 6;
      });

      // Student Details
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT DETAILS', 15, yPosition);
      
      yPosition += 10;
      
      const studentDetails = [
        { label: 'Student Name', value: receiptData.studentName },
        { label: 'Student ID', value: receiptData.studentId },
        { label: 'Email', value: receiptData.studentEmail },
        { label: 'Phone', value: receiptData.studentPhone }
      ];
      
      studentDetails.forEach(detail => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${detail.label}:`, 15, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(detail.value, 45, yPosition);
        yPosition += 6;
      });

      // Payment Details
      yPosition += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT DETAILS', 15, yPosition);
      
      yPosition += 10;
      
      // Table header
      doc.setFillColor(...lightColor);
      doc.rect(15, yPosition, 180, 8, 'F');
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, yPosition + 5);
      doc.text('Amount (₹)', 160, yPosition + 5, { align: 'right' });
      
      yPosition += 12;
      
      // Payment items
      const paymentItems = [
        { description: 'Seat Rent Fee', amount: receiptData.dueAmount },
        { description: 'Amount Paid', amount: receiptData.collectedAmount },
        { description: 'Balance Amount', amount: receiptData.balanceAmount }
      ];
      
      paymentItems.forEach(item => {
        doc.setFont('helvetica', 'normal');
        doc.text(item.description, 20, yPosition);
        doc.text(item.amount.toString(), 160, yPosition, { align: 'right' });
        yPosition += 8;
      });

      // Total
      yPosition += 5;
      doc.setDrawColor(...secondaryColor);
      doc.line(15, yPosition, 195, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...secondaryColor);
      doc.text('TOTAL PAID', 20, yPosition);
      doc.text(`₹${receiptData.collectedAmount}`, 160, yPosition, { align: 'right' });

      // Payment Method
      yPosition += 15;
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Method:', 15, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(receiptData.paymentMethod, 50, yPosition);
      
      yPosition += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Mode:', 15, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(receiptData.paymentMode, 50, yPosition);

      // Period
      if (receiptData.period) {
        yPosition += 15;
        doc.setFont('helvetica', 'bold');
        doc.text('RENTAL PERIOD:', 15, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(`${format(new Date(receiptData.period.start), 'dd/MM/yyyy')} to ${format(new Date(receiptData.period.end), 'dd/MM/yyyy')}`, 50, yPosition);
      }

      // Footer
      yPosition = 270;
      doc.setDrawColor(200, 200, 200);
      doc.line(15, yPosition, 195, yPosition);
      yPosition += 10;
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('This is a computer generated receipt. No signature required.', 105, yPosition, { align: 'center' });
      yPosition += 5;
      doc.text('Thank you for your payment!', 105, yPosition, { align: 'center' });
      yPosition += 5;
      doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy hh:mm a')}`, 105, yPosition, { align: 'center' });

      // Save the PDF
      const fileName = `receipt_${receiptData.receiptNumber}.pdf`;
      doc.save(fileName);

      toast({
        title: "Receipt Downloaded",
        description: "PDF receipt has been downloaded successfully",
      });

    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF receipt",
        variant: "destructive",
      });
    }
  };

  // Handle payment submission
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

    const dueAmount = parseFloat(selectedPayment.amount);
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
      setIsProcessing(true);

      const paymentData = {
        studentId: selectedPayment.studentId,
        studentName: selectedPayment.studentName,
        seatNo: selectedPayment.seatNo,
        dueAmount: dueAmount.toString(),
        collectedAmount: collectedAmount,
        balanceAmount: (dueAmount - paidAmount).toString(),
        paymentMethod: paymentMethod,
        paymentMode: paymentMethod === "CASH" ? "Cash" : "Digital",
        paymentDate: paymentDate,
        description: `Seat rent payment for ${selectedPayment.studentName}`,
        feeType: 'seat_rent'
      };

      const result = await paymentService.createPayment(paymentData);
      
      // Generate PDF receipt automatically after successful payment
      if (result.success) {
        await generatePDFReceipt(result.data.payment);
      }

      // Refresh payments list
      await loadPaymentsAndStats();

      toast({
        title: "Payment Successful",
        description: `Payment of ₹${collectedAmount} recorded successfully`,
      });

      // Reset form
      setShowPaymentModal(false);
      setSelectedPayment(null);
      setPaymentMethod("");
      setCollectedAmount("");
      setPaymentDate(new Date().toISOString().split('T')[0]);

    } catch (error) {
      console.error('Payment submission error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle export report
  const handleExportReport = async (format = 'pdf') => {
    try {
      const startDate = startOfMonth(new Date(selectedYear, selectedMonth));
      const endDate = endOfMonth(new Date(selectedYear, selectedMonth));
      
      const report = await paymentService.generatePaymentReport({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reportType: 'monthly',
        format: format
      });

      toast({
        title: "Report Generated",
        description: `Payment report for ${getMonthName(selectedMonth)} ${selectedYear} has been generated`,
      });

    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate payment report",
        variant: "destructive",
      });
    }
  };

  // Helper functions
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

  const openPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setCollectedAmount(payment.amount?.toString() || "");
    setShowPaymentModal(true);
  };

  // Receipt Preview Component
  const ReceiptPreview = ({ payment }) => {
    if (!payment) return null;

    return (
      <Dialog open={showReceiptPreview} onOpenChange={setShowReceiptPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Receipt Preview</DialogTitle>
          </DialogHeader>
          <div className="bg-white p-6 rounded-lg border">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-600">SEATFLOW PAYMENT RECEIPT</h2>
              <p className="text-sm text-gray-600">Smart Library Management System</p>
              <div className="border-t border-gray-200 my-4"></div>
            </div>
            
            <div className="space-y-6">
              {/* Receipt Details */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-lg">Receipt Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Receipt No</p>
                    <p className="font-medium">{payment.receiptNumber || payment.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Transaction ID</p>
                    <p className="font-medium">{payment.transactionId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{format(new Date(payment.paymentDate || payment.date), 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <Badge className={`${
                      payment.status === 'completed' ? 'bg-green-500' : 
                      payment.status === 'pending' ? 'bg-amber-500' : 
                      'bg-gray-500'
                    }`}>
                      {payment.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Library Details */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-lg">Library Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Library Name</p>
                    <p className="font-medium">{payment.property?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{payment.property?.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Seat Number</p>
                    <p className="font-medium">{payment.seatNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Shift</p>
                    <p className="font-medium">{payment.shift?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Student Details */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-lg">Student Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Student Name</p>
                    <p className="font-medium">{payment.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Student ID</p>
                    <p className="font-medium">{payment.studentId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{payment.studentEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{payment.studentPhone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-lg">Payment Details</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold">Description</th>
                        <th className="text-right p-3 text-sm font-semibold">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-3">Seat Rent Fee</td>
                        <td className="p-3 text-right">{payment.dueAmount || payment.amount}</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-3">Amount Paid</td>
                        <td className="p-3 text-right text-green-600 font-semibold">
                          {payment.collectedAmount || payment.amount}
                        </td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-3">Balance Amount</td>
                        <td className="p-3 text-right">{payment.balanceAmount || 0}</td>
                      </tr>
                      <tr className="border-t bg-gray-50">
                        <td className="p-3 font-semibold">TOTAL PAID</td>
                        <td className="p-3 text-right font-semibold text-green-600">
                          ₹{payment.collectedAmount || payment.amount}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium">{payment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Mode</p>
                  <p className="font-medium">{payment.paymentMode || (payment.paymentMethod === 'CASH' ? 'Cash' : 'Digital')}</p>
                </div>
              </div>

              {/* Rental Period */}
              {payment.period && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Rental Period</h3>
                  <p className="text-gray-700">
                    {format(new Date(payment.period.start), 'dd/MM/yyyy')} to {format(new Date(payment.period.end), 'dd/MM/yyyy')}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 my-6"></div>
            <div className="text-center text-sm text-gray-500">
              <p>This is a computer generated receipt. No signature required.</p>
              <p>Thank you for your payment!</p>
            </div>
            
            <div className="flex justify-center gap-4 mt-6">
              <Button 
                onClick={() => generatePDFReceipt(payment)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Payments</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage all payment activities and collections
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadPaymentsAndStats}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExportReport('pdf')}>
                  PDF Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportReport('excel')}>
                  Excel Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportReport('csv')}>
                  CSV Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        {/* Month Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                  Previous
                </Button>
                <div className="text-lg font-semibold">
                  {getMonthName(selectedMonth)} {selectedYear}
                </div>
                <Button variant="outline" size="sm" onClick={handleNextMonth}>
                  Next
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {filteredPayments.length} payments found
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by student name, ID, seat no, or transaction ID..."
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
                <SelectItem value="partial">Partial</SelectItem>
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
                    <TableHead className="whitespace-nowrap text-xs font-semibold text-gray-600 border-r border-gray-200">Status</TableHead>
                    <TableHead className="whitespace-nowrap text-xs font-semibold text-gray-600 border-r border-gray-200">Due Date</TableHead>
                    <TableHead className="whitespace-nowrap text-xs font-semibold text-gray-600 border-r border-gray-200">Payment Method</TableHead>
                    <TableHead className="whitespace-nowrap text-xs font-semibold text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                          <p className="text-muted-foreground text-sm">Loading payments...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredPayments.length > 0 ? (
                    filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium whitespace-nowrap text-xs border-r border-gray-100">
                          {payment.seatNo}
                        </TableCell>
                        <TableCell className="border-r border-gray-100">
                          <div>
                            <p className="font-medium text-xs">{payment.studentName}</p>
                            <p className="text-xs text-muted-foreground">{payment.studentId}</p>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-green-600 font-bold text-xs border-r border-gray-100">
                          {formatRupee(payment.amount)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs border-r border-gray-100">
                          {getStatusBadge(payment.status)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs border-r border-gray-100">
                          {payment.dueDate ? format(new Date(payment.dueDate), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs border-r border-gray-100">
                          {payment.paymentMethod}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                              onClick={() => {
                                setCurrentReceipt(payment);
                                setShowReceiptPreview(true);
                              }}
                            >
                              <Receipt className="h-3 w-3 mr-1" />
                              Receipt
                            </Button>
                            {payment.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200"
                                onClick={() => openPaymentModal(payment)}
                              >
                                <CreditCard className="h-3 w-3 mr-1" />
                                Collect
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => generatePDFReceipt(payment)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF Receipt
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="h-8 w-8 text-gray-300" />
                          <p className="text-muted-foreground text-sm">No payments found matching the current filters</p>
                          <Button variant="outline" onClick={() => {
                            setSearchQuery("");
                            setSelectedStatus("all");
                            setActiveFilter("all");
                          }}>
                            Clear Filters
                          </Button>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
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
                      <p className="text-[10px] text-gray-500 mb-0.5">Seat No</p>
                      <p className="font-medium text-gray-800 text-sm">{selectedPayment.seatNo}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">Due Amount</p>
                      <p className="font-medium text-gray-800 text-sm">{formatRupee(selectedPayment.amount)}</p>
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
                        <p className="text-lg font-bold text-red-500">{selectedPayment.amount}</p>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-500">Collected Amount *</p>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-lg font-bold text-emerald-500">₹</span>
                        <Input 
                          type="number"
                          value={collectedAmount}
                          onChange={(e) => setCollectedAmount(e.target.value)}
                          className="text-lg font-bold text-emerald-500 pl-6 h-8 border-emerald-200 focus:border-emerald-500"
                          placeholder="Enter amount"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-500">Payment Date *</p>
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
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-gray-500">Balance Amount</p>
                      <div className="flex items-center gap-1 bg-gray-100 px-2 py-1.5 rounded-md h-8">
                        <span className="text-lg font-bold text-gray-600">₹</span>
                        <p className="text-lg font-bold text-gray-600">
                          {selectedPayment.amount - (parseFloat(collectedAmount) || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="p-1.5 bg-amber-50 rounded-md">
                    <CreditCard className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">Payment Method *</h3>
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
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePaymentSubmit}
                  disabled={!paymentMethod || !collectedAmount || isProcessing}
                  className={`w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 h-8 text-sm ${
                    (!paymentMethod || !collectedAmount || isProcessing) ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  )}
                  {isProcessing ? "Processing..." : "Confirm Payment"}
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
  selectedMonth: PropTypes.number,
  selectedYear: PropTypes.number,
  activeFilter: PropTypes.string,
  selectedStatus: PropTypes.string
};

export default PaymentsPage;