import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";
import { FORBIDDEN_EVENT } from "./services/api";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

// RBAC route guards
import RequireAuth from "./components/rbac/RequireAuth";
import RequirePermission from "./components/rbac/RequirePermission";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import User from "./pages/User";
import Profile from "./pages/Profile/Profile";
import Roles from "./pages/Roles";
import Modules from "./pages/Modules";
import RolePermissions from "../src/pages/RolePermissions";
import LeaveAdmin from "./pages/LeaveAdmin";
import LeaveEmployee from "./pages/LeaveEmployee";
import LeaveSetting from "./pages/LeaveSetting";

import AttendanceAdmin from "./pages/AttendanceAdmin";
import AttendanceEmployee from "./pages/AttendanceEmployee";

import HolidayCalender from "./pages/HolidayCalender";
import WfhManagement from "./pages/WfhManagement";

import EmployeeList from "./pages/EmployeeList";
import EmployeeDetail from "./pages/EmployeeDetail";
import Designation from "./pages/Designation";
import Department from "./pages/Department";

import AttendanceRegularizationAdmin from "./pages/AttendanceRegularizationAdmin";

// Auth Pages
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FirstTimeAccess from "./pages/Firsttimeaccess";

// ─────────────────────────────────────────────────────────────────────────
// MUI Theme — full palette + shape sync so every MUI component (Chip,
// Alert, Select, DatePicker, Button, TextField) matches the same brand
// tokens defined in index.css, instead of mixing MUI defaults (Roboto,
// MUI blue/green/orange) with our own colors.
// ─────────────────────────────────────────────────────────────────────────
const muiTheme = createTheme({
  typography: {
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
  },
  shape: {
    borderRadius: 10, // matches --radius-md in index.css — keeps MUI corners in sync with Tailwind
  },
  palette: {
    primary: { main: "#041D5F", light: "#0F265C", dark: "#031646" },
    secondary: { main: "#F97316", light: "#FB923C", dark: "#EA580C" }, // brand accent orange
    success: { main: "#22C55E", dark: "#16A34A" },
    warning: { main: "#F59E0B", dark: "#D97706" }, // true semantic warning amber, distinct from brand orange
    error: { main: "#EF4444", dark: "#DC2626" },
    info: { main: "#3B82F6", dark: "#2563EB" },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow:
            "0 1px 2px 0 rgb(4 29 95 / 0.04), 0 1px 3px 0 rgb(4 29 95 / 0.06)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────
// guard(slug, page) — the page opens only when the user's role(s) have
// "<slug>:view" in role_permissions. The slug must match modules.slug.
// Without permission the user sees the 403 page, even via a direct URL.
// ─────────────────────────────────────────────────────────────────────────
const guard = (moduleSlug, page, action = "view") => (
  <RequirePermission module={moduleSlug} action={action}>
    {page}
  </RequirePermission>
);

// Shows one friendly message whenever the API answers 403 (deduplicated).
function ForbiddenNotice() {
  useEffect(() => {
    const onForbidden = () =>
      toast.error("You don't have permission to perform this action.", {
        toastId: "forbidden",
      });

    window.addEventListener(FORBIDDEN_EVENT, onForbidden);
    return () => window.removeEventListener(FORBIDDEN_EVENT, onForbidden);
  }, []);

  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// LayoutContent
// margin kept in sync with Sidebar.jsx: 288px expanded (lg:ml-72) / 80px
// collapsed (lg:ml-20)
// ─────────────────────────────────────────────────────────────────────────

function LayoutContent() {
  const location = useLocation();
  const { collapsed } = useSidebar();

  const mainMarginClass = `
    ${collapsed ? "lg:ml-20" : "lg:ml-72"}
    pt-18 lg:pt-20
    px-4 sm:px-6 lg:px-8
    py-4 lg:py-5
  `;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main
          className={`
            flex-1
            min-w-0
            ${mainMarginClass}
            min-h-screen
            overflow-x-hidden
            transition-all
            duration-base
            ease-standard
          `}
        >
          <Routes>
            {/* Dashboard & Profile: every signed-in user */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />

            {/* User */}
            <Route path="/user" element={guard("users", <User />)} />

            {/* RBAC */}
            <Route path="/roles" element={guard("roles", <Roles />)} />
            <Route path="/modules" element={guard("modules", <Modules />)} />
            <Route
              path="/role-permissions"
              element={guard("roles", <RolePermissions />)}
            />

            {/* Leave */}
            <Route
              path="/leave-admin"
              element={guard("leave-admin", <LeaveAdmin />)}
            />
            <Route
              path="/leave-employee"
              element={guard("leave-employee", <LeaveEmployee />)}
            />
            <Route
              path="/leave-setting"
              element={guard("leave-settings", <LeaveSetting />)}
            />

            {/* Attendance */}
            <Route
              path="/attendance-admin"
              element={guard("attendance-admin", <AttendanceAdmin />)}
            />

            <Route
              path="/attendance-employee"
              element={guard("attendance-employee", <AttendanceEmployee />)}
            />

            {/* Attendance Regularization */}
            <Route
              path="/attendance-regularization"
              element={guard(
                "attendance-regularization",
                <AttendanceRegularizationAdmin />,
              )}
            />

            {/* Holiday */}
            <Route
              path="/holiday-calender"
              element={guard("holiday-calendar", <HolidayCalender />)}
            />

            {/* WFH */}
            <Route
              path="/wfh-management"
              element={guard("wfh-management", <WfhManagement />)}
            />

            {/* Employee */}
            <Route
              path="/employee-list"
              element={guard("employee-list", <EmployeeList />)}
            />

            <Route
              path="/employee/:id"
              element={guard("employee-list", <EmployeeDetail />)}
            />

            {/* Organization */}
            <Route
              path="/designations"
              element={guard("designations", <Designation />)}
            />

            <Route
              path="/department"
              element={guard("department", <Department />)}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Dashboard Layout (only for signed-in users)
// ─────────────────────────────────────────────────────────────────────────

function Layout() {
  return (
    <RequireAuth>
      <SidebarProvider>
        <LayoutContent />
      </SidebarProvider>
    </RequireAuth>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────

function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <AuthProvider>
        <BrowserRouter>
          <ForbiddenNotice />

          <Routes>
            {/* Public Authentication Pages */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/first-time-access" element={<FirstTimeAccess />} />

            {/* Application */}
            <Route path="/*" element={<Layout />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            draggable
            theme="light"
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;