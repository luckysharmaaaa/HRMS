import { CalendarDays } from "lucide-react";

export default function AddHolidayModal({ isOpen, onClose, onAdd }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newHoliday = {
      title: formData.get("title"),
      start: formData.get("date"),
      color: formData.get("color") || "#f97316",
    };
    onAdd(newHoliday);
    e.target.reset();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-[999]"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] bg-white z-[1000] transition-transform duration-300 overflow-y-auto shadow-2xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl shrink-0 shadow-sm border border-orange-100/30">
              <CalendarDays size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#0F265C] tracking-tight leading-tight">
                Add Holiday
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Create a new holiday entry on the calendar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all text-base cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-5 space-y-5">
            {/* Holiday Name */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Holiday Name</span>
              </label>
              <input
                name="title"
                type="text"
                required
                className="input input-bordered w-full"
                placeholder="e.g. Independence Day"
              />
            </div>

            {/* Date */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Date</span>
              </label>
              <input
                name="date"
                type="date"
                required
                className="input input-bordered w-full text-gray-700"
              />
            </div>

            {/* Holiday Type / Color Legend */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Holiday Type</span>
              </label>
              <div className="mt-1 space-y-2">
                {[
                  { color: "#22c55e", label: "National Holiday" },
                  { color: "#f97316", label: "Company Holiday" },
                  { color: "#3b82f6", label: "Optional Holiday" },
                  { color: "#a855f7", label: "Regional Holiday" },
                  { color: "#ef4444", label: "Restricted Holiday" },
                ].map(({ color, label }) => (
                  <label
                    key={color}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-gray-300 has-[:checked]:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      className="sr-only peer"
                      defaultChecked={color === "#22c55e"}
                    />
                    <span
                      className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-1 ring-transparent peer-checked:ring-gray-400 transition-all"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="ml-auto w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center peer-checked:border-orange-500 transition-all">
                      <span className="w-2 h-2 rounded-full bg-orange-500 opacity-0 peer-checked:opacity-100 transition-all" />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 px-5 py-5">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn bg-orange-500 hover:bg-orange-600 border-none text-white"
            >
              Save Holiday
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
