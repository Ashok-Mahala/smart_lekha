import React, { useState, useEffect, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import PropTypes from 'prop-types';

const LayoutConfigurator = ({ 
  initialConfig = {
    rows: 5,
    columns: 5,
    gap: 2,
    showNumbers: true,
    showStatus: true,
    layout: Array(5).fill().map(() => Array(5).fill(true))
  }, 
  onSave 
}) => {
  const [config, setConfig] = useState(() => {
    const safeLayout = initialConfig?.layout || 
      Array(initialConfig?.rows || 5).fill().map(() => Array(initialConfig?.columns || 5).fill(true));
    
    return {
      rows: initialConfig?.rows || 5,
      columns: initialConfig?.columns || 5,
      gap: initialConfig?.gap || 2,
      showNumbers: initialConfig?.showNumbers ?? true,
      showStatus: initialConfig?.showStatus ?? true,
      layout: safeLayout
    };
  });

  // Calculate seat numbers while skipping unavailable seats (false values)
  const seatNumbers = useMemo(() => {
    let seatCounter = 0;
    return config.layout?.map(row => 
      row.map(seat => {
        if (seat) {
          seatCounter++;
          return seatCounter;
        }
        return 0; // 0 represents unavailable seats (pillars)
      })
    ) || [];
  }, [config.layout]);

  // Update grid when rows/columns change
  useEffect(() => {
    const newLayout = Array(config.rows).fill().map((_, rowIndex) => 
      Array(config.columns).fill().map((_, colIndex) => {
        const currentRow = config.layout?.[rowIndex] || [];
        return currentRow[colIndex] !== undefined ? currentRow[colIndex] : true;
      })
    );
    
    setConfig(prev => ({
      ...prev,
      layout: newLayout
    }));
  }, [config.rows, config.columns]);

  const handleGridClick = (row, col) => {
    const newLayout = config.layout?.map((r, rIdx) => 
      rIdx === row 
        ? [...(r || [])].map((c, cIdx) => cIdx === col ? !c : c)
        : [...(r || [])]
    ) || [];
    
    setConfig(prev => ({ ...prev, layout: newLayout }));
  };

  const handleSave = () => {
    if (config.layout) {
      onSave(config);
    }
  };

  const renderGrid = () => {
    if (!config.layout) return null;
    
    return config.layout.map((row, rowIndex) =>
      row?.map((seat, colIndex) => (
        <button
          key={`${rowIndex}-${colIndex}`}
          className={`aspect-square rounded-md flex items-center justify-center ${
            seat
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed'
          }`}
          onClick={() => handleGridClick(rowIndex, colIndex)}
          style={{
            minWidth: '24px', // Minimum size for seats
            maxWidth: '100%', // Prevent overflow
          }}
        >
          {config.showNumbers && seatNumbers[rowIndex]?.[colIndex] > 0 && (
            <span className="text-xs text-primary-foreground">
              {seatNumbers[rowIndex][colIndex]}
            </span>
          )}
          {!seat && (
            <span className="text-xs text-gray-200">X</span>
          )}
        </button>
      ))
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Layout Configuration</h3>
      
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Rows: {config.rows}</Label>
            <Slider
              value={[config.rows]}
              onValueChange={([value]) => setConfig(prev => ({ ...prev, rows: value }))}
              min={1}
              max={20}
              step={1}
            />
          </div>
          <div>
            <Label>Columns: {config.columns}</Label>
            <Slider
              value={[config.columns]}
              onValueChange={([value]) => setConfig(prev => ({ ...prev, columns: value }))}
              min={1}
              max={20}
              step={1}
            />
          </div>
          <div>
            <Label>Gap Size</Label>
            <Slider
              value={[config.gap]}
              onValueChange={([value]) => setConfig(prev => ({ ...prev, gap: value }))}
              min={1}
              max={5}
              step={1}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Show Seat Numbers</Label>
            <Switch
              checked={config.showNumbers}
              onCheckedChange={(val) => setConfig(p => ({ ...p, showNumbers: val }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Show Status Indicators</Label>
            <Switch
              checked={config.showStatus}
              onCheckedChange={(val) => setConfig(p => ({ ...p, showStatus: val }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Seat Grid Preview</Label>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-primary rounded-sm"></div>
              <span className="text-xs">Available Seat</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-400 rounded-sm"></div>
              <span className="text-xs">Pillar/Unavailable</span>
            </div>
          </div>
          <div 
            className="grid gap-2 border rounded-lg p-4 overflow-auto"
            style={{
              gridTemplateColumns: `repeat(${config.columns}, minmax(24px, 1fr))`,
              gap: `${config.gap * 4}px`,
              maxWidth: '100%',
            }}
          >
            {renderGrid()}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Layout
        </Button>
      </div>
    </Card>
  );
};

LayoutConfigurator.propTypes = {
  initialConfig: PropTypes.shape({
    rows: PropTypes.number,
    columns: PropTypes.number,
    gap: PropTypes.number,
    showNumbers: PropTypes.bool,
    showStatus: PropTypes.bool,
    layout: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.bool))
  }),
  onSave: PropTypes.func.isRequired
};

export default LayoutConfigurator;