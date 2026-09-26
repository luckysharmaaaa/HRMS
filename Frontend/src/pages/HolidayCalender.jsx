import { useState } from "react";
import { Palmtree, CalendarRange } from "lucide-react";
import HolidayHeader from "../components/HolidayCalender/HolidayHeader";
import CalendarView from "../components/HolidayCalender/CalendarView";
import AddHolidayModal from "../components/HolidayCalender/AddHolidayModal";
import HolidayDisclaimer from "../components/HolidayCalender/HolidayDisclaimer";

const StatCard = ({ icon: Icon, label, value, bg, iconColor }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
    <div className={`${bg} p-3 rounded-xl shrink-0`}>
      <Icon size={20} className={iconColor} />
    </div>
    <div>
      <p className="text-2xl font-bold text-[#0F265C]">{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

const UpcomingCard = ({ value, nextHoliday }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
    <div className="bg-orange-50 p-3 rounded-xl shrink-0">
      <Palmtree size={20} className="text-orange-500" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-[#0F265C]">{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-0.5">Upcoming</p>
      {nextHoliday && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: nextHoliday.color || "#f97316" }}
          />
          <span className="text-xs font-semibold text-orange-600 truncate">
            Next: {nextHoliday.title}
          </span>
          <span className="text-xs text-gray-400 shrink-0">
            &middot;{" "}
            {new Date(nextHoliday.start).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
      )}
    </div>
  </div>
);

export default function HolidayCalendar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([
    { title: "Republic Day", start: "2026-01-26", color: "#22c55e" },
    { title: "Easy Holiday", start: "2026-07-15", color: "#f97316" },
  ]);

  const handleAddHoliday = (newHoliday) => {
    setEvents([...events, newHoliday]);
  };

  const currentYear = new Date().getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yearEvents = events.filter((e) =>
    e.start.startsWith(String(currentYear)),
  );
  const upcomingEvents = events
    .filter((e) => new Date(e.start) > today)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const upcoming = upcomingEvents.length;
  const nextHoliday = upcomingEvents[0] || null;

  return (
    <div className="p-6 bg-gray-50/50 min-h-[calc(100vh-64px)]">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <HolidayHeader onAddHolidayClick={() => setIsModalOpen(true)} />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={CalendarRange}
            label={`${currentYear} Holidays`}
            value={yearEvents.length}
            bg="bg-blue-50"
            iconColor="text-blue-500"
          />
          <UpcomingCard value={upcoming} nextHoliday={nextHoliday} />
        </div>

        {/* Calendar */}
        <CalendarView events={events} />

        {/* Disclaimer + Legend */}
        <HolidayDisclaimer />
      </div>

      <AddHolidayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleAddHoliday}
      />
    </div>
  );
}
