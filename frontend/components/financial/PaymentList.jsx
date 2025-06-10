import React, { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { getPayments, verifyPayment, refundPayment } from '.././api/payments';
import { Table, Button, Input, Spinner, Badge } from '../ui';
import { toast } from 'sonner';

const PaymentList = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });

  const {
    data: payments,
    loading,
    error,
    execute: fetchPayments
  } = useApi(getPayments);

  useEffect(() => {
    fetchPayments(filters);
  }, [fetchPayments, filters]);

  const handleVerifyPayment = async (paymentId) => {
    try {
      await verifyPayment(paymentId);
      toast.success('Payment verified successfully');
      fetchPayments(filters);
    } catch (error) {
      toast.error(error.error?.message || 'Failed to verify payment');
    }
  };

  const handleRefundPayment = async (paymentId) => {
    try {
      await refundPayment(paymentId, { reason: 'Customer request' });
      toast.success('Payment refunded successfully');
      fetchPayments(filters);
    } catch (error) {
      toast.error(error.error?.message || 'Failed to refund payment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Error: {error.message}</p>
        <Button onClick={() => fetchPayments(filters)} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payments</h2>
        <div className="flex gap-4">
          <Input
            type="search"
            placeholder="Search payments..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-64"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="border rounded-md px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-40"
          />
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-40"
          />
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Payment ID</Table.HeaderCell>
            <Table.HeaderCell>Amount</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Student</Table.HeaderCell>
            <Table.HeaderCell>Date</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {payments?.data?.map((payment) => (
            <Table.Row key={payment._id}>
              <Table.Cell>{payment.paymentId}</Table.Cell>
              <Table.Cell>${payment.amount.toFixed(2)}</Table.Cell>
              <Table.Cell>
                <Badge
                  variant={
                    payment.status === 'completed'
                      ? 'success'
                      : payment.status === 'pending'
                      ? 'warning'
                      : payment.status === 'refunded'
                      ? 'info'
                      : 'destructive'
                  }
                >
                  {payment.status}
                </Badge>
              </Table.Cell>
              <Table.Cell>{payment.student?.name}</Table.Cell>
              <Table.Cell>
                {new Date(payment.createdAt).toLocaleString()}
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-2">
                  {payment.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyPayment(payment._id)}
                    >
                      Verify
                    </Button>
                  )}
                  {payment.status === 'completed' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRefundPayment(payment._id)}
                    >
                      Refund
                    </Button>
                  )}
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};

export default PaymentList; 