import React, { useEffect, useState } from "react";
import api from "../services/api";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const permissionColumns = [
  "view",
  "add",
  "edit",
  "approved",
  "delete",
];

const permissionLabels = {
  view: "View",
  add: "Add",
  edit: "Edit",
  approved: "Approved",
  delete: "Delete",
};

const PermissionCheckbox = ({
  checked,
  disabled = false,
  indeterminate = false,
  onChange,
  ariaLabel,
}) => {
  const checkboxRef = React.useRef(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      aria-label={ariaLabel}
      className="
        checkbox checkbox-sm
        border-gray-300
        checked:border-orange-500
        checked:bg-orange-500
        checked:text-white
        focus:ring-2
        focus:ring-orange-100
        focus:ring-offset-0
        disabled:opacity-40
        disabled:cursor-not-allowed
        cursor-pointer
        transition-all
      "
    />
  );
};

const RolePermissionTable = ({
  role,
  selectedModules,
  setSelectedModules,
  permissions,
  setPermissions,
}) => {
  const [modules, setModules] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (role?.id) {
      loadRoleData(role.id);
    } else {
      setSelectedModules([]);
      setPermissions({});
    }
  }, [role]);

  const loadModules = async () => {
    try {
      setLoading(true);

      const res = await api.get("/modules");
      const list = Array.isArray(res.data.data) ? res.data.data : [];
      const tree = buildTree(list);

      setModules(tree);

      const expandState = {};

      const expandAll = (items) => {
        items.forEach((item) => {
          expandState[item.id] = true;

          if (item.children?.length) {
            expandAll(item.children);
          }
        });
      };

      expandAll(tree);
      setExpanded(expandState);
    } catch (error) {
      console.error("Failed to load modules:", error);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoleData = async (roleId) => {
    try {
      setLoading(true);

      const [moduleRes, permissionRes] = await Promise.all([
        api.get(`/role-module-mapping/${roleId}`),
        api.get(`/role-permissions/${roleId}`),
      ]);

      const moduleData = Array.isArray(moduleRes.data.data)
        ? moduleRes.data.data
        : [];

      const moduleIds = moduleData
        .map((item) => item.moduleId)
        .filter(Boolean);

      setSelectedModules(moduleIds);

      const permissionObject = {};

      const permissionData = Array.isArray(permissionRes.data.data)
        ? permissionRes.data.data
        : [];

      permissionData.forEach((item) => {
        if (!permissionObject[item.moduleId]) {
          permissionObject[item.moduleId] = {};
        }

        permissionObject[item.moduleId][item.action] = true;
      });

      setPermissions(permissionObject);
    } catch (error) {
      console.error("Failed to load role permissions:", error);
      setSelectedModules([]);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };

  const buildTree = (list) => {
    const map = {};

    list.forEach((item) => {
      map[item.id] = {
        ...item,
        children: [],
      };
    });

    const roots = [];

    list.forEach((item) => {
      if (item.parentId && map[item.parentId]) {
        map[item.parentId].children.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });

    return roots;
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isModuleSelected = (moduleId) => {
    return selectedModules.includes(moduleId);
  };

  const hasPermission = (moduleId, action) => {
    return Boolean(permissions[moduleId]?.[action]);
  };

  const getDescendantIds = (module) => {
    const ids = [];

    const walk = (items) => {
      items.forEach((item) => {
        ids.push(item.id);

        if (item.children?.length) {
          walk(item.children);
        }
      });
    };

    walk(module.children || []);

    return ids;
  };

  const getAllModuleIds = (module) => {
    return [module.id, ...getDescendantIds(module)];
  };

  const getModuleCheckboxState = (module) => {
    const selected = isModuleSelected(module.id);
    const descendants = getDescendantIds(module);

    if (!descendants.length) {
      return {
        checked: selected,
        indeterminate: false,
      };
    }

    const selectedDescendants = descendants.filter((id) =>
      selectedModules.includes(id)
    );

    const allSelected =
      selected && selectedDescendants.length === descendants.length;

    const partiallySelected =
      selectedDescendants.length > 0 &&
      selectedDescendants.length < descendants.length;

    return {
      checked: allSelected,
      indeterminate: partiallySelected || (selected && !allSelected),
    };
  };

  const removePermissionsForModules = (moduleIds, current) => {
    const next = { ...current };

    moduleIds.forEach((id) => {
      delete next[id];
    });

    return next;
  };

  const toggleModule = (module) => {
    const moduleIds = getAllModuleIds(module);
    const currentlySelected = isModuleSelected(module.id);

    if (currentlySelected) {
      setSelectedModules((prev) =>
        prev.filter((id) => !moduleIds.includes(id))
      );

      setPermissions((prev) =>
        removePermissionsForModules(moduleIds, prev)
      );

      return;
    }

    setSelectedModules((prev) => {
      const next = new Set(prev);

      moduleIds.forEach((id) => next.add(id));

      return Array.from(next);
    });
  };

  const togglePermission = (moduleId, action) => {
    if (!isModuleSelected(moduleId)) {
      setSelectedModules((prev) =>
        prev.includes(moduleId) ? prev : [...prev, moduleId]
      );
    }

    setPermissions((prev) => {
      const current = prev[moduleId] || {};
      const nextValue = !current[action];

      const nextModulePermissions = {
        ...current,
        [action]: nextValue,
      };

      if (!Object.values(nextModulePermissions).some(Boolean)) {
        const next = { ...prev };
        delete next[moduleId];
        return next;
      }

      return {
        ...prev,
        [moduleId]: nextModulePermissions,
      };
    });
  };

  const areAllPermissionsSelected = (moduleId) => {
    return permissionColumns.every((action) =>
      hasPermission(moduleId, action)
    );
  };

  const hasSomePermission = (moduleId) => {
    return permissionColumns.some((action) =>
      hasPermission(moduleId, action)
    );
  };

  const toggleAllPermissions = (moduleId) => {
    if (!isModuleSelected(moduleId)) {
      setSelectedModules((prev) =>
        prev.includes(moduleId) ? prev : [...prev, moduleId]
      );
    }

    const shouldSelectAll = !areAllPermissionsSelected(moduleId);

    setPermissions((prev) => {
      if (!shouldSelectAll) {
        const next = { ...prev };
        delete next[moduleId];
        return next;
      }

      const allPermissions = {};

      permissionColumns.forEach((action) => {
        allPermissions[action] = true;
      });

      return {
        ...prev,
        [moduleId]: allPermissions,
      };
    });
  };

  const renderRows = (items, level = 0) => {
    return items.map((module) => {
      const moduleState = getModuleCheckboxState(module);
      const allPermissionsSelected = areAllPermissionsSelected(module.id);
      const somePermissionsSelected = hasSomePermission(module.id);

      return (
        <React.Fragment key={module.id}>
          <tr className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors">
            <td className="px-4 py-3">
              <div
                className="flex items-center min-w-0"
                style={{ paddingLeft: `${level * 22}px` }}
              >
                {module.children?.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(module.id)}
                    aria-label={
                      expanded[module.id]
                        ? `Collapse ${module.moduleName}`
                        : `Expand ${module.moduleName}`
                    }
                    className="
                      mr-1.5 p-1 rounded-md text-gray-400
                      hover:text-orange-500 hover:bg-orange-50
                      transition shrink-0
                    "
                  >
                    {expanded[module.id] ? (
                      <FiChevronDown size={16} />
                    ) : (
                      <FiChevronRight size={16} />
                    )}
                  </button>
                ) : (
                  <div className="w-7 shrink-0" />
                )}

                <PermissionCheckbox
                  checked={moduleState.checked}
                  indeterminate={moduleState.indeterminate}
                  onChange={() => toggleModule(module)}
                  ariaLabel={`Select ${module.moduleName} module`}
                />

                <span
                  className={`
                    ml-3 truncate
                    ${
                      level === 0
                        ? "font-semibold text-gray-800"
                        : "font-medium text-gray-600"
                    }
                  `}
                >
                  {module.moduleName}
                </span>
              </div>
            </td>

            {/* ALL - FIRST */}
            <td className="text-center px-3 py-3 border-l border-gray-100">
              <PermissionCheckbox
                checked={allPermissionsSelected}
                indeterminate={
                  somePermissionsSelected && !allPermissionsSelected
                }
                disabled={!isModuleSelected(module.id)}
                onChange={() => toggleAllPermissions(module.id)}
                ariaLabel={`All permissions for ${module.moduleName}`}
              />
            </td>

            {/* INDIVIDUAL PERMISSIONS */}
            {permissionColumns.map((action) => (
              <td
                key={action}
                className="text-center px-3 py-3"
              >
                <PermissionCheckbox
                  checked={hasPermission(module.id, action)}
                  disabled={!isModuleSelected(module.id)}
                  onChange={() => togglePermission(module.id, action)}
                  ariaLabel={`${permissionLabels[action]} permission for ${module.moduleName}`}
                />
              </td>
            ))}
          </tr>

          {expanded[module.id] &&
            module.children?.length > 0 &&
            renderRows(module.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-md text-orange-500" />
          <p className="text-sm text-gray-400">
            Loading permissions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              <th
                className="
                  min-w-[270px] px-4 py-3 text-left
                  text-[11px] font-bold uppercase tracking-wider
                  text-gray-500 bg-gray-50
                "
              >
                Module
              </th>

              {/* ALL - FIRST OPTION */}
              <th
                className="
                  min-w-[70px] px-2 py-3 text-center
                  text-[11px] font-bold uppercase tracking-wider
                  text-orange-600 bg-orange-50
                "
              >
                All
              </th>

              {permissionColumns.map((action) => (
                <th
                  key={action}
                  className="
                    min-w-[70px] px-2 py-3 text-center
                    text-[11px] font-bold uppercase tracking-wider
                    text-gray-500 bg-gray-50
                  "
                >
                  {permissionLabels[action]}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {modules.length === 0 ? (
              <tr>
                <td
                  colSpan={permissionColumns.length + 2}
                  className="py-12 text-center text-sm text-gray-400"
                >
                  No modules found.
                </td>
              </tr>
            ) : (
              renderRows(modules)
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Select a module first, then choose the permissions required
          for that module. Use "All" to enable or disable every
          permission at once.
        </p>
      </div>
    </div>
  );
};

export default RolePermissionTable;
