import React from "react";
import { Users, UserCheck, UserX, UserPlus } from "lucide-react";

const cards = [
  {
    label: "Total Employees",
    key: "total",
    icon: Users,
    gradient: "from-slate-700 to-slate-900",
    iconBg: "bg-white/10",
    glow: "shadow-slate-400/20",
  },
  {
    label: "Active",
    key: "active",
    icon: UserCheck,
    gradient: "from-emerald-400 to-green-600",
    iconBg: "bg-white/20",
    glow: "shadow-green-400/30",
  },
  {
    label: "Inactive",
    key: "inactive",
    icon: UserX,
    gradient: "from-rose-400 to-red-600",
    iconBg: "bg-white/20",
    glow: "shadow-red-400/30",
  },
  {
    label: "New Joiners",
    key: "new",
    icon: UserPlus,
    gradient: "from-blue-400 to-indigo-600",
    iconBg: "bg-white/20",
    glow: "shadow-blue-400/30",
  },
];

function getJoiningYear(joiningDate) {
  if (!joiningDate) return null;
  const parsed = new Date(joiningDate);
  return isNaN(parsed.getTime()) ? null : parsed.getFullYear();
}

export default function EmployeeStatCards({ data }) {
  const currentYear = new Date().getFullYear();

  // Derive all four card counts from the employee list in one pass
  const counts = {
    total: data.length,
    active: data.filter((e) => e.status === "Active").length,
    inactive: data.filter((e) => e.status === "Inactive").length,
    new: data.filter((e) => {
      const year = getJoiningYear(e.joiningDate);
      return year !== null && year >= currentYear - 1;
    }).length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ label, key, icon: Icon, gradient, iconBg, glow }) => (
        <div
          key={key}
          className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 flex items-center gap-4 shadow-lg ${glow} text-white relative overflow-hidden`}
        >
          {/* decorative circle */}
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -right-2 w-28 h-28 rounded-full bg-white/5" />

          <div className={`${iconBg} p-3 rounded-xl flex-shrink-0 backdrop-blur-sm`}>
            <Icon size={22} className="text-white" />
          </div>

          <div className="relative z-10">
            <p className="text-xs text-white/70 font-medium tracking-wide uppercase">
              {label}
            </p>
            <p className="text-3xl font-extrabold mt-0.5 leading-none">
              {counts[key]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
