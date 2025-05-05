import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  ChevronUp,
  ChevronDown,
  Edit,
  UserCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  Star,
  BookOpen,
  AlertTriangle,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ChevronRight,
  MoreVertical,
  Eye,
  History,
  Trash2,
  LayoutGrid,
  List,
  Table,
  Check,
  Info,
  Grid,
  ChevronLeft,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PropTypes from 'prop-types';

const StudentTable = ({ students, filteredAndSortedStudents, editStudent, deleteStudent }) => {
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [activeTabs, setActiveTabs] = useState({});
  const [imageError, setImageError] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Filter students based on search query
  const filteredStudents = searchQuery.trim() === "" 
    ? filteredAndSortedStudents 
    : filteredAndSortedStudents.filter((student) => {
        const query = searchQuery.toLowerCase();
        return (
          student.name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          student.id.toLowerCase().includes(query) ||
          student.department.toLowerCase().includes(query) ||
          student.year.toLowerCase().includes(query)
        );
      });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleExpand = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
    if (!activeTabs[studentId]) {
      setActiveTabs(prev => ({...prev, [studentId]: "information"}));
    }
  };

  const handleTabChange = (studentId, value) => {
    setActiveTabs(prev => ({...prev, [studentId]: value}));
  };

  const handleImageError = (studentId) => {
    setImageError(prev => ({ ...prev, [studentId]: true }));
  };

  const shouldShowPlaceholder = (student) => {
    return imageError[student.id] || !student.photo;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderPriorityBadge = (priority) => {
    const variants = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return (
      <Badge className={`${variants[priority] || 'bg-gray-100'} rounded-md px-2 py-1 text-xs flex items-center gap-1`}>
        <Star className="h-3 w-3" />
        <span className="capitalize">{priority}</span>
      </Badge>
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedStudents.map((student) => (
          <Card key={student.id} className={`overflow-hidden ${expandedStudent === student.id ? "ring-2 ring-primary" : ""}`}>
            <CardHeader className="p-4 pb-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-muted border-2 border-primary/20 flex-shrink-0">
                    {shouldShowPlaceholder(student) ? (
                      <UserCircle className="h-full w-full text-muted-foreground p-1" />
                    ) : (
                      <img 
                        src={student.photo} 
                        alt={student.name}
                        className="h-full w-full object-cover"
                        onError={() => handleImageError(student.id)}
                      />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base line-clamp-1">{student.name}</CardTitle>
                    <CardDescription className="line-clamp-1">{student.email}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge 
                    className={`${getStatusColor(student.status)} px-2 py-1 text-xs capitalize`}
                  >
                    {student.status}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => editStudent(student)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">ID:</span> {student.id}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{student.lastActive}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{student.bookings || 0} bookings</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className={`h-4 w-4 ${Number(student.violations) > 0 ? "text-red-500" : "text-muted-foreground"}`} />
                    <span>{student.violations || 0} violations</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-0 border-t">
              <Collapsible open={expandedStudent === student.id}>
                <CollapsibleTrigger asChild className="w-full">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-none h-10 w-full flex items-center justify-center gap-1"
                    onClick={() => toggleExpand(student.id)}
                  >
                    {expandedStudent === student.id ? "Less details" : "More details"}
                    {expandedStudent === student.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-4 pt-0 bg-muted/20">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Editable Information</h4>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm font-medium">{student.email || "N/A"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Phone</p>
                              <p className="text-sm font-medium">{student.phone || "N/A"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Address</p>
                              <p className="text-sm font-medium">{student.address || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 justify-end">
                        <Button 
                          onClick={() => editStudent(student)}
                          size="sm" 
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" /> Edit Student
                        </Button>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="border-b">
            <div className="grid grid-cols-12 py-3 px-4 bg-muted/30 text-sm font-medium">
              <div className="col-span-1 text-center">Photo</div>
              <div className="col-span-3 md:col-span-2 border-l pl-3">Student</div>
              <div className="col-span-2 border-l pl-3">Seat No</div>
              <div className="col-span-2 border-l pl-3">Status</div>
              <div className="col-span-2 hidden md:block border-l pl-3">Last Active</div>
              <div className="col-span-1 text-center border-l pl-3">Actions</div>
              <div className="col-span-1 text-center border-l pl-3">More</div>
            </div>
          </div>
          <ScrollArea className="max-h-[550px]">
            <div>
              {paginatedStudents.map((student) => (
                <Collapsible key={student.id} open={expandedStudent === student.id}>
                  <div className={`border-b transition-colors hover:bg-muted/40 ${expandedStudent === student.id ? "bg-muted/40" : ""}`}>
                    <div className="grid grid-cols-12 py-3 px-4 items-center">
                      <div className="col-span-1 flex justify-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0 border-2 border-primary/20">
                          {shouldShowPlaceholder(student) ? (
                            <UserCircle className="h-full w-full text-muted-foreground p-1" />
                          ) : (
                            <img 
                              src={student.photo} 
                              alt={student.name}
                              className="h-full w-full object-cover"
                              onError={() => handleImageError(student.id)}
                            />
                          )}
                        </div>
                      </div>
                      <div className="col-span-3 md:col-span-2 border-l pl-3">
                        <div>
                          <p className="line-clamp-1 font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{student.id}</p>
                        </div>
                      </div>
                      <div className="col-span-2 border-l pl-3">
                        <p className="text-sm font-medium">{student.seatNo || "N/A"}</p>
                      </div>
                      <div className="col-span-2 border-l pl-3">
                        <Badge 
                          className={`${getStatusColor(student.status)} px-2 py-1 text-xs capitalize`}
                        >
                          {student.status}
                        </Badge>
                      </div>
                      <div className="col-span-2 hidden md:block border-l pl-3">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{student.lastActive}</span>
                        </div>
                      </div>
                      <div className="col-span-1 flex items-center justify-center gap-1 border-l pl-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1"
                          onClick={() => editStudent(student)}
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </Button>
                      </div>
                      <div className="col-span-1 flex items-center justify-center gap-1 border-l pl-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <History className="mr-2 h-4 w-4" />
                              View History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <div className="px-4 py-3 bg-muted/20 border-b">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-16 w-16 rounded-full overflow-hidden bg-muted border-2 border-primary/20">
                            {shouldShowPlaceholder(student) ? (
                              <UserCircle className="h-full w-full text-muted-foreground p-2" />
                            ) : (
                              <img 
                                src={student.photo} 
                                alt={student.name}
                                className="h-full w-full object-cover"
                                onError={() => handleImageError(student.id)}
                              />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{student.name}</h3>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                        <h4 className="text-sm font-medium border-b pb-2">Editable Student Information</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2 p-2 bg-background/50 rounded-md border">
                            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="text-sm font-medium">{student.email || "N/A"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2 p-2 bg-background/50 rounded-md border">
                            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Phone</p>
                              <p className="text-sm font-medium">{student.phone || "N/A"}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2 p-2 bg-background/50 rounded-md border">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Address</p>
                              <p className="text-sm font-medium">{student.address || "N/A"}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 p-2 bg-background/50 rounded-md border">
                            <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">ID Proof</p>
                              <p className="text-sm font-medium">{student.idProof || "Not submitted"}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 justify-end mt-2 pt-2 border-t">
                          <Button 
                            onClick={() => editStudent(student)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" /> Edit Student
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t py-3">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
            {filteredStudents.length < filteredAndSortedStudents.length && ` (filtered from ${filteredAndSortedStudents.length})`}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };

  const renderTableView = () => {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="border-b">
            <div className="grid grid-cols-12 py-3 px-4 bg-muted/30 text-sm font-medium">
              <div className="col-span-1 text-center">Photo</div>
              <div className="col-span-2 border-l pl-3">Student</div>
              <div className="col-span-1 border-l pl-3">Seat No</div>
              <div className="col-span-1 border-l pl-3">Status</div>
              <div className="col-span-2 border-l pl-3">Email</div>
              <div className="col-span-2 border-l pl-3">Phone</div>
              <div className="col-span-2 border-l pl-3">Last Active</div>
              <div className="col-span-1 text-center border-l pl-3">Actions</div>
            </div>
          </div>
          <ScrollArea className="max-h-[550px]">
            <div>
              {paginatedStudents.map((student) => (
                <div key={student.id} className="grid grid-cols-12 py-3 px-4 items-center border-b hover:bg-muted/40">
                  <div className="col-span-1 flex justify-center">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0 border-2 border-primary/20">
                      {shouldShowPlaceholder(student) ? (
                        <UserCircle className="h-full w-full text-muted-foreground p-1" />
                      ) : (
                        <img 
                          src={student.photo} 
                          alt={student.name}
                          className="h-full w-full object-cover"
                          onError={() => handleImageError(student.id)}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 border-l pl-3">
                    <div>
                      <p className="line-clamp-1 font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{student.id}</p>
                    </div>
                  </div>
                  <div className="col-span-1 border-l pl-3">
                    <p className="text-sm">{student.seatNo || "N/A"}</p>
                  </div>
                  <div className="col-span-1 border-l pl-3">
                    <Badge className={`${getStatusColor(student.status)} px-2 py-1 text-xs capitalize`}>
                      {student.status}
                    </Badge>
                  </div>
                  <div className="col-span-2 border-l pl-3">
                    <p className="text-sm line-clamp-1">{student.email}</p>
                  </div>
                  <div className="col-span-2 border-l pl-3">
                    <p className="text-sm">{student.phone || "N/A"}</p>
                  </div>
                  <div className="col-span-2 border-l pl-3">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{student.lastActive}</span>
                    </div>
                  </div>
                  <div className="col-span-1 flex items-center justify-center gap-1 border-l pl-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => editStudent(student)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search students..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start sm:ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <SortAsc className="h-4 w-4 mr-2" />
                <span className="hidden xs:inline">Sort by:</span> {sortField.charAt(0).toUpperCase() + sortField.slice(1)}
                {sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSort("name")}>
                Name {sortField === "name" && (sortDirection === "asc" ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("id")}>
                ID {sortField === "id" && (sortDirection === "asc" ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("status")}>
                Status {sortField === "status" && (sortDirection === "asc" ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort("lastActive")}>
                Last Active {sortField === "lastActive" && (sortDirection === "asc" ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />)}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-accent/50">
                {viewMode === "grid" && <LayoutGrid className="h-4 w-4" />}
                {viewMode === "list" && <List className="h-4 w-4" />}
                {viewMode === "table" && <Table className="h-4 w-4" />}
                <span className="hidden xs:inline">View:</span> {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>View Options</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Choose how you want to view the student data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <TooltipProvider>
                <DropdownMenuItem 
                  onClick={() => setViewMode("grid")}
                  className="flex items-center justify-between cursor-pointer hover:bg-accent/50"
                >
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Grid View</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewMode === "grid" && <Check className="h-4 w-4" />}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Card-based layout with visual student information</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setViewMode("list")}
                  className="flex items-center justify-between cursor-pointer hover:bg-accent/50"
                >
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    <span>List View</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewMode === "list" && <Check className="h-4 w-4" />}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Detailed list with expandable student information</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setViewMode("table")}
                  className="flex items-center justify-between cursor-pointer hover:bg-accent/50"
                >
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    <span>Table View</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewMode === "table" && <Check className="h-4 w-4" />}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Traditional spreadsheet-style view with sortable columns</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </DropdownMenuItem>
              </TooltipProvider>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* View Content */}
      {viewMode === "grid" && renderGridView()}
      {viewMode === "list" && renderListView()}
      {viewMode === "table" && renderTableView()}

      {/* Pagination */}
      {viewMode === "list" && (
        <CardFooter className="flex items-center justify-between border-t py-3">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
            {filteredStudents.length < filteredAndSortedStudents.length && ` (filtered from ${filteredAndSortedStudents.length})`}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      )}
    </div>
  );
};

StudentTable.propTypes = {
  students: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      photo: PropTypes.string,
      status: PropTypes.string.isRequired,
      priority: PropTypes.string.isRequired,
      lastActive: PropTypes.string.isRequired,
      phone: PropTypes.string,
      address: PropTypes.string,
      registeredOn: PropTypes.string,
      idProof: PropTypes.string,
      bookings: PropTypes.number,
      violations: PropTypes.number,
      notes: PropTypes.string,
      seatNo: PropTypes.string,
      department: PropTypes.string.isRequired,
      year: PropTypes.string.isRequired
    })
  ).isRequired,
  filteredAndSortedStudents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      photo: PropTypes.string,
      status: PropTypes.string.isRequired,
      priority: PropTypes.string.isRequired,
      lastActive: PropTypes.string.isRequired,
      phone: PropTypes.string,
      address: PropTypes.string,
      registeredOn: PropTypes.string,
      idProof: PropTypes.string,
      bookings: PropTypes.number,
      violations: PropTypes.number,
      notes: PropTypes.string,
      seatNo: PropTypes.string,
      department: PropTypes.string.isRequired,
      year: PropTypes.string.isRequired
    })
  ).isRequired,
  editStudent: PropTypes.func.isRequired,
  deleteStudent: PropTypes.func.isRequired
};

export default StudentTable;