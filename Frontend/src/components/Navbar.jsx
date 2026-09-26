import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Mail,
  Search,
  Settings,
  User,
  Lock,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { logout as logoutApi } from "../services/loginAPI";
import { getFileUrl } from "../services/profileApi";
import { getInitials, getAvatarColor } from "../utils/avatar";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";

function Navbar() {
  const navigate = useNavigate();

  const { user, profile, refreshUser, clearUser } = useAuth();
  const roles = profile?.roles;
  const profileImage = profile?.profileImage;

  const { toggle, collapsed } = useSidebar();

  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = () => {
    logoutApi();
    clearUser();
    navigate("/");
  };

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "User";
  const email = user?.email || "No email";
  const phone = user?.phone || "Not available";
  const roleName = roles?.[0]?.roleName || "Not assigned";
  const status = user?.status === "0" ? "Inactive" : "Active";

  const avatarUrl = getFileUrl(profileImage?.fileURL);
  const initials = getInitials(firstName, lastName);
  const avatarColor = getAvatarColor(email);

  const Avatar = ({ size }) =>
    avatarUrl ? (
      <img
        src={avatarUrl}
        alt={fullName}
        className="rounded-full border border-border-subtle object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    ) : (
      <div
        className="rounded-full border border-border-subtle flex items-center justify-center text-white font-semibold shrink-0"
        style={{ width: size, height: size, backgroundColor: avatarColor }}
      >
        {initials}
      </div>
    );

  return (
    // left offset kept in sync with Sidebar.jsx: 288px expanded (lg:left-72) / 80px collapsed (lg:left-20)
    <nav
      className={`fixed top-0 left-0 right-0 h-18 bg-surface border-b border-border-subtle px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 z-30 transition-all duration-base ease-standard ${
        collapsed ? "lg:left-20" : "lg:left-72"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={toggle}
          className="lg:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-lg text-text-secondary hover:bg-primary-50 hover:text-primary-700 transition-colors duration-fast ease-standard"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="relative hidden sm:block w-full max-w-[320px]">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled"
          />
          <input
            type="text"
            placeholder="Search in HRMS"
            className="w-full h-11 pl-12 pr-4 rounded-md border border-border-subtle bg-background text-sm text-text-primary outline-none focus:border-accent-500 transition-colors duration-fast ease-standard"
          />
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="sm:hidden w-10 h-10 shrink-0 flex items-center justify-center rounded-lg text-text-secondary hover:bg-primary-50 hover:text-primary-700 transition-colors duration-fast ease-standard"
          aria-label="Search"
        >
          <Search size={19} />
        </button>

        {searchOpen && (
          <div className="sm:hidden absolute inset-x-0 top-0 h-18 bg-surface px-4 flex items-center gap-2 z-40">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled"
              />
              <input
                autoFocus
                type="text"
                placeholder="Search in HRMS"
                className="w-full h-11 pl-12 pr-4 rounded-md border border-border-subtle bg-background text-sm text-text-primary outline-none focus:border-accent-500 transition-colors duration-fast ease-standard"
              />
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg text-text-secondary hover:bg-background"
              aria-label="Close search"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-3 lg:gap-4 shrink-0">
        <button className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-text-secondary hover:bg-primary-50 hover:text-primary-700 transition-colors duration-fast ease-standard">
          <Settings size={19} />
        </button>

        <button className="hidden md:flex w-9 h-9 items-center justify-center rounded-lg text-text-secondary hover:bg-primary-50 hover:text-primary-700 transition-colors duration-fast ease-standard">
          <Mail size={19} />
        </button>

        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:bg-primary-50 hover:text-primary-700 transition-colors duration-fast ease-standard">
          <Bell size={19} />
          <span className="absolute top-1.5 right-1.5 bg-danger-500 w-2 h-2 rounded-full" />
        </button>

        <div
          className="relative sm:pl-4 sm:ml-1 sm:border-l border-border-subtle"
          ref={dropdownRef}
        >
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 lg:gap-3 py-1.5 pr-1 rounded-lg hover:bg-background transition-colors duration-fast ease-standard"
          >
            <Avatar size={38} />

            <div className="hidden lg:block text-left leading-tight max-w-[140px]">
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {fullName}
              </h3>
              <p className="text-xs text-text-secondary truncate">{roleName}</p>
            </div>

            <ChevronDown
              size={16}
              className={`hidden sm:block text-text-disabled transition-transform duration-fast ease-standard ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-[min(20rem,calc(100vw-2rem))] bg-surface rounded-lg shadow-lg border border-border-subtle overflow-hidden">
              <div className="px-5 py-4 border-b border-border-subtle bg-background">
                <div className="flex items-center gap-3">
                  <Avatar size={52} />

                  <div className="min-w-0">
                    <p className="font-semibold text-primary-700 text-base truncate">
                      {fullName}
                    </p>
                    <p className="text-sm text-text-secondary truncate">{email}</p>
                    <p className="text-xs text-accent-500 mt-1 font-medium">
                      {roleName}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-text-secondary shrink-0">Email</span>
                  <span className="text-sm font-medium text-text-primary text-right break-all">
                    {email}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-text-secondary shrink-0">Phone</span>
                  <span className="text-sm font-medium text-text-primary text-right">
                    {phone}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-text-secondary shrink-0">Role</span>
                  <span className="text-sm font-medium text-text-primary text-right">
                    {roleName}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4">
                  <span className="text-xs text-text-secondary shrink-0">Status</span>
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      status === "Active"
                        ? "bg-success-50 text-success-600"
                        : "bg-background text-text-secondary"
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              <div className="border-t border-border-subtle">
                <button
                  onClick={() => {
                    navigate("/profile");
                    setOpen(false);
                  }}
                  className="w-full px-5 py-3 flex items-center gap-3 text-sm hover:bg-primary-50 text-text-primary transition-colors duration-fast ease-standard"
                >
                  <User size={18} className="shrink-0" />
                  My Profile
                </button>

                <button
                  onClick={() => {
                    navigate("/profile?tab=password");
                    setOpen(false);
                  }}
                  className="w-full px-5 py-3 flex items-center gap-3 text-sm hover:bg-primary-50 text-text-primary transition-colors duration-fast ease-standard"
                >
                  <Lock size={18} className="shrink-0" />
                  Update Password
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full px-5 py-3 flex items-center gap-3 text-sm text-danger-500 hover:bg-danger-50 transition-colors duration-fast ease-standard"
                >
                  <LogOut size={18} className="shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;