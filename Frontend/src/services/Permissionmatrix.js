// Pure helpers for the role-permission matrix. No React, no API calls, so the
// rules are easy to test. State shape: { [moduleId]: ["view","add",...] }
// with actions always kept in ACTIONS order.

export const ACTIONS = ["view", "add", "edit", "approved", "delete"];

export const ACTION_LABELS = {
  view: "View",
  add: "Add",
  edit: "Edit",
  approved: "Approved",
  delete: "Delete",
};

const ordered = (list) => ACTIONS.filter((a) => list.includes(a));

/** role_permissions rows -> matrix state */
export const fromRows = (rows = []) => {
  const state = {};
  rows.forEach((row) => {
    if (!ACTIONS.includes(row.action)) return;
    const id = Number(row.moduleId);
    state[id] = ordered([...(state[id] || []), row.action]);
  });
  return state;
};

const has = (state, id, action) => (state[id] || []).includes(action);

const withActions = (state, id, actions) => {
  const next = { ...state };
  if (actions.length === 0) delete next[id];
  else next[id] = ordered(actions);
  return next;
};

/**
 * Rules (also enforced by the API):
 *  - ticking Add/Edit/Approved/Delete also ticks View
 *  - unticking View clears every action of that module
 */
export const toggleAction = (state, id, action) => {
  const current = state[id] || [];

  if (current.includes(action)) {
    return action === "view"
      ? withActions(state, id, [])
      : withActions(state, id, current.filter((a) => a !== action));
  }

  return withActions(state, id, [...current, action, "view"]);
};

/** "All" checkbox of one row. */
export const toggleRow = (state, id) =>
  (state[id] || []).length === ACTIONS.length
    ? withActions(state, id, [])
    : withActions(state, id, ACTIONS);

/** Header checkbox of one column, applied to the given (visible) modules. */
export const setColumn = (state, ids, action, on) => {
  let next = state;
  ids.forEach((id) => {
    const current = next[id] || [];
    if (on) {
      next = withActions(next, id, [...current, action, "view"]);
    } else if (action === "view") {
      next = withActions(next, id, []);
    } else {
      next = withActions(next, id, current.filter((a) => a !== action));
    }
  });
  return next;
};

/** "none" | "some" | "all" for a row. */
export const rowStatus = (state, id) => {
  const n = (state[id] || []).length;
  return n === 0 ? "none" : n === ACTIONS.length ? "all" : "some";
};

/** "none" | "some" | "all" for a column across the given modules. */
export const columnStatus = (state, ids, action) => {
  if (ids.length === 0) return "none";
  const n = ids.filter((id) => has(state, id, action)).length;
  return n === 0 ? "none" : n === ids.length ? "all" : "some";
};

export const isDirty = (a, b) => {
  const norm = (s) =>
    Object.keys(s)
      .filter((k) => s[k].length > 0)
      .sort((x, y) => Number(x) - Number(y))
      .map((k) => `${k}:${s[k].join(",")}`)
      .join("|");
  return norm(a) !== norm(b);
};

/** matrix state -> body for POST /role-permissions/sync */
export const toPayload = (state) =>
  Object.keys(state)
    .filter((k) => state[k].length > 0)
    .map((k) => ({ moduleId: Number(k), actions: state[k] }));

/**
 * Flat module list -> [{ module, children: [module, ...] }] using parentId.
 * A search keeps a parent if it or any child matches, and shows only the
 * matching children (or all children when the parent itself matches).
 */
export const buildTree = (modules = [], query = "") => {
  const q = query.trim().toLowerCase();
  const matches = (m) =>
    !q ||
    String(m.moduleName || "").toLowerCase().includes(q) ||
    String(m.slug || "").toLowerCase().includes(q);

  const byId = new Map(modules.map((m) => [m.id, m]));
  const childrenOf = new Map();
  const roots = [];

  modules.forEach((m) => {
    if (m.parentId && byId.has(m.parentId)) {
      childrenOf.set(m.parentId, [...(childrenOf.get(m.parentId) || []), m]);
    } else {
      roots.push(m);
    }
  });

  const byName = (a, b) => String(a.moduleName).localeCompare(String(b.moduleName));

  return roots
    .sort(byName)
    .map((root) => {
      const kids = (childrenOf.get(root.id) || []).sort(byName);
      const shownKids = matches(root) ? kids : kids.filter(matches);
      return { module: root, children: shownKids, keep: matches(root) || shownKids.length > 0 };
    })
    .filter((n) => n.keep)
    .map(({ module, children }) => ({ module, children }));
};

/** ids of every module row currently shown in a tree. */
export const visibleIds = (tree) =>
  tree.flatMap((n) => [n.module.id, ...n.children.map((c) => c.id)]);