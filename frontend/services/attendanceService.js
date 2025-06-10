import PropTypes from 'prop-types';
import api from './smlekha';

export const attendanceRecordPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  studentId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  checkInTime: PropTypes.string.isRequired,
  checkOutTime: PropTypes.string,
  status: PropTypes.oneOf(['present', 'absent', 'late']).isRequired,
  notes: PropTypes.string
});

export const attendanceActivityPropTypes = PropTypes.shape({
  studentId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  time: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['check-in', 'check-out']).isRequired
});

export const attendanceService = {
  async recordAttendance(data) {
    const response = await api.post('/attendance', data);
    return response.data;
  },

  async recordActivity(data) {
    const response = await api.post('/attendance/activity', data);
    return response.data;
  },

  async getStudentAttendance(studentId, startDate, endDate) {
    const response = await api.get(`/attendance/student/${studentId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  async getAttendanceStats(studentId, startDate, endDate) {
    const response = await api.get(`/attendance/stats/${studentId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  }
}; 