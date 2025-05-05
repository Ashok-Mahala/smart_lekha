import React from 'react';
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import PropTypes from 'prop-types';

const RevenueChart = ({ className, data = [] }) => {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <CardDescription>
          Weekly revenue breakdown by category
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 0,
            }}
          >
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              stroke="#888888"
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => `₹${value}`}
              tickLine={false}
              axisLine={false}
              stroke="#888888"
              fontSize={12}
            />
            <Tooltip 
              formatter={(value) => [`₹${value}`, ""]} 
              labelFormatter={(label) => `Day: ${label}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="bookings"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="penalties"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="memberships"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

RevenueChart.propTypes = {
  className: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      bookings: PropTypes.number.isRequired,
      penalties: PropTypes.number.isRequired,
      memberships: PropTypes.number.isRequired
    })
  )
};

export default RevenueChart;
