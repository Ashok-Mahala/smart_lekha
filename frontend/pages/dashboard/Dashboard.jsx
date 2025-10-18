import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Sofa, IndianRupee, Clock, TrendingUp, ChevronRight, BookOpen, Activity, Filter, BarChart2, LineChart, PieChart, Download, Plus, Bookmark, UserPlus, CreditCard, Search, AlertCircle, Loader2, Phone, Calendar, FileText, User, X, Building2, Library, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { format, subDays } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import QuickBookingForm from '@/components/booking/QuickBookingForm';
import { PaymentForm } from '@/components/financial/payments/PaymentForm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import QuickCollection from '@/components/financial/payments/QuickCollection';
import PropTypes from 'prop-types';
import { 
  getDailySummary, 
  fetchRevenueData, 
  fetchOccupancyData, 
  fetchStudentActivityData,
  fetchFinancialData
} from '@/api/reports';
import {getProperties} from '@/api/properties'

// API Integration Types
export const bookingPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  studentId: PropTypes.string.isRequired,
  seatId: PropTypes.string.isRequired,
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['active', 'completed', 'cancelled']).isRequired
});

export const studentPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['active', 'inactive']).isRequired
});

export const revenuePropTypes = PropTypes.shape({
  total: PropTypes.number.isRequired,
  today: PropTypes.number.isRequired,
  thisWeek: PropTypes.number.isRequired,
  thisMonth: PropTypes.number.isRequired
});

// Default data for when API calls fail
const defaultDashboardData = {
  dailySummary: {
    totalStudents: 0,
    peakHour: "N/A",
    totalRevenue: 0,
    occupancyRate: 0
  },
  revenue: {
    daily: [],
    weekly: [],
    monthly: [],
    yearly: []
  },
  occupancy: {
    daily: [],
    weekly: [],
    monthly: [],
    yearly: []
  },
  studentActivity: [],
  financial: []
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Something went wrong. Please try refreshing the page.
            {this.state.error && <div className="mt-2 text-xs">{this.state.error.message}</div>}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-full">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState("sb2");
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(defaultDashboardData);

  const fetchDashboardData = async () => {
        setIsLoading(true);
        setError(null);

    try {
      const [
        dailySummary,
        revenueData,
        occupancyData,
        studentActivityData,
        financialData,
        propertyData
      ] = await Promise.all([
        getDailySummary(),
        fetchRevenueData(),
        fetchOccupancyData(),
        fetchStudentActivityData(),
        fetchFinancialData(),
        getProperties()
      ]);

      setDashboardData({
        dailySummary,
        revenue: revenueData,
        occupancy: occupancyData,
        studentActivity: studentActivityData,
        financial: financialData
      });
      } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
      toast.error('Failed to load dashboard data');
      // Use default data when API calls fail
      setDashboardData(defaultDashboardData);
      } finally {
          setIsLoading(false);
        }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePropertyChange = (propertyId) => {
    setSelectedProperty(propertyId);
    fetchDashboardData();
  };

  const cardData = [
    {
      id: 'seats',
      title: 'Seat Management',
      value: `${dashboardData.occupancy.daily[0]?.current || 0}/${dashboardData.occupancy.daily[0]?.total || 0}`,
      icon: Sofa,
      color: 'from-blue-500 to-blue-600',
      route: '/seats',
      details: {
        title: 'Seat Analytics',
        content: [
          { label: 'Total Capacity', value: dashboardData.occupancy.daily[0]?.total || 0 },
          { label: 'Current Occupancy', value: dashboardData.occupancy.daily[0]?.current || 0 },
          { label: 'Available Seats', value: (dashboardData.occupancy.daily[0]?.total || 0) - (dashboardData.occupancy.daily[0]?.current || 0) },
          { label: 'Occupancy Rate', value: `${dashboardData.dailySummary.occupancyRate}%` }
        ]
      }
    },
    {
      id: 'students',
      title: 'Students',
      value: dashboardData.dailySummary.totalStudents.toString(),
      icon: Users,
      color: 'from-green-500 to-green-600',
      route: '/students',
      details: {
        title: 'Student Analytics',
        content: [
          { label: 'Total Students', value: dashboardData.dailySummary.totalStudents },
          { label: 'Active Today', value: dashboardData.studentActivity.length },
          { label: 'Peak Hour', value: dashboardData.dailySummary.peakHour },
          { label: 'Average Stay', value: dashboardData.dailySummary.averageStay || 'N/A' }
        ]
      }
    },
    {
      id: 'revenue',
      title: 'Today\'s Revenue',
      value: `₹${dashboardData.dailySummary.totalRevenue}`,
      icon: IndianRupee,
      color: 'from-yellow-500 to-yellow-600',
      route: '/payments',
      details: {
        title: 'Revenue Analytics',
        content: [
          { 
            label: 'Today\'s Revenue', 
            value: `₹${dashboardData.dailySummary?.totalRevenue || 0}` 
          },
          { 
            label: 'Monthly Revenue', 
            value: `₹${dashboardData.revenue?.monthly?.[0]?.amount || 0}` 
          },
          { 
            label: 'Growth Rate', 
            value: `${dashboardData.dailySummary?.growthRate || 0}%` 
          },
          { 
            label: 'Average Daily', 
            value: `₹${Math.floor((dashboardData.revenue?.monthly?.[0]?.amount || 0) / 30)}` 
          }
        ]
      }
    }
  ];

  const handleCardClick = (route) => {
    navigate(route);
  };

  const handleQuickBooking = () => {
    setShowBookingForm(true);
  };

  const handleBookingFormClose = () => {
    setShowBookingForm(false);
  };

  const handleAddStudent = () => {
    navigate('/students/add');
  };

  const handleProcessPayment = () => {
    setShowPaymentForm(true);
  };

  // Loading Skeleton Component
  const MetricCardSkeleton = () => (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-[100px]" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-[120px] mb-2" />
        <Skeleton className="h-4 w-[80px]" />
      </CardContent>
    </Card>
  );

  // Error Display Component
  const ErrorDisplay = ({ message }) => (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );

  ErrorDisplay.propTypes = {
    message: PropTypes.string.isRequired
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <ErrorDisplay message={error} />
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <div className="space-y-6">
          {error && <ErrorDisplay message={error} />}

          {/* Top Bar - Search and Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings, students, or payments..."
                  className="pl-10 w-full"
                />
              </div>
            </div>
          </div>

          {/* Quick Actions - Priority Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-full"
            >
              <Card className="h-full cursor-pointer border-none shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 transition-all duration-300"
                onClick={handleQuickBooking}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shadow-inner">
                      <Bookmark className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-blue-900">Quick Booking</h3>
                      <p className="text-sm text-blue-600">Book a seat instantly</p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-sm text-blue-600">Click to proceed</span>
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-full"
            >
              <Card className="h-full cursor-pointer border-none shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 hover:from-green-100 hover:to-green-200/50 transition-all duration-300"
                onClick={handleAddStudent}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center shadow-inner">
                      <UserPlus className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-green-900">Add Student</h3>
                      <p className="text-sm text-green-600">Register new student</p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-sm text-green-600">Click to proceed</span>
                    <Plus className="h-6 w-6 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="h-full"
            >
              <Card className="h-full cursor-pointer border-none shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 transition-all duration-300"
                onClick={handleProcessPayment}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center shadow-inner">
                      <CreditCard className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-purple-900">Quick Collection</h3>
                      <p className="text-sm text-purple-600">Collect payment & generate receipt</p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-sm text-purple-600">Click to proceed</span>
                    <Plus className="h-6 w-6 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Key Metrics - Priority Section */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            {cardData.map((card) => (
              <motion.div
                key={card.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="h-full"
              >
                <Card 
                  className={`h-full border-none shadow-lg bg-gradient-to-br ${card.color} text-white cursor-pointer hover:shadow-xl transition-all duration-300`}
                  onClick={() => handleCardClick(card.route)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-semibold">
                      {card.title}
                    </CardTitle>
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
                      <card.icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-2">{card.value}</div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/80">
                        Click to view details
                      </p>
                      <ChevronRight className="h-5 w-5 text-white/80" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Today's Overview Card */}
          <Card className="col-span-2 border-none shadow-lg">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    Today's Overview
                  </CardTitle>
                  <CardDescription className="mt-1">Comprehensive overview of today's activities</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Last updated:</span>
                  <span className="text-sm font-medium">{format(new Date(), 'hh:mm a')}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Occupancy Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Sofa className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-sm font-semibold">Occupancy</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600">Current Occupancy</span>
                        <span className="text-2xl font-bold text-blue-700">{dashboardData.dailySummary.occupancyRate}%</span>
                      </div>
                      <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${dashboardData.dailySummary.occupancyRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium">Peak Hours</span>
                        </div>
                        <span className="text-sm">{dashboardData.dailySummary.peakHour || 'N/A'}</span>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Bookmark className="h-4 w-4 text-purple-500" />
                          <span className="text-xs font-medium">Today's Bookings</span>
                        </div>
                        <span className="text-sm font-medium">{dashboardData.studentActivity.length}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span className="text-xs font-medium">Avg. Stay Time</span>
                      </div>
                      <span className="text-sm">{dashboardData.dailySummary.averageStay || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Student Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-sm font-semibold">Students</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-600">Active Students</span>
                        <span className="text-2xl font-bold text-green-700">{dashboardData.dailySummary.totalStudents}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-600">+{dashboardData.studentActivity.length} new today</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <UserPlus className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-medium">New Students</span>
                        </div>
                        <span className="text-sm font-medium">{dashboardData.studentActivity.length}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <IndianRupee className="h-4 w-4 text-yellow-500" />
                        <span className="text-xs font-medium">Refunds</span>
                      </div>
                      <span className="text-sm font-medium">{dashboardData.financial.length}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <IndianRupee className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-semibold">Financial</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-600">Today's Revenue</span>
                        <span className="text-2xl font-bold text-purple-700">₹{dashboardData.dailySummary.totalRevenue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-purple-600">
                          {dashboardData?.revenue?.daily?.length || 0} payments
                        </span>
                        {dashboardData?.dailySummary?.growthRate > 0 && (
                          <span className="text-xs text-green-500">
                            {dashboardData.dailySummary.growthRate}% growth
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="h-4 w-4 text-green-500" />
                          <span className="text-xs font-medium">Total Payments</span>
                        </div>
                        <span className="text-sm font-medium">{dashboardData?.revenue?.daily?.length  || 0}</span>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-orange-500" />
                          <span className="text-xs font-medium">Monthly Revenue</span>
                        </div>
                        <span className="text-sm">₹{dashboardData?.revenue?.monthly?.[0]?.amount || 0}</span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-medium">Revenue Growth</span>
                      </div>
                      <span className="text-sm text-green-500">{dashboardData?.dailySummary?.growthRate || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {/* <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl">
                  <h4 className="text-sm font-medium mb-3">Popular Seats Today</h4>
                  <div className="flex flex-wrap gap-2">
                    {dashboardData.studentActivity.map((seat, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        {seat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl">
                  <h4 className="text-sm font-medium mb-3">Peak Hours</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium">Busiest Hour</span>
                      </div>
                      <span className="text-sm font-medium">{dashboardData?.dailySummary?.peakHour || 'N/A'}</span>
                    </div>
                    <div className="p-3 bg-white/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-medium">Quietest Hour</span>
                      </div>
                      <span className="text-sm font-medium">{dashboardData?.dailySummary?.quietestHour || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div> */}
            </CardContent>
          </Card>

          {/* Quick Booking Dialog */}
          <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
            <DialogContent className="sm:max-w-[600px]">
              <QuickBookingForm onClose={handleBookingFormClose} />
            </DialogContent>
          </Dialog>

          {/* Payment Form Dialog */}
          <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
            <DialogContent className="max-w-2xl">
              <QuickCollection onClose={() => setShowPaymentForm(false)} />
            </DialogContent>
          </Dialog>

          {/* Details Dialog */}
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>
                  {cardData.find(card => card.id === selectedCard)?.details.title}
                </DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <div className="grid gap-4 py-4">
                      <div className="space-y-4">
                        {selectedCard && cardData.find(card => card.id === selectedCard)?.details.content.map((item, index) => (
                          <div key={index} className="grid grid-cols-4 items-center gap-4">
                            <div className="col-span-1 text-sm font-medium">{item.label}</div>
                            <div className="col-span-3 text-sm">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="analytics">
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Analytics data will be available soon.</p>
                  </div>
                </TabsContent>
                <TabsContent value="actions">
                  <div className="space-y-4">
                    <Button className="w-full" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                    <Button className="w-full" variant="outline">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Activity className="mr-2 h-4 w-4" />
                      Schedule Analysis
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                <Button onClick={() => selectedCard && navigate(cardData.find(card => card.id === selectedCard)?.route || '/')}>
                  View Full Page
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ErrorBoundary>
    </DashboardLayout>
  );
};

export default DashboardPage; 