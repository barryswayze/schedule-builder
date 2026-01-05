// Default activity types with colors
export const DEFAULT_ACTIVITY_TYPES: Record<string, string> = {
  'Solo Weights': '#3b82f6',
  'Weights w/ Partner': '#db2777',
  'Dog Time': '#14b8a6',
  'Cardio': '#ef4444',
  'Prayer/Liturgy': '#8b5cf6',
  'Study': '#10b981',
  'Work From Home': '#f97316',
  'Office Work': '#64748b',
  'Desk Breaks': '#f59e0b',
  'Sauna': '#ec4899',
  'Sleep': '#1e293b',
  'Meals': '#16a34a',
  'Free Time': '#d1d5db'
};

// Custom activity type definition
export interface CustomActivityType {
  name: string;
  color: string;
}

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
] as const;

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RecurrenceFrequency = 'weekly' | 'monthly' | 'quarterly' | 'none';

export interface ScheduleEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  daysOfWeek: DayOfWeek[]; // Multiple days supported
  startTime: string; // "HH:MM" format
  duration: number; // in hours (e.g., 1.5 for 90 minutes)
  activityType: string; // Now a string to support custom types
  recurrence: RecurrenceFrequency;
  recurrenceEndDate?: string; // ISO date string for "Until" date
  notificationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  calendarName: string;
  timezone: string;
  wakeTime: string; // "HH:MM"
  sleepTime: {
    weekday: string;
    weekend: string;
  };
  scheduleStartDate: string; // ISO date string
  scheduleEndDate: string; // ISO date string
  createdAt: string;
}

export interface TimeSlot {
  time: string; // "HH:MM"
  hour: number;
  minute: number;
}

// Helper to generate time slots for the day
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push({ time, hour, minute });
    }
  }
  return slots;
}

// ICS day codes
export const ICS_DAY_CODES: Record<DayOfWeek, string> = {
  0: 'SU',
  1: 'MO',
  2: 'TU',
  3: 'WE',
  4: 'TH',
  5: 'FR',
  6: 'SA'
};

// Preset colors for custom activity types
export const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#64748b', // Slate
  '#78716c', // Stone
  '#1e293b', // Dark
];
