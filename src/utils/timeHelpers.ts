import { format, parse } from 'date-fns';

/**
 * Convert "HH:MM" string to total minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert total minutes to "HH:MM" string
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calculate end time given start time and duration in hours
 */
export function calculateEndTime(startTime: string, durationHours: number): string {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationHours * 60;
  return minutesToTime(endMinutes);
}

/**
 * Format time for display (e.g., "9:00 AM")
 */
export function formatTimeDisplay(time: string): string {
  const date = parse(time, 'HH:mm', new Date());
  return format(date, 'h:mm a');
}

/**
 * Format time range for display (e.g., "9:00 AM - 10:30 AM")
 */
export function formatTimeRange(startTime: string, durationHours: number): string {
  const endTime = calculateEndTime(startTime, durationHours);
  return `${formatTimeDisplay(startTime)} - ${formatTimeDisplay(endTime)}`;
}

/**
 * Calculate the top position percentage for an event based on start time
 * Each hour = 60 units, so 24 hours = 1440 total units
 */
export function calculateEventTop(startTime: string): number {
  const minutes = timeToMinutes(startTime);
  return (minutes / 1440) * 100;
}

/**
 * Calculate the height percentage for an event based on duration
 */
export function calculateEventHeight(durationHours: number): number {
  const durationMinutes = durationHours * 60;
  return (durationMinutes / 1440) * 100;
}

/**
 * Get the slot index (0-47) for a given time
 * Each slot is 30 minutes
 */
export function getSlotIndex(time: string): number {
  const minutes = timeToMinutes(time);
  return Math.floor(minutes / 30);
}

/**
 * Get time from slot index
 */
export function getTimeFromSlot(slotIndex: number): string {
  const totalMinutes = slotIndex * 30;
  return minutesToTime(totalMinutes);
}

/**
 * Round time to nearest 30 minutes
 */
export function roundToNearestSlot(time: string): string {
  const minutes = timeToMinutes(time);
  const rounded = Math.round(minutes / 30) * 30;
  return minutesToTime(rounded);
}

/**
 * Duration options for the event form (in hours)
 */
export const DURATION_OPTIONS = [
  { value: 0.5, label: '30 min' },
  { value: 1, label: '1 hour' },
  { value: 1.5, label: '1.5 hours' },
  { value: 2, label: '2 hours' },
  { value: 2.5, label: '2.5 hours' },
  { value: 3, label: '3 hours' },
  { value: 4, label: '4 hours' },
  { value: 5, label: '5 hours' },
  { value: 6, label: '6 hours' },
  { value: 7, label: '7 hours' },
  { value: 8, label: '8 hours' },
];
