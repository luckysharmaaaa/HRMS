import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ClipboardEdit,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  Search,
  Hourglass,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getRegularizationsForReview,
  approveRegularization,
  rejectRegularization,
} from "../../services/regularizationApi";
import {
  formatDateLabel,
  formatTime,
  deriveRequestType,
} from "../../utils/attendanceRegularization";

// ─────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// Mirrors EmployeeRegularization's STATUS_CONFIG so pending/approved/rejected
// look identical across the employee and admin screens.
// ─────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", label: "Pending" },
  APPROVED: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", label: "Approved" },
  REJECTED: { bg: "bg-red-50", text: "text-red-600", border: "border-red-100", label: "Rejected" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// REVIEW DIALOG
// Replaces the old RejectDialog + window.confirm combo with one consistent,
// styled confirmation used for both approve and reject.
// ─────────────────────────────────────────────────────────────────────────

const ReviewDialog = ({ mode, onCancel, onConfirm, busy }) => {
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const isReject = mode === "reject";

  const handleConfirm = () => {
    if (isReject && !remarks.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    onConfirm(remarks.trim() || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0F265C]">
            {isReject ? "Reject request" : "Approve request"}
          </h3>
          <button onClick={onCancel} disabled={busy} aria-label="Close">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <p className="text-xs text-gray-500">
          {isReject
            ? "Let the employee know why this request is being rejected."
            : "This will update the employee's attendance record. You can optionally add a note for the record."}
        </p>

        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={3}
          placeholder={isReject ? "Reason for rejection" : "Optional note (visible to employee)"}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
        />

        {error && <p className="text-xs font-semibold text-red-500">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg disabled:opacity-50 ${
              isReject ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {busy ? "Saving…" : isReject ? "Confirm reject" : "Confirm approve"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const RegularizationReview = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("PENDING");
  const [search, setSearch] = useState("");

  // { id, mode: "approve" | "reject" } | null
  const [dialogTarget, setDialogTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRegularizationsForReview(page, PAGE_SIZE, status || undefined);
      setRows(res?.data || []);
      setTotal(res?.total || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  // Status filter changed -> jump back to page 1 so results aren't confusing
  useEffect(() => {
    setPage(1);
  }, [status]);

  // Search is client-side, scoped to the currently loaded page (backend has
  // no search param). Good enough for now; flag if you want server-side
  // search added to getRegularizationRequestsForReview.
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((r) => {
      const name = `${r.firstName || ""} ${r.lastName || ""}`.toLowerCase();
      const code = (r.employeeCode || "").toLowerCase();
      const reason = (r.reason || "").toLowerCase();
      return name.includes(query) || code.includes(query) || reason.includes(query);
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleConfirmDialog = async (remarks) => {
    if (!dialogTarget) return;
    const { id, mode } = dialogTarget;
    setBusy(true);
    try {
      if (mode === "approve") {
        await approveRegularization(id, remarks);
        toast.success("Request approved");
      } else {
        await rejectRegularization(id, remarks);
        toast.success("Request rejected");
      }
      setDialogTarget(null);
      await load();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Action failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 border border-orange-100 rounded-xl">
            <ClipboardEdit size={16} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0F265C]">Regularization Requests</h2>
            <p className="text-[11px] text-gray-400">Review and approve or reject employee requests</p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="px-6 py-3 bg-gray-50/50 border-b border-gray-100 flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 outline-none focus:border-orange-400 bg-white hover:border-gray-300 transition cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white hover:border-gray-300 transition w-60 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-100">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search this page…"
              className="outline-none text-xs flex-1 placeholder-gray-400 bg-transparent"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="hover:text-gray-600" aria-label="Clear search">
                <X size={12} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-100">
              {["Employee", "Date", "Request", "Reason", "Status", "Submitted", "Action"].map((h) => (
                <th key={h} className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-gray-400">Loading…</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="py-14 flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                      <Hourglass size={22} className="text-gray-300" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500">No requests found</p>
                      <p className="text-xs text-gray-400 mt-0.5">Try a different status filter or search term.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => {
                const inTime = formatTime(r.requestedCheckIn);
                const outTime = formatTime(r.requestedCheckOut);
                const showsStatusChange =
                  (r.requestType === "WRONG_STATUS" || r.requestType === "HALF_DAY") && r.requestedStatus;

                return (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-orange-50/30">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {r.firstName} {r.lastName}
                      <div className="text-[10px] text-gray-400">{r.employeeCode}</div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">{formatDateLabel(r.attendanceDate)}</td>

                    <td className="px-6 py-4 text-xs text-gray-600">
                      <p className="text-[10px] font-semibold text-gray-500 mb-1">{deriveRequestType(r)}</p>
                      {inTime && <div>In: {inTime}</div>}
                      {outTime && <div>Out: {outTime}</div>}
                      {showsStatusChange && (
                        <div>Status → {String(r.requestedStatus).replace("_", " ")}</div>
                      )}
                      {!inTime && !outTime && !showsStatusChange && <span className="text-gray-300">-</span>}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-600 max-w-xs">{r.reason}</td>

                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500">
                      <Clock size={11} className="inline mr-1" />
                      {r.createdAt ? new Date(Number(r.createdAt) * 1000).toLocaleDateString() : "-"}
                    </td>

                    <td className="px-6 py-4">
                      {r.status === "PENDING" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDialogTarget({ id: r.id, mode: "approve" })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 border border-emerald-100 bg-emerald-50 hover:bg-emerald-100"
                          >
                            <CheckCircle2 size={12} /> Approve
                          </button>
                          <button
                            onClick={() => setDialogTarget({ id: r.id, mode: "reject" })}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-100 bg-red-50 hover:bg-red-100"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{r.reviewRemarks || "-"}</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">
          Page <span className="font-bold text-gray-600">{page}</span> of{" "}
          <span className="font-bold text-gray-600">{totalPages}</span> ·{" "}
          <span className="font-bold text-gray-600">{total}</span> total
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {dialogTarget && (
        <ReviewDialog
          mode={dialogTarget.mode}
          busy={busy}
          onCancel={() => !busy && setDialogTarget(null)}
          onConfirm={handleConfirmDialog}
        />
      )}
    </div>
  );
};

export default RegularizationReview;
