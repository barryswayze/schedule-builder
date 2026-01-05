import { ScheduleProvider } from '@/stores/ScheduleContext';
import { Header } from '@/components/Layout/Header';
import { Sidebar } from '@/components/Layout/Sidebar';
import { WeekView } from '@/components/Calendar/WeekView';
import { EventModal } from '@/components/Events/EventModal';
import { AddActivityTypeModal } from '@/components/Events/AddActivityTypeModal';

function App() {
  return (
    <ScheduleProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 p-4 overflow-hidden">
            <WeekView />
          </main>
        </div>
        <EventModal />
        <AddActivityTypeModal />
      </div>
    </ScheduleProvider>
  );
}

export default App;
