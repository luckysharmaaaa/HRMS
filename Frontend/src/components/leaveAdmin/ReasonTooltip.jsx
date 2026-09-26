import React, { useState } from "react";
import { Info } from "lucide-react";

// ── Tooltip for Leave Reason ──────────────────────────────────
export default function ReasonTooltip({ reason }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1.5">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-blue-400 hover:text-blue-600 transition"
      >
        <Info size={13} />
      </button>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-20 leading-snug">
          {reason}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </span>
  );
}
