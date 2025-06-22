import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PropTypes from 'prop-types';

const LayoutConfigurator = ({ 
  initialConfig = {
    rows: 5,
    columns: 5,
    gap: 2,
    showNumbers: true,
    showStatus: true,
    layout: Array(5).fill().map(() => Array(5).fill(true)),
    seatNumbers: {}
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

  const [editingSeat, setEditingSeat] = useState(null);
  const [seatNumberInput, setSeatNumberInput] = useState('');
  const [seatNumbers, setSeatNumbers] = useState(initialConfig.seatNumbers || {});

  // Calculate seat numbers in continuous sequence
  const calculateContinuousNumbers = (layout, existingNumbers) => {
    const newSeatNumbers = {};
    let seatCounter = 1;
    
    // First pass: assign numbers in row-major order
    layout?.forEach((row, rowIndex) => {
      row.forEach((seat, colIndex) => {
        if (seat) {
          const key = `${rowIndex}-${colIndex}`;
          newSeatNumbers[key] = seatCounter.toString();
          seatCounter++;
        }
      });
    });
    
    return newSeatNumbers;
  };

  // Update seat numbers whenever layout changes
  useEffect(() => {
    const newSeatNumbers = calculateContinuousNumbers(config.layout, seatNumbers);
    setSeatNumbers(newSeatNumbers);
  }, [config.layout]);

  // Update layout when rows/columns change
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

  const handleSeatNumberClick = (e, row, col) => {
    e.stopPropagation();
    if (!config.layout[row][col]) return;
    
    setEditingSeat({ row, col });
    setSeatNumberInput(seatNumbers[`${row}-${col}`] || '');
  };

  const handleSaveSeatNumber = () => {
    if (editingSeat) {
      const { row, col } = editingSeat;
      const newNumber = seatNumberInput.trim();
      
      if (newNumber) {
        // Check for duplicates
        const isDuplicate = Object.entries(seatNumbers).some(
          ([key, num]) => key !== `${row}-${col}` && num.toString() === newNumber
        );
        
        if (isDuplicate) {
          alert("Seat number must be unique");
          return;
        }
        
        setSeatNumbers(prev => ({
          ...prev,
          [`${row}-${col}`]: newNumber
        }));
      }
      
      setEditingSeat(null);
    }
  };

  const handleSave = () => {
    if (config.layout) {
      onSave({
        ...config,
        seatNumbers: { ...seatNumbers }
      });
    }
  };

  const renderGrid = () => {
    if (!config.layout) return null;
    
    return config.layout.map((row, rowIndex) =>
      row?.map((seat, colIndex) => (
        <button
          key={`${rowIndex}-${colIndex}`}
          className={`aspect-square rounded-md flex items-center justify-center relative ${
            seat
              ? 'bg-primary hover:bg-primary/90'
              : 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed'
          }`}
          onClick={() => handleGridClick(rowIndex, colIndex)}
          style={{
            minWidth: '24px',
            maxWidth: '100%',
          }}
        >
          {seat && config.showNumbers && (
            <span 
              className={`text-xs ${
                seatNumbers[`${rowIndex}-${colIndex}`] !== (rowIndex * config.columns + colIndex + 1)
                  ? 'font-bold text-yellow-400'
                  : 'text-primary-foreground'
              } hover:underline cursor-pointer`}
              onClick={(e) => handleSeatNumberClick(e, rowIndex, colIndex)}
            >
              {seatNumbers[`${rowIndex}-${colIndex}`] || ''}
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

      <Dialog open={!!editingSeat} onOpenChange={(open) => !open && setEditingSeat(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Seat Number</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="text"
              value={seatNumberInput}
              onChange={(e) => setSeatNumberInput(e.target.value)}
              placeholder="e.g., A1, 101, etc."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSeat(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSeatNumber}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
    layout: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.bool)),
    seatNumbers: PropTypes.object
  }),
  onSave: PropTypes.func.isRequired
};

export default LayoutConfigurator;