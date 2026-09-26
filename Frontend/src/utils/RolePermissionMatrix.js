import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, Loader2, RotateCcw, Save, Search, ShieldCheck, X } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import usePermission from "../../hooks/usePermission";
import {
  extractList,
  fetchModules,
  fetchRolePermissions,
  fetchRoles,
  saveRolePermissions,
} from "../../services/permissionAdminApi";
import {
  ACTIONS,
  ACTION_LABELS,
  buildTree,
  columnStatus,
  fromRows,
  isDirty,
  rowStatus,
  setColumn,
  toPayload,
  toggleAction,
  toggleRow,
  visibleIds,
} from "../../utils/permissionMatrix";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1";

// Checkbox that also supports the "some selected" (indeterminate) state.
const TriCheckbox = ({ status, onChange, disabled, label }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = status === "some";
  }, [status]);

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      checked={status === "all"}
      disabled={disabled}
      onChange={onChange}
      className={`h-4 w-4 cursor-pointer rounded border-gray-300 accent-orange-500 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
    />
  );
};

const errorMessage = (err, fallback) =>
  err?.response?.data?.message || fallback;

/**
 * Permission matrix for one role.
 *  - <RolePermissionMatrix />              page with a role selector
 *  - <RolePermissionMatrix roleId={5} />   fixed role (e.g. inside a drawer)
 * Roles, modules and permissions all come from the API, so new roles and new
 * modules appear here with no code change.
 */
export default function RolePermissionMatrix({ roleId: fixedRoleId, onSaved }) {
  const { refreshPermissions } = useAuth();
  const { canEdit } = usePermission("roles");

  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [roleId, setRoleId] = useState(fixedRoleId ?? "");
  const [saved, setSaved] = useState({});
  const [draft, setDraft] = useState({});
  const [query, setQuery] = useState("");

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const dirty = isDirty(saved, draft);
  const readOnly = !canEdit;

  /* ----------------------------- data loading ---------------------------- */

  useEffect(() => {
    let active = true;
    setLoadingMeta(true);

    Promise.all([fetchRoles(), fetchModules()])
      .then(([rolesRes, modulesRes]) => {
        if (!active) return;
        const roleList = extractList(rolesRes);
        setRoles(roleList);
        setModules(extractList(modulesRes).filter((m) => !m.trashedAt));
        setRoleId((current) => current || (roleList[0]?.id ?? ""));
      })
      .catch((err) => active && setError(errorMessage(err, "Couldn't load roles and modules.")))
      .finally(() => active && setLoadingMeta(false));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (fixedRoleId) setRoleId(fixedRoleId);
  }, [fixedRoleId]);

  useEffect(() => {
    if (!roleId) return undefined;
    let active = true;

    setLoadingPerms(true);
    setError("");

    fetchRolePermissions(roleId)
      .then((res) => {
        if (!active) return;
        const state = fromRows(extractList(res));
        setSaved(state);
        setDraft(state);
      })
      .catch((err) => active && setError(errorMessage(err, "Couldn't load permissions for this role.")))
      .finally(() => active && setLoadingPerms(false));

    return () => {
      active = false;
    };
  }, [roleId]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);

  /* ------------------------------- actions ------------------------------- */

  const changeRole = (nextId) => {
    if (dirty && !window.confirm("You have unsaved changes. Switch role and discard them?")) {
      return;
    }
    setRoleId(nextId);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const res = await saveRolePermissions(roleId, toPayload(draft));
      const state = fromRows(extractList(res));
      setSaved(state);
      setDraft(state);
      setNotice("Permissions saved.");
      refreshPermissions(); // in case the edited role is one of my own roles
      onSaved?.(roleId);
    } catch (err) {
      setError(errorMessage(err, "Couldn't save permissions. Nothing was changed."));
    } finally {
      setSaving(false);
    }
  }, [roleId, draft, refreshPermissions, onSaved]);

  /* ------------------------------- derived ------------------------------- */

  const tree = useMemo(() => buildTree(modules, query), [modules, query]);
  const ids = useMemo(() => visibleIds(tree), [tree]);
  const role = roles.find((r) => String(r.id) === String(roleId));
  const busy = loadingMeta || loadingPerms;

  const renderRow = (m, isChild) => (
    <tr key={m.id} className="border-t border-gray-100 hover:bg-orange-50/30">
      <td className={`py-3 pr-4 ${isChild ? "pl-10" : "pl-5"}`}>
        <p className={`text-sm ${isChild ? "text-gray-700" : "font-semibold text-gray-900"}`}>
          {m.moduleName}
          {String(m.status) === "0" && (
            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
              Inactive
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400">{m.slug}</p>
      </td>
      <td className="px-3 text-center">
        <TriCheckbox
          status={rowStatus(draft, m.id)}
          disabled={readOnly}
          label={`All permissions for ${m.moduleName}`}
          onChange={() => setDraft((d) => toggleRow(d, m.id))}
        />
      </td>
      {ACTIONS.map((action) => (
        <td key={action} className="px-3 text-center">
          <input
            type="checkbox"
            aria-label={`${ACTION_LABELS[action]} ${m.moduleName}`}
            checked={(draft[m.id] || []).includes(action)}
            disabled={readOnly}
            onChange={() => setDraft((d) => toggleAction(d, m.id, action))}
            className={`h-4 w-4 cursor-pointer rounded border-gray-300 accent-orange-500 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
          />
        </td>
      ))}
    </tr>
  );

  /* -------------------------------- render ------------------------------- */

  return (
    <section className="rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#0F265C]">Role permissions</h2>
            <p className="text-xs text-gray-500">
              {role?.description || "Choose what this role can see and do in each module."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {!fixedRoleId && (
            <select
              value={roleId}
              disabled={loadingMeta}
              onChange={(e) => changeRole(e.target.value)}
              aria-label="Role"
              className={`h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 ${focusRing}`}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roleName}
                </option>
              ))}
            </select>
          )}
          <label className="relative block">
            <span className="sr-only">Search modules</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search modules"
              className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-8 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-56"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </label>
        </div>
      </div>

      {/* Banners */}
      {error && (
        <div role="alert" className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          <Check size={16} className="shrink-0" />
          {notice}
        </div>
      )}
      {readOnly && !loadingMeta && (
        <p className="mx-5 mt-4 rounded-lg bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
          You can view these permissions but you don't have permission to change them.
        </p>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        {busy ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-400">
            <Loader2 size={18} className="animate-spin" /> Loading permissions...
          </div>
        ) : tree.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">
            {query ? "No modules match your search." : "No modules found."}
          </p>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-gray-50/70 text-xs uppercase tracking-wider text-gray-500">
                <th className="py-3 pl-5 pr-4 text-left font-semibold">Module</th>
                <th className="px-3 text-center font-semibold">All</th>
                {ACTIONS.map((action) => (
                  <th key={action} className="px-3 text-center font-semibold">
                    <div className="flex flex-col items-center gap-1.5">
                      {ACTION_LABELS[action]}
                      <TriCheckbox
                        status={columnStatus(draft, ids, action)}
                        disabled={readOnly}
                        label={`${ACTION_LABELS[action]} for all shown modules`}
                        onChange={() =>
                          setDraft((d) => setColumn(d, ids, action, columnStatus(d, ids, action) !== "all"))
                        }
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tree.map(({ module: parent, children }) => (
                <React.Fragment key={parent.id}>
                  {renderRow(parent, false)}
                  {children.map((child) => renderRow(child, true))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">
        <p className="text-xs text-gray-500">
          {dirty ? "You have unsaved changes." : "All changes saved."}
          <span className="ml-2 text-gray-400">Selecting any action also selects View.</span>
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDraft(saved)}
            disabled={!dirty || saving}
            className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving || readOnly}
            className={`inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save changes
          </button>
        </div>
      </div>
    </section>
  );
}