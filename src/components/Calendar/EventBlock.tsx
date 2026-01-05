import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { ScheduleEvent } from '@/types';
import { formatTimeRange, timeToMinutes } from '@/utils/timeHelpers';
import { useSchedule } from '@/stores/ScheduleContext';

interface EventBlockProps {
  event: ScheduleEvent;
}

const SLOT_HEIGHT = 24; // pixels per 30-min slot

export function EventBlock({ event }: EventBlockProps) {
  const { openEditModal, getActivityColor } = useSchedule();
  const color = getActivityColor(event.activityType);

  // Calculate pixel position based on time
  const startMinutes = timeToMinutes(event.startTime);
  const topPx = (startMinutes / 30) * SLOT_HEIGHT;
  const heightPx = (event.duration * 60 / 30) * SLOT_HEIGHT;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  const style = {
    top: `${topPx}px`,
    height: `${heightPx}px`,
    minHeight: '24px',
    backgroundColor: `${color}20`,
    borderLeft: `3px solid ${color}`,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 10,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't open modal if we just finished dragging
    if (isDragging) return;
    e.stopPropagation();
    openEditModal(event);
  };

  return (
    <div
      ref={setNodeRef}
      className={`absolute left-1 right-1 rounded-md px-2 py-1 cursor-grab overflow-hidden transition-shadow hover:shadow-lg ${
        isDragging ? 'shadow-xl cursor-grabbing' : ''
      }`}
      style={style}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      <div className="text-xs font-medium truncate" style={{ color }}>
        {event.title}
      </div>
      {heightPx > 30 && (
        <div className="text-xs text-gray-500 truncate">
          {formatTimeRange(event.startTime, event.duration)}
        </div>
      )}
    </div>
  );
}
