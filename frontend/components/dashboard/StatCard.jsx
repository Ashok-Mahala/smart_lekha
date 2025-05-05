import React from 'react';
import { cn } from "@/lib/utils";
import PropTypes from 'prop-types';

const StatCard = ({ title, value, icon, description, trend }) => {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={cn(
            "mt-2 flex items-center text-sm",
            trend.type === 'up' ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.value} {trend.type === 'up' ? '↑' : '↓'}
          </div>
        )}
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node.isRequired,
  description: PropTypes.string,
  trend: PropTypes.shape({
    type: PropTypes.oneOf(['up', 'down']).isRequired,
    value: PropTypes.string.isRequired
  })
};

export default StatCard;
