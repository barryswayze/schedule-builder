import { useReducer, useEffect, useMemo, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ScheduleEvent, User, DayOfWeek, CustomActivityType } from '@/types';
import { DEFAULT_ACTIVITY_TYPES } from '@/types';
import {
  saveEvents,
  loadEvents,
  saveUser,
  loadUser,
  createDefaultUser,
  saveCustomActivityTypes,
  loadCustomActivityTypes,
} from '@/utils/localStorage';
import { ScheduleContext, type ScheduleState } from './scheduleContextDef';

// Action types
type Action =
  | { type: 'SET_EVENTS'; events: ScheduleEvent[] }
  | { type: 'ADD_EVENT'; event: ScheduleEvent }
  | { type: 'UPDATE_EVENT'; event: ScheduleEvent }
  | { type: 'DELETE_EVENT'; eventId: string }
  | { type: 'SET_USER'; user: User }
  | { type: 'UPDATE_USER'; user: Partial<User> }
  | { type: 'SET_SELECTED_EVENT'; event: ScheduleEvent | null }
  | { type: 'SET_MODAL_OPEN'; isOpen: boolean }
  | { type: 'SET_CREATING_EVENT'; slotData: { dayOfWeek: DayOfWeek; startTime: string } | null }
  | { type: 'SET_CUSTOM_ACTIVITY_TYPES'; types: CustomActivityType[] }
  | { type: 'ADD_CUSTOM_ACTIVITY_TYPE'; activityType: CustomActivityType }
  | { type: 'DELETE_CUSTOM_ACTIVITY_TYPE'; name: string }
  | { type: 'SET_ACTIVITY_TYPE_MODAL_OPEN'; isOpen: boolean };

// Initial state
const initialState: ScheduleState = {
  events: [],
  user: createDefaultUser(),
  selectedEvent: null,
  isModalOpen: false,
  creatingEventSlot: null,
  customActivityTypes: [],
  isActivityTypeModalOpen: false,
};

// Reducer
function scheduleReducer(state: ScheduleState, action: Action): ScheduleState {
  switch (action.type) {
    case 'SET_EVENTS':
      return { ...state, events: action.events };
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.event] };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => (e.id === action.event.id ? action.event : e)),
      };
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter(e => e.id !== action.eventId),
      };
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.user } };
    case 'SET_SELECTED_EVENT':
      return { ...state, selectedEvent: action.event };
    case 'SET_MODAL_OPEN':
      return { ...state, isModalOpen: action.isOpen };
    case 'SET_CREATING_EVENT':
      return { ...state, creatingEventSlot: action.slotData };
    case 'SET_CUSTOM_ACTIVITY_TYPES':
      return { ...state, customActivityTypes: action.types };
    case 'ADD_CUSTOM_ACTIVITY_TYPE':
      return {
        ...state,
        customActivityTypes: [...state.customActivityTypes, action.activityType],
      };
    case 'DELETE_CUSTOM_ACTIVITY_TYPE':
      return {
        ...state,
        customActivityTypes: state.customActivityTypes.filter(t => t.name !== action.name),
      };
    case 'SET_ACTIVITY_TYPE_MODAL_OPEN':
      return { ...state, isActivityTypeModalOpen: action.isOpen };
    default:
      return state;
  }
}

// Provider component - only component export from this file
export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(scheduleReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedEvents = loadEvents();
    const savedUser = loadUser();
    const savedCustomTypes = loadCustomActivityTypes();

    if (savedEvents.length > 0) {
      dispatch({ type: 'SET_EVENTS', events: savedEvents });
    }

    if (savedUser) {
      dispatch({ type: 'SET_USER', user: savedUser });
    }

    if (savedCustomTypes.length > 0) {
      dispatch({ type: 'SET_CUSTOM_ACTIVITY_TYPES', types: savedCustomTypes });
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    saveEvents(state.events);
  }, [state.events]);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    saveUser(state.user);
  }, [state.user]);

  // Save custom activity types to localStorage whenever they change
  useEffect(() => {
    saveCustomActivityTypes(state.customActivityTypes);
  }, [state.customActivityTypes]);

  // Memoized combined activity types
  const allActivityTypes = useMemo(() => {
    const combined: Record<string, string> = { ...DEFAULT_ACTIVITY_TYPES };
    state.customActivityTypes.forEach(t => {
      combined[t.name] = t.color;
    });
    return combined;
  }, [state.customActivityTypes]);

  // Actions
  const addEvent = (eventData: Omit<ScheduleEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newEvent: ScheduleEvent = {
      ...eventData,
      id: uuidv4(),
      userId: state.user.id,
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_EVENT', event: newEvent });
  };

  const updateEvent = (event: ScheduleEvent) => {
    const updatedEvent = {
      ...event,
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'UPDATE_EVENT', event: updatedEvent });
  };

  const deleteEvent = (eventId: string) => {
    dispatch({ type: 'DELETE_EVENT', eventId });
  };

  const updateUser = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', user: userData });
  };

  const openCreateModal = (dayOfWeek: DayOfWeek, startTime: string) => {
    dispatch({ type: 'SET_SELECTED_EVENT', event: null });
    dispatch({ type: 'SET_CREATING_EVENT', slotData: { dayOfWeek, startTime } });
    dispatch({ type: 'SET_MODAL_OPEN', isOpen: true });
  };

  const openEditModal = (event: ScheduleEvent) => {
    dispatch({ type: 'SET_CREATING_EVENT', slotData: null });
    dispatch({ type: 'SET_SELECTED_EVENT', event });
    dispatch({ type: 'SET_MODAL_OPEN', isOpen: true });
  };

  const closeModal = () => {
    dispatch({ type: 'SET_MODAL_OPEN', isOpen: false });
    dispatch({ type: 'SET_SELECTED_EVENT', event: null });
    dispatch({ type: 'SET_CREATING_EVENT', slotData: null });
  };

  const addCustomActivityType = (activityType: CustomActivityType) => {
    dispatch({ type: 'ADD_CUSTOM_ACTIVITY_TYPE', activityType });
  };

  const deleteCustomActivityType = (name: string) => {
    dispatch({ type: 'DELETE_CUSTOM_ACTIVITY_TYPE', name });
  };

  const openActivityTypeModal = () => {
    dispatch({ type: 'SET_ACTIVITY_TYPE_MODAL_OPEN', isOpen: true });
  };

  const closeActivityTypeModal = () => {
    dispatch({ type: 'SET_ACTIVITY_TYPE_MODAL_OPEN', isOpen: false });
  };

  const getEventsForDay = (dayOfWeek: DayOfWeek): ScheduleEvent[] => {
    return state.events.filter(e => e.daysOfWeek.includes(dayOfWeek));
  };

  const getAllActivityTypes = (): Record<string, string> => {
    return allActivityTypes;
  };

  const getActivityColor = (activityType: string): string => {
    return allActivityTypes[activityType] || '#64748b';
  };

  const contextValue = {
    state,
    addEvent,
    updateEvent,
    deleteEvent,
    updateUser,
    openCreateModal,
    openEditModal,
    closeModal,
    addCustomActivityType,
    deleteCustomActivityType,
    openActivityTypeModal,
    closeActivityTypeModal,
    getEventsForDay,
    getAllActivityTypes,
    getActivityColor,
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
}
