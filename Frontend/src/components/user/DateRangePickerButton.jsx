import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FiCalendar } from "react-icons/fi";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

// ── Helpers ────────────────────────────────────────────────────────────────

const sameDay = (a, b) =>
  a instanceof Date && b instanceof Date && a.toDateString() === b.toDateString();

const isDefaultRange = (range) =>
  Array.isArray(range) &&
  range[0] &&
  range[0].startDate instanceof Date &&
  range[0].endDate instanceof Date;

const fallbackRange = () => [
  { startDate: new Date(), endDate: new Date(), key: "selection" },
];

const VIEWPORT_MARGIN = 8;

// ── DateRangePickerButton ─────────────────────────────────────────────────────
// Props:
//   value         — [{ startDate, endDate, key }]  (controlled from parent)
//   onChange      — (newRange) => void  called when the range is committed
//   defaultPreset — string label to use ONLY if `value` doesn't match any
//                   known preset on mount (default: "This Year")
// ─────────────────────────────────────────────────────────────────────────────
const DateRangePickerButton = ({
  value,
  onChange,
  defaultPreset = "This Year",
}) => {
  const today = new Date();

  const safeValue = isDefaultRange(value) ? value : fallbackRange();

  const presets = [
    { label: "Today", start: today, end: today },
    {
      label: "Yesterday",
      start: new Date(today - 86400000),
      end: new Date(today - 86400000),
    },
    { label: "Last 7 Days", start: new Date(today - 6 * 86400000), end: today },
    {
      label: "Last 30 Days",
      start: new Date(today - 29 * 86400000),
      end: today,
    },
    {
      label: "This Year",
      start: new Date(today.getFullYear(), 0, 1),
      end: new Date(today.getFullYear(), 11, 31),
    },
    {
      label: "Next Year",
      start: new Date(today.getFullYear() + 1, 0, 1),
      end: new Date(today.getFullYear() + 1, 11, 31),
    },
    { label: "Custom Range", start: null, end: null },
  ];

  const detectPreset = (range) => {
    const match = presets.find(
      (p) => p.start && sameDay(p.start, range[0].startDate) && sameDay(p.end, range[0].endDate)
    );
    return match ? match.label : defaultPreset;
  };

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tempRange, setTempRange] = useState(safeValue);
  const [activePreset, setActivePreset] = useState(() => detectPreset(safeValue));

  // coords for the portaled panel, in viewport (fixed) space
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const triggerWrapRef = useRef(null); // wraps just the button
  const buttonRef = useRef(null);
  const panelRef = useRef(null); // the portaled dropdown

  // ── Position the panel relative to the trigger button ──────────────────
  // Computed in viewport coordinates (position: fixed), so ancestor scroll
  // containers and overflow-hidden cards never affect or clip it.
  const positionPanel = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left });
  }, []);

  // Initial position when opening
  useLayoutEffect(() => {
    if (datePickerOpen) positionPanel();
  }, [datePickerOpen, positionPanel]);

  // After the panel itself has rendered and we know its real width, clamp
  // it back inside the viewport instead of letting it run off-screen.
  useLayoutEffect(() => {
    if (!datePickerOpen || !panelRef.current) return;
    const panelRect = panelRef.current.getBoundingClientRect();
    const overflowRight = panelRect.right - (window.innerWidth - VIEWPORT_MARGIN);
    const overflowBottom = panelRect.bottom - (window.innerHeight - VIEWPORT_MARGIN);

    setCoords((prev) => {
      let { top, left } = prev;
      if (overflowRight > 0) left = Math.max(VIEWPORT_MARGIN, left - overflowRight);
      if (overflowBottom > 0) {
        // Flip above the button if there isn't room below
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) top = Math.max(VIEWPORT_MARGIN, rect.top - panelRect.height - 8);
      }
      return { top, left };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePickerOpen, tempRange]);

  // Keep the panel glued to the button on scroll/resize while open
  useEffect(() => {
    if (!datePickerOpen) return;
    window.addEventListener("scroll", positionPanel, true);
    window.addEventListener("resize", positionPanel);
    return () => {
      window.removeEventListener("scroll", positionPanel, true);
      window.removeEventListener("resize", positionPanel);
    };
  }, [datePickerOpen, positionPanel]);

  // Sync tempRange + activePreset when parent value changes
  useEffect(() => {
    const next = isDefaultRange(value) ? value : fallbackRange();
    setTempRange(next);
    setActivePreset(detectPreset(next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close on outside click — checks BOTH the trigger button and the
  // portaled panel, since they're no longer DOM siblings once portaled.
  useEffect(() => {
    const handleClickOutside = (e) => {
      const insideTrigger = triggerWrapRef.current?.contains(e.target);
      const insidePanel = panelRef.current?.contains(e.target);
      if (insideTrigger || insidePanel) return;

      setDatePickerOpen(false);
      const reverted = isDefaultRange(value) ? value : fallbackRange();
      setTempRange(reverted);
      setActivePreset(detectPreset(reverted));
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Quick presets commit + close immediately; "Custom Range" just switches
  // the sidebar highlight and waits for calendar input + Apply.
  const applyPreset = (preset) => {
    setActivePreset(preset.label);
    if (!preset.start) return;

    const committed = [{ startDate: preset.start, endDate: preset.end, key: "selection" }];
    setTempRange(committed);
    onChange(committed);
    setDatePickerOpen(false);
  };

  const formatDate = (d) =>
    d instanceof Date
      ? d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
      : "";

  const displayLabel = `${formatDate(safeValue[0].startDate)} - ${formatDate(safeValue[0].endDate)}`;

  return (
    <div ref={triggerWrapRef} className="relative inline-block">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setTempRange(safeValue);
          setActivePreset(detectPreset(safeValue));
          setDatePickerOpen((o) => !o);
        }}
        className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 h-10 bg-white cursor-pointer hover:border-gray-300 transition-colors whitespace-nowrap"
      >
        <FiCalendar size={13} className="text-gray-400" />
        <span>{displayLabel}</span>
      </button>

      {/* Dropdown Panel — portaled to <body> so it can never be clipped by
          an ancestor's overflow-hidden/overflow-x-auto (e.g. a rounded
          card), and positioned via fixed coords computed above. */}
      {datePickerOpen &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 9999 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden w-fit"
          >
            <div className="flex">
              {/* Presets Sidebar */}
              <div className="w-36 border-r border-gray-100 py-2 flex flex-col">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`text-left px-4 py-2 text-sm transition-colors ${
                      activePreset === p.label
                        ? "bg-orange-500 text-white font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Calendar */}
              <div className="drp-no-sidebar">
                <style>{`.drp-no-sidebar .rdrDefinedRangesWrapper { display: none !important; }`}</style>
                <DateRangePicker
                  ranges={tempRange}
                  onChange={(item) => {
                    setTempRange([item.selection]);
                    setActivePreset("Custom Range");
                  }}
                  months={1}
                  direction="horizontal"
                  showMonthAndYearPickers
                  rangeColors={["#f97316"]}
                  color="#f97316"
                  showDateDisplay={false}
                  staticRanges={[]}
                  inputRanges={[]}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-sm text-gray-500 font-medium">
                {formatDate(tempRange[0].startDate)} - {formatDate(tempRange[0].endDate)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost border border-gray-200 text-gray-600 hover:bg-gray-100"
                  onClick={() => {
                    setTempRange(safeValue);
                    setActivePreset(detectPreset(safeValue));
                    setDatePickerOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-sm bg-orange-500 hover:bg-orange-600 border-none text-white"
                  onClick={() => {
                    onChange(tempRange);
                    setDatePickerOpen(false);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default DateRangePickerButton;