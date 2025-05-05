import PropTypes from 'prop-types';

// Student Status Enum
export const StudentStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  INACTIVE: 'inactive',
  GRADUATED: 'graduated',
  ON_LEAVE: 'on_leave'
};

// Student Priority Enum
export const StudentPriority = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// Student Gender Enum
export const StudentGender = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
};

// Base Student Schema
export const studentSchema = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  phone: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['active', 'inactive', 'suspended']).isRequired,
  createdAt: PropTypes.string.isRequired,
  updatedAt: PropTypes.string.isRequired
};

// Student Stats Schema
export const studentStatsSchema = {
  total: PropTypes.number.isRequired,
  active: PropTypes.number.isRequired,
  inactive: PropTypes.number.isRequired,
  suspended: PropTypes.number.isRequired,
  totalDues: PropTypes.number.isRequired
};

// New Student Schema (for creation)
export const newStudentSchema = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  phone: PropTypes.string.isRequired,
  address: PropTypes.string.isRequired,
  idProof: PropTypes.string.isRequired,
  photo: PropTypes.string
};

// Export PropTypes for use in components
export const studentPropTypes = PropTypes.shape(studentSchema);
export const studentStatsPropTypes = PropTypes.shape(studentStatsSchema);
export const newStudentPropTypes = PropTypes.shape(newStudentSchema); 