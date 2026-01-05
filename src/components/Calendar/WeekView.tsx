import { useEffect, useRef } from 'react';
import { useSchedule } from '@/stores/ScheduleContext';
import type { DayOfWeek, ScheduleEvent } from '@/types';
import { DAYS_OF_WEEK, generateTimeSlots } from '@/types';
import { timeToMinutes } from '@/utils/timeHelpers';

const timeSlots = generateTimeSlots();
const hours = Array.from({ length: 24 }, (_, i) => i);

export function WeekView() {
  const days: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
  const { getActivityColor, openCreateModal, openEditModal, getEventsForDay } = useSchedule();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to 5 AM on mount
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const doScroll = () => {
      // 5 AM = 5 hours * 48px per hour = 240px
      el.scrollTop = 240;
      console.log('Scrolling to 240px, current scrollTop:', el.scrollTop, 'scrollHeight:', el.scrollHeight, 'clientHeight:', el.clientHeight);
    };

    // Try immediately and after delays
    doScroll();
    const timers = [50, 100, 300, 1000].map(ms => setTimeout(doScroll, ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      ref={scrollContainerRef}
      className="bg-white rounded-lg shadow border border-gray-200"
      style={{
        height: '100%',
        overflow: 'auto',
      }}
    >
      {/* Header row */}
      <div
        className="sticky top-0 z-20 bg-gray-50 border-b border-gray-200"
        style={{
          display: 'flex',
        }}
      >
        <div style={{ width: '50px', height: '40px', borderRight: '1px solid #e5e7eb', flexShrink: 0 }} />
        {days.map((day) => (
          <div
            key={day}
            style={{
              flex: 1,
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: day < 6 ? '1px solid #e5e7eb' : 'none',
            }}
          >
            <span className="text-sm font-semibold text-gray-700">{DAYS_OF_WEEK[day].slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Body - 24 hours * 48px = 1152px total height */}
      <div style={{ display: 'flex', height: '1152px' }}>
        {/* Time labels column */}
        <div style={{ width: '50px', flexShrink: 0, borderRight: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          {hours.map((hour) => (
            <div
              key={hour}
              style={{ height: '48px', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '4px', fontSize: '11px', color: '#6b7280' }}
            >
              <span style={{ marginTop: '-8px' }}>
                {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => (
          <DayColumn
            key={day}
            day={day}
            events={getEventsForDay(day)}
            onSlotClick={(time) => openCreateModal(day, time)}
            onEventClick={openEditModal}
            getActivityColor={getActivityColor}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  day,
  events,
  onSlotClick,
  onEventClick,
  getActivityColor,
}: {
  day: DayOfWeek;
  events: ScheduleEvent[];
  onSlotClick: (time: string) => void;
  onEventClick: (event: ScheduleEvent) => void;
  getActivityColor: (type: string) => string;
}) {
  const getEventAtSlot = (slotTime: string) => {
    return events.find((event) => {
      const eventStart = timeToMinutes(event.startTime);
      const eventEnd = eventStart + event.duration * 60;
      const slotMinutes = timeToMinutes(slotTime);
      return slotMinutes >= eventStart && slotMinutes < eventEnd;
    });
  };

  // 48 slots * 24px = 1152px total height
  return (
    <div
      style={{
        flex: 1,
        borderRight: day < 6 ? '1px solid #e5e7eb' : 'none',
        userSelect: 'none',
        height: '1152px',
      }}
    >
      {timeSlots.map((slot) => {
        const eventAtSlot = getEventAtSlot(slot.time);
        const isEventStart = eventAtSlot && eventAtSlot.startTime === slot.time;

        return (
          <div
            key={slot.time}
            onClick={() => {
              if (!eventAtSlot) {
                onSlotClick(slot.time);
              } else if (isEventStart) {
                onEventClick(eventAtSlot);
              }
            }}
            style={{
              height: '24px',
              borderBottom: slot.minute === 0 ? '1px solid #e5e7eb' : '1px solid #f3f4f6',
              backgroundColor: isEventStart ? `${getActivityColor(eventAtSlot.activityType)}30` :
                              eventAtSlot ? `${getActivityColor(eventAtSlot.activityType)}18` : 'transparent',
              borderLeft: isEventStart ? `3px solid ${getActivityColor(eventAtSlot.activityType)}` : 'none',
              cursor: 'pointer',
              paddingLeft: eventAtSlot ? '4px' : '0',
            }}
            onMouseEnter={(e) => {
              if (!eventAtSlot) e.currentTarget.style.backgroundColor = '#dbeafe';
            }}
            onMouseLeave={(e) => {
              if (!eventAtSlot) e.currentTarget.style.backgroundColor = 'transparent';
              else if (isEventStart) e.currentTarget.style.backgroundColor = `${getActivityColor(eventAtSlot.activityType)}30`;
              else e.currentTarget.style.backgroundColor = `${getActivityColor(eventAtSlot.activityType)}18`;
            }}
          >
            {isEventStart && (
              <span style={{ fontSize: '10px', fontWeight: 500, color: getActivityColor(eventAtSlot.activityType) }}>
                {eventAtSlot.title}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
