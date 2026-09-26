import React, { useState } from "react";

const actions = ["view", "add", "edit", "delete", "approved"];

const PermissionTree = ({
  modules,
  selectedModules,
  setSelectedModules,
  permissions,
  setPermissions,
}) => {
  const [expanded, setExpanded] = useState({});

  // Expand / Collapse
  const toggleExpand = (id) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Select Module
  const toggleModule = (moduleId) => {
    if (selectedModules.includes(moduleId)) {
      setSelectedModules(selectedModules.filter((id) => id !== moduleId));

      setPermissions(
        permissions.filter((item) => item.moduleId !== moduleId)
      );
    } else {
      setSelectedModules([...selectedModules, moduleId]);
    }
  };

  // Select Permission
  const togglePermission = (moduleId, action) => {
    const index = permissions.findIndex((p) => p.moduleId === moduleId);

    if (index === -1) {
      setPermissions([
        ...permissions,
        {
          moduleId,
          actions: [action],
        },
      ]);
      return;
    }

    const copy = [...permissions];

    if (copy[index].actions.includes(action)) {
      copy[index].actions = copy[index].actions.filter(
        (a) => a !== action
      );
    } else {
      copy[index].actions.push(action);
    }

    setPermissions(copy);
  };

  const hasPermission = (moduleId, action) => {
    const permission = permissions.find((p) => p.moduleId === moduleId);

    if (!permission) return false;

    return permission.actions.includes(action);
  };

  const renderRow = (module, level = 0) => {
    return (
      <React.Fragment key={module.id}>
        <tr>
          <td>
            <div
              style={{
                paddingLeft: `${level * 20}px`,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {module.children.length > 0 && (
                <button
                  type="button"
                  onClick={() => toggleExpand(module.id)}
                >
                  {expanded[module.id] ? "-" : "+"}
                </button>
              )}

              <input
                type="checkbox"
                checked={selectedModules.includes(module.id)}
                onChange={() => toggleModule(module.id)}
              />

              {module.moduleName}
            </div>
          </td>

          {actions.map((action) => (
            <td key={action} align="center">
              <input
                type="checkbox"
                checked={hasPermission(module.id, action)}
                onChange={() =>
                  togglePermission(module.id, action)
                }
              />
            </td>
          ))}
        </tr>

        {expanded[module.id] &&
          module.children.map((child) =>
            renderRow(child, level + 1)
          )}
      </React.Fragment>
    );
  };

  return (
    <table
      className="table table-bordered"
      style={{ width: "100%" }}
    >
      <thead>
        <tr>
          <th>Module</th>
          <th>View</th>
          <th>Add</th>
          <th>Edit</th>
          <th>Delete</th>
          <th>Approved</th>
        </tr>
      </thead>

      <tbody>
        {modules.map((module) => renderRow(module))}
      </tbody>
    </table>
  );
};

export default PermissionTree;