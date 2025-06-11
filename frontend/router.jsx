import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import DashboardPage from './pages/dashboard/Dashboard';
import LoginPage from './pages/auth/Login';
import SignupPage from './pages/auth/Signup';
import AttendancePage from './pages/AttendancePage';
import StudentsPage from './pages/students/Students';
import AddStudentPage from './pages/students/AddStudentPage';
import StudentBookingPage from './pages/students/StudentBookingPage';
import OldStudentsPage from './pages/students/OldStudentsPage';
import AddBookingPage from './pages/students/AddBookingPage';
import EditBookingPage from './pages/students/EditBookingPage';
import StudentProfile from './pages/students/StudentProfile';
import SeatsPage from './pages/seats/Seats';
import PaymentsPage from './pages/financial/Payments';
import CollectionsPage from './pages/financial/Collections';
import DuePaymentsPage from './pages/financial/DuePayments';
import ExpensesPage from './pages/financial/Expenses';
import BankAccountsPage from './pages/financial/BankAccounts';
import ShiftsPage from './pages/Shifts';
import ReportsPage from './pages/reports/Reports';
import SettingsPage from './pages/system/Settings';
import ErrorPage from './pages/ErrorPage';
import ProfilePage from './pages/admin/ProfilePage';
import SecurityPage from './pages/admin/SecurityPage';
import AccessControlPage from './pages/admin/AccessControlPage';
import TeamPage from './pages/admin/TeamPage';
import PropertiesPage from './pages/properties/Properties';
import PropertyDetails from './pages/properties/PropertyDetails';
import { authService } from './services/authService';



const isAuthenticated = () => {
  return authService.isAuthenticated();
};

const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/attendance',
    element: (
      <ProtectedRoute>
        <AttendancePage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/students',
    element: (
      <ProtectedRoute>
        <StudentsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/students/add',
    element: (
      <ProtectedRoute>
        <AddStudentPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/students/booking',
    element: (
      <ProtectedRoute>
        <StudentBookingPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/students/old',
    element: (
      <ProtectedRoute>
        <OldStudentsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/students/booking/add',
    element: (
      <ProtectedRoute>
        <AddBookingPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/students/booking/edit/:id',
    element: (
      <ProtectedRoute>
        <EditBookingPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/students/profile/:id',
    element: (
      <ProtectedRoute>
        <StudentProfile />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/seats',
    element: (
      <ProtectedRoute>
        <SeatsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/payments',
    element: (
      <ProtectedRoute>
        <PaymentsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/collections',
    element: (
      <ProtectedRoute>
        <CollectionsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/due-payments',
    element: (
      <ProtectedRoute>
        <DuePaymentsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/expenses',
    element: (
      <ProtectedRoute>
        <ExpensesPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/bank-accounts',
    element: (
      <ProtectedRoute>
        <BankAccountsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/shifts',
    element: (
      <ProtectedRoute>
        <ShiftsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <ReportsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/admin/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/admin/security',
    element: (
      <ProtectedRoute>
        <SecurityPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/admin/access-control',
    element: (
      <ProtectedRoute>
        <AccessControlPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/admin/team',
    element: (
      <ProtectedRoute>
        <TeamPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/properties',
    element: (
      <ProtectedRoute>
        <PropertiesPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: '/properties/:id',
    element: (
      <ProtectedRoute>
        <PropertyDetails />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
}); 