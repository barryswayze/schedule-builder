import { createContext } from 'react';
import type { ScheduleEvent, User, DayOfWeek, CustomActivityType } from '@/types';

// State interface
export interface ScheduleState {
  events: ScheduleEvent[];
  user: User;
  selectedEvent: ScheduleEvent | null;
  isModalOpen: boolean;
  creatingEventSlot: { dayOfWeek: DayOfWeek; startTime: string } | null;
  customActivityTypes: CustomActivityType[];
  isActivityTypeModalOpen: boolean;
}

// Context type
export interface ScheduleContextType {
  state: ScheduleState;
  // Event actions
  addEvent: (eventData: Omit<ScheduleEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  updateEvent: (event: ScheduleEvent) => void;
  deleteEvent: (eventId: string) => void;
  // User actions
  updateUser: (userData: Partial<User>) => void;
  // Modal actions
  openCreateModal: (dayOfWeek: DayOfWeek, startTime: string) => void;
  openEditModal: (event: ScheduleEvent) => void;
  closeModal: () => void;
  // Activity type actions
  addCustomActivityType: (activityType: CustomActivityType) => void;
  deleteCustomActivityType: (name: string) => void;
  openActivityTypeModal: () => void;
  closeActivityTypeModal: () => void;
  // Getters
  getEventsForDay: (dayOfWeek: DayOfWeek) => ScheduleEvent[];
  getAllActivityTypes: () => Record<string, string>;
  getActivityColor: (activityType: string) => string;
}

// Create and export the context
export const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);
