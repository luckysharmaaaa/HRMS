import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Activity,
  AlertCircle,
  Ban,
  CalendarDays,
  Check,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { FiChevronRight } from "react-icons/fi";
import LeaveSettingModal from "../components/LeaveSettingModal";
import { getLeaveSettings, updateLeaveSetting } from "../services/leaveService";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

// Accent per leave type. Derived from the leave's id/code (not list position),
// so a card keeps its colour while filtering.
const PALETTE = [
  { solid: "bg-amber-400", soft: "bg-amber-100 text-amber-700" },
  { solid: "bg-pink-500", soft: "bg-pink-100 text-pink-700" },
  { solid: "bg-lime-500", soft: "bg-lime-100 text-lime-700" },
  { solid: "bg-slate-600", soft: "bg-slate-200 text-slate-700" },
  { solid: "bg-blue-500", soft: "bg-blue-100 text-blue-700" },
  { solid: "bg-orange-500", soft: "bg-orange-100 text-orange-700" },
  { solid: "bg-purple-500", soft: "bg-purple-100 text-purple-700" },
];

const isActiveLeave = (leave) => String(leave.status) === "1";
const isPaidLeave = (leave) => Number(leave.isPaid) === 1;

const getPalette = (leave) => {
  const key = String(leave.id ?? leave.leaveCode ?? leave.leaveName ?? "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash += key.charCodeAt(i);
  return PALETTE[hash % PALETTE.length];
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2";

const useToasts = () => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      timers.current.push(setTimeout(() => dismiss(id), 3500));
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return { toasts, push, dismiss };
};

/* -------------------------------------------------------------------------- */
/*  Small components                                                          */
/* -------------------------------------------------------------------------- */

const Toasts = ({ toasts, onDismiss }) => (
  <div
    aria-live="polite"
    className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[calc(100%-3rem)] max-w-sm flex-col gap-2"
  >
    {toasts.map((t) => (
      <div
        key={t.id}
        role="status"
        className="pointer-events-auto flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-3.5 text-sm text-white shadow-xl"
      >
        {t.type === "error" ? (
          <AlertCircle size={18} className="shrink-0 text-red-400" />
        ) : (
          <Check size={18} className="shrink-0 text-green-400" />
        )}
        <span className="flex-1">{t.message}</span>
        <button
          type="button"
          onClick={() => onDismiss(t.id)}
          aria-label="Dismiss notification"
          className={`rounded p-0.5 text-gray-400 hover:text-white ${focusRing}`}
        >
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
);

const Pill = ({ tone, children }) => {
  const tones = {
    green: "bg-green-50 text-green-700 ring-green-600/20",
    gray: "bg-gray-100 text-gray-600 ring-gray-500/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const Switch = ({ checked, disabled, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${
      checked ? "bg-orange-500" : "bg-gray-300"
    }`}
  >
    <span
      className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-[22px]" : "translate-x-0.5"
      }`}
    />
  </button>
);

// Summary tile that doubles as a filter: click to filter, click again to clear.
const StatTile = ({
  icon: Icon,
  label,
  value,
  total,
  tone,
  loading,
  selected,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    aria-pressed={selected}
    className={`flex items-center gap-4 rounded-2xl border bg-white p-5 text-left shadow-sm transition disabled:cursor-default ${focusRing} ${
      selected
        ? "border-orange-500 ring-1 ring-orange-500"
        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
    }`}
  >
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}
    >
      <Icon size={22} />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-gray-500">{label}</p>
      {loading ? (
        <div className="mt-1.5 h-7 w-14 animate-pulse rounded bg-gray-200" />
      ) : (
        <p className="text-3xl font-semibold leading-tight tabular-nums text-gray-900">
          {value}
          {total != null && (
            <span className="ml-1.5 text-sm font-normal text-gray-400">of {total}</span>
          )}
        </p>
      )}
    </div>
  </button>
);

const LeaveTypeCard = ({ leave, pending, onEdit, onToggle }) => {
  const active = isActiveLeave(leave);
  const paid = isPaidLeave(leave);
  const days = Number(leave.maxBalance) || 0;
  const palette = getPalette(leave);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition-shadow hover:shadow-lg ${
        active ? "bg-white" : "bg-gray-50"
      }`}
    >
      <div aria-hidden="true" className={`h-1.5 ${active ? palette.solid : "bg-gray-300"}`} />

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${
              active ? palette.soft : "bg-gray-200 text-gray-500"
            }`}
          >
            {(leave.leaveCode || leave.leaveName || "").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              title={leave.leaveName}
              className={`truncate text-base font-semibold ${
                active ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {leave.leaveName}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {leave.leaveCode}
              </span>
              <Pill tone={paid ? "green" : "gray"}>{paid ? "Paid" : "Unpaid"}</Pill>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500">Total days</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-4xl font-semibold tabular-nums tracking-tight ${
                active ? "text-gray-900" : "text-gray-500"
              }`}
            >
              {days}
            </span>
            <span className="text-sm text-gray-500">{days === 1 ? "day" : "days"}</span>
          </p>
        </div>

        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => onEdit(leave)}
              aria-label={`Edit ${leave.leaveName}`}
              className={`inline-flex h-9 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 ${focusRing}`}
            >
              <Pencil size={14} />
              Edit
            </button>

            <div className="flex items-center gap-3">
              {pending && <Loader2 size={15} className="animate-spin text-gray-400" />}
              <span
                className={`text-sm font-medium ${active ? "text-gray-900" : "text-gray-500"}`}
              >
                {active ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={active}
                disabled={pending}
                onChange={() => onToggle(leave)}
                label={`${active ? "Deactivate" : "Activate"} ${leave.leaveName}`}
              />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const SkeletonCard = () => (
  <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <div className="h-1.5 bg-gray-200" />
    <div className="p-6">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-2xl bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-5 w-14 rounded-md bg-gray-100" />
            <div className="h-5 w-16 rounded-full bg-gray-100" />
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <div className="h-3 w-16 rounded bg-gray-100" />
        <div className="h-9 w-20 rounded bg-gray-200" />
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
        <div className="h-9 w-20 rounded-lg bg-gray-200" />
        <div className="h-6 w-28 rounded-full bg-gray-200" />
      </div>
    </div>
  </div>
);

const StateMessage = ({ icon, title, description, children }) => (
  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
      {icon}
    </div>
    <div>
      <p className="text-base font-semibold text-gray-900">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">{description}</p>
      )}
    </div>
    {children}
  </div>
);

const ConfirmDeactivateDialog = ({ leave, onCancel, onConfirm }) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!leave) return undefined;
    cancelRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [leave, onCancel]);

  if (!leave) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="deactivate-title"
        aria-describedby="deactivate-desc"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 id="deactivate-title" className="text-lg font-semibold text-gray-900">
          Deactivate {leave.leaveName}?
        </h2>
        <p id="deactivate-desc" className="mt-2 text-sm text-gray-600">
          This leave type will no longer be available for new leave requests. You can
          activate it again at any time.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={`rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${focusRing}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(leave)}
            className={`rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 ${focusRing}`}
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

const LeaveSettings = () => {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // All | Active
  const [paymentFilter, setPaymentFilter] = useState("All"); // All | Paid | Unpaid
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(null);
  const [pendingIds, setPendingIds] = useState([]);

  const mountedRef = useRef(true);
  const { toasts, push: pushToast, dismiss: dismissToast } = useToasts();

  /* ------------------------------ data loading ----------------------------- */

  // `silent` refreshes keep the current list on screen instead of showing skeletons.
  const fetchSettings = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setLoadError(false);
      try {
        const data = await getLeaveSettings();
        if (mountedRef.current) setLeaveTypes(Array.isArray(data) ? data : []);
      } catch {
        if (!mountedRef.current) return;
        if (silent) pushToast("error", "Couldn't refresh leave types. Try again.");
        else setLoadError(true);
      } finally {
        if (mountedRef.current && !silent) setLoading(false);
      }
    },
    [pushToast],
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchSettings();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSettings]);

  /* ------------------------------- actions --------------------------------- */

  const applyToggle = async (leave) => {
    const nextStatus = isActiveLeave(leave) ? "0" : "1";
    const previousStatus = leave.status;

    setPendingIds((prev) => [...prev, leave.id]);
    // Optimistic update
    setLeaveTypes((prev) =>
      prev.map((item) => (item.id === leave.id ? { ...item, status: nextStatus } : item)),
    );

    try {
      await updateLeaveSetting(leave.id, { status: nextStatus });
      pushToast(
        "success",
        `${leave.leaveName} ${nextStatus === "1" ? "activated" : "deactivated"}.`,
      );
    } catch {
      // Roll back
      if (mountedRef.current) {
        setLeaveTypes((prev) =>
          prev.map((item) =>
            item.id === leave.id ? { ...item, status: previousStatus } : item,
          ),
        );
      }
      pushToast("error", `Couldn't update ${leave.leaveName}. Try again.`);
    } finally {
      if (mountedRef.current) {
        setPendingIds((prev) => prev.filter((id) => id !== leave.id));
      }
    }
  };

  // Deactivating asks first; activating is instant.
  const requestToggle = (leave) => {
    if (pendingIds.includes(leave.id)) return;
    if (isActiveLeave(leave)) setConfirmLeave(leave);
    else applyToggle(leave);
  };

  const openCreate = () => {
    setSelectedLeave(null);
    setModalOpen(true);
  };

  const openEdit = (leave) => {
    setSelectedLeave(leave);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedLeave(null);
  };

  const handleSaved = () => {
    pushToast("success", "Leave type saved.");
    fetchSettings({ silent: true });
  };

  const clearFilters = () => {
    setStatusFilter("All");
    setPaymentFilter("All");
  };

  const clearAll = () => {
    setSearch("");
    clearFilters();
  };

  /* ------------------------------ derived data ----------------------------- */

  const stats = useMemo(() => {
    const total = leaveTypes.length;
    const paid = leaveTypes.filter(isPaidLeave).length;
    return {
      total,
      active: leaveTypes.filter(isActiveLeave).length,
      paid,
      unpaid: total - paid,
    };
  }, [leaveTypes]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leaveTypes.filter((l) => {
      const matchesSearch =
        !q ||
        (l.leaveName || "").toLowerCase().includes(q) ||
        (l.leaveCode || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || isActiveLeave(l);
      const matchesPayment =
        paymentFilter === "All" ||
        (paymentFilter === "Paid" ? isPaidLeave(l) : !isPaidLeave(l));
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [leaveTypes, search, statusFilter, paymentFilter]);

  const showTiles = !loadError && (loading || leaveTypes.length > 0);
  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== "All" || paymentFilter !== "All";

  /* --------------------------------- render -------------------------------- */

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-gray-500"
          >
            <span>Leave</span>
            <FiChevronRight size={12} aria-hidden="true" />
            <span className="font-medium text-gray-700" aria-current="page">
              Leave Types
            </span>
          </nav>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
            Leave Types
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-gray-500">
            Set up the leave policies employees can apply for, and choose which ones are
            currently available.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block sm:w-72">
            <span className="sr-only">Search leave types</span>
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              disabled={loading}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 placeholder-gray-400 transition focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 disabled:opacity-60"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700 ${focusRing}`}
              >
                <X size={15} />
              </button>
            )}
          </label>

          <button
            type="button"
            onClick={openCreate}
            className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 ${focusRing}`}
          >
            <Plus size={17} />
            Create leave type
          </button>
        </div>
      </header>

      {/* Summary tiles (click to filter) */}
      {showTiles && (
        <section
          aria-label="Leave type summary. Select a tile to filter the list."
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatTile
            icon={Layers}
            label="Total leave types"
            value={stats.total}
            tone="bg-gray-100 text-gray-700"
            loading={loading}
            selected={statusFilter === "All" && paymentFilter === "All"}
            onClick={clearFilters}
          />
          <StatTile
            icon={Activity}
            label="Active"
            value={stats.active}
            total={stats.total}
            tone="bg-orange-100 text-orange-600"
            loading={loading}
            selected={statusFilter === "Active"}
            onClick={() => setStatusFilter((v) => (v === "Active" ? "All" : "Active"))}
          />
          <StatTile
            icon={Wallet}
            label="Paid"
            value={stats.paid}
            total={stats.total}
            tone="bg-green-100 text-green-700"
            loading={loading}
            selected={paymentFilter === "Paid"}
            onClick={() => setPaymentFilter((v) => (v === "Paid" ? "All" : "Paid"))}
          />
          <StatTile
            icon={Ban}
            label="Unpaid"
            value={stats.unpaid}
            total={stats.total}
            tone="bg-slate-100 text-slate-600"
            loading={loading}
            selected={paymentFilter === "Unpaid"}
            onClick={() => setPaymentFilter((v) => (v === "Unpaid" ? "All" : "Unpaid"))}
          />
        </section>
      )}

      {/* Content */}
      {loading ? (
        <div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
          aria-label="Loading leave types"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : loadError ? (
        <StateMessage
          icon={<AlertCircle size={24} />}
          title="Couldn't load leave types"
          description="Check your connection and try again."
        >
          <button
            type="button"
            onClick={() => fetchSettings()}
            className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 ${focusRing}`}
          >
            <RefreshCw size={15} /> Try again
          </button>
        </StateMessage>
      ) : leaveTypes.length === 0 ? (
        <StateMessage
          icon={<CalendarDays size={24} />}
          title="No leave types yet"
          description="Create your first leave type so employees can start requesting time off."
        >
          <button
            type="button"
            onClick={openCreate}
            className={`inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 ${focusRing}`}
          >
            <Plus size={16} /> Create leave type
          </button>
        </StateMessage>
      ) : visible.length === 0 ? (
        <StateMessage
          icon={<Search size={24} />}
          title="No leave types found"
          description="Try a different search or clear the filters."
        >
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAll}
              className={`rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 ${focusRing}`}
            >
              Clear filters
            </button>
          )}
        </StateMessage>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((leave) => (
            <LeaveTypeCard
              key={leave.id}
              leave={leave}
              pending={pendingIds.includes(leave.id)}
              onEdit={openEdit}
              onToggle={requestToggle}
            />
          ))}
        </div>
      )}

      {/* Add / Edit drawer */}
      <LeaveSettingModal
        open={modalOpen}
        leave={selectedLeave}
        onClose={closeModal}
        onSaved={handleSaved}
      />

      <ConfirmDeactivateDialog
        leave={confirmLeave}
        onCancel={() => setConfirmLeave(null)}
        onConfirm={(leave) => {
          setConfirmLeave(null);
          applyToggle(leave);
        }}
      />

      <Toasts toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default LeaveSettings;