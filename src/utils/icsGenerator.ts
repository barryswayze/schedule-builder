import { format, nextDay, isAfter } from 'date-fns';
import type { ScheduleEvent, User, DayOfWeek, RecurrenceFrequency } from '@/types';
import { ICS_DAY_CODES } from '@/types';
import { timeToMinutes } from './timeHelpers';

/**
 * Generate a unique ID for ICS events
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@schedulebuilder.local`;
}

/**
 * Format a date and time for ICS format (YYYYMMDDTHHMMSS)
 */
function formatICSDateTime(date: Date, time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const dateStr = format(date, 'yyyyMMdd');
  const timeStr = `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}00`;
  return `${dateStr}T${timeStr}`;
}

/**
 * Format a date for ICS UNTIL format (YYYYMMDDTHHMMSSZ)
 */
function formatICSUntil(date: Date): string {
  return format(date, "yyyyMMdd'T'235959'Z'");
}

/**
 * Calculate the end time given start time and duration
 */
function calculateEndTime(startTime: string, durationHours: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationHours * 60;
  const hours = Math.floor(endMinutes / 60) % 24;
  const minutes = endMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Find the first occurrence date for an event based on day of week
 */
function findFirstOccurrence(startDate: Date, dayOfWeek: DayOfWeek): Date {
  const startDayOfWeek = startDate.getDay();

  if (startDayOfWeek === dayOfWeek) {
    return startDate;
  }

  // nextDay expects 0-6 where 0 is Sunday
  return nextDay(startDate, dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6);
}

/**
 * Escape special characters in ICS text fields
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate VTIMEZONE component for America/New_York
 * (Simplified - for full timezone support, a library would be needed)
 */
function generateTimezone(timezone: string): string {
  // Using America/New_York as default
  return `BEGIN:VTIMEZONE
TZID:${timezone}
X-LIC-LOCATION:${timezone}
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE`;
}

/**
 * Generate RRULE based on recurrence frequency
 */
function generateRRule(
  recurrence: RecurrenceFrequency,
  daysOfWeek: DayOfWeek[],
  untilDate?: Date
): string | null {
  if (recurrence === 'none') {
    return null;
  }

  const dayCodes = daysOfWeek.map(d => ICS_DAY_CODES[d]).join(',');
  let rule = '';

  switch (recurrence) {
    case 'weekly':
      rule = `FREQ=WEEKLY;BYDAY=${dayCodes}`;
      break;
    case 'monthly':
      // Monthly on same day of month
      rule = `FREQ=MONTHLY;BYDAY=${dayCodes}`;
      break;
    case 'quarterly':
      // Every 3 months
      rule = `FREQ=MONTHLY;INTERVAL=3;BYDAY=${dayCodes}`;
      break;
    default:
      return null;
  }

  if (untilDate) {
    rule += `;UNTIL=${formatICSUntil(untilDate)}`;
  }

  return rule;
}

/**
 * Generate a VEVENT for a single event occurrence (one day)
 */
function generateVEvent(
  event: ScheduleEvent,
  dayOfWeek: DayOfWeek,
  firstOccurrence: Date,
  timezone: string
): string {
  const endTime = calculateEndTime(event.startTime, event.duration);
  const dtStart = formatICSDateTime(firstOccurrence, event.startTime);
  const dtEnd = formatICSDateTime(firstOccurrence, endTime);

  const untilDate = event.recurrenceEndDate ? new Date(event.recurrenceEndDate) : undefined;
  const rrule = generateRRule(event.recurrence, [dayOfWeek], untilDate);

  let vevent = `BEGIN:VEVENT
UID:${generateUID()}
DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}
DTSTART;TZID=${timezone}:${dtStart}
DTEND;TZID=${timezone}:${dtEnd}`;

  if (rrule) {
    vevent += `\nRRULE:${rrule}`;
  }

  vevent += `\nSUMMARY:${escapeICSText(event.title)}`;

  if (event.description) {
    vevent += `\nDESCRIPTION:${escapeICSText(event.description)}`;
  }

  // Add category/color hint
  vevent += `\nCATEGORIES:${escapeICSText(event.activityType)}`;

  // Add notification/alarm if enabled
  if (event.notificationEnabled) {
    vevent += `
BEGIN:VALARM
TRIGGER:-PT0M
ACTION:DISPLAY
DESCRIPTION:${escapeICSText(event.title)}
END:VALARM`;
  }

  vevent += `
STATUS:CONFIRMED
END:VEVENT`;

  return vevent;
}

/**
 * Generate complete ICS file content
 */
export function generateICS(events: ScheduleEvent[], user: User): string {
  const startDate = new Date(user.scheduleStartDate);
  const endDate = new Date(user.scheduleEndDate);

  const vevents: string[] = [];

  events.forEach(event => {
    // Create a VEVENT for each day the event occurs on
    event.daysOfWeek.forEach(dayOfWeek => {
      const firstOccurrence = findFirstOccurrence(startDate, dayOfWeek);

      // Skip if first occurrence is after end date
      if (isAfter(firstOccurrence, endDate)) {
        return;
      }

      const vevent = generateVEvent(event, dayOfWeek, firstOccurrence, user.timezone);
      vevents.push(vevent);
    });
  });

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Schedule Builder//Multi-User Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${escapeICSText(user.calendarName)}
X-WR-TIMEZONE:${user.timezone}
${generateTimezone(user.timezone)}
${vevents.join('\n')}
END:VCALENDAR`;

  return icsContent;
}

/**
 * Download ICS file
 */
export function downloadICS(events: ScheduleEvent[], user: User): void {
  const icsContent = generateICS(events, user);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${user.name.replace(/\s+/g, '_')}_Calendar.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
