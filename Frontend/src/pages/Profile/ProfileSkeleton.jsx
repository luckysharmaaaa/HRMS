import React from "react";

const Line = ({ className = "" }) => (
  <div
    className={`rounded bg-slate-200 motion-safe:animate-pulse ${className}`}
  />
);

const SectionSkeleton = ({ fields }) => (
  <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 lg:p-8">
    <div className="space-y-2">
      <Line className="h-4 w-36" />
      <Line className="h-3 w-full max-w-[200px]" />
    </div>

    <div className="grid gap-5 sm:grid-cols-2">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Line className="h-3 w-24" />
          <Line className="h-11 w-full" />
        </div>
      ))}
    </div>
  </div>
);

const ProfileSkeleton = () => (
  <div
    className="space-y-6"
    role="status"
    aria-busy="true"
    aria-label="Loading your profile"
  >
    <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center lg:p-8">
      <div className="h-24 w-24 shrink-0 rounded-full bg-slate-200 motion-safe:animate-pulse" />

      <div className="flex-1 space-y-3">
        <Line className="h-5 w-48" />
        <Line className="h-3 w-64" />
        <Line className="h-10 w-40" />
      </div>
    </div>

    <SectionSkeleton fields={4} />
    <SectionSkeleton fields={6} />
  </div>
);

export default ProfileSkeleton;