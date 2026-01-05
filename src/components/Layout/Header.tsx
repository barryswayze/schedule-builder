import { Button } from '@/components/ui/button';
import { useSchedule } from '@/stores/ScheduleContext';
import { downloadICS } from '@/utils/icsGenerator';

export function Header() {
  const { state: { events, user } } = useSchedule();

  const handleExport = () => {
    if (events.length === 0) {
      alert('No events to export. Add some events first!');
      return;
    }
    downloadICS(events, user);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Schedule Builder</h1>
        <p className="text-sm text-gray-500">{user.calendarName}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={handleExport}>
          Export .ics
        </Button>
      </div>
    </header>
  );
}
