import type { ScheduleEvent, User, CustomActivityType } from '@/types';

const EVENTS_KEY = 'schedule-builder-events';
const USER_KEY = 'schedule-builder-user';
const CUSTOM_ACTIVITY_TYPES_KEY = 'schedule-builder-custom-activity-types';

/**
 * Save events to localStorage
 */
export function saveEvents(events: ScheduleEvent[]): void {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save events to localStorage:', error);
  }
}

/**
 * Load events from localStorage
 */
export function loadEvents(): ScheduleEvent[] {
  try {
    const data = localStorage.getItem(EVENTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load events from localStorage:', error);
  }
  return [];
}

/**
 * Save user to localStorage
 */
export function saveUser(user: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save user to localStorage:', error);
  }
}

/**
 * Load user from localStorage
 */
export function loadUser(): User | null {
  try {
    const data = localStorage.getItem(USER_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load user from localStorage:', error);
  }
  return null;
}

/**
 * Create default user
 */
export function createDefaultUser(): User {
  const today = new Date();
  const threeMonthsLater = new Date(today);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

  return {
    id: crypto.randomUUID(),
    name: 'Default User',
    calendarName: 'My Schedule',
    timezone: 'America/New_York',
    wakeTime: '06:00',
    sleepTime: {
      weekday: '22:00',
      weekend: '23:00'
    },
    scheduleStartDate: today.toISOString().split('T')[0],
    scheduleEndDate: threeMonthsLater.toISOString().split('T')[0],
    createdAt: today.toISOString()
  };
}

/**
 * Save custom activity types to localStorage
 */
export function saveCustomActivityTypes(types: CustomActivityType[]): void {
  try {
    localStorage.setItem(CUSTOM_ACTIVITY_TYPES_KEY, JSON.stringify(types));
  } catch (error) {
    console.error('Failed to save custom activity types to localStorage:', error);
  }
}

/**
 * Load custom activity types from localStorage
 */
export function loadCustomActivityTypes(): CustomActivityType[] {
  try {
    const data = localStorage.getItem(CUSTOM_ACTIVITY_TYPES_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load custom activity types from localStorage:', error);
  }
  return [];
}

/**
 * Clear all data from localStorage
 */
export function clearAllData(): void {
  localStorage.removeItem(EVENTS_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(CUSTOM_ACTIVITY_TYPES_KEY);
}
