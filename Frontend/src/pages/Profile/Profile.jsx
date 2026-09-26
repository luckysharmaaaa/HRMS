import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronRight, Lock, RefreshCw, User } from "lucide-react";

import ProfileForm from "./ProfileForm";
import ChangePassword from "./ChangePassword";
import ProfileSkeleton from "./ProfileSkeleton";

import { useAuth } from "../../context/AuthContext";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "password", label: "Password", icon: Lock },
];

const Profile = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // The URL is the single source of truth for the active tab, so links from
  // the Navbar (?tab=password) keep working.
  const activeTab =
    searchParams.get("tab") === "password" ? "password" : "profile";

  // AuthContext owns the profile: { user, address, roles, profileImage }.
  const { profile, refreshUser, setProfile } = useAuth();

  const hadProfileOnMount = useRef(Boolean(profile));

  const [loading, setLoading] = useState(!profile);
  const [loadFailed, setLoadFailed] = useState(false);

  // showSpinner = false refreshes quietly in the background (e.g. on tab
  // focus). refreshUser() is de-duplicated, so StrictMode's double effect and
  // the Navbar share one /auth/me request.
  const loadProfile = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) {
        setLoading(true);
        setLoadFailed(false);
      }

      const result = await refreshUser();

      if (showSpinner) {
        setLoadFailed(!result);
        setLoading(false);
      }
    },
    [refreshUser],
  );

  // Initial load. If AuthContext already has the profile, refresh quietly.
  useEffect(() => {
    loadProfile(!hadProfileOnMount.current);
  }, [loadProfile]);

  // Quiet re-fetch when the window regains focus (e.g. a photo was changed
  // elsewhere). Forms only reset if the server data actually changed.
  useEffect(() => {
    const handleFocus = () => loadProfile(false);

    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);
  }, [loadProfile]);

  const selectTab = (id) => {
    setSearchParams(id === "profile" ? {} : { tab: id }, { replace: true });
  };

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern.
  const handleTabKeyDown = (event, index) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

    event.preventDefault();

    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(index + step + TABS.length) % TABS.length];

    selectTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#041D5F]">
          Account Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your personal information and password.
        </p>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
          <span>Pages</span>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="font-medium text-orange-500">Account Settings</span>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Account settings"
        className="flex gap-1 border-b border-slate-200"
      >
        {TABS.map((tab, index) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 ${
                selected
                  ? "border-orange-500 text-[#041D5F]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <ProfileSkeleton />
      ) : !profile ? (
        <div
          role="alert"
          className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center"
        >
          <h2 className="text-lg font-semibold text-[#041D5F]">
            {loadFailed
              ? "We couldn't load your profile"
              : "Your profile isn't available"}
          </h2>

          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Check your connection and try again. If the problem continues,
            contact your administrator.
          </p>

          <button
            type="button"
            onClick={() => loadProfile(true)}
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Both panels stay mounted so unsaved edits survive a tab switch. */}
          <div
            id="panel-profile"
            role="tabpanel"
            aria-labelledby="tab-profile"
            hidden={activeTab !== "profile"}
          >
            <ProfileForm
              profileData={profile}
              onSaved={setProfile}
              onImageChanged={(profileImage) =>
                setProfile({ ...profile, profileImage })
              }
            />
          </div>

          <div
            id="panel-password"
            role="tabpanel"
            aria-labelledby="tab-password"
            hidden={activeTab !== "password"}
          >
            <ChangePassword />
          </div>
        </>
      )}
    </div>
  );
};

export default Profile;