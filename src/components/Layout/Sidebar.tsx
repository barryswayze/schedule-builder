import { useSchedule } from '@/stores/ScheduleContext';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const {
    state: { events, customActivityTypes },
    getAllActivityTypes,
    getActivityColor,
    openActivityTypeModal,
    deleteCustomActivityType,
  } = useSchedule();

  const allTypes = getAllActivityTypes();
  const activityEntries = Object.entries(allTypes);

  // Calculate total hours by activity type (multiply by number of days)
  const hoursByType: Record<string, number> = {};
  events.forEach((event) => {
    const totalHours = event.duration * event.daysOfWeek.length;
    hoursByType[event.activityType] = (hoursByType[event.activityType] || 0) + totalHours;
  });

  // Calculate total scheduled hours (per week) - multiply by number of days
  const totalScheduledHours = events.reduce((sum, e) => sum + (e.duration * e.daysOfWeek.length), 0);
  const freeHours = 168 - totalScheduledHours; // 168 hours in a week

  // Check if a type is custom (deletable)
  const isCustomType = (typeName: string) => {
    return customActivityTypes.some(t => t.name === typeName);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Activity Types Legend */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Activity Types</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={openActivityTypeModal}
              className="h-6 px-2 text-xs"
            >
              + Add
            </Button>
          </div>
          <div className="space-y-1">
            {activityEntries.map(([type, color]) => (
              <div
                key={type}
                className="flex items-center justify-between group py-1"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-600 truncate">{type}</span>
                </div>
                {isCustomType(type) && (
                  <button
                    onClick={() => deleteCustomActivityType(type)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs px-1 transition-opacity"
                    title="Delete custom type"
                  >
                    x
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Weekly Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Events</span>
              <span className="font-medium text-gray-900">{events.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Scheduled Hours</span>
              <span className="font-medium text-gray-900">{totalScheduledHours.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Free Time</span>
              <span className="font-medium text-green-600">{freeHours.toFixed(1)}h</span>
            </div>
          </div>
        </div>

        {/* Hours by Activity */}
        {Object.keys(hoursByType).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Hours by Activity</h2>
            <div className="space-y-2">
              {Object.entries(hoursByType)
                .sort((a, b) => b[1] - a[1])
                .map(([type, hours]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getActivityColor(type) }}
                      />
                      <span className="text-gray-600 truncate">{type}</span>
                    </div>
                    <span className="font-medium text-gray-900 flex-shrink-0">{hours.toFixed(1)}h</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-400 space-y-1">
          <p>Click on a time slot to add an event</p>
          <p>Click on an event to edit it</p>
        </div>
      </div>
    </aside>
  );
}
