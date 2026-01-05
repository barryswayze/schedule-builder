import { useDroppable } from '@dnd-kit/core';
import { DAYS_OF_WEEK, generateTimeSlots, type DayOfWeek } from '@/types';
import { useSchedule } from '@/stores/ScheduleContext';
import { TimeSlot } from './TimeSlot';
import { EventBlock } from './EventBlock';

interface DayColumnProps {
  dayOfWeek: DayOfWeek;
}

const timeSlots = generateTimeSlots();
// 48 slots * 24px each = 1152px total height
const TOTAL_HEIGHT = 48 * 24;

export function DayColumn({ dayOfWeek }: DayColumnProps) {
  const { getEventsForDay } = useSchedule();
  const dayName = DAYS_OF_WEEK[dayOfWeek];
  const events = getEventsForDay(dayOfWeek);

  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayOfWeek}`,
    data: { dayOfWeek },
  });

  // Get abbreviated day name
  const shortDay = dayName.substring(0, 3);

  return (
    <div className="flex flex-col border-r border-gray-200 last:border-r-0">
      {/* Day header */}
      <div className="h-12 flex items-center justify-center border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <span className="text-sm font-semibold text-gray-700">{shortDay}</span>
      </div>

      {/* Time slots container with events */}
      <div
        ref={setNodeRef}
        className={`relative transition-colors ${isOver ? 'bg-blue-50' : ''}`}
        style={{ height: `${TOTAL_HEIGHT}px` }}
      >
        {/* Time slots (clickable) */}
        {timeSlots.map((slot, index) => (
          <TimeSlot key={slot.time} slot={slot} dayOfWeek={dayOfWeek} index={index} />
        ))}

        {/* Events layer - positioned on top */}
        {events.map((event) => (
          <EventBlock key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
