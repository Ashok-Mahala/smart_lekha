import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import StudentTable from "@/components/dashboard/StudentTable";
import InteractiveSeatMap from "@/components/seats/InteractiveSeatMap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import {
  UserCheck,
  FileText,
  Mail,
  Calendar,
  Users,
  AlertTriangle,
  Loader2,
  Plus,
  User,
  UserCog,
  IdCard,
  Phone,
  Image,
  File,
  CheckCircle,
  XCircle,
  Clock,
  Sofa,
  UserPlus,
  GraduationCap,
  Activity,
  ChevronRight,
  Search,
  Filter,
  Upload,
  X,
  CreditCard,
  Receipt,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  Eye,
  MessageSquare,
  AlertCircle,
  Download,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import PropTypes from 'prop-types';

// Define PropTypes for Student
export const studentPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  registeredOn: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['active', 'pending', 'suspended', 'inactive', 'graduated', 'on_leave']).isRequired,
  lastActive: PropTypes.string,
  photo: PropTypes.string,
  idProof: PropTypes.string,
  bookings: PropTypes.number,
  violations: PropTypes.number,
  phone: PropTypes.string,
  address: PropTypes.string,
  priority: PropTypes.oneOf(['high', 'medium', 'low']),
  notes: PropTypes.string,
  seatNo: PropTypes.string,
  dueDate: PropTypes.string,
  fatherName: PropTypes.string,
  studentId: PropTypes.string,
  shift: PropTypes.string,
  admissionDate: PropTypes.instanceOf(Date),
  idProofFile: PropTypes.instanceOf(File),
  profilePhotoFile: PropTypes.instanceOf(File),
  dob: PropTypes.string,
  gender: PropTypes.oneOf(['male', 'female', 'other']),
  city: PropTypes.string,
  state: PropTypes.string,
  pincode: PropTypes.string,
  whatsapp: PropTypes.string,
  course: PropTypes.string,
  idProofType: PropTypes.string,
  idProofNumber: PropTypes.string,
  idProofFront: PropTypes.string,
  idProofBack: PropTypes.string
});

// Define PropTypes for StudentStats
export const studentStatsPropTypes = PropTypes.shape({
  totalStudents: PropTypes.number.isRequired,
  activeStudents: PropTypes.number.isRequired,
  inactiveStudents: PropTypes.number.isRequired,
  totalBookings: PropTypes.number.isRequired,
  totalViolations: PropTypes.number.isRequired,
  totalDues: PropTypes.number.isRequired
});

// Define PropTypes for NewStudent
export const newStudentPropTypes = PropTypes.shape({
  name: PropTypes.string.isRequired,
  fatherName: PropTypes.string.isRequired,
  studentId: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  phone: PropTypes.string.isRequired,
  shift: PropTypes.string.isRequired,
  admissionDate: PropTypes.instanceOf(Date).isRequired,
  address: PropTypes.string.isRequired,
  idProof: PropTypes.instanceOf(File),
  profilePhoto: PropTypes.instanceOf(File)
});

function StudentProfileDialog({ student, open, onOpenChange }) {
  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Student Profile</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-100px)]">
          <div className="space-y-6 p-4">
            {/* Basic Information */}
            <div className="bg-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="font-medium">{student.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{student.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{student.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{student.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">{student.whatsapp || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seat Number</p>
                  <p className="font-medium">{student.seatNo || '-'}</p>
                </div>
              </div>
            </div>

            {/* Due Information */}
            <div className="bg-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Due Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Due Amount</p>
                  <p className="font-medium text-red-500">₹{student.dueAmount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {student.dueDate ? format(new Date(student.dueDate), "MMM dd, yyyy") : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Late Days</p>
                  <p className="font-medium text-red-500">{student.lateDays} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Active</p>
                  <p className="font-medium">{student.lastActive}</p>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="bg-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Terms and Conditions</h3>
              <div className="space-y-4">
                <p className="text-sm">
                  1. The student agrees to pay the due amount within the specified due date.
                </p>
                <p className="text-sm">
                  2. Late payments will incur additional charges as per the institution's policy.
                </p>
                <p className="text-sm">
                  3. The student is responsible for maintaining their contact information up to date.
                </p>
                <p className="text-sm">
                  4. The institution reserves the right to take appropriate action for non-payment.
                </p>
              </div>
            </div>

            {/* Signature Section */}
            <div className="bg-white/10 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Signature</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Student Signature</p>
                  <div className="h-20 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Student Signature</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Parent/Guardian Signature</p>
                  <div className="h-20 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">Parent/Guardian Signature</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

StudentProfileDialog.propTypes = {
  student: studentPropTypes,
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired
};

const StudentsPage = () => {
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showLargePhoto, setShowLargePhoto] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    fatherName: '',
    studentId: '',
    email: '',
    phone: '',
    shift: '',
    admissionDate: new Date(),
    address: '',
    idProof: null,
    profilePhoto: null
  });
  const [isSeatSelectionOpen, setIsSeatSelectionOpen] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    totalBookings: 0,
    totalViolations: 0,
    totalDues: 0
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showFullTable, setShowFullTable] = useState(false);
  const fileInputRef = useRef(null);
  const idProofInputRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState(null);
  const [showStudentTable, setShowStudentTable] = useState(true);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [selectedDue, setSelectedDue] = useState(null);
  const [collectionForm, setCollectionForm] = useState({
    amount: '',
    paymentMode: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [dues, setDues] = useState([]);
  const [collections, setCollections] = useState([]);
  const [shifts, setShifts] = useState([]);

  // Add the missing fetchShifts function
  const fetchShifts = async () => {
    try {
      const response = await fetch('/api/shifts');
      
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('API endpoint not available');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching shifts:', error);
      // Return default shifts
      return [
        { id: 'morning', name: 'Morning', time: '9:00 AM - 12:00 PM' },
        { id: 'afternoon', name: 'Afternoon', time: '12:00 PM - 5:00 PM' },
        { id: 'evening', name: 'Evening', time: '5:00 PM - 9:00 PM' }
      ];
    }
  };

  const fetchStudentStats = async () => {
    try {
      const response = await fetch('/api/students/stats');
      
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('API endpoint not available');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching student stats:', error);
      return {
        activeStudents: 0,
        inactiveStudents: 0,
        totalSeats: 0,
        occupiedSeats: 0
      };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [shiftsData, statsData] = await Promise.all([
          fetchShifts(),
          fetchStudentStats()
        ]);
        
        setShifts(shiftsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Student overview statistics
  const studentStats = {
    total: 0,
    active: 0,
    pending: 0,
    banned: 0,
    newThisMonth: 0,
    violations: 0
  };

  // Make sure percentages are calculated safely
  const activePercentage = "0.0";

  // Update the filteredAndSortedStudents function to only show active students
  const filteredAndSortedStudents = React.useMemo(() => {
    let filtered = [...students].filter(student => student.status === 'active');
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(search) || 
        student.id.toLowerCase().includes(search) || 
        student.email.toLowerCase().includes(search) ||
        (student.phone && student.phone.toLowerCase().includes(search))
      );
    }
    
    return filtered;
  }, [students, searchTerm]);

  // Update the shift column display
  const renderShiftCell = (student) => {
    const currentShift = student.shift ? shifts.find(s => s.id === student.shift) : shifts[0];
    return (
      <TableCell className="py-3 border-r border-dashed" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {isEditing && editedStudent?.id === student.id ? (
            <div className="flex items-center gap-2">
              <Select
                value={editedStudent.shift || currentShift.id}
                onValueChange={(value) => setEditedStudent(prev => prev ? { ...prev, shift: value } : null)}
              >
                <SelectTrigger className="h-7 w-[140px]">
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map(shift => (
                    <SelectItem key={shift.id} value={shift.id}>
                      <div className="flex flex-col">
                        <span>{shift.name}</span>
                        <span className="text-xs text-muted-foreground">{shift.time}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-7 px-2 text-xs font-medium bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
              >
                Save
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {currentShift?.name || shifts[0].name}
              </span>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 shadow-sm hover:shadow-md transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditStudent(student);
                  }}
                >
                  Change
                </Button>
              )}
            </div>
          )}
        </div>
      </TableCell>
    );
  };

  // Function to handle student editing
  const handleEditStudent = (student) => {
    setEditedStudent({ ...student });
    setIsEditing(true);
  };

  const handleAddStudent = () => {
    navigate('/students/add');
  };

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/students');
      
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('API endpoint not available');
      }
      
      const students = await response.json();
      setStudents(students);
      
      // Fetch stats separately
      const statsResponse = await fetch('/api/students/stats');
      if (statsResponse.ok && statsResponse.headers.get('content-type')?.includes('application/json')) {
        const stats = await statsResponse.json();
        setStats(stats);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const cardData = [
    {
      id: 'active-students',
      title: 'Active Students',
      value: stats.activeStudents,
      icon: UserCheck,
      color: 'from-blue-500 to-blue-600',
      route: '/students',
      description: 'View all active students'
    },
    {
      id: 'add-student',
      title: 'Add Student',
      value: stats.inactiveStudents,
      icon: UserPlus,
      color: 'from-green-500 to-green-600',
      route: '/students/add',
      description: 'Register a new student'
    },
    {
      id: 'booking',
      title: 'Booking',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
      route: '/students/booking',
      description: 'Manage student bookings'
    },
    {
      id: 'old-students',
      title: 'Old Students',
      value: `${stats.totalStudents - stats.activeStudents - stats.inactiveStudents}`,
      icon: GraduationCap,
      color: 'from-amber-500 to-amber-600',
      route: '/students/old',
      description: 'View old student records'
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      // Here you would implement your actual import logic
      // For example, reading the file and processing the data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Import Successful",
        description: "Students have been imported successfully",
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "There was an error importing the students",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Update the card click handler
  const handleCardClick = (route) => {
    if (route === 'add') {
      navigate('/students/add');
    } else {
      navigate(route);
    }
  };

  const handleDeleteStudent = (student) => {
    setStudents(students.filter(s => s.id !== student.id));
    toast({
      title: "Student deleted",
      description: "Student has been deleted successfully.",
    });
  };

  // Update the handleCollectionSubmit function
  const handleCollectionSubmit = async () => {
    try {
      // Here you would implement your actual API call to record the collection
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Create new collection record
      const newCollection = {
        date: collectionForm.date,
        category: selectedDue.category,
        amount: Number(collectionForm.amount),
        paymentMode: collectionForm.paymentMode,
        seatNo: student?.seatNo || "A101",
        description: collectionForm.description,
        receivedBy: "Current Admin", // This should come from your auth system
      };

      // Update collections state
      setCollections(prev => [newCollection, ...prev]);

      // Update dues state - mark the paid due as completed
      setDues(prev => prev.map(due => 
        due.dueDate === selectedDue.dueDate 
          ? { ...due, status: "completed" }
          : due
      ));
      
      toast({
        title: "Collection Recorded",
        description: "Payment has been recorded successfully",
      });
      
      setShowCollectionForm(false);
      setSelectedDue(null);
      setCollectionForm({
        amount: '',
        paymentMode: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
    }
  };

  // Update the dues table to show status
  const renderDueStatus = (due) => {
    if (due.status === "completed") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Paid
        </Badge>
      );
    }
    if (due.lateDays > 0) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Overdue
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Pending
      </Badge>
    );
  };

  // Update the dues table action button click handler
  const handleCollectionClick = (due) => {
    setSelectedDue(due);
    setCollectionForm({
      amount: due.amount.toString(),
      paymentMode: '',
      description: `${due.category} Payment`,
      date: new Date().toISOString().split('T')[0]
    });
    setShowCollectionForm(true);
  };

  // Update the table row click handler
  const handleRowClick = (student) => {
    navigate(`/students/${student.id}`);
  };

  // Add PhotoModal component
  const PhotoModal = () => {
    if (!selectedStudent || !showLargePhoto) return null;

    return (
      <Dialog open={showLargePhoto} onOpenChange={setShowLargePhoto}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <div className="relative">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Profile Photo</DialogTitle>
                <DialogDescription className="text-blue-100 text-sm">
                  {selectedStudent.name}
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-4">
              <div className="relative aspect-square w-full max-h-[400px] rounded-lg overflow-hidden">
                <img
                  src={selectedStudent.photo || "/placeholder.svg"}
                  alt={selectedStudent.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="bg-gray-50 px-3 py-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowLargePhoto(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Add StudentDetailsModal component
  const StudentDetailsModal = () => {
    if (!selectedStudent) return null;
    const student = isEditing ? editedStudent : selectedStudent;

    if (!student) return null;

    return (
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-7xl w-[95vw] p-0 overflow-hidden">
          <div className="flex flex-col lg:flex-row h-[90vh]">
            {/* Left Sidebar - Student Info */}
            <div className="w-full lg:w-80 bg-gradient-to-b from-blue-600 to-indigo-700 p-6 text-white flex flex-col">
              <div className="flex-1">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="relative group">
                    <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
                                <img
                                  src={student.photo || "/placeholder.svg"}
                                  alt={student.name}
                        className="h-full w-full object-cover"
                                />
                              </div>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Edit className="h-5 w-5" />
                      </Button>
                            </div>
                            </div>
                  <h3 className="text-xl font-bold mt-4">{student.name}</h3>
                  <p className="text-blue-100">ID: {student.id}</p>
                          </div>

                          <div className="space-y-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-100 mb-2">Contact Information</h4>
                              <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-white hover:bg-white/20"
                        onClick={() => window.location.href = `tel:${student.phone}`}
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        <span className="text-sm">{student.phone}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-white hover:bg-white/20"
                        onClick={() => window.open(`https://wa.me/${student.whatsapp || student.phone}`, '_blank')}
                      >
                        <svg 
                          viewBox="0 0 24 24" 
                          width="16" 
                          height="16" 
                          fill="currentColor"
                          className="h-4 w-4 mr-2"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="text-sm">{student.whatsapp || student.phone}</span>
                      </Button>
                            </div>
                          </div>

                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-100 mb-2">Seat Information</h4>
                              <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Sofa className="h-4 w-4" />
                        <span>Seat No: {student.seatNo}</span>
                              </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>Due Date: {format(new Date(student.dueDate), "dd MMM yyyy")}</span>
                              </div>
                              </div>
                              </div>
                            </div>
                          </div>

              <div className="pt-4 border-t border-white/10">
                <Button 
                  variant="outline" 
                  className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20"
                  onClick={() => window.open(`https://wa.me/${student.whatsapp || student.phone}`, '_blank')}
                >
                  Send Reminder
                </Button>
                              </div>
                              </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold">Student Passbook</h2>
                <p className="text-muted-foreground">Financial details and payment history</p>
              </div>

              {/* Basic Information */}
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium">{student.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{student.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{student.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{student.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Seat Number</p>
                    <p className="font-medium">{student.seatNo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Shift</p>
                    <p className="font-medium">{student.shift || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Total Due</p>
                      <p className="text-2xl font-bold text-red-700">
                        ₹{dues
                          .filter(due => due.status === "pending")
                          .reduce((sum, due) => sum + due.amount, 0)
                          .toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Total Paid</p>
                      <p className="text-2xl font-bold text-green-700">
                        ₹{dues
                          .filter(due => due.status === "paid")
                          .reduce((sum, due) => sum + due.amount, 0)
                          .toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {dues.length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              <Tabs defaultValue="due" className="flex-1">
                <TabsList className="w-full justify-start border-b rounded-none h-12 px-6">
                  <TabsTrigger value="due" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
                    Due
                  </TabsTrigger>
                  <TabsTrigger value="collection" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
                    Collection
                  </TabsTrigger>
                  <TabsTrigger value="add-due" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
                    Add Due
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="due" className="flex-1">
                  {/* Due Tab Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Due Payments</h3>
                      <Button variant="outline" size="sm" onClick={() => setShowCollectionForm(true)}>
                        Record Payment
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {dues.map((due, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              due.status === 'paid' ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {due.status === 'paid' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <AlertCircle className="h-5 w-5 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{due.category}</p>
                              <p className="text-sm text-muted-foreground">
                                Due: {format(new Date(due.dueDate), "dd MMM yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{due.amount.toLocaleString('en-IN')}</p>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm ${
                                due.status === 'paid' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {due.status === 'paid' ? 'Paid' : 'Pending'}
                              </p>
                              {due.status !== 'paid' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleCollectionClick(due)}
                                  className="h-6 px-2 text-xs"
                                >
                                  Pay Now
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="collection" className="flex-1">
                  {/* Collection Tab Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Payment History</h3>
                      <Button variant="outline" size="sm" onClick={() => setShowCollectionForm(true)}>
                        Record Payment
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {collections.map((collection, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{collection.category}</p>
                              <p className="text-sm text-muted-foreground">
                                Paid on: {format(new Date(collection.date), "dd MMM yyyy")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">₹{collection.amount.toLocaleString('en-IN')}</p>
                            <p className="text-sm text-green-600">{collection.paymentMode}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="add-due" className="flex-1">
                  {/* Add Due Tab Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Add New Due</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly Fee</SelectItem>
                              <SelectItem value="registration">Registration Fee</SelectItem>
                              <SelectItem value="late">Late Fee</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Amount</Label>
                          <Input type="number" placeholder="Enter amount" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input placeholder="Enter description" />
                      </div>
                      <Button className="w-full">Add Due</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Add CollectionFormDialog component
  const CollectionFormDialog = () => {
    if (!selectedDue) return null;

    return (
      <Dialog open={showCollectionForm} onOpenChange={setShowCollectionForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Collection</DialogTitle>
            <DialogDescription>
              Record payment for {selectedDue.category} due on {format(new Date(selectedDue.dueDate), "dd MMM yyyy")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Amount</Label>
                <div className="p-2 bg-muted rounded-md">
                  <span className="text-lg font-semibold text-red-600">₹{selectedDue.amount.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
              <div className="space-y-2">
                <Label>Late Days</Label>
                <div className="p-2 bg-muted rounded-md">
                  <span className="text-lg font-semibold text-red-600">{selectedDue.lateDays} days</span>
                                    </div>
                                      </div>
                                    </div>

                          <div className="space-y-2">
              <Label>Collection Amount</Label>
              <Input
                type="number" 
                placeholder="Enter amount"
                value={collectionForm.amount}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, amount: e.target.value }))}
              />
                </div>

                          <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select
                value={collectionForm.paymentMode}
                onValueChange={(value) => setCollectionForm(prev => ({ ...prev, paymentMode: value }))}
              >
                              <SelectTrigger>
                  <SelectValue placeholder="Select payment mode" />
                              </SelectTrigger>
                              <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

            <div className="space-y-2">
              <Label>Collection Date</Label>
              <Input
                type="date"
                value={collectionForm.date}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, date: e.target.value }))}
              />
                        </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                placeholder="Enter description"
                value={collectionForm.description}
                onChange={(e) => setCollectionForm(prev => ({ ...prev, description: e.target.value }))}
              />
                        </div>
                      </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollectionForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCollectionSubmit}>
              Record Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const handleStudentClick = (studentId) => {
    navigate(`/students/profile/${studentId}`);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading student data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Student Management</h1>
              <p className="text-muted-foreground">
                Manage and track all student records and activities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />
            <Button 
              variant="outline" 
              size="default"
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Students
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardData.map((card) => (
            <motion.div
              key={card.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleCardClick(card.route)}
            >
              <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                      <card.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{card.value}</div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{card.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Student Table */}
        <Card className="border-none shadow-lg">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Active Students
                </CardTitle>
                <CardDescription className="mt-1">
                  View all active student records
            </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search active students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                />
              </div>
                        </div>
              </div>
            <div className="rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100">
                    <TableHead className="w-[80px] border-r border-dashed">Photo</TableHead>
                    <TableHead className="w-[120px] border-r border-dashed">Student ID</TableHead>
                    <TableHead className="w-[200px] border-r border-dashed">Name</TableHead>
                    <TableHead className="w-[100px] border-r border-dashed">Seat No</TableHead>
                    <TableHead className="w-[150px] border-r border-dashed">Last Active</TableHead>
                    <TableHead className="w-[150px] border-r border-dashed">Due Date</TableHead>
                    <TableHead className="w-[150px] border-r border-dashed">Shift</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedStudents.map((student) => (
                    <TableRow 
                      key={student.id}
                      className="cursor-pointer hover:bg-blue-50/50 transition-colors group"
                      onClick={() => handleStudentClick(student.id)}
                    >
                      <TableCell className="py-3 border-r border-dashed">
                        <div className="flex items-center justify-center">
                          <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-primary/50 transition-colors">
                            <img
                              src={student.photo || "/placeholder.svg"}
                              alt={student.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 border-r border-dashed">
                        <span className="font-medium text-primary">{student.id}</span>
                      </TableCell>
                      <TableCell className="py-3 border-r border-dashed">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 border-r border-dashed">
                        <Badge variant="outline" className="font-medium">
                          {student.seatNo || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 border-r border-dashed">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{student.lastActive}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 border-r border-dashed">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                        {student.dueDate ? format(new Date(student.dueDate), "MMM dd, yyyy") : '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 border-r border-dashed" onClick={(e) => e.stopPropagation()}>
                        {renderShiftCell(student)}
                      </TableCell>
                      <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedStudent(student)}
                            className="hover:bg-primary/10"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => window.location.href = `tel:${student.phone}`}
                            className="hover:bg-green-100 text-green-600"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => window.open(`https://wa.me/${student.whatsapp || student.phone}`, '_blank')}
                            className="hover:bg-green-100 text-green-600"
                          >
                            <svg 
                              viewBox="0 0 24 24" 
                              width="16" 
                              height="16" 
                              fill="currentColor"
                              className="h-4 w-4"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <StudentDetailsModal />
        <PhotoModal />
        <CollectionFormDialog />
        <StudentProfileDialog 
          student={selectedStudent}
          open={showProfile}
          onOpenChange={setShowProfile}
        />
      </div>
    </DashboardLayout>
  );
};

StudentsPage.propTypes = {
  isLoading: PropTypes.bool,
  students: PropTypes.arrayOf(studentPropTypes),
  stats: studentStatsPropTypes,
  searchTerm: PropTypes.string,
  statusFilter: PropTypes.string,
  sortField: PropTypes.string,
  sortDirection: PropTypes.string,
  showFullTable: PropTypes.bool,
  isEditing: PropTypes.bool,
  editedStudent: studentPropTypes,
  showStudentTable: PropTypes.bool,
  showCollectionForm: PropTypes.bool,
  selectedDue: PropTypes.shape({
    amount: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    dueDate: PropTypes.string.isRequired,
    addedBy: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    lateDays: PropTypes.number.isRequired
  }),
  collectionForm: PropTypes.shape({
    amount: PropTypes.string.isRequired,
    paymentMode: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired
  }),
  dues: PropTypes.arrayOf(PropTypes.shape({
    amount: PropTypes.number.isRequired,
    category: PropTypes.string.isRequired,
    dueDate: PropTypes.string.isRequired,
    addedBy: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    lateDays: PropTypes.number.isRequired
  })),
  collections: PropTypes.arrayOf(PropTypes.shape({
    date: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    paymentMode: PropTypes.string.isRequired,
    seatNo: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    receivedBy: PropTypes.string.isRequired
  })),
  shifts: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired
  }))
};

export default StudentsPage;
