import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { ScheduleProvider, useSchedule } from './ScheduleContext'
import type { ScheduleEvent, CustomActivityType, DayOfWeek } from '@/types'

// Mock localStorage utilities
vi.mock('@/utils/localStorage', () => ({
  loadEvents: vi.fn(() => []),
  saveEvents: vi.fn(),
  loadUser: vi.fn(() => null),
  saveUser: vi.fn(),
  loadCustomActivityTypes: vi.fn(() => []),
  saveCustomActivityTypes: vi.fn(),
  createDefaultUser: vi.fn(() => ({
    id: 'test-user-id',
    name: 'Test User',
    calendarName: 'Test Calendar',
    timezone: 'America/New_York',
    wakeTime: '06:00',
    sleepTime: { weekday: '22:00', weekend: '23:00' },
    scheduleStartDate: '2024-01-01',
    scheduleEndDate: '2024-04-01',
    createdAt: '2024-01-01T00:00:00.000Z',
  })),
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
}))

describe('ScheduleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ScheduleProvider>{children}</ScheduleProvider>
  )

  describe('Initial State', () => {
    it('provides initial empty events array', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })
      expect(result.current.state.events).toEqual([])
    })

    it('provides default user', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })
      expect(result.current.state.user).toBeDefined()
      expect(result.current.state.user.name).toBe('Test User')
    })

    it('has modal closed by default', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })
      expect(result.current.state.isModalOpen).toBe(false)
    })

    it('has no selected event by default', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })
      expect(result.current.state.selectedEvent).toBeNull()
    })

    it('has empty custom activity types by default', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })
      expect(result.current.state.customActivityTypes).toEqual([])
    })
  })

  describe('Event Actions', () => {
    it('addEvent adds a new event with generated id and timestamps', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        daysOfWeek: [1, 3, 5] as DayOfWeek[],
        startTime: '09:00',
        duration: 1.5,
        activityType: 'Work From Home',
        recurrence: 'weekly' as const,
        notificationEnabled: true,
      }

      act(() => {
        result.current.addEvent(eventData)
      })

      expect(result.current.state.events).toHaveLength(1)
      const addedEvent = result.current.state.events[0]
      expect(addedEvent.title).toBe('Test Event')
      expect(addedEvent.id).toBeDefined()
      expect(addedEvent.userId).toBe('test-user-id')
      expect(addedEvent.createdAt).toBeDefined()
      expect(addedEvent.updatedAt).toBeDefined()
    })

    it('updateEvent updates an existing event', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      // First add an event
      act(() => {
        result.current.addEvent({
          title: 'Original Title',
          daysOfWeek: [1] as DayOfWeek[],
          startTime: '09:00',
          duration: 1,
          activityType: 'Work From Home',
          recurrence: 'none',
          notificationEnabled: false,
        })
      })

      const eventId = result.current.state.events[0].id

      // Update the event
      act(() => {
        result.current.updateEvent({
          ...result.current.state.events[0],
          title: 'Updated Title',
        })
      })

      expect(result.current.state.events).toHaveLength(1)
      expect(result.current.state.events[0].title).toBe('Updated Title')
      expect(result.current.state.events[0].id).toBe(eventId)
    })

    it('deleteEvent removes an event by id', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      // Add two events
      act(() => {
        result.current.addEvent({
          title: 'Event 1',
          daysOfWeek: [1] as DayOfWeek[],
          startTime: '09:00',
          duration: 1,
          activityType: 'Work From Home',
          recurrence: 'none',
          notificationEnabled: false,
        })
      })

      act(() => {
        result.current.addEvent({
          title: 'Event 2',
          daysOfWeek: [2] as DayOfWeek[],
          startTime: '10:00',
          duration: 1,
          activityType: 'Study',
          recurrence: 'none',
          notificationEnabled: false,
        })
      })

      const eventToDelete = result.current.state.events[0].id

      act(() => {
        result.current.deleteEvent(eventToDelete)
      })

      expect(result.current.state.events).toHaveLength(1)
      expect(result.current.state.events[0].title).toBe('Event 2')
    })
  })

  describe('Modal Actions', () => {
    it('openCreateModal sets slot data and opens modal', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      act(() => {
        result.current.openCreateModal(1, '09:00')
      })

      expect(result.current.state.isModalOpen).toBe(true)
      expect(result.current.state.creatingEventSlot).toEqual({
        dayOfWeek: 1,
        startTime: '09:00',
      })
      expect(result.current.state.selectedEvent).toBeNull()
    })

    it('openEditModal sets selected event and opens modal', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      // First add an event
      act(() => {
        result.current.addEvent({
          title: 'Test Event',
          daysOfWeek: [1] as DayOfWeek[],
          startTime: '09:00',
          duration: 1,
          activityType: 'Work From Home',
          recurrence: 'none',
          notificationEnabled: false,
        })
      })

      const event = result.current.state.events[0]

      act(() => {
        result.current.openEditModal(event)
      })

      expect(result.current.state.isModalOpen).toBe(true)
      expect(result.current.state.selectedEvent).toEqual(event)
      expect(result.current.state.creatingEventSlot).toBeNull()
    })

    it('closeModal closes modal and clears selection', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      // Open modal first
      act(() => {
        result.current.openCreateModal(1, '09:00')
      })

      expect(result.current.state.isModalOpen).toBe(true)

      act(() => {
        result.current.closeModal()
      })

      expect(result.current.state.isModalOpen).toBe(false)
      expect(result.current.state.selectedEvent).toBeNull()
      expect(result.current.state.creatingEventSlot).toBeNull()
    })
  })

  describe('Activity Type Actions', () => {
    it('addCustomActivityType adds a new custom type', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      const customType: CustomActivityType = {
        name: 'Custom Activity',
        color: '#ff5733',
      }

      act(() => {
        result.current.addCustomActivityType(customType)
      })

      expect(result.current.state.customActivityTypes).toHaveLength(1)
      expect(result.current.state.customActivityTypes[0]).toEqual(customType)
    })

    it('deleteCustomActivityType removes a type by name', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      act(() => {
        result.current.addCustomActivityType({ name: 'Type 1', color: '#111' })
      })
      act(() => {
        result.current.addCustomActivityType({ name: 'Type 2', color: '#222' })
      })

      act(() => {
        result.current.deleteCustomActivityType('Type 1')
      })

      expect(result.current.state.customActivityTypes).toHaveLength(1)
      expect(result.current.state.customActivityTypes[0].name).toBe('Type 2')
    })

    it('openActivityTypeModal opens the activity type modal', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      act(() => {
        result.current.openActivityTypeModal()
      })

      expect(result.current.state.isActivityTypeModalOpen).toBe(true)
    })

    it('closeActivityTypeModal closes the activity type modal', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      act(() => {
        result.current.openActivityTypeModal()
      })

      act(() => {
        result.current.closeActivityTypeModal()
      })

      expect(result.current.state.isActivityTypeModalOpen).toBe(false)
    })
  })

  describe('Getter Functions', () => {
    it('getEventsForDay returns events for specific day', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      // Add events for different days
      act(() => {
        result.current.addEvent({
          title: 'Monday Event',
          daysOfWeek: [1] as DayOfWeek[],
          startTime: '09:00',
          duration: 1,
          activityType: 'Work From Home',
          recurrence: 'none',
          notificationEnabled: false,
        })
      })

      act(() => {
        result.current.addEvent({
          title: 'Tuesday Event',
          daysOfWeek: [2] as DayOfWeek[],
          startTime: '10:00',
          duration: 1,
          activityType: 'Study',
          recurrence: 'none',
          notificationEnabled: false,
        })
      })

      act(() => {
        result.current.addEvent({
          title: 'Monday and Wednesday Event',
          daysOfWeek: [1, 3] as DayOfWeek[],
          startTime: '14:00',
          duration: 2,
          activityType: 'Cardio',
          recurrence: 'none',
          notificationEnabled: false,
        })
      })

      const mondayEvents = result.current.getEventsForDay(1)
      const tuesdayEvents = result.current.getEventsForDay(2)
      const wednesdayEvents = result.current.getEventsForDay(3)
      const sundayEvents = result.current.getEventsForDay(0)

      expect(mondayEvents).toHaveLength(2)
      expect(tuesdayEvents).toHaveLength(1)
      expect(wednesdayEvents).toHaveLength(1)
      expect(sundayEvents).toHaveLength(0)
    })

    it('getAllActivityTypes includes both default and custom types', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      act(() => {
        result.current.addCustomActivityType({
          name: 'Custom Type',
          color: '#123456',
        })
      })

      const allTypes = result.current.getAllActivityTypes()

      // Should include default types
      expect(allTypes['Work From Home']).toBeDefined()
      expect(allTypes['Study']).toBeDefined()

      // Should include custom type
      expect(allTypes['Custom Type']).toBe('#123456')
    })

    it('getActivityColor returns correct color for known types', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      const workColor = result.current.getActivityColor('Work From Home')
      expect(workColor).toBe('#f97316')
    })

    it('getActivityColor returns fallback color for unknown types', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      const unknownColor = result.current.getActivityColor('Unknown Type')
      expect(unknownColor).toBe('#64748b') // Default slate color
    })
  })

  describe('User Actions', () => {
    it('updateUser updates user properties', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      act(() => {
        result.current.updateUser({ name: 'New Name' })
      })

      expect(result.current.state.user.name).toBe('New Name')
      // Other properties should remain unchanged
      expect(result.current.state.user.timezone).toBe('America/New_York')
    })

    it('updateUser can update multiple properties', () => {
      const { result } = renderHook(() => useSchedule(), { wrapper })

      act(() => {
        result.current.updateUser({
          name: 'Updated User',
          calendarName: 'Updated Calendar',
          wakeTime: '07:00',
        })
      })

      expect(result.current.state.user.name).toBe('Updated User')
      expect(result.current.state.user.calendarName).toBe('Updated Calendar')
      expect(result.current.state.user.wakeTime).toBe('07:00')
    })
  })
})

describe('useSchedule hook', () => {
  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useSchedule())
    }).toThrow('useSchedule must be used within a ScheduleProvider')

    consoleSpy.mockRestore()
  })
})
