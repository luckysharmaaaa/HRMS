import React from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DESIGNATIONS, SORT_OPTIONS, getProductivityStyle } from "./employeeData";

const DEPT_COLORS = [
  "bg-pink-100 text-pink-600",
  "bg-purple-100 text-purple-600",
  "bg-blue-100 text-blue-600",
  "bg-green-100 text-green-600",
  "bg-yellow-100 text-yellow-600",
  "bg-teal-100 text-teal-600",
];

export default function EmployeeGrid({
  filtered,
  designation,
  setDesignation,
  sortBy,
  setSortBy,
  onEdit,
  onDelete,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-gray-700">Employees Grid</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-orange-400 bg-white"
          >
            {DESIGNATIONS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 outline-none focus:border-orange-400 bg-white"
          >
            {SORT_OPTIONS.map((s) => <option key={s} value={s}>Sort By : {s}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="p-5">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">No employees found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((emp, idx) => {
              const style = getProductivityStyle(emp.productivity);
              const deptColor = DEPT_COLORS[idx % DEPT_COLORS.length];
              return (
                <div
                  key={emp.id}
                  className="relative bg-white border border-gray-100 rounded-xl p-5 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-shadow group"
                >
                  {/* 3-dot menu */}
                  <div className="absolute top-3 right-3 dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-xs p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </label>
                    <ul tabIndex={0} className="dropdown-content menu bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-32 p-1 mt-1">
                      <li>
                        <button onClick={() => onEdit(emp)} className="flex items-center gap-2 text-sm text-gray-700 hover:text-orange-500">
                          <Pencil size={13} /> Edit
                        </button>
                      </li>
                      <li>
                        <button onClick={() => onDelete(emp)} className="flex items-center gap-2 text-sm text-gray-700 hover:text-red-500">
                          <Trash2 size={13} /> Delete
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Avatar */}
                  {/* Avatar */}
                  <div className="relative mt-2">
                    <div
                      className={`w-16 h-16 rounded-full ${emp.color} flex items-center justify-center text-white text-xl font-bold shadow-md ring-4 ring-white overflow-hidden`}
                    >
                      {emp.avatarUrl ? (
                        <img
                          src={emp.avatarUrl}
                          alt={emp.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        emp.avatar
                      )}
                    </div>

                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500" />
                  </div>

                  {/* Name + role badge */}
                  <div className="text-center">
                    <p className="font-bold text-gray-800 text-[15px]">{emp.name}</p>
                    <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${deptColor}`}>
                      {emp.department}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="w-full grid grid-cols-3 gap-2 text-center border-t border-gray-50 pt-3">
                    {[["Projects", emp.projects], ["Done", emp.done], ["Progress", emp.progress]].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-[10px] text-gray-400 font-medium">{label}</p>
                        <p className="text-sm font-bold text-gray-700">{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Productivity bar */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-gray-400">Productivity</span>
                      <span className={`text-[12px] font-bold ${style.text}`}>
                        {emp.productivity}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${emp.productivity}%`, backgroundColor: style.bar }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
