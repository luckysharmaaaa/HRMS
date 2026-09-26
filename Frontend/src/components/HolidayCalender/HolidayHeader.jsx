import { HomeIcon, ChevronRight, Plus } from "lucide-react";

export default function HolidayHeader({ onAddHolidayClick }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
      <div>
        <h1 className="text-3xl font-bold text-[#0F265C]">
          Holiday Calendar
        </h1>
        <nav className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 font-medium">
          <HomeIcon size={14} className="text-gray-400 hover:text-orange-500 cursor-pointer transition-colors" />
          <ChevronRight size={14} className="text-gray-400" />
          <span className="hover:text-orange-500 cursor-pointer transition-colors">Calendar</span>
          <ChevronRight size={14} className="text-gray-400" />
          <span className="text-orange-500">
            Holidays
          </span>
        </nav>
      </div>
      <button 
        onClick={onAddHolidayClick}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all font-medium"
      >
        <Plus size={18} />
        Add Holiday
      </button>
    </div>
  );
}
