import { describe, it, expect } from 'vitest'
import {
  timeToMinutes,
  minutesToTime,
  calculateEndTime,
  formatTimeDisplay,
  formatTimeRange,
  calculateEventTop,
  calculateEventHeight,
  getSlotIndex,
  getTimeFromSlot,
  roundToNearestSlot,
  DURATION_OPTIONS,
} from './timeHelpers'

describe('timeToMinutes', () => {
  it('converts midnight to 0 minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0)
  })

  it('converts noon to 720 minutes', () => {
    expect(timeToMinutes('12:00')).toBe(720)
  })

  it('converts end of day to 1439 minutes', () => {
    expect(timeToMinutes('23:59')).toBe(1439)
  })

  it('handles times with minutes correctly', () => {
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('14:45')).toBe(885)
  })

  it('handles single digit hours', () => {
    expect(timeToMinutes('05:00')).toBe(300)
  })
})

describe('minutesToTime', () => {
  it('converts 0 minutes to midnight', () => {
    expect(minutesToTime(0)).toBe('00:00')
  })

  it('converts 720 minutes to noon', () => {
    expect(minutesToTime(720)).toBe('12:00')
  })

  it('converts 1439 minutes to 23:59', () => {
    expect(minutesToTime(1439)).toBe('23:59')
  })

  it('handles overflow (wraps around 24 hours)', () => {
    expect(minutesToTime(1440)).toBe('00:00') // 24:00 wraps to 00:00
    expect(minutesToTime(1500)).toBe('01:00') // 25:00 wraps to 01:00
  })

  it('pads single digit hours and minutes', () => {
    expect(minutesToTime(65)).toBe('01:05')
  })
})

describe('calculateEndTime', () => {
  it('calculates end time for 1 hour duration', () => {
    expect(calculateEndTime('09:00', 1)).toBe('10:00')
  })

  it('calculates end time for fractional hours', () => {
    expect(calculateEndTime('09:00', 1.5)).toBe('10:30')
    expect(calculateEndTime('09:00', 0.5)).toBe('09:30')
  })

  it('handles events spanning noon', () => {
    expect(calculateEndTime('11:00', 2)).toBe('13:00')
  })

  it('handles events spanning midnight (wraps)', () => {
    expect(calculateEndTime('23:00', 2)).toBe('01:00')
  })

  it('handles long durations', () => {
    expect(calculateEndTime('08:00', 8)).toBe('16:00')
  })
})

describe('formatTimeDisplay', () => {
  it('formats morning time correctly', () => {
    expect(formatTimeDisplay('09:00')).toBe('9:00 AM')
  })

  it('formats noon correctly', () => {
    expect(formatTimeDisplay('12:00')).toBe('12:00 PM')
  })

  it('formats afternoon time correctly', () => {
    expect(formatTimeDisplay('14:30')).toBe('2:30 PM')
  })

  it('formats midnight correctly', () => {
    expect(formatTimeDisplay('00:00')).toBe('12:00 AM')
  })

  it('formats late night correctly', () => {
    expect(formatTimeDisplay('23:45')).toBe('11:45 PM')
  })
})

describe('formatTimeRange', () => {
  it('formats a simple time range', () => {
    expect(formatTimeRange('09:00', 1)).toBe('9:00 AM - 10:00 AM')
  })

  it('formats a range spanning AM to PM', () => {
    expect(formatTimeRange('11:00', 2)).toBe('11:00 AM - 1:00 PM')
  })

  it('formats a fractional hour range', () => {
    expect(formatTimeRange('14:00', 1.5)).toBe('2:00 PM - 3:30 PM')
  })
})

describe('calculateEventTop', () => {
  it('returns 0 for midnight', () => {
    expect(calculateEventTop('00:00')).toBe(0)
  })

  it('returns 50 for noon', () => {
    expect(calculateEventTop('12:00')).toBe(50)
  })

  it('calculates correct percentage for 6 AM', () => {
    // 6 * 60 = 360 minutes, 360 / 1440 * 100 = 25%
    expect(calculateEventTop('06:00')).toBe(25)
  })

  it('calculates correct percentage for 9:30 AM', () => {
    // 9.5 * 60 = 570 minutes, 570 / 1440 * 100 = 39.583...%
    expect(calculateEventTop('09:30')).toBeCloseTo(39.583, 2)
  })
})

describe('calculateEventHeight', () => {
  it('returns correct percentage for 1 hour', () => {
    // 60 / 1440 * 100 = 4.166...%
    expect(calculateEventHeight(1)).toBeCloseTo(4.166, 2)
  })

  it('returns correct percentage for 30 minutes', () => {
    // 30 / 1440 * 100 = 2.083...%
    expect(calculateEventHeight(0.5)).toBeCloseTo(2.083, 2)
  })

  it('returns correct percentage for 2 hours', () => {
    // 120 / 1440 * 100 = 8.333...%
    expect(calculateEventHeight(2)).toBeCloseTo(8.333, 2)
  })

  it('returns correct percentage for full day', () => {
    expect(calculateEventHeight(24)).toBe(100)
  })
})

describe('getSlotIndex', () => {
  it('returns 0 for midnight', () => {
    expect(getSlotIndex('00:00')).toBe(0)
  })

  it('returns 1 for 00:30', () => {
    expect(getSlotIndex('00:30')).toBe(1)
  })

  it('returns 24 for noon', () => {
    expect(getSlotIndex('12:00')).toBe(24)
  })

  it('returns 47 for 23:30', () => {
    expect(getSlotIndex('23:30')).toBe(47)
  })

  it('handles mid-slot times (floors)', () => {
    expect(getSlotIndex('09:15')).toBe(18) // 9:00 slot
    expect(getSlotIndex('09:45')).toBe(19) // 9:30 slot
  })
})

describe('getTimeFromSlot', () => {
  it('returns midnight for slot 0', () => {
    expect(getTimeFromSlot(0)).toBe('00:00')
  })

  it('returns 00:30 for slot 1', () => {
    expect(getTimeFromSlot(1)).toBe('00:30')
  })

  it('returns noon for slot 24', () => {
    expect(getTimeFromSlot(24)).toBe('12:00')
  })

  it('returns 23:30 for slot 47', () => {
    expect(getTimeFromSlot(47)).toBe('23:30')
  })
})

describe('roundToNearestSlot', () => {
  it('keeps times already on slot boundaries', () => {
    expect(roundToNearestSlot('09:00')).toBe('09:00')
    expect(roundToNearestSlot('09:30')).toBe('09:30')
  })

  it('rounds down for times before the midpoint', () => {
    expect(roundToNearestSlot('09:14')).toBe('09:00')
    expect(roundToNearestSlot('09:44')).toBe('09:30')
  })

  it('rounds up for times at or after the midpoint', () => {
    expect(roundToNearestSlot('09:15')).toBe('09:30')
    expect(roundToNearestSlot('09:45')).toBe('10:00')
  })

  it('handles midnight boundary', () => {
    expect(roundToNearestSlot('00:14')).toBe('00:00')
    expect(roundToNearestSlot('00:15')).toBe('00:30')
  })

  it('handles near-midnight rounding', () => {
    expect(roundToNearestSlot('23:50')).toBe('00:00') // Wraps around
  })
})

describe('DURATION_OPTIONS', () => {
  it('has correct number of options', () => {
    expect(DURATION_OPTIONS).toHaveLength(11)
  })

  it('starts with 30 min option', () => {
    expect(DURATION_OPTIONS[0]).toEqual({ value: 0.5, label: '30 min' })
  })

  it('ends with 8 hours option', () => {
    expect(DURATION_OPTIONS[DURATION_OPTIONS.length - 1]).toEqual({
      value: 8,
      label: '8 hours',
    })
  })

  it('has all values in ascending order', () => {
    for (let i = 1; i < DURATION_OPTIONS.length; i++) {
      expect(DURATION_OPTIONS[i].value).toBeGreaterThan(
        DURATION_OPTIONS[i - 1].value
      )
    }
  })
})
