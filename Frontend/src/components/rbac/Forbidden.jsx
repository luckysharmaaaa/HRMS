import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
        <ShieldAlert size={30} />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-[#0F265C]">Access denied</h1>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-gray-500">
          You don't have permission to view this page. If you think this is a
          mistake, please contact your administrator.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
      >
        Back to dashboard
      </Link>
    </div>
  );
}