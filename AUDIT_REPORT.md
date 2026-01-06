# Schedule Builder - Product Audit Report

**Date:** January 6, 2026
**Auditor:** Claude Code
**Branch:** `claude/audit-product-bpMId`

---

## Executive Summary

The Schedule Builder is a well-structured React application for weekly schedule management with calendar export capabilities. The codebase demonstrates good architectural patterns but has several areas requiring attention across security, performance, accessibility, and code quality.

| Category | Rating | Issues Found |
|----------|--------|--------------|
| **Security** | ⚠️ Medium | 4 issues |
| **Performance** | ⚠️ Medium | 5 issues |
| **Accessibility** | 🔴 Needs Work | 6 issues |
| **Code Quality** | ✅ Good | 3 minor issues |
| **Build/Dependencies** | ✅ Good | 1 minor issue |

---

## 1. Security Issues

### 1.1 No Input Validation on localStorage Data (Medium)
**Location:** `src/utils/localStorage.ts:21-31`, `src/utils/localStorage.ts:47-57`

**Issue:** Data loaded from localStorage is parsed with `JSON.parse()` without validation. Malformed or tampered data could cause runtime errors or unexpected behavior.

```typescript
// Current implementation
export function loadEvents(): ScheduleEvent[] {
  try {
    const data = localStorage.getItem(EVENTS_KEY);
    if (data) {
      return JSON.parse(data); // No schema validation
    }
  } catch (error) {
    console.error('Failed to load events from localStorage:', error);
  }
  return [];
}
```

**Recommendation:** Add schema validation using a library like Zod or implement manual type guards.

---

### 1.2 Potential XSS in ICS Download Filename (Low)
**Location:** `src/utils/icsGenerator.ts:230`

**Issue:** User name is used directly in filename with only space replacement.

```typescript
link.download = `${user.name.replace(/\s+/g, '_')}_Calendar.ics`;
```

**Recommendation:** Sanitize filename more thoroughly to remove special characters.

---

### 1.3 No CSRF/Origin Validation for localStorage (Low)
**Location:** `src/utils/localStorage.ts`

**Issue:** While localStorage is origin-bound by browsers, there's no additional integrity checking for stored data.

**Recommendation:** Consider adding checksums for data integrity verification.

---

### 1.4 Console Logging in Production (Low)
**Location:** `src/components/Calendar/WeekView.tsx:23`

**Issue:** Debug `console.log` statement left in production code.

```typescript
console.log('Scrolling to 240px, current scrollTop:', el.scrollTop, ...);
```

**Recommendation:** Remove debug logs or use a proper logging library with environment-based filtering.

---

## 2. Performance Issues

### 2.1 Inefficient Event Filtering on Every Render (Medium)
**Location:** `src/stores/ScheduleContext.tsx:199-201`

**Issue:** `getEventsForDay()` creates a new filtered array on every call without memoization.

```typescript
const getEventsForDay = (dayOfWeek: DayOfWeek): ScheduleEvent[] => {
  return state.events.filter(e => e.daysOfWeek.includes(dayOfWeek));
};
```

**Recommendation:** Memoize per-day event lists or use `useMemo` in consuming components.

---

### 2.2 Unnecessary Re-renders in DayColumn (Medium)
**Location:** `src/components/Calendar/WeekView.tsx:98-172`

**Issue:** `DayColumn` component receives new function references on each parent render due to inline `onSlotClick` and `onEventClick` callbacks.

```typescript
<DayColumn
  key={day}
  events={getEventsForDay(day)}
  onSlotClick={(time) => openCreateModal(day, time)} // New function each render
  onEventClick={openEditModal}
  getActivityColor={getActivityColor}
/>
```

**Recommendation:** Wrap callbacks with `useCallback` or pass stable references.

---

### 2.3 Multiple Auto-Scroll Timeout Attempts (Low)
**Location:** `src/components/Calendar/WeekView.tsx:27-29`

**Issue:** Uses brute-force approach with multiple timeouts (50ms, 100ms, 300ms, 1000ms) for auto-scroll.

```typescript
const timers = [50, 100, 300, 1000].map(ms => setTimeout(doScroll, ms));
```

**Recommendation:** Use a single `requestAnimationFrame` or `useLayoutEffect` for more reliable scroll timing.

---

### 2.4 Large Bundle Size (Low)
**Location:** Build output

**Issue:** Bundle is 357KB (114KB gzipped) which is moderate but could be optimized.

```
dist/assets/index-CYihIYdJ.js   356.88 kB │ gzip: 113.67 kB
```

**Recommendation:** Consider code splitting, lazy loading modals, and analyzing bundle with `vite-bundle-analyzer`.

---

### 2.5 No Virtual Scrolling for Time Slots (Low)
**Location:** `src/components/Calendar/WeekView.tsx:130-169`

**Issue:** Renders all 48 time slots per day (336 total elements) regardless of viewport.

**Recommendation:** Implement virtual scrolling for better performance with many events.

---

## 3. Accessibility Issues

### 3.1 Missing ARIA Labels on Interactive Elements (High)
**Location:** Multiple components

**Issues:**
- Time slots have no accessible name: `src/components/Calendar/WeekView.tsx:134-168`
- Day selector buttons lack proper labels: `src/components/Events/EventModal.tsx:235-256`
- Delete button uses just "x": `src/components/Layout/Sidebar.tsx:62-69`

**Recommendation:** Add `aria-label` attributes describing the action (e.g., "Select Monday", "Delete activity type").

---

### 3.2 Day Selector Not Keyboard Accessible (High)
**Location:** `src/components/Events/EventModal.tsx:235-256`

**Issue:** Day selector uses `<div>` with `onClick` instead of proper buttons.

```typescript
<div
  key={index}
  onClick={(e) => { e.preventDefault(); toggleDay(index as DayOfWeek); }}
  // No role, tabIndex, or keyboard handlers
>
```

**Recommendation:** Use `<button>` elements or add `role="button"`, `tabIndex={0}`, and keyboard event handlers.

---

### 3.3 Color-Only Information Conveying (Medium)
**Location:** `src/components/Layout/Sidebar.tsx`, calendar views

**Issue:** Activity types are distinguished primarily by color without alternative indicators for colorblind users.

**Recommendation:** Add patterns, icons, or text labels alongside colors.

---

### 3.4 Missing Focus Management in Modals (Medium)
**Location:** `src/components/Events/EventModal.tsx`

**Issue:** While using Radix Dialog (which handles focus trapping), focus return and initial focus could be more predictable.

**Recommendation:** Explicitly set `autoFocus` on the first interactive element.

---

### 3.5 Time Inputs Lack Screen Reader Context (Medium)
**Location:** `src/components/Events/EventModal.tsx:262-268`

**Issue:** Time input lacks `aria-describedby` for format hints.

**Recommendation:** Add description like "Format: HH:MM (24-hour)".

---

### 3.6 No Skip Navigation Link (Low)
**Location:** `src/App.tsx`

**Issue:** No skip link to bypass sidebar and header for keyboard users.

**Recommendation:** Add "Skip to main content" link at the top.

---

## 4. Code Quality Issues

### 4.1 Form State Not Reset Properly (Medium)
**Location:** `src/components/Events/EventModal.tsx:102-112`

**Issue:** Form state is initialized with `useMemo` but individual `useState` hooks don't update when `initialFormState` changes. The `key` prop workaround on Dialog works but is non-standard.

```typescript
const [title, setTitle] = useState(initialFormState.title);
// These don't update when initialFormState changes
```

**Recommendation:** Use a single `useReducer` for form state or `useEffect` to sync state.

---

### 4.2 EventBlock Component Not Used (Low)
**Location:** `src/components/Calendar/EventBlock.tsx`

**Issue:** `EventBlock.tsx` exists with drag-and-drop functionality but isn't used in `WeekView.tsx`. The inline event rendering in `WeekView` duplicates some logic.

**Recommendation:** Either integrate `EventBlock` or remove the unused file.

---

### 4.3 Type Safety Gap in Activity Type Handling (Low)
**Location:** `src/types/index.ts:46`

**Issue:** `activityType` is typed as `string` which loses type safety.

```typescript
activityType: string; // Now a string to support custom types
```

**Recommendation:** Consider a union type or branded string type for better type safety.

---

## 5. Build & Dependency Issues

### 5.1 React Version Mismatch (Low)
**Location:** `package.json:23-24`

**Issue:** Using React 19.2.0 which is a pre-release/experimental version. Most ecosystem packages may not fully support it.

```json
"react": "^19.2.0",
"react-dom": "^19.2.0",
```

**Recommendation:** Pin to stable React 18.x for production use until React 19 is officially released and ecosystem catches up.

---

## 6. Positive Findings

### Well-Architected State Management
- Clean separation using Context + useReducer pattern
- Properly typed actions and state
- Memoized combined activity types

### Good TypeScript Usage
- Comprehensive type definitions
- Proper use of discriminated unions for actions
- Type-safe event handling

### Clean Component Structure
- Logical component hierarchy
- Single responsibility principle followed
- Reusable UI components from shadcn/ui

### Proper Error Handling
- Try-catch blocks around localStorage operations
- Fallback to defaults on load failure

### Build Pipeline
- TypeScript compilation passes
- ESLint configured and passing
- Production build successful

---

## 7. Recommendations Priority

### High Priority (Address Before Production)
1. Add accessibility improvements (ARIA labels, keyboard navigation)
2. Validate localStorage data on load
3. Remove debug console.log statements

### Medium Priority (Address Soon)
1. Memoize event filtering and callbacks
2. Fix form state management in EventModal
3. Add color-blind friendly indicators

### Low Priority (Nice to Have)
1. Integrate or remove EventBlock component
2. Optimize bundle size
3. Consider virtual scrolling
4. Pin React version to stable release

---

## 8. Testing Recommendations

Currently, the project has no automated tests. Recommend adding:

1. **Unit Tests** - Time helpers, ICS generator, reducer logic
2. **Component Tests** - EventModal form validation, Sidebar calculations
3. **Integration Tests** - Event CRUD operations, localStorage persistence
4. **E2E Tests** - Full user workflows with Playwright/Cypress

---

## Conclusion

The Schedule Builder is a functional MVP with solid architecture. The main areas requiring attention are accessibility and input validation. Performance optimizations can be deferred until scale becomes an issue. The codebase is well-organized and maintainable.

**Overall Assessment:** Ready for beta testing with accessibility fixes; not yet production-ready.
