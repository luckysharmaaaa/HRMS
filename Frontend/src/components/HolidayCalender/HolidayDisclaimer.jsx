import { Info, AlertCircle } from "lucide-react";

export default function HolidayDisclaimer() {
  return (
    <div className="mt-5 space-y-3">
      {/* Legend Row */}
      <div className="bg-white border border-gray-100 rounded-xl px-5 py-3.5 flex flex-wrap items-center gap-x-6 gap-y-2 shadow-sm">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">
          Legend
        </span>
        {[
          { color: "#22c55e", label: "National Holiday" },
          { color: "#f97316", label: "Company Holiday" },
          { color: "#3b82f6", label: "Optional Holiday" },
          { color: "#a855f7", label: "Regional Holiday" },
          { color: "#ef4444", label: "Restricted Holiday" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full inline-block flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-gray-600 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex gap-3 shadow-sm">
        <AlertCircle
          size={18}
          className="text-amber-500 mt-0.5 flex-shrink-0"
        />
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-0.5">
            Disclaimer
          </p>
          <p className="text-xs text-amber-700 leading-relaxed">
            The holidays listed in this calendar are for informational purposes
            only and are subject to change based on government notifications or
            company policy updates. Employees are advised to refer to the
            official HR communication for the final list of applicable holidays.
            Marking a date as a holiday does not automatically affect payroll or
            leave balances unless processed by the HR department.
          </p>
        </div>
      </div>

      {/* Footer note */}
      <div className="flex items-center gap-2 px-1">
        <Info size={13} className="text-gray-400 flex-shrink-0" />
        <p className="text-xs text-gray-400">
          Last updated by HR Admin · Holidays are subject to applicable local
          laws and organizational policies.
        </p>
      </div>
    </div>
  );
}
