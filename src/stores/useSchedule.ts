import { useContext } from 'react';
import { ScheduleContext, type ScheduleContextType } from './scheduleContextDef';

// Hook to use the schedule context
export function useSchedule(): ScheduleContextType {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}
