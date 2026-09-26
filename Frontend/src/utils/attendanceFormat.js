  // Small formatting helpers so components stay dumb — all real
  // calculation already happened on the backend.

  export const formatTime = (isoString) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  export const minsToHrsMins = (mins) => {
    if (mins === null || mins === undefined) return "0h 0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  // Compact "Xh Ym" for table cells (e.g. 260 -> "4h 20m", 45 -> "45m",
  // 0/null/undefined -> "-"). Used for Late / Overtime columns in the
  // attendance table, where a bare "260 Min" is hard to read at a glance.
  export const minsToShort = (mins) => {
    if (!mins) return "-";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Maps backend attendanceStatus/isLate to the table's display strings
  export const mapStatusLabel = (row) => {
    if (!row.checkIn) return "Absent";
    if (row.isLate) return "Late";
    return "Present";
  };