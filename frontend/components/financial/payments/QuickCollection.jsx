import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CreditCard, Receipt, Loader2, AlertCircle, CheckCircle2, X, Calendar, User, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';

const QuickCollection = ({ onClose }) => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [studentDetails, setStudentDetails] = useState(null);

  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    amount: 0,
    paymentMethod: '',
    paymentDate: new Date(),
    receiptNumber: generateReceiptNumber(),
    description: '',
    category: ''
  });

  // Generate unique receipt number
  function generateReceiptNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RCP${year}${month}${random}`;
  }

  // Payment methods
  const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'card', name: 'Card' },
    { id: 'upi', name: 'UPI' },
    { id: 'bank_transfer', name: 'Bank Transfer' }
  ];

  // Payment categories
  const paymentCategories = [
    { id: 'library', name: 'Library Fee' },
    { id: 'membership', name: 'Membership Fee' },
    { id: 'booking', name: 'Booking Fee' },
    { id: 'other', name: 'Other' }
  ];

  // Fetch student details when ID changes
  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!formData.studentId) {
        setFormData(prev => ({ ...prev, studentName: '' }));
        setStudentDetails(null);
        return;
      }

      setIsLoadingStudent(true);
      try {
        const response = await fetch(`/api/students/${formData.studentId}`);
        
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('Failed to fetch student data');
        }
        
        const studentData = await response.json();
        setStudentDetails(studentData);
        setFormData(prev => ({ 
          ...prev, 
          studentName: studentData.name,
          amount: studentData.dueFees?.library || 0 // Default to library fee
        }));
      } catch (error) {
        console.error('Error fetching student details:', error);
        toast.error('Failed to fetch student details');
      } finally {
        setIsLoadingStudent(false);
      }
    };

    const debounceTimer = setTimeout(fetchStudentDetails, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.studentId]);

  // Update amount when category changes
  useEffect(() => {
    if (studentDetails && formData.category) {
      const amount = studentDetails.dueFees[formData.category] || 0;
      setFormData(prev => ({ ...prev, amount }));
    }
  }, [formData.category, studentDetails]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.studentId || !formData.amount || !formData.paymentMethod || !formData.category) {
        throw new Error('Please fill in all required fields');
      }

      // Submit payment to API
      const response = await fetch('/api/payments/collect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: formData.studentId,
          amount: parseFloat(formData.amount),
          paymentMethod: formData.paymentMethod,
          category: formData.category,
          notes: formData.notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process payment');
      }

      const paymentData = await response.json();

      // Generate receipt
      setIsGeneratingReceipt(true);
      setReceiptData(paymentData);
      setShowReceipt(true);

      toast.success('Payment collected successfully!');
    } catch (error) {
      console.error('Collection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to process payment');
      toast.error('Failed to process payment');
    } finally {
      setIsSubmitting(false);
      setIsGeneratingReceipt(false);
    }
  };

  // Generate receipt
  const generateReceipt = async (data) => {
    try {
      const response = await fetch(`/api/receipts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Quick Collection
        </h2>
        <p className="text-sm text-muted-foreground">Collect payment and generate receipt instantly</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentId" className="text-sm font-medium">Student ID <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="studentId"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="Enter student ID"
                    required
                    className={cn(
                      "focus:ring-2 focus:ring-primary/20",
                      isLoadingStudent && "animate-pulse"
                    )}
                  />
                  {isLoadingStudent && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentName" className="text-sm font-medium">Student Name <span className="text-red-500">*</span></Label>
                <Input
                  id="studentName"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="Student name will appear here"
                  required
                  className="focus:ring-2 focus:ring-primary/20"
                  disabled={isLoadingStudent}
                />
              </div>
            </div>

            {studentDetails && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Due Fees</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Library Fee</p>
                    <p className="text-sm font-medium">₹{studentDetails.dueFees.library}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Membership Fee</p>
                    <p className="text-sm font-medium">₹{studentDetails.dueFees.membership}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Booking Fee</p>
                    <p className="text-sm font-medium">₹{studentDetails.dueFees.booking}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Due</p>
                    <p className="text-sm font-medium text-primary">₹{studentDetails.dueFees.total}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Amount <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    placeholder="Enter amount"
                    required
                    className="pl-8 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter payment description"
                  className="focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              Cancel
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px] bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                'Collect Payment'
              )}
            </Button>
          </motion.div>
        </div>
      </form>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Payment Receipt
            </DialogTitle>
          </DialogHeader>
          {receiptData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Receipt Number</p>
                  <p className="text-sm">{receiptData.receiptNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm">{format(receiptData.generatedAt, 'PPP')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Student ID</p>
                  <p className="text-sm">{receiptData.studentId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Student Name</p>
                  <p className="text-sm">{receiptData.studentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-sm">₹{receiptData.amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Method</p>
                  <p className="text-sm">{receiptData.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm">{receiptData.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-green-500">{receiptData.status}</p>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Implement print functionality
                    window.print();
                  }}
                >
                  Print Receipt
                </Button>
                <Button
                  onClick={() => {
                    setShowReceipt(false);
                    onClose();
                    navigate('/collections');
                  }}
                >
                  View in Collections
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

QuickCollection.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default QuickCollection; 