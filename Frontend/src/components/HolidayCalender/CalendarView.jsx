import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./CalendarOverrides.css";

export default function CalendarView({ events }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "title",
          center: "",
          right: "prev,today,next dayGridMonth,timeGridWeek"
        }}
        editable={true}
        selectable={true}
        height="auto"
        events={events}
        eventClassNames="rounded-md shadow-sm border-none px-1 text-sm font-medium"
        dayMaxEvents={true}
      />
    </div>
  );
}
