import type { DayOfWeek, TimeSlot as TimeSlotType } from '@/types';
import { useSchedule } from '@/stores/ScheduleContext';

interface TimeSlotProps {
  slot: TimeSlotType;
  dayOfWeek: DayOfWeek;
  index: number;
}

const SLOT_HEIGHT = 24; // pixels per 30-min slot

export function TimeSlot({ slot, dayOfWeek, index }: TimeSlotProps) {
  const { openCreateModal } = useSchedule();

  const handleClick = () => {
    openCreateModal(dayOfWeek, slot.time);
  };

  const isHourStart = slot.minute === 0;

  return (
    <div
      className={`absolute left-0 right-0 border-b cursor-pointer transition-colors hover:bg-blue-100 ${
        isHourStart ? 'border-gray-200' : 'border-gray-100'
      }`}
      style={{
        top: `${index * SLOT_HEIGHT}px`,
        height: `${SLOT_HEIGHT}px`,
      }}
      onClick={handleClick}
    />
  );
}
