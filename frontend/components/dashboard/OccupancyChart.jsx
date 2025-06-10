import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

const OccupancyChart = ({ className }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/smlekha/occupancy');
        
        // If the response is not OK or returns HTML instead of JSON
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
          throw new Error('API endpoint not available');
        }
        
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching occupancy data:', error);
        setError('Unable to connect to the server. Using default data.');
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Occupancy by Zone</CardTitle>
          <CardDescription>Loading occupancy data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Occupancy by Zone</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Occupancy by Zone</CardTitle>
          <CardDescription>No occupancy data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get all unique zone names from the data
  const zoneNames = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'name') : [];
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Occupancy by Zone</CardTitle>
        <CardDescription>Hourly occupancy trends across different zones</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {zoneNames.map((zone, index) => (
              <Bar 
                key={zone}
                dataKey={zone}
                fill={colors[index % colors.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

OccupancyChart.propTypes = {
  className: PropTypes.string
};

export default OccupancyChart;
