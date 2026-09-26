import React, { useMemo, useState } from "react";

import {
  ClipboardEdit,
  Clock,
  Hourglass,
  CheckCircle2,
  XCircle,
  Search,
  X,
  CalendarDays,
} from "lucide-react";

import {
  formatDateLabel,
  formatTime,
  deriveRequestType,
} from "../../utils/attendanceRegularization";

/* ============================================================
   STATUS CONFIG
============================================================ */

const STATUS_CONFIG = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    label: "Pending",
    Icon: Hourglass,
  },

  APPROVED: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-100",
    label: "Approved",
    Icon: CheckCircle2,
  },

  REJECTED: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-100",
    label: "Rejected",
    Icon: XCircle,
  },
};

/* ============================================================
   STATUS BADGE
   UI: min-width matches the attendance table's StatusBadge so both
   tables' Status columns read as the same component.
============================================================ */

const RegularizationStatusBadge = ({ status }) => {
  const normalizedStatus = String(status || "").toUpperCase();

  const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.PENDING;

  const Icon = config.Icon;

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 min-w-[86px] px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon size={11} className="shrink-0" />
      {config.label}
    </span>
  );
};

/* ============================================================
   EMPTY STATE
============================================================ */

const EmptyRequestsState = () => {
  return (
    <tr>
      <td colSpan={6}>
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
            <ClipboardEdit size={24} className="text-gray-300" />
          </div>

          <p className="mt-4 text-sm font-semibold text-gray-500">
            No regularization requests found
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Your attendance regularization requests will appear here.
          </p>
        </div>
      </td>
    </tr>
  );
};

/* ============================================================
   MAIN COMPONENT
============================================================ */

const EmployeeRegularization = ({ requests = [], regularizationRef }) => {
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  /* ==========================================================
     NORMALIZE REQUESTS
  ========================================================== */

  const normalizedRequests = useMemo(() => {
    if (!Array.isArray(requests)) {
      return [];
    }

    return requests;
  }, [requests]);

  /* ==========================================================
     FILTER REQUESTS
  ========================================================== */

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return normalizedRequests.filter((request) => {
      const requestStatus = String(request?.status || "").toUpperCase();

      const requestType = String(
        request?.requestType || request?.type || ""
      ).toLowerCase();

      const reason = String(request?.reason || "").toLowerCase();

      const date = String(
        request?.attendanceDate || request?.date || ""
      ).toLowerCase();

      const reviewerRemarks = String(
        request?.reviewRemarks ||
          request?.reviewerRemarks ||
          request?.remarks ||
          ""
      ).toLowerCase();

      const matchesSearch =
        !query ||
        date.includes(query) ||
        requestStatus.toLowerCase().includes(query) ||
        requestType.includes(query) ||
        reason.includes(query) ||
        reviewerRemarks.includes(query);

      const matchesStatus = !status || requestStatus === status.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [normalizedRequests, search, status]);

  /* ==========================================================
     COUNTS
  ========================================================== */

  const pendingCount = normalizedRequests.filter(
    (request) => String(request?.status || "").toUpperCase() === "PENDING"
  ).length;

  const approvedCount = normalizedRequests.filter(
    (request) => String(request?.status || "").toUpperCase() === "APPROVED"
  ).length;

  const rejectedCount = normalizedRequests.filter(
    (request) => String(request?.status || "").toUpperCase() === "REJECTED"
  ).length;

  /* ============================================================
     DATE HELPERS
  ============================================================ */

  const getAttendanceDate = (request) => {
    return (
      request?.attendanceDate ||
      request?.date ||
      request?.attendance?.date ||
      request?.attendance?.attendanceDate ||
      null
    );
  };

  const getRequestedOn = (request) => {
    return (
      request?.createdAt ||
      request?.createdOn ||
      request?.requestedAt ||
      request?.submittedAt ||
      request?.requestDate ||
      null
    );
  };

  /* ============================================================
     REQUEST TYPE
  ============================================================ */

  const getRequestType = (request) => {
    try {
      const derived = deriveRequestType?.(request);

      if (derived) {
        return derived;
      }
    } catch (error) {
      console.warn("Unable to derive request type:", error);
    }

    return request?.requestType || request?.type || "Regularization";
  };

  /* ============================================================
     REQUESTED TIMES
  ============================================================ */

  const getRequestedTimes = (request) => {
    const checkIn =
      request?.requestedCheckIn ??
      request?.requested_check_in ??
      request?.requestedIn ??
      null;

    const checkOut =
      request?.requestedCheckOut ??
      request?.requested_check_out ??
      request?.requestedOut ??
      null;

    return {
      checkIn,
      checkOut,
    };
  };

  /* ============================================================
     REVIEWER NOTE
  ============================================================ */

  const getReviewerNote = (request) => {
    return (
      request?.reviewRemarks ||
      request?.reviewerRemarks ||
      request?.reviewerNote ||
      request?.remarks ||
      request?.rejectionReason ||
      "-"
    );
  };

  /* ============================================================
     REQUEST ID
  ============================================================ */

  const getRequestId = (request) => {
    return (
      request?.id ?? request?.regularizationId ?? request?.requestId ?? "-"
    );
  };

  /* ============================================================
     FORMAT DATE SAFELY
  ============================================================ */

  const safeFormatDate = (value) => {
    if (!value) return "-";

    try {
      return formatDateLabel ? formatDateLabel(value) : value;
    } catch {
      return value;
    }
  };

  /* ============================================================
     FORMAT TIME SAFELY
  ============================================================ */

  const safeFormatTime = (value) => {
    if (!value) return "-";

    try {
      return formatTime ? formatTime(value) : value;
    } catch {
      return value;
    }
  };

  /* ============================================================
     UI
  ============================================================ */

  const thClass =
    "px-6 py-3.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap";

  const chipClass =
    "inline-flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-full border";

  return (
    <div ref={regularizationRef} className="space-y-4 scroll-mt-6">
      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0">
              <ClipboardEdit size={16} className="text-orange-500" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#0F265C]">
                My Regularization Requests
              </h2>

              <p className="text-[11px] text-gray-400 mt-0.5">
                Track your attendance regularization requests
              </p>
            </div>
          </div>

          {/* ==================================================
              SUMMARY BADGES
          ================================================== */}

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`${chipClass} bg-amber-50 border-amber-100 text-amber-600`}
            >
              <Hourglass size={11} />
              {pendingCount} Pending
            </span>

            <span
              className={`${chipClass} bg-emerald-50 border-emerald-100 text-emerald-700`}
            >
              <CheckCircle2 size={11} />
              {approvedCount} Approved
            </span>

            <span
              className={`${chipClass} bg-red-50 border-red-100 text-red-600`}
            >
              <XCircle size={11} />
              {rejectedCount} Rejected
            </span>
          </div>
        </div>

        {/* ====================================================
            FILTERS
        ==================================================== */}

        <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-2">
          {/* STATUS */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-[38px] border border-gray-200 rounded-lg px-3 text-xs font-medium text-gray-600 outline-none focus:border-orange-400 bg-white hover:border-gray-300 transition cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* SEARCH */}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 h-[38px] border border-gray-200 rounded-lg px-3 bg-white hover:border-gray-300 transition w-64 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-100">
              <Search size={14} className="text-gray-400 shrink-0" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search requests..."
                className="outline-none text-xs flex-1 placeholder-gray-400 bg-transparent"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          TABLE
      ====================================================== */}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50">
              <tr className="text-left border-b border-gray-100">
                <th className={thClass}>Date</th>
                <th className={thClass}>Requested</th>
                <th className={thClass}>Reason</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Reviewer Note</th>
                <th className={thClass}>Requested On</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length === 0 ? (
                <EmptyRequestsState />
              ) : (
                filteredRequests.map((request, index) => {
                  const attendanceDate = getAttendanceDate(request);

                  const requestedOn = getRequestedOn(request);

                  const { checkIn, checkOut } = getRequestedTimes(request);

                  const requestType = getRequestType(request);

                  const reviewerNote = getReviewerNote(request);

                  const requestId = getRequestId(request);

                  return (
                    <tr
                      key={`${requestId}-${index}`}
                      className={`group transition-colors hover:bg-orange-50/30 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      } border-b border-gray-50 last:border-0`}
                    >
                      {/* ==================================================
                          DATE
                      ================================================== */}

                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0F265C]/5 border border-[#0F265C]/10 flex items-center justify-center shrink-0">
                            <CalendarDays size={13} className="text-[#0F265C]" />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">
                              {safeFormatDate(attendanceDate)}
                            </p>

                            <p className="text-[10px] text-gray-400 mt-0.5">
                              Request #{requestId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* ==================================================
                          REQUESTED
                      ================================================== */}

                      <td className="px-6 py-4 align-middle">
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-[#0F265C]">
                            {requestType}
                          </p>

                          <div className="flex items-center gap-3 flex-wrap">
                            {checkIn && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                <Clock size={11} className="text-gray-400" />
                                In:{" "}
                                <span className="font-semibold text-gray-700">
                                  {safeFormatTime(checkIn)}
                                </span>
                              </span>
                            )}

                            {checkOut && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                <Clock size={11} className="text-gray-400" />
                                Out:{" "}
                                <span className="font-semibold text-gray-700">
                                  {safeFormatTime(checkOut)}
                                </span>
                              </span>
                            )}

                            {!checkIn && !checkOut && (
                              <span className="text-[11px] text-gray-400">
                                Status change
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ==================================================
                          REASON
                      ================================================== */}

                      <td className="px-6 py-4 align-middle max-w-xs">
                        <p
                          className="text-xs text-gray-600 leading-relaxed line-clamp-2"
                          title={request?.reason || "-"}
                        >
                          {request?.reason || "-"}
                        </p>
                      </td>

                      {/* ==================================================
                          STATUS
                      ================================================== */}

                      <td className="px-6 py-4 align-middle">
                        <RegularizationStatusBadge status={request?.status} />
                      </td>

                      {/* ==================================================
                          REVIEWER NOTE
                      ================================================== */}

                      <td className="px-6 py-4 align-middle max-w-xs">
                        <p
                          className={`text-xs leading-relaxed line-clamp-2 ${
                            reviewerNote !== "-" &&
                            String(request?.status).toUpperCase() === "REJECTED"
                              ? "text-red-500 font-medium"
                              : "text-gray-500"
                          }`}
                          title={reviewerNote}
                        >
                          {reviewerNote}
                        </p>
                      </td>

                      {/* ==================================================
                          REQUESTED ON
                      ================================================== */}

                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-gray-300 shrink-0" />

                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {safeFormatDate(requestedOn)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-400 font-medium">
            Showing{" "}
            <span className="font-bold text-gray-600">
              {filteredRequests.length}
            </span>{" "}
            request{filteredRequests.length !== 1 ? "s" : ""}
          </span>

          {filteredRequests.length !== normalizedRequests.length && (
            <span className="text-[11px] text-gray-400">
              Filtered from {normalizedRequests.length} total
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegularization;