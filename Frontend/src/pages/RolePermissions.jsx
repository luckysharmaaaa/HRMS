import React from "react";
import { ChevronRight } from "lucide-react";
import RolePermissionMatrix from "../components/rbac/RolePermissionMatrix";

export default function RolePermissions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F265C]">Role Permissions</h1>
        <nav className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
          <span>Access Control</span>
          <ChevronRight size={12} />
          <span className="font-medium text-orange-500">Role Permissions</span>
        </nav>
      </div>

      <RolePermissionMatrix />
    </div>
  );
}