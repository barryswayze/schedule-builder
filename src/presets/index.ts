/**
 * Schedule Presets
 *
 * Pre-built weekly schedule templates that can be loaded into the app.
 * Each preset contains events matching the ScheduleEvent interface.
 */

import monasticSchedule from './monastic-schedule.json';

export interface SchedulePreset {
  name: string;
  description: string;
  source?: string;
  targetDate?: string;
  events: Array<{
    id: string;
    title: string;
    description?: string;
    daysOfWeek: number[];
    startTime: string;
    duration: number;
    activityType: string;
    recurrence: string;
    notificationEnabled: boolean;
  }>;
  weeklyTotals?: Record<string, string>;
}

export const presets: Record<string, SchedulePreset> = {
  monastic: monasticSchedule as SchedulePreset,
};

export default presets;
