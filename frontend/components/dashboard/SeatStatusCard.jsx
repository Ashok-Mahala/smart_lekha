import React from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import PropTypes from 'prop-types';

const SeatStatusCard = ({ title, count, total, type }) => {
  const percentage = (count / total) * 100;
  const getStatusColor = () => {
    switch (type) {
      case 'available':
        return 'bg-green-500';
      case 'occupied':
        return 'bg-blue-500';
      case 'reserved':
        return 'bg-yellow-500';
      case 'maintenance':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="default" className={getStatusColor()}>
          {count}/{total}
        </Badge>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-sm text-muted-foreground mt-2">
        {percentage.toFixed(1)}% occupancy
      </p>
    </Card>
  );
};

SeatStatusCard.propTypes = {
  title: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['available', 'occupied', 'reserved', 'maintenance']).isRequired
};

export default SeatStatusCard;