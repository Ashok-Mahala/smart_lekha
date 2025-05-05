import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { handleApiResponse } from '@/api/axios';
import api from '@/api/axios';
import PropTypes from 'prop-types';

// Initial state
const initialState = {
  students: [],
  stats: {
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    totalBookings: 0,
    totalViolations: 0,
    totalDues: 0
  },
  selectedStudent: null,
  isLoading: false,
  error: null
};

// Action types
const actionTypes = {
  SET_STUDENTS: 'SET_STUDENTS',
  SET_STATS: 'SET_STATS',
  SET_SELECTED_STUDENT: 'SET_SELECTED_STUDENT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  ADD_STUDENT: 'ADD_STUDENT',
  UPDATE_STUDENT: 'UPDATE_STUDENT',
  DELETE_STUDENT: 'DELETE_STUDENT'
};

// Reducer function
const studentReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_STUDENTS:
      return { ...state, students: action.payload };
    case actionTypes.SET_STATS:
      return { ...state, stats: action.payload };
    case actionTypes.SET_SELECTED_STUDENT:
      return { ...state, selectedStudent: action.payload };
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case actionTypes.ADD_STUDENT:
      return { ...state, students: [...state.students, action.payload] };
    case actionTypes.UPDATE_STUDENT:
      return {
        ...state,
        students: state.students.map(student =>
          student.id === action.payload.id ? action.payload : student
        )
      };
    case actionTypes.DELETE_STUDENT:
      return {
        ...state,
        students: state.students.filter(student => student.id !== action.payload)
      };
    default:
      return state;
  }
};

// Create context
const StudentContext = createContext();

// Provider component
const StudentProvider = ({ children }) => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    male: 0,
    female: 0,
    other: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/students');
      
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('API endpoint not available');
      }
      
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentStats = async () => {
    try {
      const response = await fetch('/api/students/stats');
      
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('API endpoint not available');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching student stats:', error);
      setError('Failed to load student statistics');
    }
  };

  const addStudent = async (studentData) => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add student');
      }
      
      const newStudent = await response.json();
      setStudents(prevStudents => [...prevStudents, newStudent]);
      await fetchStudentStats();
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  };

  const updateStudent = async (studentId, studentData) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update student');
      }
      
      const updatedStudent = await response.json();
      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.id === studentId ? updatedStudent : student
        )
      );
      await fetchStudentStats();
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  };

  const deleteStudent = async (studentId) => {
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete student');
      }
      
      setStudents(prevStudents => 
        prevStudents.filter(student => student.id !== studentId)
      );
      await fetchStudentStats();
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchStudentStats();
  }, []);

  const value = {
    students,
    stats,
    isLoading,
    error,
    fetchStudents,
    fetchStudentStats,
    addStudent,
    updateStudent,
    deleteStudent,
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
};

StudentProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook for using the context
export const useStudentContext = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudentContext must be used within a StudentProvider');
  }
  return context;
}; 