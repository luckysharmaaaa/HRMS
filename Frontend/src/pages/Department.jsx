
import React, { useEffect, useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Plus,
} from "lucide-react";

import DepartmentTable from "../components/Department/DepartmentTable";
import AddDepartmentModal from "../components/Department/addDepartment";
import DeleteDepartmentModal from "../components/Department/DeleteDepartmentModal";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment, 
} from "../services/department.service";

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  // ==========================================================
  // Fetch Departments
  // ==========================================================
  const fetchDepartments = async () => {
    try {
      setLoading(true);

      const response = await getDepartments();

      /*
       * sendSuccess response is expected to be:
       *
       * {
       *   success: true,
       *   message: "...",
       *   data: [...]
       * }
       */

      const data =
        response?.data?.data ||
        response?.data ||
        [];

      setDepartments(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch departments:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // Load Departments on Page Load
  // ==========================================================
  useEffect(() => {
    fetchDepartments();
  }, []);

  // ==========================================================
  // Open Add Department
  // ==========================================================
  const handleAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  // ==========================================================
  // Open Edit Department
  // ==========================================================
  const handleEdit = (department) => {
    setEditData(department);
    setIsModalOpen(true);
  };

  // ==========================================================
  // Add / Edit Department
  // ==========================================================
  const handleSubmit = async ({
    name,
    description,
    status,
  }) => {
    try {
      setLoading(true);

      if (editData) {
        // ====================================================
        // EDIT
        // ====================================================
        await updateDepartment(
          editData.id,
          {
            departmentName: name,
            description,
            status,
          }
        );
      } else {
        // ====================================================
        // ADD
        // ====================================================
        await createDepartment({
          departmentName: name,
          description,
          status,
        });
      }

      // Get latest data from database
      await fetchDepartments();

      // Close modal
      setEditData(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error(
        editData
          ? "Failed to update department:"
          : "Failed to create department:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // Close Add / Edit Modal
  // ==========================================================
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  // ==========================================================
  // Open Delete Confirmation
  // ==========================================================
  const handleDeleteRequest = (department) => {
    setDeleteTarget(department);
  };

  // ==========================================================
  // Delete Department
  // ==========================================================
  const handleDelete = async (id) => {
    try {
      setLoading(true);

      await deleteDepartment(id);

      // Refresh latest data
      await fetchDepartments();

      // Close delete modal
      setDeleteTarget(null);
    } catch (error) {
      console.error(
        "Failed to delete department:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // Render
  // ==========================================================
  return (
    <div className="p-5">

      {/* ======================================================
          Header
      ======================================================= */}
      <div className="flex items-center justify-between mb-5">

        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold text-[#0F265C]">
            Departments
          </h1>

          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <span>Employees</span>
            <span>/</span>
            <span>Departments</span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">

          {/* ==================================================
              Export Dropdown
          =================================================== */}
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
              {/* Export PDF */}
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

              {/* Export Excel */}
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

          {/* ==================================================
              Add Department
          =================================================== */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={15} />

            Add Department
          </button>
        </div>
      </div>

      {/* ======================================================
          Department Table
      ======================================================= */}
      <DepartmentTable
        departments={departments}
        setDepartments={setDepartments}
        onEditDepartment={handleEdit}
        onDeleteDepartment={handleDeleteRequest}
      />

      {/* ======================================================
          Add / Edit Department Modal
      ======================================================= */}
      <AddDepartmentModal
        open={isModalOpen}
        onClose={handleCloseModal}
        editData={editData}
        onSubmit={handleSubmit}
      />

      {/* ======================================================
          Delete Department Modal
      ======================================================= */}
      <DeleteDepartmentModal
        open={!!deleteTarget}
        item={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      {/* ======================================================
          Loading Indicator
      ======================================================= */}
      {loading && (
        <div className="fixed bottom-5 right-5 z-[2000] bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-2 text-sm text-gray-600">
          Processing...
        </div>
      )}
    </div>
  );
};

export default Department;

