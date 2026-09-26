import React, { useEffect, useState } from "react";
import {
  ChevronRight,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Plus,
} from "lucide-react";

import DesignationTable from "../components/Designation/DesignationTable";
import AddDesignationDrawer from "../components/Designation/AddDesignationDrawer";
import DeleteDesignationModal from "../components/Designation/DeleteDesignationModal";

import {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../services/designation.service";

import { getDepartments } from "../services/department.service";

const Designation = () => {
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  // ==========================================================
  // GET DESIGNATIONS
  // ==========================================================

  const fetchDesignations = async () => {
    try {
      const response = await getDesignations();

      console.log("Designation API Response:", response);

      const data =
        response?.data?.data ||
        response?.data ||
        [];

      setDesignations(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch designations:",
        error
      );

      setDesignations([]);
    }
  };

  // ==========================================================
  // GET DEPARTMENTS
  // ==========================================================

  const fetchDepartments = async () => {
    try {
      const response = await getDepartments();

      console.log("Department API Response:", response);

      const data =
        response?.data?.data ||
        response?.data ||
        [];

      console.log(
        "Raw Departments for dropdown:",
        data
      );

      /*
       * Normalize department data.
       *
       * Different APIs can return:
       * departmentName
       * name
       * department_name
       *
       * The drawer expects:
       * department.id
       * department.departmentName
       */

      const normalizedDepartments = Array.isArray(data)
        ? data.map((department) => ({
            ...department,

            id:
              department.id ??
              department.departmentId ??
              department.department_id,

            departmentName:
              department.departmentName ??
              department.name ??
              department.department_name ??
              "",
          }))
        : [];

      console.log(
        "Normalized Departments for dropdown:",
        normalizedDepartments
      );

      setDepartments(normalizedDepartments);
    } catch (error) {
      console.error(
        "Failed to fetch departments:",
        error
      );

      setDepartments([]);
    }
  };

  // ==========================================================
  // FETCH DATA ON PAGE LOAD
  // ==========================================================

  useEffect(() => {
    fetchDesignations();
    fetchDepartments();
  }, []);

  // ==========================================================
  // OPEN ADD DRAWER
  // ==========================================================

  const handleAdd = () => {
    setEditData(null);
    setIsDrawerOpen(true);
  };

  // ==========================================================
  // OPEN EDIT DRAWER
  // ==========================================================

  const handleEdit = (designation) => {
    console.log(
      "Edit Designation:",
      designation
    );

    setEditData(designation);
    setIsDrawerOpen(true);
  };

  // ==========================================================
  // ADD / UPDATE DESIGNATION
  // ==========================================================

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);

      console.log(
        "Designation Form Data:",
        formData
      );

      if (editData) {
        await updateDesignation(
          editData.id,
          formData
        );
      } else {
        await createDesignation(formData);
      }

      await fetchDesignations();

      setIsDrawerOpen(false);
      setEditData(null);
    } catch (error) {
      console.error(
        "Failed to save designation:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // DELETE DESIGNATION
  // ==========================================================

  const handleDelete = async (id) => {
    try {
      setLoading(true);

      await deleteDesignation(id);

      await fetchDesignations();

      setDeleteTarget(null);
    } catch (error) {
      console.error(
        "Failed to delete designation:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center justify-between mb-5">
        <div>
          {/* Breadcrumb */}

          <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
            <span>Employees</span>

            <ChevronRight
              size={15}
              className="text-gray-400"
            />

            <span className="text-gray-800 font-medium">
              Designations
            </span>
          </div>

          <h1 className="text-2xl font-bold text-[#0F265C]">
            Designations
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* =================================================
              EXPORT DROPDOWN
          ================================================= */}

          <div className="dropdown dropdown-end">
            <label
              tabIndex={0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-semibold rounded-lg transition shadow-sm cursor-pointer"
            >
              <FileText
                size={16}
                className="text-gray-500"
              />

              <span>Export</span>

              <ChevronDown size={14} />
            </label>

            <ul
              tabIndex={0}
              className="dropdown-content menu bg-white border border-gray-100 rounded-xl shadow-xl z-50 w-48 p-1.5 mt-2"
            >
              <li>
                <a className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <FileText
                    size={16}
                    className="text-red-500 shrink-0"
                  />

                  <span className="font-medium">
                    Export as PDF
                  </span>
                </a>
              </li>

              <li>
                <a className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                  <FileSpreadsheet
                    size={16}
                    className="text-green-600 shrink-0"
                  />

                  <span className="font-medium">
                    Export as Excel
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* =================================================
              ADD DESIGNATION
          ================================================= */}

          <button
            type="button"
            onClick={handleAdd}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition shadow-sm disabled:opacity-60"
          >
            <Plus size={15} />

            Add Designation
          </button>
        </div>
      </div>

      {/* =====================================================
          DESIGNATION TABLE
      ===================================================== */}

      <DesignationTable
        designations={designations}
        departments={departments}
        onEdit={handleEdit}
        onDelete={(designation) =>
          setDeleteTarget(designation)
        }
      />

      {/* =====================================================
          ADD / EDIT DRAWER
      ===================================================== */}

      <AddDesignationDrawer
        open={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditData(null);
        }}
        editData={editData}
        departments={departments}
        onSubmit={handleSubmit}
      />

      {/* =====================================================
          DELETE MODAL
      ===================================================== */}

      <DeleteDesignationModal
        open={!!deleteTarget}
        item={deleteTarget}
        onClose={() =>
          setDeleteTarget(null)
        }
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Designation;