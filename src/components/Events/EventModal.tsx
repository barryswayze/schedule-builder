import { useState, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSchedule } from '@/stores/useSchedule';
import { DAYS_OF_WEEK, type DayOfWeek, type RecurrenceFrequency } from '@/types';
import { DURATION_OPTIONS } from '@/utils/timeHelpers';

interface FormState {
  title: string;
  description: string;
  daysOfWeek: DayOfWeek[];
  startTime: string;
  duration: number;
  activityType: string;
  customType: string;
  recurrence: RecurrenceFrequency;
  recurrenceEndDate: string;
  notificationEnabled: boolean;
}

function getInitialFormState(
  selectedEvent: ReturnType<typeof useSchedule>['state']['selectedEvent'],
  creatingEventSlot: ReturnType<typeof useSchedule>['state']['creatingEventSlot']
): FormState {
  if (selectedEvent) {
    return {
      title: selectedEvent.title,
      description: selectedEvent.description || '',
      daysOfWeek: selectedEvent.daysOfWeek,
      startTime: selectedEvent.startTime,
      duration: selectedEvent.duration,
      activityType: selectedEvent.activityType,
      customType: '',
      recurrence: selectedEvent.recurrence,
      recurrenceEndDate: selectedEvent.recurrenceEndDate || '',
      notificationEnabled: selectedEvent.notificationEnabled,
    };
  }
  if (creatingEventSlot) {
    return {
      title: '',
      description: '',
      daysOfWeek: [creatingEventSlot.dayOfWeek],
      startTime: creatingEventSlot.startTime,
      duration: 1,
      activityType: 'Work From Home',
      customType: '',
      recurrence: 'weekly',
      recurrenceEndDate: '',
      notificationEnabled: true,
    };
  }
  return {
    title: '',
    description: '',
    daysOfWeek: [0],
    startTime: '09:00',
    duration: 1,
    activityType: 'Work From Home',
    customType: '',
    recurrence: 'weekly',
    recurrenceEndDate: '',
    notificationEnabled: true,
  };
}

export function EventModal() {
  const {
    state: { isModalOpen, selectedEvent, creatingEventSlot },
    addEvent,
    updateEvent,
    deleteEvent,
    closeModal,
    getAllActivityTypes,
    addCustomActivityType,
  } = useSchedule();

  const isEditing = selectedEvent !== null;
  const allTypes = getAllActivityTypes();

  // Compute initial state based on modal context
  const initialFormState = useMemo(
    () => getInitialFormState(selectedEvent, creatingEventSlot),
    [selectedEvent, creatingEventSlot]
  );

  // Form state - uses key prop on Dialog to reset when modal opens
  const [title, setTitle] = useState(initialFormState.title);
  const [description, setDescription] = useState(initialFormState.description);
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(initialFormState.daysOfWeek);
  const [startTime, setStartTime] = useState(initialFormState.startTime);
  const [duration, setDuration] = useState(initialFormState.duration);
  const [activityType, setActivityType] = useState(initialFormState.activityType);
  const [customType, setCustomType] = useState(initialFormState.customType);
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>(initialFormState.recurrence);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(initialFormState.recurrenceEndDate);
  const [notificationEnabled, setNotificationEnabled] = useState(initialFormState.notificationEnabled);

  const toggleDay = (day: DayOfWeek) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(day)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Handle custom type entry
    let finalActivityType = activityType;
    if (customType.trim()) {
      finalActivityType = customType.trim();
      // Add as custom type if it doesn't exist
      if (!allTypes[finalActivityType]) {
        addCustomActivityType({ name: finalActivityType, color: '#6366f1' });
      }
    }

    const finalTitle = title.trim() || finalActivityType;

    const eventData = {
      title: finalTitle,
      description: description.trim() || undefined,
      daysOfWeek,
      startTime,
      duration,
      activityType: finalActivityType,
      recurrence,
      recurrenceEndDate: recurrence !== 'none' && recurrenceEndDate ? recurrenceEndDate : undefined,
      notificationEnabled,
    };

    if (isEditing && selectedEvent) {
      updateEvent({ ...selectedEvent, ...eventData });
    } else {
      addEvent(eventData);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id);
      closeModal();
    }
  };

  // Generate a key to force form reset when modal context changes
  const modalKey = selectedEvent?.id || creatingEventSlot?.startTime || 'new';

  return (
    <Dialog key={modalKey} open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Event' : 'Create Event'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Row 1: Activity Type + Custom Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Activity Type</Label>
              <Select value={activityType} onValueChange={(v) => { setActivityType(v); setCustomType(''); }}>
                <SelectTrigger className="h-9" style={{
                  backgroundColor: `${allTypes[activityType]}20`,
                  borderLeft: `3px solid ${allTypes[activityType]}`
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(allTypes).map(([type, color]) => (
                    <SelectItem key={type} value={type}>
                      <div
                        className="flex items-center gap-2 px-2 py-1 rounded -mx-2"
                        style={{ backgroundColor: `${color}25` }}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span style={{ color: color, fontWeight: 500 }}>{type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Or type new</Label>
              <Input
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="Custom type..."
                className="h-9"
              />
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <Label className="text-xs">Title (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={customType || activityType}
              className="h-9"
            />
          </div>

          {/* Row 3: Days */}
          <div>
            <Label className="text-xs">Days</Label>
            <div className="flex gap-1 mt-1">
              {DAYS_OF_WEEK.map((day, index) => {
                const isSelected = daysOfWeek.includes(index as DayOfWeek);
                return (
                  <div
                    key={index}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleDay(index as DayOfWeek); }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      borderRadius: '4px',
                      border: '1px solid',
                      cursor: 'pointer',
                      userSelect: 'none',
                      backgroundColor: isSelected ? '#3b82f6' : 'white',
                      color: isSelected ? 'white' : '#374151',
                      borderColor: isSelected ? '#3b82f6' : '#d1d5db',
                      flex: 1,
                      textAlign: 'center',
                    }}
                  >
                    {day.slice(0, 2)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 4: Time + Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Duration</Label>
              <Select value={duration.toString()} onValueChange={(v) => setDuration(parseFloat(v))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: Recurrence + Until */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Recurrence</Label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceFrequency)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">One-time</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Until {recurrence === 'none' && '(n/a)'}</Label>
              <Input
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                disabled={recurrence === 'none'}
                className="h-9"
              />
            </div>
          </div>

          {/* Row 6: Description */}
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes..."
              className="h-9"
            />
          </div>

          {/* Row 7: Notification */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notification"
              checked={notificationEnabled}
              onChange={(e) => setNotificationEnabled(e.target.checked)}
            />
            <Label htmlFor="notification" className="text-xs cursor-pointer">Notification</Label>
          </div>

          <DialogFooter className="gap-2 pt-2">
            {isEditing && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
            <Button type="submit" size="sm">{isEditing ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
