import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Users,
  UserPlus,
  Calendar,
  GraduationCap,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { getDocumentUrl, getStudentsByProperty, getStudentStats } from "@/api/students";

const StudentsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const propertyId = localStorage.getItem("selected_property");
        if (!propertyId) throw new Error("No property selected");

        const [studentList, statInfo] = await Promise.all([
          getStudentsByProperty(propertyId),
          getStudentStats(propertyId)
        ]);

        setStudents(studentList || []);
        setStats(statInfo || {});
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to load student data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredStudents = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return students
    .map(s => ({ ...s, fullName: `${s.firstName || ''} ${s.lastName || ''}`.trim() }))
    .filter(student =>
      student.fullName.toLowerCase().includes(search) ||
      student._id?.toLowerCase().includes(search) ||
      student.email?.toLowerCase().includes(search) ||
      student.phone?.toLowerCase().includes(search)
    );  
  }, [students, searchTerm]);

  const handleStudentClick = (id) => navigate(`/students/profile/${id}`);

  const getProfilePhotoUrl = (documents) => {
    const doc = documents?.find(d => d.type === 'profile_photo');
    return getDocumentUrl(doc?.url);
  };
  

  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading student data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Student Management</h1>
            {/* <Button onClick={() => navigate('/students/add')}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Student
            </Button> */}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Students</CardTitle>
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                  <TableHead>Profile Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Seat</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Payment Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => {
                    const currentStudentEntry = student.currentSeat?.currentStudents?.find(cs => cs.student?._id === student._id);
                    const booking = currentStudentEntry?.booking;
                    const shift = currentStudentEntry?.shift;
                    const payment = student.payment;

                    return (
                      <TableRow
                        key={student._id}
                        onClick={() => handleStudentClick(student._id)}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell>
                          <img
                            src={getProfilePhotoUrl(student.booking?.documents)}
                            alt={student.fullName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        </TableCell>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {student.currentSeat?.seatNumber || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {student.shift
                            ? `${student.shift.name} (${student.shift.startTime} - ${student.shift.endTime})`
                            : '-'}
                        </TableCell>
                        <TableCell>{student.status}</TableCell>
                        <TableCell>
                          {student.payment
                            // ? `₹${student.payment.amount} (${student.payment.status})`
                            ? `₹${student.payment.amount}`
                            : '—'}
                        </TableCell>
                        <TableCell>{student.payment?.paymentMethod || '—'}</TableCell>
                        <TableCell>
                          {student.payment?.paymentDate
                            ? format(new Date(student.payment.paymentDate), 'dd MMM yyyy')
                            : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StudentsPage;
