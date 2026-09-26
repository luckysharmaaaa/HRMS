import React, { useState, useRef, useEffect } from 'react';

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────
const DeleteConfirmModal = ({ onClose, onConfirm, itemName, itemDetails }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="0.5" fill="#ef4444" stroke="none"/></svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">Confirm Delete</h3>
        <p className="text-sm text-gray-500 text-center mb-6">You want to delete {itemName ? <span className="font-semibold text-gray-700">"{itemName}"</span> : "the selected item"}, this can't be undone once you delete.</p>
        {itemDetails && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
            {itemDetails.map((detail, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm"><span className="text-gray-500">{detail.label}</span><span className="font-medium text-gray-800">{detail.value}</span></div>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600">Yes, Delete</button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Custom Date Range Picker Modal ────────────────────────────────────────────
const DateRangePickerModal = ({ onClose, onApply, initialStartDate, initialEndDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState(initialStartDate || null);
  const [endDate, setEndDate] = useState(initialEndDate || null);
  const [hoverDate, setHoverDate] = useState(null);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear(), month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    const startOffset = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
    for (let i = 1; i <= lastDay.getDate(); i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    for (let i = 1; i <= 42 - days.length; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    return days;
  };

  const formatDate = (d) => d ? d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : '';
  const isInRange = (date) => startDate && endDate && date >= startDate && date <= endDate;
  const isSelected = (date) => {
    if (startDate && formatDate(date) === formatDate(startDate)) return 'start';
    if (endDate && formatDate(date) === formatDate(endDate)) return 'end';
    return false;
  };

  const handleDateClick = (date) => {
    if (!startDate || (startDate && endDate)) setStartDate(date), setEndDate(null);
    else if (startDate && !endDate) date < startDate ? (setStartDate(date), setEndDate(startDate)) : setEndDate(date);
  };

  const days = getDaysInMonth(currentMonth);
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6"/></svg></button>
            <span className="text-sm font-semibold text-gray-800">{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">{weekDays.map(day => (<div key={day} className="text-center text-xs font-medium text-gray-400 py-2">{day}</div>))}</div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              const selected = isSelected(day.date);
              const inRange = isInRange(day.date);
              let bgColor = selected === 'start' ? 'bg-orange-500 text-white rounded-l-full' : selected === 'end' ? 'bg-orange-500 text-white rounded-r-full' : (inRange || (hoverDate && startDate && !endDate && ((day.date > startDate && day.date <= hoverDate) || (day.date < startDate && day.date >= hoverDate)))) ? 'bg-orange-100' : '';
              return (<button key={idx} onClick={() => handleDateClick(day.date)} onMouseEnter={() => setHoverDate(day.date)} onMouseLeave={() => setHoverDate(null)} className={`text-center py-2 text-sm rounded-full transition-colors ${bgColor} ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700 hover:bg-orange-100'}`}>{day.date.getDate()}</button>);
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100"><div className="flex items-center justify-between text-sm"><div><p className="text-xs text-gray-400 mb-1">Start Date</p><p className="font-medium text-gray-800">{startDate ? formatDate(startDate) : '—'}</p></div><span className="text-gray-300">→</span><div><p className="text-xs text-gray-400 mb-1">End Date</p><p className="font-medium text-gray-800">{endDate ? formatDate(endDate) : '—'}</p></div></div></div>
          <div className="flex gap-3 mt-5"><button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button><button onClick={() => { if (startDate) onApply(startDate, endDate || startDate); onClose(); }} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">Apply</button></div>
        </div>
      </div>
    </div>
  );
};

// ─── Reusable Modal Wrapper for Add/Edit ───────────────────────────────────────
const EmployeeFormModal = ({ title, employee, onClose, onSave, nextId }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [profilePreview, setProfilePreview] = useState(employee?.image || null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const fileRef = useRef();
  const [errors, setErrors] = useState({});

  const [permissions, setPermissions] = useState(employee?.permissions || {
    Holidays: { read: false, write: false, create: false, delete: false, import: false, export: false },
    Leaves: { read: false, write: false, create: false, delete: false, import: false, export: false },
    Clients: { read: false, write: false, create: false, delete: false, import: false, export: false },
    Projects: { read: false, write: false, create: false, delete: false, import: false, export: false },
    Tasks: { read: false, write: false, create: false, delete: false, import: false, export: false },
    Chats: { read: false, write: false, create: false, delete: false, import: false, export: false },
    Assets: { read: false, write: false, create: false, delete: false, import: false, export: false },
    'Timing Sheets': { read: false, write: false, create: false, delete: false, import: false, export: false },
  });

  const [form, setForm] = useState({
    firstName: employee?.name?.split(' ')[0] || '',
    lastName: employee?.name?.split(' ').slice(1).join(' ') || '',
    employeeId: employee?.id || nextId,
    joiningDate: employee?.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
    username: employee?.email?.split('@')[0] || '',
    email: employee?.email || '',
    password: '', confirmPassword: '',
    phone: employee?.phone || '',
    company: employee?.company || '',
    department: employee?.designation || '',
    designation: employee?.designation || '',
    about: employee?.about || '',
    role: employee?.role || 'Employee',
  });

  const set = (field, value) => { setForm(f => ({ ...f, [field]: value })); setErrors(e => ({ ...e, [field]: '' })); };
  const updatePermission = (module, action, value) => setPermissions(prev => ({ ...prev, [module]: { ...prev[module], [action]: value } }));
  const selectAllForModule = (module) => {
    const current = permissions[module];
    const allSelected = current.read && current.write && current.create && current.delete && current.import && current.export;
    setPermissions(prev => ({ ...prev, [module]: { ...prev[module], read: !allSelected, write: !allSelected, create: !allSelected, delete: !allSelected, import: !allSelected, export: !allSelected } }));
  };
  const selectAllGlobal = () => {
    const anySelected = Object.values(permissions).some(p => p.read || p.write || p.create || p.delete || p.import || p.export);
    const newPermissions = { ...permissions };
    Object.keys(newPermissions).forEach(module => { newPermissions[module] = { read: !anySelected, write: !anySelected, create: !anySelected, delete: !anySelected, import: !anySelected, export: !anySelected }; });
    setPermissions(newPermissions);
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.employeeId.trim()) e.employeeId = 'Employee ID is required';
    if (!form.joiningDate) e.joiningDate = 'Joining date is required';
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!employee && !form.password) e.password = 'Password is required';
    else if (form.password && form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.company.trim()) e.company = 'Company is required';
    if (!form.department) e.department = 'Please select a department';
    if (!form.designation) e.designation = 'Please select a designation';
    return e;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 4 * 1024 * 1024) setProfilePreview(URL.createObjectURL(file));
    else if (file) setErrors(er => ({ ...er, image: 'Image must be below 4 MB' }));
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); setActiveTab('basic'); return; }
    onSave({ ...form, profilePreview, permissions, id: employee?.id });
  };

  const modulesList = ['Holidays', 'Leaves', 'Clients', 'Projects', 'Tasks', 'Chats', 'Assets', 'Timing Sheets'];
  const actionKeys = ['read', 'write', 'create', 'delete', 'import', 'export'];
  const actionLabels = ['Read', 'Write', 'Create', 'Delete', 'Import', 'Export'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F265C]">Profile</h1>

          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
            <span>Pages</span>
            <FiChevronRight size={12} className="shrink-0" />
            <span className="text-orange-500 font-medium">Profile</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="w-10 h-10 flex items-center justify-center bg-[#FF7A21] border border-gray-300 rounded-md text-white">
            <FiChevronsUp size={16} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
        >
          {/* Form Title */}
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-2xl font-semibold text-[#0F265C]">Profile</h2>
          </div>
          {/* Basic Information */}
          <h3 className="text-md font-semibold text-gray-900 pb-3">
            Basic Information
          </h3>
          {/* Profile Photo */}
          <div className="bg-slate-50 rounded-lg p-5 flex items-center gap-5 mb-2">
            {/* Image Preview */}
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-gray-400">IMG</span>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-[#0F265C]">Profile Photo</h4>

              <p className="text-sm text-gray-500 mt-1">
                Recommended image size is 40px x 40px
              </p>

              <div className="flex gap-3 mt-2">
                {/* Upload Button */}
                <label className="bg-[#FF7A21] text-white px-2 py-1 text-sm rounded-md hover:opacity-90 cursor-pointer">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={handleCancelImage}
                  className="border border-gray-300 px-2 py-1 text-sm rounded-md hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div><label className="block text-xs font-semibold text-gray-600 mb-2">Role</label><select value={form.role} onChange={e => set('role', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 outline-none appearance-none bg-white">{['Employee', 'Manager', 'Admin'].map(r => <option key={r}>{r}</option>)}</select></div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"><span className="text-sm font-semibold text-gray-800">Enable Options</span><button onClick={selectAllGlobal} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">Select All</button></div>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-gray-50 border-b border-gray-200"><tr><th className="py-3 px-4 text-left text-xs font-semibold text-gray-500">Module</th>{actionLabels.map(a => <th key={a} className="py-3 px-2 text-center text-xs font-semibold text-gray-500 w-16">{a}</th>)}<th className="py-3 px-2 text-center text-xs font-semibold text-gray-500 w-20">Select All</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {modulesList.map(module => {
                      const perms = permissions[module] || { read: false, write: false, create: false, delete: false, import: false, export: false };
                      const allSelected = perms.read && perms.write && perms.create && perms.delete && perms.import && perms.export;
                      return (<tr key={module} className="hover:bg-gray-50"><td className="py-3 px-4 text-sm font-medium text-gray-800">{module}</td>{actionKeys.map(action => (<td key={action} className="py-3 px-2 text-center"><input type="checkbox" checked={perms[action]} onChange={(e) => updatePermission(module, action, e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer" /></td>))}<td className="py-3 px-2 text-center"><input type="checkbox" checked={allSelected} onChange={() => selectAllForModule(module)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 cursor-pointer" /></td></tr>);
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600">Save</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [designation, setDesignation] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('Last 7 Days');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('list');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('06/05/2026 - 06/11/2026');
  const [dateRangeLabel, setDateRangeLabel] = useState('Last 7 Days');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [modalState, setModalState] = useState({ showAdd: false, showEdit: false, showDelete: false, employee: null });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [employees, setEmployees] = useState([
    { id: 'Emp-001', name: 'Anthony Lewis', role: 'Software Developer', email: 'anthony@example.com', phone: '(123) 4567 890', designation: 'Finance', joiningDate: '12 Sep 2024', status: 'Active', avatar: 'AL', avatarColor: '#e8f0fe', avatarTextColor: '#4f46e5', image: 'https://randomuser.me/api/portraits/men/1.jpg', projects: 20, done: 13, productivity: 65, company: 'Abac Company', about: 'Experienced developer' },
    { id: 'Emp-002', name: 'Brian Villalobos', role: 'Developer', email: 'brian@example.com', phone: '(179) 7382 829', designation: 'Developer', joiningDate: '24 Oct 2024', status: 'Active', avatar: 'BV', avatarColor: '#e3f2fd', avatarTextColor: '#1565c0', image: 'https://randomuser.me/api/portraits/men/2.jpg', projects: 30, done: 10, productivity: 30, company: 'Tech Corp', about: 'Full stack developer' },
    { id: 'Emp-003', name: 'Harvey Smith', role: 'Developer', email: 'harvey@example.com', phone: '(184) 2719 738', designation: 'Developer', joiningDate: '18 Feb 2024', status: 'Inactive', avatar: 'HS', avatarColor: '#fce4ec', avatarTextColor: '#c2185b', image: 'https://randomuser.me/api/portraits/men/3.jpg', projects: 25, done: 7, productivity: 20, company: 'Startup Inc', about: 'Junior developer' },
    { id: 'Emp-004', name: 'Stephan Peralt', role: 'Software Developer', email: 'peral@example.com', phone: '(193) 7839 748', designation: 'Executive', joiningDate: '17 Oct 2024', status: 'Active', avatar: 'SP', avatarColor: '#e8f5e9', avatarTextColor: '#2e7d32', image: 'https://randomuser.me/api/portraits/men/4.jpg', projects: 15, done: 13, productivity: 90, company: 'Global Systems', about: 'Senior executive' },
    { id: 'Emp-005', name: 'Doglas Martini', role: 'Full Stack Developer', email: 'martniwr@example.com', phone: '(183) 9302 890', designation: 'Manager', joiningDate: '20 Jul 2024', status: 'Active', avatar: 'DM', avatarColor: '#fff3e0', avatarTextColor: '#e65100', image: 'https://randomuser.me/api/portraits/men/5.jpg', projects: 15, done: 7, productivity: 65, company: 'Tech Solutions', about: 'Team manager' },
    { id: 'Emp-006', name: 'Linda Ray', role: 'Software Developer', email: 'ray456@example.com', phone: '(120) 3728 039', designation: 'Finance', joiningDate: '10 Apr 2024', status: 'Inactive', avatar: 'LR', avatarColor: '#f3e5f5', avatarTextColor: '#7b1fa2', image: 'https://randomuser.me/api/portraits/women/1.jpg', projects: 20, done: 11, productivity: 50, company: 'Finance Corp', about: 'Finance analyst' },
    { id: 'Emp-007', name: 'Elliot Murray', role: 'Developer', email: 'elliot@example.com', phone: '(145) 6789 012', designation: 'Finance', joiningDate: '05 Jan 2024', status: 'Active', avatar: 'EM', avatarColor: '#e0f2fe', avatarTextColor: '#0284c7', image: 'https://randomuser.me/api/portraits/men/6.jpg', projects: 40, done: 25, productivity: 93, company: 'Bank Corp', about: 'Finance specialist' },
    { id: 'Emp-008', name: 'Rebecca Smith', role: 'Tester', email: 'rebecca@example.com', phone: '(156) 7890 123', designation: 'Executive', joiningDate: '15 Mar 2024', status: 'Active', avatar: 'RS', avatarColor: '#fef3c7', avatarTextColor: '#d97706', image: 'https://randomuser.me/api/portraits/women/2.jpg', projects: 30, done: 22, productivity: 80, company: 'Quality Assurance', about: 'QA lead' },
    { id: 'Emp-009', name: 'Connie Waters', role: 'Developer', email: 'connie@example.com', phone: '(167) 8901 234', designation: 'Developer', joiningDate: '22 Nov 2024', status: 'Active', avatar: 'CW', avatarColor: '#d1fae5', avatarTextColor: '#059669', image: 'https://randomuser.me/api/portraits/women/3.jpg', projects: 25, done: 18, productivity: 70, company: 'DevOps Inc', about: 'Backend developer' },
    { id: 'Emp-010', name: 'David Miller', role: 'Manager', email: 'david@example.com', phone: '(178) 9012 345', designation: 'Manager', joiningDate: '03 Feb 2024', status: 'Inactive', avatar: 'DM', avatarColor: '#fed7aa', avatarTextColor: '#9a3412', image: 'https://randomuser.me/api/portraits/men/7.jpg', projects: 12, done: 5, productivity: 45, company: 'Management Co', about: 'Project manager' },
    { id: 'Emp-011', name: 'Sarah Johnson', role: 'Executive', email: 'sarah@example.com', phone: '(189) 0123 456', designation: 'Executive', joiningDate: '28 Aug 2024', status: 'Active', avatar: 'SJ', avatarColor: '#e9d5ff', avatarTextColor: '#6b21a5', image: 'https://randomuser.me/api/portraits/women/4.jpg', projects: 22, done: 16, productivity: 88, company: 'Executive Corp', about: 'Senior executive' },
    { id: 'Emp-012', name: 'Michael Brown', role: 'Developer', email: 'michael@example.com', phone: '(190) 1234 567', designation: 'Developer', joiningDate: '14 May 2024', status: 'Active', avatar: 'MB', avatarColor: '#bfdbfe', avatarTextColor: '#1e40af', image: 'https://randomuser.me/api/portraits/men/8.jpg', projects: 18, done: 12, productivity: 60, company: 'Software Inc', about: 'Frontend developer' },
    { id: 'Emp-013', name: 'Jennifer Wilson', role: 'Finance', email: 'jennifer@example.com', phone: '(201) 2345 678', designation: 'Finance', joiningDate: '19 Nov 2024', status: 'Active', avatar: 'JW', avatarColor: '#fecdd3', avatarTextColor: '#9f1239', image: 'https://randomuser.me/api/portraits/women/5.jpg', projects: 28, done: 20, productivity: 75, company: 'Finance Solutions', about: 'Finance manager' },
    { id: 'Emp-014', name: 'Robert Taylor', role: 'Manager', email: 'robert@example.com', phone: '(212) 3456 789', designation: 'Manager', joiningDate: '07 Sep 2024', status: 'Inactive', avatar: 'RT', avatarColor: '#ccfbf1', avatarTextColor: '#0f766e', image: 'https://randomuser.me/api/portraits/men/9.jpg', projects: 8, done: 3, productivity: 25, company: 'Consulting Inc', about: 'Consultant' },
    { id: 'Emp-015', name: 'Patricia Anderson', role: 'Executive', email: 'patricia@example.com', phone: '(223) 4567 890', designation: 'Executive', joiningDate: '25 Oct 2024', status: 'Active', avatar: 'PA', avatarColor: '#fef08a', avatarTextColor: '#854d0e', image: 'https://randomuser.me/api/portraits/women/6.jpg', projects: 35, done: 28, productivity: 95, company: 'Leadership Corp', about: 'VP of operations' },
  ]);

  const nextEmpId = `Emp-${String(employees.length + 1).padStart(3, '0')}`;

  const showToast = (msg) => { setToastMessage(msg); setShowSuccessToast(true); setTimeout(() => setShowSuccessToast(false), 3000); };

  const handleAddEmployee = (data) => {
    const avatarColors = ['#e8f0fe', '#e3f2fd', '#fce4ec', '#e8f5e9', '#fff3e0', '#f3e5f5'];
    const avatarTextColors = ['#4f46e5', '#1565c0', '#c2185b', '#2e7d32', '#e65100', '#7b1fa2'];
    const idx = employees.length % avatarColors.length;
    const newEmp = {
      id: data.employeeId, name: `${data.firstName} ${data.lastName}`, role: data.designation || 'Employee', email: data.email, phone: data.phone,
      designation: data.designation, joiningDate: data.joiningDate ? new Date(data.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
      status: 'Active', avatar: `${data.firstName[0]}${data.lastName[0]}`.toUpperCase(), avatarColor: avatarColors[idx], avatarTextColor: avatarTextColors[idx],
      image: data.profilePreview || null, projects: 0, done: 0, productivity: 0, company: data.company, about: data.about, permissions: data.permissions,
    };
    setEmployees([...employees, newEmp]);
    setModalState({ ...modalState, showAdd: false });
    showToast('Employee Added!');
  };

  const handleEditEmployee = (data) => {
    setEmployees(employees.map(emp => emp.id === data.id ? { ...emp, id: data.employeeId, name: `${data.firstName} ${data.lastName}`, role: data.designation || 'Employee', email: data.email, phone: data.phone, designation: data.designation, joiningDate: data.joiningDate ? new Date(data.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : emp.joiningDate, image: data.profilePreview || emp.image, company: data.company, about: data.about, permissions: data.permissions } : emp));
    setModalState({ ...modalState, showEdit: false });
    showToast('Employee Updated!');
  };

  const handleDeleteEmployee = () => {
    if (modalState.employee) setEmployees(employees.filter(emp => emp.id !== modalState.employee.id));
    setModalState({ showAdd: false, showEdit: false, showDelete: false, employee: null });
    showToast('Employee Deleted!');
  };

  const stats = [
    { label: 'Total Employee', value: employees.length, growth: '+19.01%', iconBg: '#1a1a2e' },
    { label: 'Active', value: employees.filter(e => e.status === 'Active').length, growth: '+19.01%', iconBg: '#22c55e' },
    { label: 'InActive', value: employees.filter(e => e.status === 'Inactive').length, growth: '+19.01%', iconBg: '#ef4444' },
    { label: 'New Joiners', value: '67', growth: '+19.01%', iconBg: '#3b82f6' },
  ];

  const filteredEmployees = employees.filter(emp => (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.email.toLowerCase().includes(searchTerm.toLowerCase())) && (!designation || emp.designation === designation) && (!status || emp.status === status));
  const totalEntries = filteredEmployees.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, startIndex + rowsPerPage);

  const toggleRow = (id) => setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  const toggleAll = () => setSelectedRows(selectedRows.length === currentEmployees.length ? [] : currentEmployees.map(e => e.id));

  const handleDateRangeSelect = (option) => {
    const today = new Date();
    const fmt = d => d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    let rangeText = '';
    if (option.value === 'today') rangeText = `${fmt(today)} - ${fmt(today)}`, setDateRangeLabel('Today');
    else if (option.value === 'yesterday') { const y = new Date(today); y.setDate(today.getDate() - 1); rangeText = `${fmt(y)} - ${fmt(y)}`; setDateRangeLabel('Yesterday'); }
    else if (option.value === 'last7days') { const l7 = new Date(today); l7.setDate(today.getDate() - 7); rangeText = `${fmt(l7)} - ${fmt(today)}`; setDateRangeLabel('Last 7 Days'); }
    else if (option.value === 'last30days') { const l30 = new Date(today); l30.setDate(today.getDate() - 30); rangeText = `${fmt(l30)} - ${fmt(today)}`; setDateRangeLabel('Last 30 Days'); }
    else if (option.value === 'thisyear') rangeText = `${fmt(new Date(today.getFullYear(), 0, 1))} - ${fmt(new Date(today.getFullYear(), 11, 31))}`, setDateRangeLabel('This Year');
    else if (option.value === 'nextyear') rangeText = `${fmt(new Date(today.getFullYear() + 1, 0, 1))} - ${fmt(new Date(today.getFullYear() + 1, 11, 31))}`, setDateRangeLabel('Next Year');
    else if (option.value === 'custom') { setShowDateRangePicker(true); setShowDateDropdown(false); return; }
    setSelectedDateRange(rangeText);
    setShowDateDropdown(false);
    setCurrentPage(1);
  };

  const handleCustomRangeApply = (start, end) => {
    const fmt = d => d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    setSelectedDateRange(`${fmt(start)} - ${fmt(end)}`);
    setDateRangeLabel('Custom Range');
    setCustomStartDate(start);
    setCustomEndDate(end);
    setCurrentPage(1);
  };

  useEffect(() => {
    const handler = (e) => { if (openMenuId && !e.target.closest('.menu-container')) setOpenMenuId(null); if (showExportDropdown && !e.target.closest('.export-dropdown')) setShowExportDropdown(false); if (showDateDropdown && !e.target.closest('.date-dropdown')) setShowDateDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId, showExportDropdown, showDateDropdown]);

  const designations = ['Finance', 'Developer', 'Executive', 'Manager'];
  const statusOptions = ['Active', 'Inactive'];
  const sortOptions = ['Last 7 Days', 'Last 30 Days', 'Last 3 Months'];
  const dateOptions = [{ label: 'Today', value: 'today' }, { label: 'Yesterday', value: 'yesterday' }, { label: 'Last 7 Days', value: 'last7days' }, { label: 'Last 30 Days', value: 'last30days' }, { label: 'This Year', value: 'thisyear' }, { label: 'Next Year', value: 'nextyear' }, { label: 'Custom Range', value: 'custom' }];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {showSuccessToast && (<div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-white border border-green-100 shadow-lg rounded-xl px-4 py-3"><div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a"><polyline points="20 6 9 17 4 12"/></svg></div><div><p className="text-sm font-semibold text-gray-800">{toastMessage}</p><p className="text-xs text-gray-500">Operation completed successfully.</p></div></div>)}
      {modalState.showDelete && <DeleteConfirmModal onClose={() => setModalState({ ...modalState, showDelete: false })} onConfirm={handleDeleteEmployee} itemName={modalState.employee?.name} itemDetails={modalState.employee ? [{ label: 'Designation', value: modalState.employee.designation }, { label: 'Joining Date', value: modalState.employee.joiningDate }, { label: 'Status', value: modalState.employee.status }] : null} />}
      {modalState.showAdd && <EmployeeFormModal title="Add New Employee" onClose={() => setModalState({ ...modalState, showAdd: false })} onSave={handleAddEmployee} nextId={nextEmpId} />}
      {modalState.showEdit && modalState.employee && <EmployeeFormModal title="Edit Employee" employee={modalState.employee} onClose={() => setModalState({ ...modalState, showEdit: false })} onSave={handleEditEmployee} />}
      {showDateRangePicker && <DateRangePickerModal onClose={() => setShowDateRangePicker(false)} onApply={handleCustomRangeApply} initialStartDate={customStartDate} initialEndDate={customEndDate} />}
      
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
        <div><h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5">Employees List</h1><div className="flex items-center gap-1 text-sm text-gray-500"><span>🏠</span><span className="text-gray-400">›</span><span>Employees</span><span className="text-gray-400">›</span><span className="text-gray-700 font-medium">Employees List</span></div></div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setViewMode('list')} className={`w-9 h-9 flex items-center justify-center bg-white border rounded-lg ${viewMode === 'list' ? 'border-indigo-600 text-indigo-600' : 'border-gray-200 text-gray-500'}`}><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="2" width="16" height="2" rx="1"/><rect x="0" y="7" width="16" height="2" rx="1"/><rect x="0" y="12" width="16" height="2" rx="1"/></svg></button>
          <button onClick={() => setViewMode('grid')} className={`w-9 h-9 flex items-center justify-center bg-white border rounded-lg ${viewMode === 'grid' ? 'border-indigo-600 text-indigo-600' : 'border-gray-200 text-gray-500'}`}><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="7" rx="1"/><rect x="0" y="9" width="7" height="7" rx="1"/><rect x="9" y="9" width="7" height="7" rx="1"/></svg></button>
          <div className="relative"><button onClick={() => setShowExportDropdown(!showExportDropdown)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>Export<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6"/></svg></button>{showExportDropdown && (<div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">{['PDF', 'Excel'].map(fmt => (<button key={fmt} onClick={() => setShowExportDropdown(false)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Export as {fmt}</button>))}</div>)}</div>
          <button onClick={() => setModalState({ ...modalState, showAdd: true })} className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 rounded-lg text-sm font-semibold text-white shadow-md hover:bg-orange-600"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>Add Employee</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (<div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm"><div className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.iconBg }}><svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/></svg></div><div className="flex-1"><div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{stat.label}</div><div className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</div></div><div className="flex items-center gap-0.5 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full"><span>→</span><span>{stat.growth}</span></div></div>))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 pb-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-gray-900">Plan List</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative"><button onClick={() => setShowDateDropdown(!showDateDropdown)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg><span className="hidden sm:inline">{selectedDateRange}</span><span className="sm:hidden">{dateRangeLabel}</span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6"/></svg></button>{showDateDropdown && (<div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">{dateOptions.map(opt => (<button key={opt.value} onClick={() => handleDateRangeSelect(opt)} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between"><span>{opt.label}</span>{dateRangeLabel === opt.label && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg>}</button>))}</div>)}</div>
              {[{ val: designation, set: v => { setDesignation(v); setCurrentPage(1); }, opts: designations, placeholder: 'Designation' }, { val: status, set: v => { setStatus(v); setCurrentPage(1); }, opts: statusOptions, placeholder: 'Select Status' }, { val: sortBy, set: v => setSortBy(v), opts: sortOptions, prefix: 'Sort By : ' }].map((sel, i) => (<select key={i} value={sel.val} onChange={e => sel.set(e.target.value)} className="px-3 py-1.5 pr-7 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white appearance-none cursor-pointer">{!sel.prefix && <option value="">{sel.placeholder}</option>}{sel.opts.map(o => <option key={o} value={o}>{sel.prefix ? `${sel.prefix}${o}` : o}</option>)}</select>))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500"><span>Row Per Page</span><select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2 py-1 pr-6 border border-gray-200 rounded-md text-sm text-gray-700 bg-white appearance-none">{[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}</select><span>Entries</span></div>
            <div className="relative"><svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" placeholder="Search" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 pr-3.5 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 w-full sm:w-48 focus:border-indigo-600 outline-none" /></div>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead className="bg-gray-50"><tr><th className="py-3 pl-5 pr-4 w-11"><input type="checkbox" checked={selectedRows.length === currentEmployees.length && currentEmployees.length > 0} onChange={toggleAll} className="w-4 h-4 cursor-pointer accent-indigo-600" /></th>{['Emp ID', 'Name', 'Email', 'Phone', 'Designation', 'Joining Date', 'Status', ''].map(h => (<th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase whitespace-nowrap"><div className="flex items-center gap-1">{h} <span className="text-gray-300 text-sm">⇅</span></div></th>))}</tr></thead>
              <tbody>
                {currentEmployees.map(emp => (<tr key={emp.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedRows.includes(emp.id) ? 'bg-indigo-50' : ''}`}>
                  <td className="py-3.5 pl-5 pr-4"><input type="checkbox" checked={selectedRows.includes(emp.id)} onChange={() => toggleRow(emp.id)} className="w-4 h-4 cursor-pointer accent-indigo-600" /></td>
                  <td className="py-3.5 px-4 text-sm font-semibold text-gray-700">{emp.id}</td>
                  <td className="py-3.5 px-4"><div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden" style={{ background: emp.avatarColor }}>{emp.image ? <img src={emp.image} alt={emp.name} className="w-full h-full object-cover" /> : <span style={{ color: emp.avatarTextColor }}>{emp.avatar}</span>}</div><div><div className="text-sm font-semibold text-gray-900">{emp.name}</div><div className="text-xs text-gray-400">{emp.role}</div></div></div></td>
                  <td className="py-3.5 px-4 text-sm text-gray-500">{emp.email}</td>
                  <td className="py-3.5 px-4 text-sm text-gray-700">{emp.phone}</td>
                  <td className="py-3.5 px-4"><div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-gray-200 rounded-md text-sm text-gray-700 bg-white">{emp.designation}<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6"/></svg></div></td>
                  <td className="py-3.5 px-4 text-sm text-gray-700">{emp.joiningDate}</td>
                  <td className="py-3.5 px-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${emp.status === 'Active' ? 'bg-green-700 text-white' : 'bg-red-700 text-white'}`}><span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-green-300' : 'bg-red-300'}`}></span>{emp.status}</span></td>
                  <td className="py-3.5 px-4"><div className="flex items-center gap-1.5"><button onClick={() => setModalState({ ...modalState, showEdit: true, employee: emp })} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-indigo-600"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button><button onClick={() => setModalState({ ...modalState, showDelete: true, employee: emp })} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg></button></div></td>
                </tr>))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-5">
            {currentEmployees.map(emp => (<div key={emp.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all relative"><div className="p-5"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden" style={{ background: emp.avatarColor }}>{emp.image ? <img src={emp.image} alt={emp.name} className="w-full h-full object-cover" /> : <span style={{ color: emp.avatarTextColor }}>{emp.avatar}</span>}</div><div><h3 className="font-semibold text-gray-900 text-base">{emp.name}</h3><p className="text-xs text-gray-500">{emp.role}</p></div></div><div className="relative"><button onClick={() => setOpenMenuId(openMenuId === emp.id ? null : emp.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg></button>{openMenuId === emp.id && (<div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30"><button onClick={() => { setModalState({ ...modalState, showEdit: true, employee: emp }); setOpenMenuId(null); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit</button><button onClick={() => { setModalState({ ...modalState, showDelete: true, employee: emp }); setOpenMenuId(null); }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>Delete</button></div>)}</div></div><div className="grid grid-cols-3 gap-2 mt-4 text-center"><div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Projects</div><div className="text-lg font-bold text-gray-900">{emp.projects}</div></div><div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Done</div><div className="text-lg font-bold text-green-600">{emp.done}</div></div><div className="bg-gray-50 rounded-lg p-2"><div className="text-xs text-gray-500">Progress</div><div className="text-lg font-bold text-blue-600">{emp.projects - emp.done}</div></div></div><div className="mt-4 text-center"><div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg"><span className="text-xs font-medium text-gray-500">Productivity</span><span className="text-sm font-bold" style={{ color: emp.productivity >= 70 ? '#22c55e' : emp.productivity >= 40 ? '#eab308' : '#ef4444' }}>{emp.productivity}%</span></div></div><div className="mt-3"><div className="w-full bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${emp.productivity}%`, backgroundColor: emp.productivity >= 70 ? '#22c55e' : emp.productivity >= 40 ? '#eab308' : '#ef4444' }} /></div></div></div></div>))}
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-500">Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, totalEntries)} of {totalEntries} entries</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6"/></svg>Previous</button>
            <div className="flex items-center gap-1">{Array.from({ length: Math.min(totalPages, 5) }, (_, i) => { let p = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i; return (<button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-md text-sm font-medium ${currentPage === p ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{p}</button>); })}</div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalEntries === 0} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 ${currentPage === totalPages || totalEntries === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>Next<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>
      </div>

      <button className="fixed right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center bg-orange-500 rounded-l-lg text-white shadow-lg hover:bg-orange-600 z-10"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg></button>
    </div>
  );
};

export default EmployeeList;