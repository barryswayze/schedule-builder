import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSchedule } from '@/stores/ScheduleContext';
import { PRESET_COLORS } from '@/types';

export function AddActivityTypeModal() {
  const {
    state: { isActivityTypeModalOpen },
    closeActivityTypeModal,
    addCustomActivityType,
    getAllActivityTypes,
  } = useSchedule();

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState('');

  const existingTypes = getAllActivityTypes();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter a name');
      return;
    }

    if (existingTypes[trimmedName]) {
      setError('An activity type with this name already exists');
      return;
    }

    addCustomActivityType({ name: trimmedName, color: selectedColor });
    setName('');
    setSelectedColor(PRESET_COLORS[0]);
    closeActivityTypeModal();
  };

  const handleClose = () => {
    setName('');
    setSelectedColor(PRESET_COLORS[0]);
    setError('');
    closeActivityTypeModal();
  };

  return (
    <Dialog open={isActivityTypeModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Custom Activity Type</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="activityName">Activity Name</Label>
            <Input
              id="activityName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g., Yoga, Reading, Gym"
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-10 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    selectedColor === color
                      ? 'border-gray-900 scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div
              className="p-3 rounded-md"
              style={{
                backgroundColor: `${selectedColor}20`,
                borderLeft: `3px solid ${selectedColor}`,
              }}
            >
              <div className="text-sm font-medium" style={{ color: selectedColor }}>
                {name || 'Activity Name'}
              </div>
              <div className="text-xs text-gray-500">9:00 AM - 10:00 AM</div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Add Activity Type</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
