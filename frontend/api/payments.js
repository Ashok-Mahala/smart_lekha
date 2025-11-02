// api/paymentService.js - Enhanced version
import axios from './axios';
import { API_CONFIG } from './config';
import { toast } from 'sonner';

const API_BASE_URL = `${API_CONFIG.baseURL}/payments`;

export const createPayment = async (paymentData) => {
  try {
    const response = await axios.post(API_BASE_URL, paymentData);
    toast.success('Payment recorded successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to record payment');
    throw error;
  }
};

export const getPayments = async (params = {}) => {
  try {
    const response = await axios.get(API_BASE_URL, { params });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch payments');
    throw error;
  }
};

export const getDashboardStats = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats/dashboard`, { params });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch payment statistics');
    throw error;
  }
};

export const getStudentPayments = async (studentId, params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/student/${studentId}`, { params });
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch student payments');
    throw error;
  }
};

export const generatePaymentReport = async (params = {}) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/report`, { params });
    return response.data;
  } catch (error) {
    toast.error('Failed to generate payment report');
    throw error;
  }
};

// Keep existing methods for compatibility
export const getPaymentById = async (paymentId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${paymentId}`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch payment');
    throw error;
  }
};

export const updatePayment = async (paymentId, paymentData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${paymentId}`, paymentData);
    toast.success('Payment updated successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to update payment');
    throw error;
  }
};

export const completePayment = async (paymentId, transactionData = {}) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${paymentId}/complete`, transactionData);
    toast.success('Payment completed successfully');
    return response.data;
  } catch (error) {
    toast.error('Failed to complete payment');
    throw error;
  }
};

export const getOverduePayments = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/overdue`);
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch overdue payments');
    throw error;
  }
};

export default {
  createPayment,
  getPayments,
  getDashboardStats,
  getStudentPayments,
  generatePaymentReport,
  getPaymentById,
  updatePayment,
  completePayment,
  getOverduePayments
};