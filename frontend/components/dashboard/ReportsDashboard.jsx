import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import {
  getAttendanceReport,
  getRevenueReport,
  getSeatUtilizationReport,
  getStudentPerformanceReport,
  getPaymentSummaryReport,
  exportReportToPDF,
  exportReportToExcel
} from '.././api/reports';
import { Card, Button, Select, DateRangePicker, Spinner } from '../ui';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ReportsDashboard = () => {
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });

  const {
    data: reportData,
    loading,
    error,
    execute: fetchReport
  } = useApi(
    selectedReport === 'attendance'
      ? getAttendanceReport
      : selectedReport === 'revenue'
      ? getRevenueReport
      : selectedReport === 'seat-utilization'
      ? getSeatUtilizationReport
      : selectedReport === 'student-performance'
      ? getStudentPerformanceReport
      : getPaymentSummaryReport
  );

  const handleReportChange = (value) => {
    setSelectedReport(value);
    fetchReport({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    fetchReport({
      startDate: range.startDate,
      endDate: range.endDate
    });
  };

  const handleExport = async (format) => {
    try {
      const exportFn = format === 'pdf' ? exportReportToPDF : exportReportToExcel;
      const blob = await exportFn(selectedReport, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}-report.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(error.error?.message || `Failed to export report as ${format.toUpperCase()}`);
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
        <Button onClick={() => fetchReport({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        })} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reports Dashboard</h2>
        <div className="flex gap-4">
          <Select
            value={selectedReport}
            onChange={handleReportChange}
            options={[
              { value: 'attendance', label: 'Attendance Report' },
              { value: 'revenue', label: 'Revenue Report' },
              { value: 'seat-utilization', label: 'Seat Utilization' },
              { value: 'student-performance', label: 'Student Performance' },
              { value: 'payment-summary', label: 'Payment Summary' }
            ]}
            className="w-64"
          />
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            className="w-64"
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
            >
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
            >
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportData?.summary?.map((item, index) => (
          <Card key={index} className="p-4">
            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-2xl font-bold">{item.value}</p>
            {item.change && (
              <p className={`text-sm ${item.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {item.change > 0 ? '+' : ''}{item.change}% from previous period
              </p>
            )}
          </Card>
        ))}
      </div>

      {reportData?.chartData && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportsDashboard; 