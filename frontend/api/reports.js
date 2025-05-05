// Reports API Service

import { toast } from "sonner";
import PropTypes from 'prop-types';
import { API_CONFIG } from './config.js';
import api from './axios';

const API_BASE_URL = API_CONFIG.baseURL;
const REPORTS_ENDPOINT = '/api/reports';

// Get daily summary report
export const getDailySummary = async (date) => {
  try {
    const formattedDate = date ? `?date=${date}` : '';
    const response = await api.get(`/reports/summary${formattedDate}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching daily summary:", error);
    toast.error("Failed to fetch daily summary");
    return {
      totalStudents: 0,
      peakHour: "N/A",
      totalRevenue: 0,
      occupancyRate: 0
    };
  }
};

// Get revenue data
export const fetchRevenueData = async () => {
  try {
    const response = await api.get('/reports/revenue');
    return response.data;
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    toast.error('Failed to fetch revenue data');
    return {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    };
  }
};

// Get occupancy data
export const fetchOccupancyData = async () => {
  try {
    const response = await api.get('/reports/occupancy');
    return response.data;
  } catch (error) {
    console.error('Error fetching occupancy data:', error);
    toast.error('Failed to fetch occupancy data');
    return {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
    };
  }
};

// Get student activity data
export const fetchStudentActivityData = async () => {
  try {
    const response = await api.get('/reports/student-activity');
    return response.data;
  } catch (error) {
    console.error('Error fetching student activity data:', error);
    toast.error('Failed to fetch student activity data');
    return [];
  }
};

// Get financial data
export const fetchFinancialData = async () => {
  try {
    const response = await api.get('/reports/financial');
    return response.data;
  } catch (error) {
    console.error('Error fetching financial data:', error);
    toast.error('Failed to fetch financial data');
    return [];
  }
};

// Generate custom report
export const generateCustomReport = async (reportType, startDate, endDate, filters) => {
  try {
    const params = {
      reportType,
      startDate,
      endDate,
      ...filters
    };
    
    const response = await api.get('/reports/generate', { params });
    toast.success("Report generated successfully");
    return response.data.reportUrl;
  } catch (error) {
    console.error("Error generating report:", error);
    toast.error("Failed to generate report");
    return "";
  }
};

// Export report
export const exportReport = async (type) => {
  try {
    const response = await api.post(`/reports/export/${type}`);
    toast.success("Report exported successfully");
    return response.data.downloadUrl;
  } catch (error) {
    console.error("Error exporting report:", error);
    toast.error("Failed to export report");
    return "";
  }
};

// PropTypes validation
export const occupancyDataPropTypes = PropTypes.shape({
  date: PropTypes.string.isRequired,
  total: PropTypes.number.isRequired,
  zone: PropTypes.shape({
    readingArea: PropTypes.number.isRequired,
    computerZone: PropTypes.number.isRequired,
    quietStudy: PropTypes.number.isRequired,
    groupStudy: PropTypes.number.isRequired,
  }).isRequired,
});

export const revenueDataPropTypes = PropTypes.shape({
  date: PropTypes.string.isRequired,
  amount: PropTypes.number.isRequired,
  type: PropTypes.shape({
    seatReservation: PropTypes.number.isRequired,
    fines: PropTypes.number.isRequired,
    membership: PropTypes.number.isRequired,
    other: PropTypes.number.isRequired,
  }).isRequired,
});

export const studentUsageDataPropTypes = PropTypes.shape({
  studentId: PropTypes.string.isRequired,
  studentName: PropTypes.string.isRequired,
  totalHours: PropTypes.number.isRequired,
  visitsCount: PropTypes.number.isRequired,
  lastVisit: PropTypes.string.isRequired,
  preferredZone: PropTypes.string,
});

// Get attendance report
export const getAttendanceReport = async (params = {}) => {
  try {
    const response = await api.get(`${REPORTS_ENDPOINT}/attendance`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get revenue report
export const getRevenueReport = async (params = {}) => {
  try {
    const response = await api.get(`${REPORTS_ENDPOINT}/revenue`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get seat utilization report
export const getSeatUtilizationReport = async (params = {}) => {
  try {
    const response = await api.get(`${REPORTS_ENDPOINT}/seat-utilization`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get student performance report
export const getStudentPerformanceReport = async (params = {}) => {
  try {
    const response = await api.get(`${REPORTS_ENDPOINT}/student-performance`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get payment summary report
export const getPaymentSummaryReport = async (params = {}) => {
  try {
    const response = await api.get(`${REPORTS_ENDPOINT}/payment-summary`, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Export report to PDF
export const exportReportToPDF = async (reportType, params = {}) => {
  try {
    const response = await api.get(`${REPORTS_ENDPOINT}/${reportType}/export/pdf`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Export report to Excel
export const exportReportToExcel = async (reportType, params = {}) => {
  try {
    const response = await api.get(`${REPORTS_ENDPOINT}/${reportType}/export/excel`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get report filters
export const getReportFilters = async (reportType) => {
  try {
    const response = await api.get(`${REPORTS_ENDPOINT}/${reportType}/filters`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
