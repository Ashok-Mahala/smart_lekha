import PropTypes from 'prop-types';

// Common PropTypes for the application
export const userPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  role: PropTypes.oneOf(['admin', 'librarian', 'student']).isRequired,
  avatar: PropTypes.string
});

export const appSettingsPropTypes = PropTypes.shape({
  theme: PropTypes.oneOf(['light', 'dark', 'system']).isRequired,
  notificationsEnabled: PropTypes.bool.isRequired,
  emailNotifications: PropTypes.bool.isRequired,
  smsNotifications: PropTypes.bool.isRequired
});

export const librarySettingsPropTypes = PropTypes.shape({
  name: PropTypes.string.isRequired,
  openingTime: PropTypes.string.isRequired,
  closingTime: PropTypes.string.isRequired,
  maxStudentsPerShift: PropTypes.number.isRequired,
  bookingAdvanceDays: PropTypes.number.isRequired,
  cancellationPeriodMinutes: PropTypes.number.isRequired,
  finePerLateMinute: PropTypes.number.isRequired
});

export const seatPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  number: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['available', 'occupied', 'pre-booked']).isRequired,
  student: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    fatherName: PropTypes.string.isRequired,
    admissionDate: PropTypes.string.isRequired,
    idProof: PropTypes.string.isRequired,
    idProofPhoto: PropTypes.string,
    address: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    shiftTiming: PropTypes.string,
    shiftDays: PropTypes.string,
    studyCenter: PropTypes.string,
    feePaymentDueDate: PropTypes.string
  })
});

export const studentPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  phone: PropTypes.string.isRequired,
  fatherName: PropTypes.string.isRequired,
  admissionDate: PropTypes.string.isRequired,
  idProof: PropTypes.string.isRequired,
  idProofPhoto: PropTypes.string,
  address: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  shiftTiming: PropTypes.string,
  shiftDays: PropTypes.string,
  studyCenter: PropTypes.string,
  feePaymentDueDate: PropTypes.string
});

export const bookingPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  studentId: PropTypes.string.isRequired,
  seatId: PropTypes.string.isRequired,
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  paidAmount: PropTypes.number.isRequired,
  dueAmount: PropTypes.number.isRequired,
  status: PropTypes.oneOf(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).isRequired,
  paymentStatus: PropTypes.oneOf(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']).isRequired,
  createdAt: PropTypes.string.isRequired,
  updatedAt: PropTypes.string.isRequired
});

export const dashboardStatsPropTypes = PropTypes.shape({
  totalSeats: PropTypes.number.isRequired,
  availableSeats: PropTypes.number.isRequired,
  totalBookings: PropTypes.number.isRequired,
  activeBookings: PropTypes.number.isRequired,
  totalRevenue: PropTypes.number.isRequired,
  todayRevenue: PropTypes.number.isRequired,
  zoneOccupancy: PropTypes.arrayOf(
    PropTypes.shape({
      zoneId: PropTypes.string.isRequired,
      zoneName: PropTypes.string.isRequired,
      occupancy: PropTypes.number.isRequired
    })
  ).isRequired
});

export const apiResponsePropTypes = (dataType) => PropTypes.shape({
  data: dataType,
  message: PropTypes.string,
  error: PropTypes.string
}); 