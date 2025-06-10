import PropTypes from 'prop-types';
import api from './api';

interface Payment {
  id: string;
  studentName: string;
  studentId: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  method: string;
  description: string;
  invoiceUrl: string;
}

interface ReportParams {
  startDate: string;
  endDate: string;
}

export const paymentPropTypes = PropTypes.shape({
  id: PropTypes.string.isRequired,
  studentId: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  status: PropTypes.oneOf(['pending', 'completed', 'failed', 'refunded']).isRequired,
  paymentMethod: PropTypes.string.isRequired,
  transactionId: PropTypes.string,
  createdAt: PropTypes.string.isRequired,
  updatedAt: PropTypes.string.isRequired
});

export const reportParamsPropTypes = PropTypes.shape({
  startDate: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
  paymentMethod: PropTypes.string,
  status: PropTypes.string
});

export const paymentService = {
  async generateReport(params) {
    const response = await api.get('/payments/report', { params });
    return response.data;
  },

  async exportPayments(format) {
    const response = await api.get(`/payments/export/${format}`);
    return response.data;
  },

  async getPayments() {
    const response = await api.get('/payments');
    return response.data;
  },

  async updatePaymentStatus(paymentId, status) {
    const response = await api.put(`/payments/${paymentId}/status`, { status });
    return response.data;
  }
}; 