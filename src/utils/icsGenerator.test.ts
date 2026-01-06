import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateICS, downloadICS } from './icsGenerator'
import type { ScheduleEvent, User, DayOfWeek } from '@/types'

describe('generateICS', () => {
  const createMockUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-123',
    name: 'Test User',
    calendarName: 'My Test Calendar',
    timezone: 'America/New_York',
    wakeTime: '06:00',
    sleepTime: { weekday: '22:00', weekend: '23:00' },
    scheduleStartDate: '2024-01-01',
    scheduleEndDate: '2024-03-31',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  })

  const createMockEvent = (
    overrides: Partial<ScheduleEvent> = {}
  ): ScheduleEvent => ({
    id: 'event-123',
    userId: 'user-123',
    title: 'Test Event',
    description: 'Test Description',
    daysOfWeek: [1] as DayOfWeek[], // Monday
    startTime: '09:00',
    duration: 1,
    activityType: 'Work From Home',
    recurrence: 'weekly',
    notificationEnabled: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  })

  describe('ICS Format Structure', () => {
    it('generates valid ICS header', () => {
      const user = createMockUser()
      const events: ScheduleEvent[] = []

      const ics = generateICS(events, user)

      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('VERSION:2.0')
      expect(ics).toContain('PRODID:-//Schedule Builder//Multi-User Calendar//EN')
      expect(ics).toContain('CALSCALE:GREGORIAN')
      expect(ics).toContain('METHOD:PUBLISH')
      expect(ics).toContain('END:VCALENDAR')
    })

    it('includes calendar name from user', () => {
      const user = createMockUser({ calendarName: 'My Special Calendar' })
      const events: ScheduleEvent[] = []

      const ics = generateICS(events, user)

      expect(ics).toContain('X-WR-CALNAME:My Special Calendar')
    })

    it('includes timezone information', () => {
      const user = createMockUser({ timezone: 'America/New_York' })
      const events: ScheduleEvent[] = []

      const ics = generateICS(events, user)

      expect(ics).toContain('X-WR-TIMEZONE:America/New_York')
      expect(ics).toContain('BEGIN:VTIMEZONE')
      expect(ics).toContain('TZID:America/New_York')
      expect(ics).toContain('END:VTIMEZONE')
    })
  })

  describe('Event Generation', () => {
    it('generates VEVENT for a single event', () => {
      const user = createMockUser()
      const events = [createMockEvent()]

      const ics = generateICS(events, user)

      expect(ics).toContain('BEGIN:VEVENT')
      expect(ics).toContain('END:VEVENT')
      expect(ics).toContain('SUMMARY:Test Event')
    })

    it('includes event description when provided', () => {
      const user = createMockUser()
      const events = [createMockEvent({ description: 'Important meeting' })]

      const ics = generateICS(events, user)

      expect(ics).toContain('DESCRIPTION:Important meeting')
    })

    it('does not include description when not provided', () => {
      const user = createMockUser()
      const events = [createMockEvent({ description: undefined })]

      const ics = generateICS(events, user)

      // Count occurrences of DESCRIPTION
      const descriptionMatches = ics.match(/DESCRIPTION:/g)
      expect(descriptionMatches).toBeNull()
    })

    it('includes activity type as category', () => {
      const user = createMockUser()
      const events = [createMockEvent({ activityType: 'Cardio' })]

      const ics = generateICS(events, user)

      expect(ics).toContain('CATEGORIES:Cardio')
    })

    it('includes DTSTART and DTEND with timezone', () => {
      const user = createMockUser({ timezone: 'America/New_York' })
      const events = [
        createMockEvent({
          startTime: '09:00',
          duration: 1.5,
        }),
      ]

      const ics = generateICS(events, user)

      expect(ics).toMatch(/DTSTART;TZID=America\/New_York:\d{8}T090000/)
      expect(ics).toMatch(/DTEND;TZID=America\/New_York:\d{8}T103000/)
    })
  })

  describe('Recurrence Rules', () => {
    it('includes weekly RRULE for weekly recurrence', () => {
      const user = createMockUser()
      const events = [
        createMockEvent({
          daysOfWeek: [1] as DayOfWeek[], // Monday
          recurrence: 'weekly',
        }),
      ]

      const ics = generateICS(events, user)

      expect(ics).toMatch(/RRULE:FREQ=WEEKLY;BYDAY=MO/)
    })

    it('includes multiple days in RRULE', () => {
      const user = createMockUser()
      const events = [
        createMockEvent({
          daysOfWeek: [1, 3, 5] as DayOfWeek[], // Mon, Wed, Fri
          recurrence: 'weekly',
        }),
      ]

      const ics = generateICS(events, user)

      // Should have 3 VEVENTs, one for each day
      const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length
      expect(veventCount).toBe(3)
    })

    it('includes UNTIL date in RRULE when recurrenceEndDate is set', () => {
      const user = createMockUser()
      const events = [
        createMockEvent({
          recurrence: 'weekly',
          recurrenceEndDate: '2024-06-30',
        }),
      ]

      const ics = generateICS(events, user)

      expect(ics).toMatch(/UNTIL=20240630T235959Z/)
    })

    it('does not include RRULE in VEVENT for non-recurring events', () => {
      const user = createMockUser()
      const events = [
        createMockEvent({
          recurrence: 'none',
        }),
      ]

      const ics = generateICS(events, user)

      // Extract just the VEVENT section
      const veventMatch = ics.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/)
      expect(veventMatch).not.toBeNull()
      const vevent = veventMatch![0]

      // VEVENT should not contain RRULE (timezone RRULE is ok)
      expect(vevent).not.toContain('RRULE:')
    })

    it('handles monthly recurrence', () => {
      const user = createMockUser()
      const events = [
        createMockEvent({
          daysOfWeek: [2] as DayOfWeek[], // Tuesday
          recurrence: 'monthly',
        }),
      ]

      const ics = generateICS(events, user)

      expect(ics).toMatch(/RRULE:FREQ=MONTHLY;BYDAY=TU/)
    })

    it('handles quarterly recurrence', () => {
      const user = createMockUser()
      const events = [
        createMockEvent({
          daysOfWeek: [5] as DayOfWeek[], // Friday
          recurrence: 'quarterly',
        }),
      ]

      const ics = generateICS(events, user)

      expect(ics).toMatch(/RRULE:FREQ=MONTHLY;INTERVAL=3;BYDAY=FR/)
    })
  })

  describe('Notifications/Alarms', () => {
    it('includes VALARM when notification is enabled', () => {
      const user = createMockUser()
      const events = [createMockEvent({ notificationEnabled: true })]

      const ics = generateICS(events, user)

      expect(ics).toContain('BEGIN:VALARM')
      expect(ics).toContain('TRIGGER:-PT0M')
      expect(ics).toContain('ACTION:DISPLAY')
      expect(ics).toContain('END:VALARM')
    })

    it('does not include VALARM when notification is disabled', () => {
      const user = createMockUser()
      const events = [createMockEvent({ notificationEnabled: false })]

      const ics = generateICS(events, user)

      expect(ics).not.toContain('BEGIN:VALARM')
    })
  })

  describe('Special Character Escaping', () => {
    it('escapes commas in event title', () => {
      const user = createMockUser()
      const events = [createMockEvent({ title: 'Meeting, Important' })]

      const ics = generateICS(events, user)

      expect(ics).toContain('SUMMARY:Meeting\\, Important')
    })

    it('escapes semicolons in event title', () => {
      const user = createMockUser()
      const events = [createMockEvent({ title: 'Step 1; Step 2' })]

      const ics = generateICS(events, user)

      expect(ics).toContain('SUMMARY:Step 1\\; Step 2')
    })

    it('escapes backslashes in event title', () => {
      const user = createMockUser()
      const events = [createMockEvent({ title: 'Path\\Name' })]

      const ics = generateICS(events, user)

      expect(ics).toContain('SUMMARY:Path\\\\Name')
    })

    it('escapes newlines in description', () => {
      const user = createMockUser()
      const events = [
        createMockEvent({ description: 'Line 1\nLine 2' }),
      ]

      const ics = generateICS(events, user)

      expect(ics).toContain('DESCRIPTION:Line 1\\nLine 2')
    })
  })

  describe('Day of Week Mapping', () => {
    it('correctly maps Sunday (0) to SU', () => {
      const user = createMockUser()
      const events = [
        createMockEvent({
          daysOfWeek: [0] as DayOfWeek[],
          recurrence: 'weekly',
        }),
      ]

      const ics = generateICS(events, user)

      expect(ics).toContain('BYDAY=SU')
    })

    it('correctly maps Saturday (6) to SA', () => {
      const user = createMockUser()
      const events = [
        createMockEvent({
          daysOfWeek: [6] as DayOfWeek[],
          recurrence: 'weekly',
        }),
      ]

      const ics = generateICS(events, user)

      expect(ics).toContain('BYDAY=SA')
    })

    it('correctly maps all weekdays', () => {
      const user = createMockUser()
      const dayMappings: [DayOfWeek, string][] = [
        [0, 'SU'],
        [1, 'MO'],
        [2, 'TU'],
        [3, 'WE'],
        [4, 'TH'],
        [5, 'FR'],
        [6, 'SA'],
      ]

      for (const [dayNum, dayCode] of dayMappings) {
        const events = [
          createMockEvent({
            daysOfWeek: [dayNum],
            recurrence: 'weekly',
          }),
        ]

        const ics = generateICS(events, user)

        expect(ics).toContain(`BYDAY=${dayCode}`)
      }
    })
  })

  describe('Edge Cases', () => {
    it('handles empty events array', () => {
      const user = createMockUser()
      const events: ScheduleEvent[] = []

      const ics = generateICS(events, user)

      expect(ics).toContain('BEGIN:VCALENDAR')
      expect(ics).toContain('END:VCALENDAR')
      expect(ics).not.toContain('BEGIN:VEVENT')
    })

    it('handles multiple events', () => {
      const user = createMockUser()
      const events = [
        createMockEvent({ title: 'Event 1', id: 'e1' }),
        createMockEvent({ title: 'Event 2', id: 'e2' }),
        createMockEvent({ title: 'Event 3', id: 'e3' }),
      ]

      const ics = generateICS(events, user)

      const veventCount = (ics.match(/BEGIN:VEVENT/g) || []).length
      expect(veventCount).toBe(3)
    })

    it('skips events that start after schedule end date', () => {
      const user = createMockUser({
        scheduleStartDate: '2024-01-01',
        scheduleEndDate: '2024-01-03', // Very short schedule
      })

      // Event on Friday, but schedule ends Wednesday
      const events = [
        createMockEvent({
          daysOfWeek: [5] as DayOfWeek[], // Friday
          recurrence: 'weekly',
        }),
      ]

      const ics = generateICS(events, user)

      // Should not have any VEVENT since Friday is after end date
      expect(ics).not.toContain('BEGIN:VEVENT')
    })

    it('includes UID for each event', () => {
      const user = createMockUser()
      const events = [createMockEvent()]

      const ics = generateICS(events, user)

      expect(ics).toMatch(/UID:.+@schedulebuilder\.local/)
    })

    it('includes DTSTAMP', () => {
      const user = createMockUser()
      const events = [createMockEvent()]

      const ics = generateICS(events, user)

      expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/)
    })

    it('includes STATUS:CONFIRMED', () => {
      const user = createMockUser()
      const events = [createMockEvent()]

      const ics = generateICS(events, user)

      expect(ics).toContain('STATUS:CONFIRMED')
    })
  })
})

describe('downloadICS', () => {
  beforeEach(() => {
    // Mock DOM APIs
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  it('creates and triggers download link', () => {
    const user: User = {
      id: 'user-123',
      name: 'Test User',
      calendarName: 'My Calendar',
      timezone: 'America/New_York',
      wakeTime: '06:00',
      sleepTime: { weekday: '22:00', weekend: '23:00' },
      scheduleStartDate: '2024-01-01',
      scheduleEndDate: '2024-03-31',
      createdAt: '2024-01-01T00:00:00.000Z',
    }
    const events: ScheduleEvent[] = []

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(mockLink as unknown as HTMLAnchorElement)
    const appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation(() => mockLink as unknown as HTMLAnchorElement)
    const removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation(() => mockLink as unknown as HTMLAnchorElement)

    downloadICS(events, user)

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(mockLink.download).toBe('Test_User_Calendar.ics')
    expect(mockLink.click).toHaveBeenCalled()
    expect(appendChildSpy).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()
  })

  it('replaces spaces in filename with underscores', () => {
    const user: User = {
      id: 'user-123',
      name: 'John Doe Smith',
      calendarName: 'My Calendar',
      timezone: 'America/New_York',
      wakeTime: '06:00',
      sleepTime: { weekday: '22:00', weekend: '23:00' },
      scheduleStartDate: '2024-01-01',
      scheduleEndDate: '2024-03-31',
      createdAt: '2024-01-01T00:00:00.000Z',
    }
    const events: ScheduleEvent[] = []

    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    }
    vi.spyOn(document, 'createElement').mockReturnValue(
      mockLink as unknown as HTMLAnchorElement
    )
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      () => mockLink as unknown as HTMLAnchorElement
    )
    vi.spyOn(document.body, 'removeChild').mockImplementation(
      () => mockLink as unknown as HTMLAnchorElement
    )

    downloadICS(events, user)

    expect(mockLink.download).toBe('John_Doe_Smith_Calendar.ics')
  })
})
