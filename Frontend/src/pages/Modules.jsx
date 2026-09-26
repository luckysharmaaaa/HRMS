import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
  X,
  ToggleLeft,
  ToggleRight,
  FolderOpen,
  FileText,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Inbox,
} from "lucide-react";

import {
  getAllModules,
  createModule,
  updateModule,
  deleteModule as deleteModuleApi,
} from "../services/moduleApi";

const EMPTY_FORM = { moduleName: "", parentId: "", path: "", icon: "", status: "1" };

function buildTree(flatList) {
  const byId = {};
  flatList.forEach((item) => {
    byId[item.id] = { ...item, children: [] };
  });
  const roots = [];
  flatList.forEach((item) => {
    const node = byId[item.id];
    const parent = byId[item.parentId];
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node); // no parent (or parent not in filtered list) = top level
    }
  });

  return roots;
}

// Returns the set of every descendant id of `moduleId` (children, grandchildren, ...).
// Used to stop a module from being re-parented under one of its own descendants,
// which would create a cycle and crash the recursive tree renderer.
function getDescendantIds(modules, moduleId) {
  const descendants = new Set();
  const stack = modules.filter((m) => m.parentId === moduleId).map((m) => m.id);

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (descendants.has(currentId)) continue; // guard against pre-existing bad data
    descendants.add(currentId);
    modules
      .filter((m) => m.parentId === currentId)
      .forEach((m) => stack.push(m.id));
  }

  return descendants;
}

function findModuleName(modules, id) {
  const found = modules.find((m) => m.id === id);
  return found ? found.moduleName : "—";
}

// Direct child count, used to warn before a delete that would orphan sub-modules
// (the FK is ON DELETE SET NULL, so children survive but pop up to top level).
function countDirectChildren(modules, id) {
  return modules.filter((m) => m.parentId === id).length;
}

function StatusToggle({ isActive, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title="Toggle status"
      aria-pressed={isActive}
      aria-label={isActive ? "Active — click to deactivate" : "Inactive — click to activate"}
      className="flex items-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40"
    >
      {isActive ? (
        <>
          <ToggleRight size={22} className="text-success-500" />
          <span className="text-xs text-success-600 font-medium">Active</span>
        </>
      ) : (
        <>
          <ToggleLeft size={22} className="text-text-disabled" />
          <span className="text-xs text-text-disabled font-medium">Inactive</span>
        </>
      )}
    </button>
  );
}

// One of the 3 summary boxes at the top (Total / Active / Inactive)
function StatCard({ label, value, colorClasses, icon: Icon = Layers }) {
  return (
    <div className="bg-surface rounded-xl border border-border-subtle shadow-sm hover:shadow-md transition-shadow duration-fast ease-standard px-5 py-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-lg ${colorClasses}`}>
        <Icon size={18} />
      </div>

      <div>
        <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
        <p className="text-xs text-text-secondary">{label}</p>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// TABLE ROW (renders itself, then renders its children below it)
// ------------------------------------------------------------

function ModuleRow({
  node,
  level,
  allModules,
  onEdit,
  onDelete,
  onToggleStatus,
  pendingId,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isActive = node.status === "1";
  const indentPx = level * 20; // each nesting level shifts right by 20px
  const isPending = pendingId === node.id;

  return (
    <>
      <tr className="hover:bg-primary-50 transition-colors duration-fast ease-standard group">
        {/* Module name + expand arrow + indentation */}
        <td className="px-5 py-3">
          <div
            className="flex items-center gap-2"
            style={{ paddingLeft: `${indentPx}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-text-disabled hover:text-primary-700 transition-colors duration-fast ease-standard shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
                aria-label={isExpanded ? `Collapse ${node.moduleName}` : `Expand ${node.moduleName}`}
                aria-expanded={isExpanded}
              >
                <ChevronRight
                  size={14}
                  className={`transition-transform duration-fast ease-standard ${isExpanded ? "rotate-90" : ""}`}
                />
              </button>
            ) : (
              <span className="w-3.5 shrink-0" /> // keeps alignment even with no arrow
            )}

            {level === 0 ? (
              <FolderOpen size={15} className="text-primary-700 shrink-0" />
            ) : (
              <FileText size={14} className="text-primary-300 shrink-0" />
            )}

            <span
              className={
                level === 0
                  ? "text-sm font-semibold text-text-primary"
                  : level === 1
                    ? "text-sm font-medium text-text-secondary"
                    : "text-sm text-text-secondary"
              }
            >
              {node.moduleName}
            </span>

            {hasChildren && (
              <span className="text-[10px] text-primary-700 bg-primary-50 border border-primary-100 rounded-full px-1.5 py-0.5 tabular-nums font-semibold">
                {node.children.length}
              </span>
            )}
          </div>
        </td>

        {/* Parent name */}
        <td className="px-5 py-3 text-sm text-text-secondary">
          {node.parentId ? findModuleName(allModules, node.parentId) : "—"}
        </td>

        {/* Route path */}
        <td className="px-5 py-3">
          {node.path ? (
            <code className="text-xs bg-background text-text-secondary px-2 py-0.5 rounded font-mono">
              {node.path}
            </code>
          ) : (
            <span className="text-text-disabled text-xs">—</span>
          )}
        </td>

        {/* Icon name */}
        <td className="px-5 py-3 text-sm text-text-secondary font-mono">
          {node.icon || <span className="text-text-disabled">—</span>}
        </td>

        {/* Status toggle */}
        <td className="px-5 py-3">
          <StatusToggle
            isActive={isActive}
            disabled={isPending}
            onClick={() => onToggleStatus(node.id, node.status)}
          />
        </td>

        {/* Edit / Delete buttons — visible on row hover or keyboard focus */}
        <td className="px-5 py-3">
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-fast ease-standard">
            <button
              onClick={() => onEdit(node)}
              className="p-1.5 rounded-lg hover:bg-primary-50 hover:text-primary-700 text-text-disabled transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
              title="Edit"
              aria-label={`Edit ${node.moduleName}`}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(node)}
              className="p-1.5 rounded-lg hover:bg-danger-50 hover:text-danger-500 text-text-disabled transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500/30"
              title="Delete"
              aria-label={`Delete ${node.moduleName}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {/* Recursively render child rows underneath, only if expanded */}
      {isExpanded &&
        node.children.map((child) => (
          <ModuleRow
            key={child.id}
            node={child}
            level={level + 1}
            allModules={allModules}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStatus={onToggleStatus}
            pendingId={pendingId}
          />
        ))}
    </>
  );
}

// ------------------------------------------------------------
// SKELETON ROWS (shown while the initial fetch is in flight)
// ------------------------------------------------------------

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <tr key={i}>
          <td className="px-5 py-3" colSpan={6}>
            <div
              className="h-4 bg-border-subtle rounded animate-pulse"
              style={{ width: `${70 - i * 8}%`, marginLeft: i > 2 ? 20 : 0 }}
            />
          </td>
        </tr>
      ))}
    </>
  );
}

// ------------------------------------------------------------
// MODALS
// ------------------------------------------------------------

// Shared modal shell: backdrop, Escape-to-close, and a11y dialog semantics.
function ModalShell({ onClose, children, labelledBy, maxWidth = "max-w-md" }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative bg-surface rounded-lg shadow-lg w-full ${maxWidth} mx-4 z-10`}
      >
        {children}
      </div>
    </div>
  );
}

// Add/Edit form modal. If `editData` is null -> "Add" mode, otherwise "Edit" mode.
function ModuleFormModal({ isOpen, onClose, editData, allModules, onSave }) {
  const [form, setForm] = useState(editData ?? EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const nameInputRef = useRef(null);

  // Whenever the modal is opened (or which module we're editing changes),
  // reset the form to match.
  useEffect(() => {
    setForm(editData ?? EMPTY_FORM);
    setFormError(null);
    setIsSaving(false);
  }, [editData, isOpen]);

  // Put the cursor straight in the first field so keyboard users don't
  // have to tab past the header to start typing.
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => nameInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Can't set a module as its own parent, and can't set it as a child of one of
  // its own descendants either — that would create a cycle in the tree and blow
  // the stack in ModuleRow's recursive rendering.
  const blockedIds = editData
    ? new Set([editData.id, ...getDescendantIds(allModules, editData.id)])
    : new Set();
  const parentOptions = allModules.filter((m) => !blockedIds.has(m.id));

  const trimmedName = form.moduleName.trim();
  const canSubmit = trimmedName.length > 0 && !isSaving;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSaving(true);
    setFormError(null);
    try {
      await onSave({ ...form, moduleName: trimmedName });
      // On success the parent closes the modal; nothing else to do here.
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          "Couldn't save this module. Please try again."
      );
      setIsSaving(false);
    }
  }

  function toggleFormStatus() {
    setForm((prev) => ({ ...prev, status: prev.status === "1" ? "0" : "1" }));
  }

  return (
    <ModalShell onClose={onClose} labelledBy="module-form-title" maxWidth="max-w-md">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-surface">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-accent-500/10 text-accent-500 rounded-xl shrink-0 shadow-sm border border-accent-500/20">
            <Layers size={22} />
          </div>

          <div>
            <h2 id="module-form-title" className="text-2xl font-bold text-primary-700 tracking-tight leading-tight">
              {editData ? "Edit Module" : "Add Module"}
            </h2>

            <p className="text-xs text-text-secondary font-medium mt-1">
              {editData
                ? "Update configuration parameters for this module"
                : "Register a new feature module in the system"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-text-disabled hover:text-text-primary transition-colors duration-fast ease-standard p-1 rounded-lg hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>
      </div>

      {/* Form fields */}
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 bg-danger-50 border border-danger-500/20 text-danger-600 text-xs rounded-lg px-3.5 py-2.5"
          >
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <div>
          <label htmlFor="moduleName" className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Module Name <span className="text-danger-500">*</span>
          </label>
          <input
            id="moduleName"
            ref={nameInputRef}
            required
            value={form.moduleName}
            onChange={(e) => setForm({ ...form, moduleName: e.target.value })}
            placeholder="e.g. Leave Management"
            className="w-full border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 transition-colors duration-fast ease-standard"
          />
        </div>

        <div>
          <label htmlFor="parentId" className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Parent Module
          </label>
          <select
            id="parentId"
            value={form.parentId ?? ""}
            onChange={(e) =>
              setForm({ ...form, parentId: e.target.value || null })
            }
            className="w-full border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 transition-colors duration-fast ease-standard bg-surface"
          >
            <option value="">— None (Top Level) —</option>
            {parentOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.moduleName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="path" className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Route Path
          </label>
          <input
            id="path"
            value={form.path ?? ""}
            onChange={(e) => setForm({ ...form, path: e.target.value })}
            placeholder="e.g. /apply-leave"
            className="w-full border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-text-primary font-mono outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 transition-colors duration-fast ease-standard"
          />
        </div>

        <div>
          <label htmlFor="icon" className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Icon Name
          </label>
          <input
            id="icon"
            value={form.icon ?? ""}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="e.g. LayoutDashboard"
            className="w-full border border-border-subtle rounded-lg px-3.5 py-2.5 text-sm text-text-primary font-mono outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 transition-colors duration-fast ease-standard"
          />
          <p className="text-[11px] text-text-secondary mt-1">
            Use Lucide icon component names (e.g. FileText, Users)
          </p>
        </div>

        <div className="flex items-center justify-between bg-background rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text-primary">Active Status</p>
            <p className="text-xs text-text-secondary">Module will appear in navigation when active</p>
          </div>
          <button type="button" onClick={toggleFormStatus} aria-pressed={form.status === "1"} aria-label="Toggle active status">
            {form.status === "1" ? (
              <ToggleRight size={28} className="text-success-500" />
            ) : (
              <ToggleLeft size={28} className="text-text-disabled" />
            )}
          </button>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 border border-border-strong text-text-primary rounded-lg text-sm font-medium hover:bg-background bg-surface transition-colors duration-fast ease-standard disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 px-6 py-2.5 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-semibold transition-colors duration-fast ease-standard shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 size={15} className="animate-spin" />}
            {isSaving ? "Saving…" : editData ? "Update Module" : "Add Module"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// Confirmation popup shown before actually deleting a module
function DeleteConfirmModal({ module, onClose, onConfirm, childCount }) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsDeleting(false);
  }, [module]);

  if (!module) return null;

  async function handleConfirm() {
    setIsDeleting(true);
    await onConfirm(module.id);
    // Parent closes the modal once the delete settles; if it fails, parent
    // keeps this open so the disabled state below should be reset.
    setIsDeleting(false);
  }

  return (
    <ModalShell onClose={onClose} labelledBy="delete-module-title" maxWidth="max-w-sm">
      <div className="p-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="p-3 bg-danger-50 rounded-full">
            <AlertTriangle size={24} className="text-danger-500" />
          </div>

          <h3 id="delete-module-title" className="text-base font-semibold text-text-primary">
            Delete Module?
          </h3>
          <p className="text-sm text-text-secondary">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-text-primary">"{module.moduleName}"</span>? This action cannot be undone.
          </p>

          {childCount > 0 && (
            <p className="text-xs text-warning-600 bg-warning-50 border border-warning-500/20 rounded-lg px-3 py-2 text-left">
              This module has {childCount} sub-module{childCount !== 1 ? "s" : ""}. They won't be
              deleted, but will move up to the top level of the menu.
            </p>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 border border-border-subtle text-text-secondary py-2.5 rounded-lg text-sm font-medium hover:bg-background transition-colors duration-fast ease-standard disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 bg-danger-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-danger-600 transition-colors duration-fast ease-standard disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            {isDeleting ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ------------------------------------------------------------
// MAIN PAGE — owns all the state, wires everything together
// ------------------------------------------------------------

export default function Modules() {
  // --- state ---
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null); // null = "add" mode
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [pendingToggleId, setPendingToggleId] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  // --- derived data ---
  const matchesSearch = (m) =>
    m.moduleName.toLowerCase().includes(searchText.toLowerCase());
  const visibleModules = searchText ? modules.filter(matchesSearch) : modules;
  const tree = buildTree(visibleModules);

  const activeCount = modules.filter((m) => m.status === "1").length;
  const inactiveCount = modules.filter((m) => m.status === "0").length;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // --- data fetch ---
  const fetchModules = useCallback(async ({ silent } = {}) => {
    if (!silent) setIsLoading(true);
    setLoadError(null);
    try {
      const response = await getAllModules();
      setModules(response.data.data);
    } catch (error) {
      console.error("Error fetching modules:", error);
      setLoadError("Couldn't load modules. Check your connection and try again.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  // --- actions ---
  function openAddForm() {
    setEditingModule(null);
    setIsFormOpen(true);
  }

  function openEditForm(module) {
    // `module` comes from the rendered tree, so it carries a `children` array
    // tacked on by buildTree. Strip that (and any other tree-only fields)
    // before it becomes form state, so it doesn't get sent back to the API.
    const { children, ...cleanModule } = module;
    setEditingModule(cleanModule);
    setIsFormOpen(true);
  }

  // Called by the modal on submit. Handles both create + update.
  // Throws back to the modal on failure so it can show an inline error
  // and stay open, instead of silently failing.
  async function handleSaveModule(formData) {
    if (editingModule) {
      await updateModule(editingModule.id, formData);
      setToast({ type: "success", message: `"${formData.moduleName}" updated.` });
    } else {
      await createModule(formData);
      setToast({ type: "success", message: `"${formData.moduleName}" added.` });
    }
    await fetchModules({ silent: true });
    setIsFormOpen(false);
  }

  async function toggleModuleStatus(id, currentStatus) {
    setPendingToggleId(id);
    try {
      await updateModule(id, {
        status: currentStatus === "1" ? "0" : "1",
      });
      await fetchModules({ silent: true });
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Couldn't update status. Please try again." });
    } finally {
      setPendingToggleId(null);
    }
  }

  async function deleteModule(id) {
    const target = modules.find((m) => m.id === id);
    try {
      await deleteModuleApi(id);
      await fetchModules({ silent: true });
      setModuleToDelete(null);
      setToast({ type: "success", message: `"${target?.moduleName ?? "Module"}" deleted.` });
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Couldn't delete this module. Please try again." });
    }
  }

  // --- render ---
  return (
    <div className="space-y-6">
      {/* Header banner — brand navy gradient, shared style with every other page banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-brand px-6 py-7 shadow-lg">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-10 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 border border-white/10 rounded-xl backdrop-blur-sm shrink-0">
              <Layers size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Modules</h1>
              <p className="text-sm text-white/70 mt-0.5">
                Manage navigation modules and their hierarchy
              </p>
            </div>
          </div>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-500 text-white text-sm font-semibold rounded-lg hover:bg-accent-600 transition-colors duration-fast ease-standard shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <Plus size={16} />
            Add Module
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Modules" value={modules.length} colorClasses="bg-primary-50 text-primary-700" icon={Layers} />
        <StatCard label="Active" value={activeCount} colorClasses="bg-success-50 text-success-600" icon={ToggleRight} />
        <StatCard label="Inactive" value={inactiveCount} colorClasses="bg-danger-50 text-danger-500" icon={ToggleLeft} />
      </div>

      {/* Table card */}
      <div className="bg-surface rounded-xl shadow-md border border-border-subtle">
        {/* Toolbar: title + search box */}
        <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-sm font-semibold text-text-primary shrink-0">
            Module Tree
          </h2>

          <div className="flex items-center gap-2 border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-secondary w-full sm:w-64 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-colors duration-fast ease-standard">
            <Search size={14} className="shrink-0 text-text-disabled" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search modules..."
              aria-label="Search modules"
              className="outline-none text-sm flex-1 placeholder-text-disabled bg-transparent"
            />
            {searchText && (
              <button onClick={() => setSearchText("")} className="text-text-disabled hover:text-text-primary" aria-label="Clear search">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-primary-700/60 uppercase tracking-wider border-b border-primary-100 bg-primary-50/60">
                <th className="px-5 py-3 font-semibold">Module Name</th>
                <th className="px-5 py-3 font-semibold">Parent</th>
                <th className="px-5 py-3 font-semibold">Path</th>
                <th className="px-5 py-3 font-semibold">Icon</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <SkeletonRows />
              ) : loadError ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <AlertTriangle size={22} className="text-danger-500" />
                      <p className="text-sm text-text-secondary">{loadError}</p>
                      <button
                        onClick={() => fetchModules()}
                        className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-500 hover:text-accent-600"
                      >
                        <RefreshCw size={12} />
                        Try again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : tree.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Inbox size={22} className="text-border-strong" />
                      {searchText ? (
                        <>
                          <p className="text-sm text-text-secondary">
                            No modules match "{searchText}".
                          </p>
                          <button
                            onClick={() => setSearchText("")}
                            className="text-xs font-semibold text-accent-500 hover:text-accent-600"
                          >
                            Clear search
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-text-secondary">No modules yet.</p>
                          <button
                            onClick={openAddForm}
                            className="text-xs font-semibold text-accent-500 hover:text-accent-600"
                          >
                            Add your first module
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                tree.map((node) => (
                  <ModuleRow
                    key={node.id}
                    node={node}
                    level={0}
                    allModules={modules}
                    onEdit={openEditForm}
                    onDelete={setModuleToDelete}
                    onToggleStatus={toggleModuleStatus}
                    pendingId={pendingToggleId}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="px-5 py-3 border-t border-border-subtle text-xs text-text-secondary">
          {searchText
            ? `Showing ${visibleModules.length} of ${modules.length} module${modules.length !== 1 ? "s" : ""}`
            : `Showing ${modules.length} module${modules.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Modals */}
      <ModuleFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editData={editingModule}
        allModules={modules}
        onSave={handleSaveModule}
      />
      <DeleteConfirmModal
        module={moduleToDelete}
        childCount={moduleToDelete ? countDirectChildren(modules, moduleToDelete.id) : 0}
        onClose={() => setModuleToDelete(null)}
        onConfirm={deleteModule}
      />

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === "error" ? "bg-danger-500" : "bg-primary-800"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}