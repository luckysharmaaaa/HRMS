import React, { useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Users, Loader2 } from "lucide-react";
import { getAdminSummary } from "../../services/leaveService";

const CARD_CONFIG = [
  { key: "pending", label: "Pending Requests", icon: Clock, gradient: "from-cyan-400 to-cyan-600", iconBg: "bg-cyan-300/40" },
  { key: "approved", label: "Approved Requests", icon: CheckCircle2, gradient: "from-green-400 to-green-600", iconBg: "bg-green-300/40" },
  { key: "rejected", label: "Rejected Requests", icon: XCircle, gradient: "from-red-400 to-red-600", iconBg: "bg-red-300/40" },
  { key: "onLeaveToday", label: "On Leave Today", icon: Users, gradient: "from-yellow-400 to-yellow-600", iconBg: "bg-yellow-300/40" },
];

// ── Stat Cards Row (real data) ──────────────────────────────────
export default function LeaveStatCards() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARD_CONFIG.map(({ label }) => (
          <div
            key={label}
            className="bg-gray-100 rounded-xl p-5 h-[92px] flex items-center justify-center"
          >
            <Loader2 size={18} className="animate-spin text-gray-300" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARD_CONFIG.map(({ key, label, icon: Icon, gradient, iconBg }) => (
        <div
          key={key}
          className={`relative bg-gradient-to-r ${gradient} rounded-xl p-5 text-white shadow-sm overflow-hidden`}
        >
          <div className={`absolute -right-3 -top-3 p-5 ${iconBg} rounded-full`}>
            <Icon size={32} className="opacity-60" />
          </div>
          <p className="text-sm font-medium opacity-90 mb-1">{label}</p>
          <p className="text-3xl font-bold tracking-tight">
            {summary ? summary[key] : "—"}
          </p>
        </div>
      ))}
    </div>
  );
}