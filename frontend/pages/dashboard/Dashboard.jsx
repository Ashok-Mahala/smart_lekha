import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Sofa, 
  IndianRupee, 
  TrendingUp, 
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  Plus,
  CreditCard,
  UserCheck,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Calendar,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import QuickBookingForm from '@/components/booking/QuickBookingForm';
import QuickCollection from '@/components/financial/payments/QuickCollection';

// Import API services
import { getStudentsByProperty } from '@/api/students';
import { getSeatsByProperty } from '@/api/seats';
import { getPayments, getDashboardStats, generatePaymentReport } from '@/api/payments';
import { getProperties } from '@/api/properties';

// Chart Components
const RevenueChart = ({ data, timeframe }) => {
  const maxValue = Math.max(...data.map(item => item.amount), 1);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Revenue Trend</h4>
        <Badge variant="outline" className="text-xs">
          {timeframe}
        </Badge>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground w-20 truncate">
              {item.label}
            </span>
            <div className="flex-1 max-w-32 mx-2">
              <Progress 
                value={(item.amount / maxValue) * 100} 
                className="h-2"
              />
            </div>
            <span className="text-xs font-medium w-16 text-right">
              ₹{item.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PaymentStatusChart = ({ data }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Payment Status</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-green-50 rounded-lg border">
          <div className="text-xl font-bold text-green-600">{data.completed}</div>
          <div className="text-xs text-green-600 mt-1">Completed</div>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-lg border">
          <div className="text-xl font-bold text-amber-600">{data.pending}</div>
          <div className="text-xs text-amber-600 mt-1">Pending</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg border">
          <div className="text-xl font-bold text-blue-600">{data.partial}</div>
          <div className="text-xs text-blue-600 mt-1">Partial</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg border">
          <div className="text-xl font-bold text-red-600">{data.overdue}</div>
          <div className="text-xs text-red-600 mt-1">Overdue</div>
        </div>
      </div>
    </div>
  );
};

const StudentDistributionChart = ({ data }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Student Distribution</h4>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <span className="text-sm">Active Students</span>
          <Badge variant="default">{data.active}</Badge>
        </div>
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-sm">New This Week</span>
          <Badge variant="outline">{data.newThisWeek}</Badge>
        </div>
        <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
          <span className="text-sm">Due Payments</span>
          <Badge variant="outline">{data.withDuePayments}</Badge>
        </div>
      </div>
    </div>
  );
};

const RecentPaymentsTable = ({ payments }) => {
  const getStatusVariant = (status) => {
    const variants = {
      completed: 'default',
      pending: 'outline',
      partial: 'secondary',
      overdue: 'destructive'
    };
    return variants[status] || 'outline';
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Recent Payments</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {payments.map((payment, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium truncate">{payment.studentName}</span>
                <Badge variant={getStatusVariant(payment.status)} className="text-xs">
                  {payment.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Seat: {payment.seatNo}</span>
                <span>{format(new Date(payment.date), 'MMM dd')}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-green-600">₹{payment.amount}</div>
              <div className="text-xs text-muted-foreground capitalize">{payment.method}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading Components
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

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-4 w-[150px]" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[200px] w-full" />
    </CardContent>
  </Card>
);

// Main Dashboard Component
const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [selectedProperty, setSelectedProperty] = useState('');
  const [properties, setProperties] = useState([]);
  const [timeframe, setTimeframe] = useState('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalStudents: 0,
      totalSeats: 0,
      occupancyRate: 0,
      totalRevenue: 0,
      activeBookings: 0
    },
    financial: {
      revenue: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        trend: 0
      },
      payments: {
        completed: 0,
        pending: 0,
        partial: 0,
        overdue: 0
      },
      revenueChart: []
    },
    students: {
      active: 0,
      newThisWeek: 0,
      withDuePayments: 0,
      distribution: []
    },
    recentPayments: []
  });

  // Fetch Properties
  const fetchProperties = async () => {
    try {
      const propertiesData = await getProperties();
      setProperties(propertiesData);
      if (propertiesData.length > 0 && !selectedProperty) {
        setSelectedProperty(propertiesData[0]._id);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    }
  };

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async () => {
    if (!selectedProperty) return;
    
    try {
      setIsRefreshing(true);
      setError(null);

      const [
        studentsResponse,
        seatsResponse,
        paymentsResponse,
        statsResponse
      ] = await Promise.all([
        getStudentsByProperty(selectedProperty),
        getSeatsByProperty(selectedProperty),
        getPayments({ propertyId: selectedProperty, timeframe }),
        getDashboardStats({ propertyId: selectedProperty })
      ]);

      // Handle API response structure
      const studentsData = studentsResponse?.data || studentsResponse || [];
      const seatsData = seatsResponse?.data || seatsResponse || [];
      const paymentsData = paymentsResponse?.data || paymentsResponse || [];
      const statsData = statsResponse?.data || statsResponse || {};

      // Transform data for dashboard
      const totalSeats = seatsData.length || 0;
      const occupiedSeats = Array.isArray(seatsData) ? 
        seatsData.filter(seat => seat.status === 'occupied').length : 0;
      
      const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

      // Calculate student statistics
      const activeStudents = Array.isArray(studentsData) ? 
        studentsData.filter(student => student.status === 'active').length : 0;
      
      const newThisWeek = Array.isArray(studentsData) ? 
        studentsData.filter(student => {
          const createdDate = new Date(student.createdAt || student.dateAdded || new Date());
          const weekAgo = subDays(new Date(), 7);
          return createdDate > weekAgo;
        }).length : 0;

      // Generate chart data
      const revenueChartData = generateRevenueChartData();
      const recentPayments = generateRecentPaymentsData(paymentsData);

      setDashboardData({
        overview: {
          totalStudents: Array.isArray(studentsData) ? studentsData.length : 0,
          totalSeats,
          occupancyRate,
          totalRevenue: statsData.totalRevenue || 0,
          activeBookings: occupiedSeats
        },
        financial: {
          revenue: {
            today: statsData.todayRevenue || 0,
            thisWeek: statsData.weekRevenue || 0,
            thisMonth: statsData.monthRevenue || 0,
            trend: 12.5 // Sample trend data
          },
          payments: {
            completed: statsData.completedPayments || 0,
            pending: statsData.pendingPayments || 0,
            partial: statsData.partialPayments || 0,
            overdue: statsData.overduePayments || 0
          },
          revenueChart: revenueChartData
        },
        students: {
          active: activeStudents,
          newThisWeek,
          withDuePayments: statsData.studentsWithDuePayments || 0,
          distribution: Array.isArray(studentsData) ? studentsData.slice(0, 5).map(student => ({
            name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
            status: student.status,
            seat: student.currentAssignments?.[0]?.seatNumber || 'N/A'
          })) : []
        },
        recentPayments
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedProperty, timeframe]);

  // Helper functions for sample data
  const generateRevenueChartData = () => {
    return Array.from({ length: 7 }, (_, i) => ({
      label: format(subDays(new Date(), 6 - i), 'EEE'),
      amount: Math.floor(Math.random() * 5000) + 1000
    }));
  };

  const generateRecentPaymentsData = (paymentsData) => {
    if (!Array.isArray(paymentsData)) {
      return Array.from({ length: 5 }, (_, i) => ({
        id: i,
        studentName: `Student ${i + 1}`,
        amount: Math.floor(Math.random() * 1000) + 500,
        status: ['completed', 'pending', 'partial'][i % 3],
        method: ['cash', 'upi', 'card'][i % 3],
        seatNo: `A-${i + 1}`,
        date: subDays(new Date(), i).toISOString()
      }));
    }

    return paymentsData.slice(0, 5).map(payment => ({
      id: payment._id || payment.id,
      studentName: payment.studentName || 'Unknown Student',
      amount: payment.amount || 0,
      status: payment.status || 'pending',
      method: payment.paymentMethod || 'cash',
      seatNo: payment.seatNo || 'N/A',
      date: payment.date || payment.createdAt || new Date().toISOString()
    }));
  };

  // Initial data load
  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchDashboardData();
    }
  }, [selectedProperty, timeframe, fetchDashboardData]);

  // Handlers
  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleQuickBooking = () => {
    setShowBookingForm(true);
  };

  const handleQuickPayment = () => {
    setShowPaymentForm(true);
  };

  const handleExportReport = async () => {
    try {
      await generatePaymentReport({
        propertyId: selectedProperty,
        timeframe,
        format: 'pdf'
      });
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  // Error Display
  if (error && !isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error}
              <Button onClick={fetchDashboardData} className="mt-2">
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Smart management insights for students and payments
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Select Property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property._id} value={property._id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card 
              className="cursor-pointer border-blue-200 hover:border-blue-400 transition-all duration-300"
              onClick={handleQuickBooking}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Quick Booking</h3>
                    <p className="text-sm text-muted-foreground">Book a seat instantly</p>
                  </div>
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Card 
              className="cursor-pointer border-green-200 hover:border-green-400 transition-all duration-300"
              onClick={handleQuickPayment}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">Quick Collection</h3>
                    <p className="text-sm text-muted-foreground">Collect payment & generate receipt</p>
                  </div>
                  <Plus className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Students */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.totalStudents}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <UserCheck className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-500">{dashboardData.students.active} active</span>
              </div>
            </CardContent>
          </Card>

          {/* Seat Occupancy */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Seat Occupancy</CardTitle>
              <Sofa className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.overview.occupancyRate}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Activity className="h-3 w-3 mr-1" />
                <span>{dashboardData.overview.activeBookings} active bookings</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{dashboardData.overview.totalRevenue.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {dashboardData.financial.revenue.trend > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    <span className="text-green-500">+{dashboardData.financial.revenue.trend}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    <span className="text-red-500">{dashboardData.financial.revenue.trend}%</span>
                  </>
                )}
                <span className="mx-1">•</span>
                <span>This month</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.financial.payments.completed}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="text-green-500">{dashboardData.financial.payments.completed} completed</span>
                <span className="mx-1">•</span>
                <span className="text-amber-500">{dashboardData.financial.payments.pending} pending</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial Analytics</TabsTrigger>
            <TabsTrigger value="students">Student Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Revenue Overview
                  </CardTitle>
                  <CardDescription>Revenue trends for the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <ChartSkeleton />
                  ) : (
                    <RevenueChart 
                      data={dashboardData.financial.revenueChart} 
                      timeframe={timeframe}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Payment Status Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Payment Status
                  </CardTitle>
                  <CardDescription>Current payment distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <ChartSkeleton />
                  ) : (
                    <PaymentStatusChart data={dashboardData.financial.payments} />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Payments
                </CardTitle>
                <CardDescription>Latest payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <RecentPaymentsTable payments={dashboardData.recentPayments} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    ₹{dashboardData.financial.revenue.today.toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />
                    Daily collection
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    ₹{dashboardData.financial.revenue.thisWeek.toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                    This week
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    ₹{dashboardData.financial.revenue.thisMonth.toLocaleString()}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <BarChart3 className="h-4 w-4 mr-1 text-purple-500" />
                    This month
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span>Completed Payments</span>
                      <Badge variant="default">{dashboardData.financial.payments.completed}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <span>Pending Payments</span>
                      <Badge variant="outline">{dashboardData.financial.payments.pending}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span>Overdue Payments</span>
                      <Badge variant="destructive">{dashboardData.financial.payments.overdue}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" onClick={handleQuickPayment}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Collect Payment
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleExportReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/payments')}>
                    <Activity className="h-4 w-4 mr-2" />
                    View All Payments
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Student Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <ChartSkeleton />
                  ) : (
                    <StudentDistributionChart data={dashboardData.students} />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Occupancy Rate</span>
                        <span className="text-2xl font-bold text-blue-600">{dashboardData.overview.occupancyRate}%</span>
                      </div>
                      <Progress value={dashboardData.overview.occupancyRate} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <div className="text-lg font-bold">{dashboardData.students.newThisWeek}</div>
                        <div className="text-xs text-muted-foreground">New This Week</div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg text-center">
                        <div className="text-lg font-bold">{dashboardData.students.withDuePayments}</div>
                        <div className="text-xs text-muted-foreground">Due Payments</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>Quick actions for student management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={() => navigate('/students/add')} className="h-auto py-4">
                    <Plus className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">Add Student</div>
                      <div className="text-xs opacity-75">Register new student</div>
                    </div>
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/students')} className="h-auto py-4">
                    <Users className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">View All Students</div>
                      <div className="text-xs opacity-75">Manage student records</div>
                    </div>
                  </Button>
                  <Button variant="outline" onClick={handleQuickBooking} className="h-auto py-4">
                    <BookOpen className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">Quick Booking</div>
                      <div className="text-xs opacity-75">Assign seat to student</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Booking Dialog */}
        <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
          <DialogContent className="sm:max-w-[600px]">
            <QuickBookingForm onClose={() => setShowBookingForm(false)} />
          </DialogContent>
        </Dialog>

        {/* Payment Form Dialog */}
        <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
          <DialogContent className="max-w-2xl">
            <QuickCollection onClose={() => setShowPaymentForm(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsDashboard;