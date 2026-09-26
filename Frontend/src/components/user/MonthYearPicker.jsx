import React from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MonthYearPicker = ({ year, month, onChange }) => {
  const goPrev = () => {
    if (month === 1) {
      onChange(year - 1, 12);
    } else {
      onChange(year, month - 1);
    }
  };

  const goNext = () => {
    if (month === 12) {
      onChange(year + 1, 1);
    } else {
      onChange(year, month + 1);
    }
  };

  return (
    <div className="flex h-10 items-center gap-1 rounded-lg border border-gray-200 bg-white px-1.5 shadow-sm">
      <button
        type="button"
        onClick={goPrev}
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
        aria-label="Previous month"
      >
        <ChevronLeft size={15} />
      </button>

      <span className="flex min-w-[130px] items-center justify-center gap-1.5 px-2 text-sm font-semibold text-gray-700">
        <CalendarDays size={14} className="text-orange-500" />
        {MONTH_NAMES[month - 1]} {year}
      </span>

      <button
        type="button"
        onClick={goNext}
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
        aria-label="Next month"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
};

export default MonthYearPicker;
