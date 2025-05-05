import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import PropTypes from 'prop-types';

const LayoutConfigurator = ({ onSave }) => {
  const [rows, setRows] = useState(5);
  const [columns, setColumns] = useState(5);
  const [gap, setGap] = useState(2);
  const [showSeatNumbers, setShowSeatNumbers] = useState(true);
  const [showStatus, setShowStatus] = useState(true);
  const [grid, setGrid] = useState(Array(5).fill().map(() => Array(5).fill(true)));

  const handleGridClick = (row, col) => {
    const newGrid = [...grid];
    newGrid[row][col] = !newGrid[row][col];
    setGrid(newGrid);
  };

  const handleSave = () => {
    onSave({
      rows,
      columns,
      gap,
      showSeatNumbers,
      showStatus,
      grid
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Layout Configuration</h3>
      
      <div className="space-y-6">
        {/* Grid Size Configuration */}
        <div className="space-y-4">
          <div>
            <Label>Rows</Label>
            <Slider
              value={[rows]}
              onValueChange={([value]) => setRows(value)}
              min={1}
              max={10}
              step={1}
            />
          </div>
          <div>
            <Label>Columns</Label>
            <Slider
              value={[columns]}
              onValueChange={([value]) => setColumns(value)}
              min={1}
              max={10}
              step={1}
            />
          </div>
          <div>
            <Label>Gap</Label>
            <Slider
              value={[gap]}
              onValueChange={([value]) => setGap(value)}
              min={1}
              max={5}
              step={1}
            />
          </div>
        </div>

        {/* Display Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Show Seat Numbers</Label>
            <Switch
              checked={showSeatNumbers}
              onCheckedChange={setShowSeatNumbers}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Show Status</Label>
            <Switch
              checked={showStatus}
              onCheckedChange={setShowStatus}
            />
          </div>
        </div>

        {/* Interactive Grid */}
        <div className="space-y-2">
          <Label>Seat Layout</Label>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: `${gap * 0.25}rem`
            }}
          >
            {Array.from({ length: rows }).map((_, rowIndex) =>
              Array.from({ length: columns }).map((_, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={`aspect-square rounded-md ${
                    grid[rowIndex][colIndex]
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-muted hover:bg-muted/90'
                  }`}
                  onClick={() => handleGridClick(rowIndex, colIndex)}
                >
                  {showSeatNumbers && (
                    <span className="text-xs text-primary-foreground">
                      {rowIndex * columns + colIndex + 1}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} className="w-full">
          Save Layout
        </Button>
      </div>
    </Card>
  );
};

LayoutConfigurator.propTypes = {
  onSave: PropTypes.func.isRequired
};

export default LayoutConfigurator; 