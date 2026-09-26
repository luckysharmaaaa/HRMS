// ```jsx
import React, { useEffect, useState } from "react";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
} from "react-icons/fi";

import DateRangePickerButton from "../user/DateRangePickerButton";

// ==========================================================
// DESIGNATION TABLE
// ==========================================================

const DesignationTable = ({
  designations = [],
  departments = [],
  onEdit,
  onDelete,
}) => {
  const today = new Date();

  const [appliedRange, setAppliedRange] = useState([
    {
      startDate: new Date(
        today.getFullYear(),
        0,
        1
      ),
      endDate: new Date(
        today.getFullYear(),
        11,
        31
      ),
      key: "selection",
    },
  ]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("");

  const [rowsPerPage, setRowsPerPage] =
    useState(10);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [sortConfig, setSortConfig] =
    useState({
      key: null,
      dir: "asc",
    });

  // ==========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // ==========================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    deptFilter,
    statusFilter,
    appliedRange,
    rowsPerPage,
  ]);

  // ==========================================================
  // SORT
  // ==========================================================

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? {
            key,
            dir:
              prev.dir === "asc"
                ? "desc"
                : "asc",
          }
        : {
            key,
            dir: "asc",
          }
    );
  };

  // ==========================================================
  // FILTER
  // ==========================================================

  const filtered = designations.filter(
    (item) => {
      const designationName =
        item.designationName
          ?.toString()
          .toLowerCase() || "";

      const departmentName =
        item.departmentName
          ?.toString()
          .toLowerCase() || "";

      const searchValue =
        search.toLowerCase();

      // ------------------------------------------------------
      // Search
      // ------------------------------------------------------

      const matchSearch =
        designationName.includes(
          searchValue
        ) ||
        departmentName.includes(
          searchValue
        );

      // ------------------------------------------------------
      // Department
      // ------------------------------------------------------

      const matchDept = deptFilter
        ? item.departmentName ===
          deptFilter
        : true;

      // ------------------------------------------------------
      // Status
      // ------------------------------------------------------

      const matchStatus = statusFilter
        ? item.status === statusFilter
        : true;

      // ------------------------------------------------------
      // Date Range
      // ------------------------------------------------------

      let matchDate = true;

      if (
        appliedRange?.[0]?.startDate &&
        appliedRange?.[0]?.endDate
      ) {
        const itemTimestamp =
          Number(item.createdAt);

        // Only apply date filter if createdAt
        // exists and is a valid number.
        if (
          item.createdAt !== null &&
          item.createdAt !== undefined &&
          item.createdAt !== "" &&
          !Number.isNaN(itemTimestamp)
        ) {
          const itemDate = new Date(
            itemTimestamp > 9999999999
              ? itemTimestamp
              : itemTimestamp * 1000
          );

          const start = new Date(
            appliedRange[0].startDate
          );

          const end = new Date(
            appliedRange[0].endDate
          );

          start.setHours(
            0,
            0,
            0,
            0
          );

          end.setHours(
            23,
            59,
            59,
            999
          );

          matchDate =
            itemDate >= start &&
            itemDate <= end;
        }
      }

      return (
        matchSearch &&
        matchDept &&
        matchStatus &&
        matchDate
      );
    }
  );

  // ==========================================================
  // SORTED DATA
  // ==========================================================

  const sorted = [...filtered].sort(
    (a, b) => {
      if (!sortConfig.key) {
        return 0;
      }

      let aVal;
      let bVal;

      // ------------------------------------------------------
      // Created At
      // ------------------------------------------------------

      if (
        sortConfig.key === "createdAt"
      ) {
        aVal =
          Number(a.createdAt) || 0;

        bVal =
          Number(b.createdAt) || 0;
      }

      // ------------------------------------------------------
      // Normal String / Number Fields
      // ------------------------------------------------------

      else {
        aVal =
          a[sortConfig.key]
            ?.toString()
            .toLowerCase() || "";

        bVal =
          b[sortConfig.key]
            ?.toString()
            .toLowerCase() || "";
      }

      if (aVal < bVal) {
        return sortConfig.dir === "asc"
          ? -1
          : 1;
      }

      if (aVal > bVal) {
        return sortConfig.dir === "asc"
          ? 1
          : -1;
      }

      return 0;
    }
  );

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalEntries =
    sorted.length;

  const totalPages = Math.max(
    1,
    Math.ceil(
      totalEntries / rowsPerPage
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const paginated = sorted.slice(
    (safePage - 1) *
      rowsPerPage,
    safePage * rowsPerPage
  );

  const startEntry =
    totalEntries === 0
      ? 0
      : (safePage - 1) *
          rowsPerPage +
        1;

  const endEntry = Math.min(
    safePage * rowsPerPage,
    totalEntries
  );

  // ==========================================================
  // COLUMN HEADER
  // ==========================================================

  const ColHeader = ({
    label,
    sortKey,
  }) => (
    <button
      type="button"
      className="inline-flex items-center gap-0.5 font-bold text-[13px] text-gray-600 uppercase tracking-wide hover:text-orange-500 transition"
      onClick={() =>
        sortKey &&
        handleSort(sortKey)
      }
    >
      {label}

      {sortKey && (
        <span className="inline-flex flex-col ml-1 opacity-40 leading-none">
          <FiChevronUp
            size={10}
            className={
              sortConfig.key ===
                sortKey &&
              sortConfig.dir === "asc"
                ? "opacity-100 text-orange-500"
                : ""
            }
          />

          <FiChevronDown
            size={10}
            className={
              sortConfig.key ===
                sortKey &&
              sortConfig.dir === "desc"
                ? "opacity-100 text-orange-500"
                : ""
            }
          />
        </span>
      )}
    </button>
  );

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

      {/* =====================================================
          CARD HEADER
      ===================================================== */}

      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-200">

        <h2 className="text-base font-bold text-[#0F265C]">
          Designation List
        </h2>

        <div className="flex items-center gap-2">

          {/* =================================================
              DATE FILTER
          ================================================= */}

          <DateRangePickerButton
            value={appliedRange}
            onChange={(newRange) => {
              setAppliedRange(
                newRange
              );
              setCurrentPage(1);
            }}
            defaultPreset="This Year"
          />

          {/* =================================================
              DEPARTMENT FILTER
          ================================================= */}

          <select
            className="select select-bordered select-xs text-xs h-8 min-h-0 rounded-lg bg-white text-black min-w-[130px]"
            value={deptFilter}
            onChange={(e) =>
              setDeptFilter(
                e.target.value
              )
            }
          >
            <option value="">
              All Departments
            </option>

            {departments.map(
              (department) => (
                <option
                  key={department.id}
                  value={
                    department.departmentName
                  }
                >
                  {
                    department.departmentName
                  }
                </option>
              )
            )}
          </select>

          {/* =================================================
              STATUS FILTER
          ================================================= */}

          <select
            className="select select-bordered select-xs text-xs h-8 min-h-0 rounded-lg bg-white text-black"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
          >
            <option value="">
              Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>
          </select>

          {/* =================================================
              SORT
          ================================================= */}

          <select
            className="select select-bordered select-xs text-xs h-8 min-h-0 rounded-lg min-w-40 bg-white text-black"
            value={
              sortConfig.key ===
                "createdAt" &&
              sortConfig.dir === "desc"
                ? "Recently Added"
                : sortConfig.key ===
                    "designationName" &&
                  sortConfig.dir === "asc"
                ? "Ascending"
                : sortConfig.key ===
                    "designationName" &&
                  sortConfig.dir === "desc"
                ? "Descending"
                : ""
            }
            onChange={(e) => {
              const val =
                e.target.value;

              if (
                val ===
                "Recently Added"
              ) {
                setSortConfig({
                  key: "createdAt",
                  dir: "desc",
                });
              } else if (
                val === "Ascending"
              ) {
                setSortConfig({
                  key: "designationName",
                  dir: "asc",
                });
              } else if (
                val === "Descending"
              ) {
                setSortConfig({
                  key: "designationName",
                  dir: "desc",
                });
              } else {
                setSortConfig({
                  key: null,
                  dir: "asc",
                });
              }
            }}
          >
            <option value="">
              Sort By
            </option>

            <option value="Recently Added">
              Recently Added
            </option>

            <option value="Ascending">
              Ascending (Title)
            </option>

            <option value="Descending">
              Descending (Title)
            </option>
          </select>

        </div>
      </div>

      {/* =====================================================
          ROWS PER PAGE + SEARCH
      ===================================================== */}

      <div className="flex items-center justify-between gap-2 px-5 py-2.5 border-b border-gray-200 text-sm text-gray-600">

        <div className="flex items-center gap-2">

          <span className="whitespace-nowrap text-[13px]">
            Row Per Page
          </span>

          <select
            className="select select-bordered select-xs h-7 min-h-0 text-xs rounded-md bg-white text-black"
            value={rowsPerPage}
            onChange={(e) =>
              setRowsPerPage(
                Number(
                  e.target.value
                )
              )
            }
          >
            <option value={10}>
              10
            </option>

            <option value={25}>
              25
            </option>

            <option value={50}>
              50
            </option>
          </select>

          <span>
            Entries
          </span>

        </div>

        <label className="input input-bordered input-xs flex items-center gap-2 h-8 rounded-lg px-3 text-xs bg-white text-black">

          <FiSearch
            size={13}
            className="text-gray-400"
          />

          <input
            type="text"
            placeholder="Search designations"
            className="grow bg-transparent outline-none text-xs w-40"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

        </label>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="overflow-x-auto">

        <table className="table table-md w-full">

          <thead className="bg-gray-50 text-gray-600 text-xs font-semibold">

            <tr>

              <th className="bg-gray-50">
                <ColHeader
                  label="Designation"
                  sortKey="designationName"
                />
              </th>

              <th className="bg-gray-50">
                <ColHeader
                  label="Department"
                  sortKey="departmentName"
                />
              </th>

              <th className="bg-gray-50">
                <ColHeader
                  label="No of Employees"
                  sortKey="employees"
                />
              </th>

              <th className="bg-gray-50">
                <ColHeader
                  label="Status"
                  sortKey="status"
                />
              </th>

              <th className="bg-gray-50 text-center">
                <span className="font-bold text-[13px] text-gray-600 uppercase tracking-wide">
                  Actions
                </span>
              </th>

            </tr>

          </thead>

          <tbody>

            {paginated.length === 0 ? (

              <tr>

                <td
                  colSpan={5}
                  className="text-center text-gray-400 py-10"
                >
                  No designations
                  found.
                </td>

              </tr>

            ) : (

              paginated.map(
                (des) => (

                  <tr
                    key={des.id}
                    className="hover:bg-gray-50 transition-colors"
                  >

                    {/* =================================================
                        DESIGNATION
                    ================================================= */}

                    <td>

                      <span className="text-gray-800 text-sm font-semibold hover:text-orange-500 transition cursor-pointer">
                        {
                          des.designationName
                        }
                      </span>

                    </td>

                    {/* =================================================
                        DEPARTMENT
                    ================================================= */}

                    <td className="text-gray-600 text-sm">

                      {
                        des.departmentName ||
                        "-"
                      }

                    </td>

                    {/* =================================================
                        EMPLOYEES
                    ================================================= */}

                    <td className="text-gray-600 text-sm">

                      {
                        des.employees ??
                        0
                      }

                    </td>

                    {/* =================================================
                        STATUS
                    ================================================= */}

                    <td>

                      <span
                        className={`badge badge-sm border-0 text-white font-semibold text-xs gap-1.5 px-2.5 py-0.5 ${
                          des.status ===
                          "Active"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >

                        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />

                        {
                          des.status
                        }

                      </span>

                    </td>

                    {/* =================================================
                        ACTIONS
                    ================================================= */}

                    <td className="text-center">

                      <div className="flex justify-center items-center gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            onEdit?.(
                              des
                            )
                          }
                          className="btn btn-ghost btn-xs text-gray-400 hover:text-orange-500 hover:bg-orange-50 p-1 min-h-0 h-auto rounded"
                          title="Edit"
                        >

                          <FiEdit2
                            size={14}
                          />

                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDelete?.(
                              des
                            )
                          }
                          className="btn btn-ghost btn-xs text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 min-h-0 h-auto rounded"
                          title="Delete"
                        >

                          <FiTrash2
                            size={14}
                          />

                        </button>

                      </div>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-200">

        <p className="text-sm text-gray-500">

          Showing{" "}
          {startEntry} -{" "}
          {endEntry} of{" "}
          {totalEntries}{" "}
          entries

        </p>

        <div className="join">

          <button
            type="button"
            className="join-item btn btn-sm btn-ghost border border-gray-200"
            onClick={() =>
              setCurrentPage(
                (p) =>
                  Math.max(
                    1,
                    p - 1
                  )
              )
            }
            disabled={
              safePage === 1
            }
          >
            ❮
          </button>

          {Array.from(
            {
              length: totalPages,
            },
            (_, i) => i + 1
          ).map((page) => (

            <button
              type="button"
              key={page}
              className={`join-item btn btn-sm border-none ${
                page === safePage
                  ? "bg-orange-500 text-white"
                  : "btn-ghost border border-gray-200"
              }`}
              onClick={() =>
                setCurrentPage(
                  page
                )
              }
            >
              {page}
            </button>

          ))}

          <button
            type="button"
            className="join-item btn btn-sm btn-ghost border border-gray-200"
            onClick={() =>
              setCurrentPage(
                (p) =>
                  Math.min(
                    totalPages,
                    p + 1
                  )
              )
            }
            disabled={
              safePage ===
              totalPages
            }
          >
            ❯
          </button>

        </div>

      </div>

    </div>
  );
};

export default DesignationTable;
// ```
