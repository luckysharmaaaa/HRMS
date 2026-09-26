import React from "react";
import { Home, CheckCircle2, Clock, XCircle } from "lucide-react";

const cards = [
  {
    label: "All WFH Requests",
    key: "all",
    icon: Home,
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
    valueColor: "text-blue-600",
  },
  {
    label: "Approved",
    key: "Approved",
    icon: CheckCircle2,
    bg: "bg-green-50",
    iconColor: "text-green-500",
    valueColor: "text-green-600",
  },
  {
    label: "Pending",
    key: "Pending",
    icon: Clock,
    bg: "bg-yellow-50",
    iconColor: "text-yellow-500",
    valueColor: "text-yellow-600",
  },
  {
    label: "Rejected",
    key: "Rejected",
    icon: XCircle,
    bg: "bg-red-50",
    iconColor: "text-red-500",
    valueColor: "text-red-600",
  },
];

export default function WfhStatCards({ data }) {
  const counts = {
    all: data.length,
    Approved: data.filter((r) => r.status === "Approved").length,
    Pending: data.filter((r) => r.status === "Pending").length,
    Rejected: data.filter((r) => r.status === "Rejected").length,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ label, key, icon: Icon, bg, iconColor, valueColor }) => (
        <div
          key={key}
          className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className={`${bg} p-3 rounded-xl flex-shrink-0`}>
            <Icon size={20} className={iconColor} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${valueColor}`}>
              {counts[key]}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
