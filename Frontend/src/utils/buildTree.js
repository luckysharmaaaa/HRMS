export const buildTree = (modules) => {
  const map = {};
  const roots = [];

  // Create a copy of every module
  modules.forEach((module) => {
    map[module.id] = {
      ...module,
      children: [],
    };
  });

  // Connect parent and child
  modules.forEach((module) => {
    if (module.parentId) {
      if (map[module.parentId]) {
        map[module.parentId].children.push(map[module.id]);
      }
    } else {
      roots.push(map[module.id]);
    }
  });

  return roots;
};