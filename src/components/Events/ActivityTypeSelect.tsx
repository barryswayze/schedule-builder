import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useSchedule } from '@/stores/ScheduleContext';

interface ActivityTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ActivityTypeSelect({ value, onValueChange }: ActivityTypeSelectProps) {
  const { getAllActivityTypes, openActivityTypeModal } = useSchedule();
  const activityTypes = getAllActivityTypes();
  const activityOptions = Object.entries(activityTypes);

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select activity type">
            {value && activityTypes[value] && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activityTypes[value] }}
                />
                <span>{value}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {activityOptions.map(([type, color]) => (
            <SelectItem key={type} value={type}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>{type}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={openActivityTypeModal}
        title="Add custom activity type"
      >
        +
      </Button>
    </div>
  );
}
