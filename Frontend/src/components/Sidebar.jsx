import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../services/loginAPI";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  CalendarClock,
  Settings2,
  Home,
  ClipboardEdit,
  Users,
  Building2,
  Briefcase,
  ClipboardList,
  ShieldCheck,
  UserCircle,
  BadgeCheck,
  Layers,
  LogOut,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Save your uploaded logo as: src/assets/technovatic-logo.png
// Full wordmark logo is used when expanded. At 80px collapsed width the
// full "Technovatic Solutions" wordmark cannot fit legibly, so collapsed
// state shows a small monogram instead — same pattern as Slack/Gmail.
import companyLogo from "../assets/images/logo.png";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { open, close, collapsed, toggleCollapsed } = useSidebar();
  const { hasPermission, permissionsLoaded } = useAuth();

  const isActive = (path) => location.pathname === path;
  const can = (slug) => permissionsLoaded && hasPermission(slug, "view");

  const labelCls = collapsed ? "lg:hidden" : "";
  const justifyCls = collapsed ? "lg:justify-center" : "";

  const topItem = (path) =>
    `group flex items-center gap-3 h-11 px-3.5 rounded-md text-sm font-medium transition-colors duration-fast ease-standard ${justifyCls} ${
      isActive(path)
        ? "bg-primary-50 text-primary-700 border-l-[3px] border-accent-500"
        : "text-text-secondary border-l-[3px] border-transparent hover:bg-primary-50 hover:text-primary-700"
    }`;

  const childItem = (path) =>
    `flex items-center gap-2.5 h-10 pl-[46px] pr-3.5 rounded-md text-[13.5px] transition-colors duration-fast ease-standard ${
      isActive(path)
        ? "bg-primary-50 text-primary-700 font-medium"
        : "text-text-secondary hover:bg-primary-50 hover:text-primary-700"
    }`;

  const groupHeader =
    "flex items-center justify-between h-11 px-3.5 rounded-md text-sm font-medium text-text-primary cursor-pointer hover:bg-primary-50 hover:text-primary-700 transition-colors duration-fast ease-standard";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleGroupClick = (e) => {
    if (collapsed) {
      e.preventDefault();
      toggleCollapsed();
    }
  };

  const canLeaveAdmin = can("leave-admin");
  const canLeaveEmployee = can("leave-employee");
  const canLeaveSettings = can("leave-settings");
  const canAttendanceAdmin = can("attendance-admin");
  const canAttendanceEmployee = can("attendance-employee");
  const canHoliday = can("holiday-calendar");
  const canWfh = can("wfh-management");
  const canRegularization = can("attendance-regularization");
  const showAttendanceGroup =
    canLeaveAdmin ||
    canLeaveEmployee ||
    canLeaveSettings ||
    canAttendanceAdmin ||
    canAttendanceEmployee ||
    canHoliday ||
    canWfh ||
    canRegularization;

  const canEmployeeList = can("employee-list");
  const canDepartment = can("department");
  const canDesignations = can("designations");
  const showEmployeesGroup = canEmployeeList || canDepartment || canDesignations;

  const canUsers = can("users");
  const canRoles = can("roles");
  const canModules = can("modules");

  return (
    <>
      <div
        onClick={close}
        aria-hidden={!open}
        className={`fixed inset-0 z-40 bg-black/40 lg:hidden transition-opacity duration-base ease-standard ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Expanded: 288px (w-72) · Collapsed: 80px (w-20) — kept in sync with Navbar.jsx and App.jsx margins */}
      <aside
        className={`h-screen bg-surface border-r border-border-subtle fixed left-0 top-0 z-50 flex flex-col shadow-sm
          transition-all duration-base ease-standard
          w-72 ${collapsed ? "lg:w-20" : "lg:w-72"}
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0`}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 items-center justify-center rounded-full bg-surface border border-border-subtle shadow-sm text-primary-700 hover:text-accent-500 hover:border-primary-200 transition-colors duration-fast ease-standard z-10"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* Header.
            IMPORTANT: on mobile/tablet (below lg) the sidebar is ALWAYS
            full width regardless of `collapsed` (that flag only affects
            desktop). So visibility below must key off the lg breakpoint,
            not off `collapsed` alone — plain `hidden` with no breakpoint
            was the earlier bug, hiding the logo everywhere. */}
        <div className="shrink-0 border-b border-border-subtle">
          <div className="h-16 flex items-center justify-center px-5 relative">
            <Link to="/dashboard" className="shrink-0 flex items-center">
              {/* Full wordmark: always shown below lg; shown at lg only when NOT collapsed */}
              <img
                src={companyLogo}
                alt="Technovatic Solutions"
                className={`object-contain h-11 block ${collapsed ? "lg:hidden" : ""}`}
              />

              {/* Monogram: shown at lg only when collapsed; never shown below lg */}
              {collapsed && (
                <div className="hidden lg:flex h-10 w-10 rounded-lg bg-gradient-brand items-center justify-center shadow-sm">
                  <span className="text-white font-extrabold text-sm leading-none">
                    TS
                  </span>
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={close}
              className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-primary-50 hover:text-primary-700"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>
          <div className="h-[3px] bg-gradient-brand" />
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
          <p className={`text-[10px] font-semibold text-text-disabled uppercase tracking-wider mb-2 px-3.5 ${labelCls}`}>
            Main Menu
          </p>

          <ul className="flex flex-col gap-0.5">
            <li>
              <Link to="/dashboard" title={collapsed ? "Dashboard" : undefined} className={topItem("/dashboard")}>
                <LayoutDashboard size={18} className="shrink-0" />
                <span className={labelCls}>Dashboard</span>
              </Link>
            </li>

            {showAttendanceGroup && (
              <li>
                <details className="group" open>
                  <summary
                    onClick={handleGroupClick}
                    title={collapsed ? "Attendance" : undefined}
                    className={`${groupHeader} ${justifyCls} list-none`}
                  >
                    <span className="flex items-center gap-3">
                      <CalendarCheck size={18} className="shrink-0" />
                      <span className={labelCls}>Attendance</span>
                    </span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 transition-transform duration-fast ease-standard group-open:rotate-180 ${labelCls}`}
                    />
                  </summary>

                  <ul className={`flex flex-col gap-0.5 mt-0.5 ${collapsed ? "lg:hidden" : ""}`}>
                    {canLeaveAdmin && (
                      <li>
                        <Link to="/leave-admin" className={childItem("/leave-admin")}>
                          <ClipboardCheck size={14} className="shrink-0" />
                          Leave (Admin)
                        </Link>
                      </li>
                    )}
                    {canLeaveEmployee && (
                      <li>
                        <Link to="/leave-employee" className={childItem("/leave-employee")}>
                          <CalendarClock size={14} className="shrink-0" />
                          Leave (Employee)
                        </Link>
                      </li>
                    )}
                    {canLeaveSettings && (
                      <li>
                        <Link to="/leave-setting" className={childItem("/leave-setting")}>
                          <Settings2 size={14} className="shrink-0" />
                          Leave Settings
                        </Link>
                      </li>
                    )}
                    {canAttendanceAdmin && (
                      <li>
                        <Link to="/attendance-admin" className={childItem("/attendance-admin")}>
                          <CalendarCheck size={14} className="shrink-0" />
                          Attendance (Admin)
                        </Link>
                      </li>
                    )}
                    {canAttendanceEmployee && (
                      <li>
                        <Link to="/attendance-employee" className={childItem("/attendance-employee")}>
                          <CalendarDays size={14} className="shrink-0" />
                          Attendance (Employee)
                        </Link>
                      </li>
                    )}
                    {canHoliday && (
                      <li>
                        <Link to="/holiday-calender" className={childItem("/holiday-calender")}>
                          <CalendarDays size={14} className="shrink-0" />
                          Holiday Calendar
                        </Link>
                      </li>
                    )}
                    {canWfh && (
                      <li>
                        <Link to="/wfh-management" className={childItem("/wfh-management")}>
                          <Home size={14} className="shrink-0" />
                          WFH Management
                        </Link>
                      </li>
                    )}
                    {canRegularization && (
                      <li>
                        <Link to="/attendance-regularization" className={childItem("/attendance-regularization")}>
                          <ClipboardEdit size={14} className="shrink-0" />
                          Regularization
                        </Link>
                      </li>
                    )}
                  </ul>
                </details>
              </li>
            )}

            {showEmployeesGroup && (
              <li>
                <details className="group" open>
                  <summary
                    onClick={handleGroupClick}
                    title={collapsed ? "Employees" : undefined}
                    className={`${groupHeader} ${justifyCls} list-none`}
                  >
                    <span className="flex items-center gap-3">
                      <Users size={18} className="shrink-0" />
                      <span className={labelCls}>Employees</span>
                    </span>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 transition-transform duration-fast ease-standard group-open:rotate-180 ${labelCls}`}
                    />
                  </summary>

                  <ul className={`flex flex-col gap-0.5 mt-0.5 ${collapsed ? "lg:hidden" : ""}`}>
                    {canEmployeeList && (
                      <li>
                        <Link to="/employee-list" className={childItem("/employee-list")}>
                          <ClipboardList size={14} className="shrink-0" />
                          Employee List
                        </Link>
                      </li>
                    )}
                    {canDepartment && (
                      <li>
                        <Link to="/department" className={childItem("/department")}>
                          <Building2 size={14} className="shrink-0" />
                          Department
                        </Link>
                      </li>
                    )}
                    {canDesignations && (
                      <li>
                        <Link to="/designations" className={childItem("/designations")}>
                          <Briefcase size={14} className="shrink-0" />
                          Designations
                        </Link>
                      </li>
                    )}
                  </ul>
                </details>
              </li>
            )}

            {canUsers && (
              <li>
                <Link to="/user" title={collapsed ? "Users" : undefined} className={topItem("/user")}>
                  <Users size={18} className="shrink-0" />
                  <span className={labelCls}>Users</span>
                </Link>
              </li>
            )}

            <li>
              <Link to="/profile" title={collapsed ? "Profile" : undefined} className={topItem("/profile")}>
                <UserCircle size={18} className="shrink-0" />
                <span className={labelCls}>Profile</span>
              </Link>
            </li>

            {canRoles && (
              <li>
                <Link to="/roles" title={collapsed ? "Roles" : undefined} className={topItem("/roles")}>
                  <BadgeCheck size={18} className="shrink-0" />
                  <span className={labelCls}>Roles</span>
                </Link>
              </li>
            )}

            {canRoles && (
              <li>
                <Link to="/role-permissions" title={collapsed ? "Role Permissions" : undefined} className={topItem("/role-permissions")}>
                  <ShieldCheck size={18} className="shrink-0" />
                  <span className={labelCls}>Role Permissions</span>
                </Link>
              </li>
            )}

            {canModules && (
              <li>
                <Link to="/modules" title={collapsed ? "Modules" : undefined} className={topItem("/modules")}>
                  <Layers size={18} className="shrink-0" />
                  <span className={labelCls}>Modules</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="shrink-0 h-14 px-3 border-t border-border-subtle flex items-center">
          <button
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-3 h-11 px-3.5 rounded-md text-sm font-medium text-danger-500 hover:bg-danger-50 transition-colors duration-fast ease-standard ${justifyCls}`}
          >
            <LogOut size={18} className="shrink-0" />
            <span className={labelCls}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;