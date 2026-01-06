import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  saveEvents,
  loadEvents,
  saveUser,
  loadUser,
  createDefaultUser,
  saveCustomActivityTypes,
  loadCustomActivityTypes,
  clearAllData,
} from './localStorage'
import type { ScheduleEvent, User, CustomActivityType, DayOfWeek } from '@/types'

describe('localStorage utilities', () => {
  let mockStorage: Record<string, string>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockStorage = {}
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Mock localStorage
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key]
      }),
      clear: vi.fn(() => {
        mockStorage = {}
      }),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    consoleErrorSpy.mockRestore()
  })

  describe('saveEvents / loadEvents', () => {
    const mockEvent: ScheduleEvent = {
      id: 'event-123',
      userId: 'user-123',
      title: 'Test Event',
      description: 'Test Description',
      daysOfWeek: [1, 3, 5] as DayOfWeek[],
      startTime: '09:00',
      duration: 1.5,
      activityType: 'Work From Home',
      recurrence: 'weekly',
      notificationEnabled: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    }

    it('saves events to localStorage', () => {
      const events = [mockEvent]

      saveEvents(events)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'schedule-builder-events',
        JSON.stringify(events)
      )
    })

    it('loads events from localStorage', () => {
      const events = [mockEvent]
      mockStorage['schedule-builder-events'] = JSON.stringify(events)

      const result = loadEvents()

      expect(result).toEqual(events)
    })

    it('returns empty array when no events exist', () => {
      const result = loadEvents()

      expect(result).toEqual([])
    })

    it('returns empty array on parse error', () => {
      mockStorage['schedule-builder-events'] = 'invalid json {'

      const result = loadEvents()

      expect(result).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('logs error when save fails', () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      saveEvents([mockEvent])

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save events to localStorage:',
        expect.any(Error)
      )
    })

    it('handles multiple events', () => {
      const events: ScheduleEvent[] = [
        mockEvent,
        { ...mockEvent, id: 'event-456', title: 'Another Event' },
      ]

      saveEvents(events)
      mockStorage['schedule-builder-events'] = JSON.stringify(events)
      const result = loadEvents()

      expect(result).toHaveLength(2)
      expect(result[1].title).toBe('Another Event')
    })
  })

  describe('saveUser / loadUser', () => {
    const mockUser: User = {
      id: 'user-123',
      name: 'Test User',
      calendarName: 'My Calendar',
      timezone: 'America/New_York',
      wakeTime: '06:00',
      sleepTime: { weekday: '22:00', weekend: '23:00' },
      scheduleStartDate: '2024-01-01',
      scheduleEndDate: '2024-04-01',
      createdAt: '2024-01-01T00:00:00.000Z',
    }

    it('saves user to localStorage', () => {
      saveUser(mockUser)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'schedule-builder-user',
        JSON.stringify(mockUser)
      )
    })

    it('loads user from localStorage', () => {
      mockStorage['schedule-builder-user'] = JSON.stringify(mockUser)

      const result = loadUser()

      expect(result).toEqual(mockUser)
    })

    it('returns null when no user exists', () => {
      const result = loadUser()

      expect(result).toBeNull()
    })

    it('returns null on parse error', () => {
      mockStorage['schedule-builder-user'] = 'invalid json'

      const result = loadUser()

      expect(result).toBeNull()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('logs error when save fails', () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      saveUser(mockUser)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save user to localStorage:',
        expect.any(Error)
      )
    })
  })

  describe('createDefaultUser', () => {
    it('creates user with required fields', () => {
      const user = createDefaultUser()

      expect(user.id).toBeDefined()
      expect(user.name).toBe('Default User')
      expect(user.calendarName).toBe('My Schedule')
      expect(user.timezone).toBe('America/New_York')
    })

    it('sets default wake time', () => {
      const user = createDefaultUser()

      expect(user.wakeTime).toBe('06:00')
    })

    it('sets different weekday and weekend sleep times', () => {
      const user = createDefaultUser()

      expect(user.sleepTime.weekday).toBe('22:00')
      expect(user.sleepTime.weekend).toBe('23:00')
    })

    it('sets schedule start date to today', () => {
      const user = createDefaultUser()
      const today = new Date().toISOString().split('T')[0]

      expect(user.scheduleStartDate).toBe(today)
    })

    it('sets schedule end date to 3 months from now', () => {
      const user = createDefaultUser()
      const today = new Date()
      const threeMonthsLater = new Date(today)
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)
      const expectedEndDate = threeMonthsLater.toISOString().split('T')[0]

      expect(user.scheduleEndDate).toBe(expectedEndDate)
    })

    it('sets createdAt timestamp', () => {
      const before = new Date().toISOString()
      const user = createDefaultUser()
      const after = new Date().toISOString()

      expect(user.createdAt >= before).toBe(true)
      expect(user.createdAt <= after).toBe(true)
    })

    it('generates unique IDs for each call', () => {
      const user1 = createDefaultUser()
      const user2 = createDefaultUser()

      expect(user1.id).not.toBe(user2.id)
    })
  })

  describe('saveCustomActivityTypes / loadCustomActivityTypes', () => {
    const mockTypes: CustomActivityType[] = [
      { name: 'Custom Type 1', color: '#ff5733' },
      { name: 'Custom Type 2', color: '#3357ff' },
    ]

    it('saves custom activity types to localStorage', () => {
      saveCustomActivityTypes(mockTypes)

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'schedule-builder-custom-activity-types',
        JSON.stringify(mockTypes)
      )
    })

    it('loads custom activity types from localStorage', () => {
      mockStorage['schedule-builder-custom-activity-types'] =
        JSON.stringify(mockTypes)

      const result = loadCustomActivityTypes()

      expect(result).toEqual(mockTypes)
    })

    it('returns empty array when no custom types exist', () => {
      const result = loadCustomActivityTypes()

      expect(result).toEqual([])
    })

    it('returns empty array on parse error', () => {
      mockStorage['schedule-builder-custom-activity-types'] = 'invalid json'

      const result = loadCustomActivityTypes()

      expect(result).toEqual([])
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('logs error when save fails', () => {
      vi.mocked(localStorage.setItem).mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      saveCustomActivityTypes(mockTypes)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save custom activity types to localStorage:',
        expect.any(Error)
      )
    })
  })

  describe('clearAllData', () => {
    it('removes all app data from localStorage', () => {
      clearAllData()

      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'schedule-builder-events'
      )
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'schedule-builder-user'
      )
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        'schedule-builder-custom-activity-types'
      )
    })

    it('removes exactly 3 items', () => {
      clearAllData()

      expect(localStorage.removeItem).toHaveBeenCalledTimes(3)
    })
  })

  describe('round-trip serialization', () => {
    it('preserves event data through save/load cycle', () => {
      const originalEvent: ScheduleEvent = {
        id: 'test-id',
        userId: 'user-id',
        title: 'Test Title',
        description: 'Test Description',
        daysOfWeek: [0, 2, 4] as DayOfWeek[],
        startTime: '10:30',
        duration: 2.5,
        activityType: 'Study',
        recurrence: 'monthly',
        recurrenceEndDate: '2024-12-31',
        notificationEnabled: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-20T14:45:00.000Z',
      }

      saveEvents([originalEvent])
      // Simulate loading from the same storage
      mockStorage['schedule-builder-events'] = JSON.stringify([originalEvent])
      const loaded = loadEvents()

      expect(loaded[0]).toEqual(originalEvent)
    })

    it('preserves user data through save/load cycle', () => {
      const originalUser: User = {
        id: 'user-test',
        name: 'John Doe',
        calendarName: 'Work Schedule',
        timezone: 'Europe/London',
        wakeTime: '07:30',
        sleepTime: { weekday: '23:00', weekend: '00:30' },
        scheduleStartDate: '2024-02-01',
        scheduleEndDate: '2024-08-01',
        createdAt: '2024-01-01T00:00:00.000Z',
      }

      saveUser(originalUser)
      mockStorage['schedule-builder-user'] = JSON.stringify(originalUser)
      const loaded = loadUser()

      expect(loaded).toEqual(originalUser)
    })
  })
})
