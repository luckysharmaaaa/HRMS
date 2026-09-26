import React, { useState } from "react";
import {
  X,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Calendar,
  Download,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Timer,
  Star,
} from "lucide-react";

// ── Mock report data ──────────────────────────────────────────────────────────
const SUMMARY_STATS = [
  {
    label: "Total Employees",
    value: "312",
    icon: Users,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
  },
  {
    label: "Avg Attendance",
    value: "91.4%",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
  },
  {
    label: "Avg Late Arrivals",
    value: "8.6%",
    icon: Timer,
    color: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
  },
  {
    label: "Avg Absences",
    value: "3.8%",
    icon: XCircle,
    color: "bg-red-50 text-red-600",
    border: "border-red-100",
  },
];

const DEPARTMENT_REPORT = [
  { dept: "UI/UX Team", present: 28, absent: 2, late: 3, rate: 93 },
  { dept: "Development", present: 45, absent: 3, late: 5, rate: 91 },
  { dept: "HR", present: 12, absent: 1, late: 1, rate: 93 },
  { dept: "Management", present: 9, absent: 1, late: 2, rate: 88 },
  { dept: "Finance", present: 18, absent: 2, late: 2, rate: 90 },
];

const WEEKLY_TREND = [
  { day: "Mon", present: 295, absent: 8, late: 9 },
  { day: "Tue", present: 301, absent: 5, late: 6 },
  { day: "Wed", present: 289, absent: 12, late: 11 },
  { day: "Thu", present: 308, absent: 4, late: 0 },
  { day: "Fri", present: 278, absent: 18, late: 16 },
];

const TOP_EARLY_BIRDS = [
  { name: "Anthony Lewis",    dept: "UI/UX Team",   earlyCount: 22, avgEarly: "08:12 AM", avatar: "AL", color: "bg-blue-500" },
  { name: "Harvey Smith",     dept: "HR",            earlyCount: 20, avgEarly: "08:20 AM", avatar: "HS", color: "bg-orange-700" },
  { name: "Connie Waters",    dept: "Management",    earlyCount: 18, avgEarly: "08:25 AM", avatar: "CW", color: "bg-red-500" },
  { name: "Rebecca Smith",    dept: "UI/UX Team",    earlyCount: 17, avgEarly: "08:30 AM", avatar: "RS", color: "bg-emerald-600" },
];

const PERIOD_OPTIONS = [
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Last Month",
  "Custom Range",
];

// ── Mini progress bar ─────────────────────────────────────────────────────────
const MiniBar = ({ value, max, color }) => (
  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${color}`}
      style={{ width: `${(value / max) * 100}%` }}
    />
  </div>
);

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-center gap-2.5 mb-4">
    <div className="p-1.5 bg-orange-50 text-orange-500 rounded-lg border border-orange-100/60">
      <Icon size={15} />
    </div>
    <div>
      <p className="text-sm font-bold text-[#0F265C]">{title}</p>
      {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const AttendanceReportModal = ({ open, onClose }) => {
  const [period, setPeriod] = useState("Last 30 Days");
  const [showPeriodDrop, setShowPeriodDrop] = useState(false);

  const maxPresent = Math.max(...WEEKLY_TREND.map((d) => d.present));

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-[999] backdrop-blur-[1px]"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[680px] bg-white z-[1000] transition-transform duration-300 overflow-y-auto shadow-2xl flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0 shadow-sm border border-orange-100/30">
              <BarChart3 size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F265C]">
                Attendance Report
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Detailed insights &amp; analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodDrop((p) => !p)}
                className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-orange-300 hover:bg-orange-50 transition"
              >
                <Calendar size={14} className="text-orange-500" />
                {period}
                <ChevronDown size={13} className="text-gray-400" />
              </button>

              {showPeriodDrop && (
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-44 py-1 overflow-hidden">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setPeriod(opt);
                        setShowPeriodDrop(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition ${
                        period === opt
                          ? "bg-orange-50 text-orange-600 font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export */}
            <button className="flex items-center gap-2 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-orange-200">
              <Download size={14} />
              Export
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="flex-1 p-5 space-y-6">
          {/* Period badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-orange-50 border border-orange-100 rounded-lg w-fit">
            <FileText size={13} className="text-orange-500" />
            <span className="text-xs font-semibold text-orange-600">
              Report Period: {period}
            </span>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-3">
            {SUMMARY_STATS.map(({ label, value, icon: Icon, color, border }) => (
              <div
                key={label}
                className={`flex items-center gap-3 p-4 rounded-xl border ${border} bg-white shadow-sm`}
              >
                <div className={`p-2.5 rounded-xl ${color} border ${border}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                  <p className="text-xl font-bold text-[#0F265C] mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Weekly trend */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
            <SectionHeader
              icon={TrendingUp}
              title="Weekly Attendance Trend"
              subtitle="Present vs. Absent breakdown by day"
            />
            <div className="space-y-3">
              {WEEKLY_TREND.map(({ day, present, absent, late }) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-7 shrink-0">
                    {day}
                  </span>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <MiniBar value={present} max={maxPresent} color="bg-emerald-400" />
                      <span className="text-[11px] text-gray-500 w-8 text-right">{present}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MiniBar value={absent} max={maxPresent} color="bg-red-400" />
                      <span className="text-[11px] text-gray-500 w-8 text-right">{absent}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {late > 10 ? (
                      <TrendingDown size={12} className="text-red-400" />
                    ) : (
                      <TrendingUp size={12} className="text-emerald-400" />
                    )}
                    <span
                      className={`text-[11px] font-semibold ${
                        late > 10 ? "text-red-500" : "text-emerald-500"
                      }`}
                    >
                      {late} late
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span className="text-xs text-gray-400">Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                <span className="text-xs text-gray-400">Absent</span>
              </div>
            </div>
          </div>

          {/* Department breakdown */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
            <SectionHeader
              icon={Users}
              title="Department Breakdown"
              subtitle="Attendance rates per department"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-400 font-semibold bg-gray-50">
                    <th className="text-left px-3 py-2.5 rounded-l-lg">Department</th>
                    <th className="text-center px-3 py-2.5">Present</th>
                    <th className="text-center px-3 py-2.5">Absent</th>
                    <th className="text-center px-3 py-2.5">Late</th>
                    <th className="text-right px-3 py-2.5 rounded-r-lg">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {DEPARTMENT_REPORT.map(({ dept, present, absent, late, rate }) => (
                    <tr key={dept} className="hover:bg-gray-50/70 transition">
                      <td className="px-3 py-3 font-semibold text-[#0F265C]">{dept}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-semibold">
                          {present}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 bg-red-50 text-red-500 rounded-md font-semibold">
                          {absent}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md font-semibold">
                          {late}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                rate >= 92
                                  ? "bg-emerald-400"
                                  : rate >= 88
                                  ? "bg-amber-400"
                                  : "bg-red-400"
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span
                            className={`font-bold ${
                              rate >= 92
                                ? "text-emerald-600"
                                : rate >= 88
                                ? "text-amber-600"
                                : "text-red-500"
                            }`}
                          >
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top early bird arrivals */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
            <SectionHeader
              icon={Star}
              title="Top Early Bird Arrivals"
              subtitle="Employees who consistently arrive earliest this period"
            />
            <div className="space-y-3">
              {TOP_EARLY_BIRDS.map(({ name, dept, earlyCount, avgEarly, avatar, color }, idx) => (
                <div
                  key={name}
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/40 border border-emerald-100/60 hover:border-emerald-200 hover:bg-emerald-50/70 transition"
                >
                  {/* Rank badge */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    idx === 0
                      ? "bg-yellow-400 text-white shadow-sm"
                      : idx === 1
                      ? "bg-gray-300 text-gray-700"
                      : idx === 2
                      ? "bg-amber-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {idx + 1}
                  </div>

                  <div
                    className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
                  >
                    {avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                    <p className="text-xs text-gray-400">{dept}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-600">{earlyCount} days</p>
                    <p className="text-xs text-gray-400">avg {avgEarly}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insight banner */}
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
            <AlertCircle size={17} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-orange-700">Insight</p>
              <p className="text-xs text-orange-600 mt-0.5 leading-relaxed">
                Friday shows the highest absenteeism rate (5.8%) across the period.
                Consider reviewing scheduling policies or incentives for end-of-week
                attendance.
              </p>
            </div>
          </div>

          {/* Working hours summary */}
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
            <SectionHeader
              icon={Clock}
              title="Working Hours Summary"
              subtitle="Average hours logged this period"
            />
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Avg Daily Hours", value: "8h 22m", sub: "per employee", color: "text-blue-600" },
                { label: "Total Overtime", value: "142h", sub: "across all staff", color: "text-emerald-600" },
                { label: "Total Break Time", value: "38h", sub: "across all staff", color: "text-amber-600" },
              ].map(({ label, value, sub, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100 text-center gap-1"
                >
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                  <p className="text-xs font-semibold text-gray-600">{label}</p>
                  <p className="text-[11px] text-gray-400">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            Generated on{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Close
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg transition shadow-sm shadow-orange-200">
              <Download size={14} />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceReportModal;

