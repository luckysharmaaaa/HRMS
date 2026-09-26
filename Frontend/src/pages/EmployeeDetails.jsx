import { useState, useRef, useEffect } from "react";

// ========== DATA ==========
const employeeData = {
  name: "Stephan Peralt",
  role: "Software Developer",
  experience: "10+ years of Experience",
  clientId: "CLT-0024",
  team: "UI/UX Design",
  dateOfJoin: "1st Jan 2023",
  reportOffice: "Doglas Martini",
  phone: "(163) 2459 315",
  email: "peralt12@example.com",
  gender: "Male",
  birthday: "24th July 2000",
  address: "1861 Bayonne Ave, Manchester, NJ, 08759",
  passportNo: "QRET4566FGRT",
  passportExpDate: "15 May 2029",
  nationality: "Indian",
  religion: "Christianity",
  maritalStatus: "Yes",
  employmentOfSpouse: "No",
  noOfChildren: "2",
  emergencyContacts: [
    { type: "Primary", name: "Adrian Peralt", relation: "Father", phone: "+1 127 2685 598" },
    { type: "Secondary", name: "Karen Wills", relation: "Mother", phone: "+1 989 7774 787" },
  ],
  projects: [
    { name: "World Health", color: "bg-blue-500", tasks: 8, completed: 15, deadline: "31 July 2025", lead: "Leona" },
    { name: "Hospital Administration", color: "bg-purple-500", tasks: 8, completed: 15, deadline: "31 July 2025", lead: "Leona" },
  ],
  assets: [
    { name: "Dell Laptop", id: "#343556656", assetId: "AST-001", assignedOn: "22 Nov, 2022 10:32AM", assignedBy: "Andrew Symon", icon: "💻", type: "Laptop", brand: "Dell", category: "Computer", serialNo: "3647952145678", cost: "$800", vendor: "Compusoft Systems Ltd.", warranty: "12 Jan 2022 - 12 Jan 2026", location: "46 Laurel Lane, TX 79701", images: ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=150&h=150&fit=crop"] },
    { name: "Bluetooth Mouse", id: "#478878", assetId: "AST-001", assignedOn: "22 Nov, 2022 10:32AM", assignedBy: "Andrew Symon", icon: "🖱️", type: "Mouse", brand: "Logitech", category: "Accessory", serialNo: "3647952145679", cost: "$50", vendor: "Tech Solutions Ltd.", warranty: "12 Jan 2022 - 12 Jan 2024", location: "46 Laurel Lane, TX 79701", images: ["https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=150&h=150&fit=crop", "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=150&h=150&fit=crop"] },
  ],
  bankDetails: { bankName: "Swiz Intenational Bank", accountNo: "159843014641", ifscCode: "ICI24504", branch: "Alabama USA" },
  familyMembers: [{ name: "Hendry Peralt", relationship: "Brother", dateOfBirth: "25 May 2014", phone: "+1 265 6956 961" }],
  educationDetails: [
    { institution: "Oxford University", course: "Computer Science", years: "2020 - 2022" },
    { institution: "Cambridge University", course: "Computer Network & Systems", years: "2016 - 2019" },
    { institution: "Oxford School", course: "Grade X", years: "2012 - 2016" },
  ],
  experienceDetails: [
    { company: "Google", role: "UI/UX Developer", years: "Jan 2013 - Present" },
    { company: "Salesforce", role: "Web Developer", years: "Dec 2012 - Jan 2015" },
    { company: "HubSpot", role: "Software Developer", years: "Dec 2011 - Jan 2012" },
  ]
};

const chatList = [
  { id: 1, name: "Anthony Lewis", avatar: "https://randomuser.me/api/portraits/men/32.jpg", online: true, lastMessage: "is typing •••", isTyping: true, time: "02:40 PM" },
  { id: 2, name: "Elliot Murray", avatar: "https://randomuser.me/api/portraits/women/65.jpg", online: true, lastMessage: "Document", icon: "📄", time: "06:12 AM", trailingIcon: "✓" },
  { id: 3, name: "Stephan Peralt", avatar: "https://randomuser.me/api/portraits/men/45.jpg", online: true, lastMessage: "Missed Video Call", icon: "📹", lastMessageColor: "text-red-500", time: "03:15 AM", trailingIcon: "📎" },
  { id: 4, name: "Rebecca Smith", avatar: "https://randomuser.me/api/portraits/women/68.jpg", online: true, lastMessage: "Hi How are you 🔥", time: "Sunday", badge: "25", badgeColor: "bg-red-500" },
  { id: 5, name: "Harvey Smith", avatar: "https://randomuser.me/api/portraits/men/22.jpg", online: true, lastMessage: "Haha oh man 🔥", time: "03:15 AM", badge: "12", badgeColor: "bg-red-500", trailingIcon: "📎" },
  { id: 6, name: "Lori Broaddus", avatar: "https://randomuser.me/api/portraits/women/12.jpg", online: true, lastMessage: "Do you know which...", time: "02:40 PM", trailingIcon: "🔖" },
  { id: 7, name: "Brian Villalobos", avatar: "https://randomuser.me/api/portraits/men/53.jpg", online: false, lastMessage: "Do you know which...", time: "06:12 AM" },
];

const initialConversation = [
  { id: 1, sender: "them", text: "Hi John, I wanted to update you on a new company policy regarding remote work.", time: "08:00 AM" },
  { id: 2, sender: "them", text: "Do you have a moment?", time: "08:00 AM" },
  { id: 3, sender: "me", text: "Sure, Sarah. What's the new policy?", time: "08:00 AM" },
  { id: 4, sender: "them", text: "Starting next month, we'll be implementing a hybrid work model. Employees can work from home up to three days a week.", time: "08:00 AM" },
  { id: 5, sender: "me", text: "That sounds great! Are there any specific requirements for tracking our hours when working remotely?", time: "08:00 AM" },
];

const projectDetailsData = {
  "World Health": {
    projectId: "PRO-0001", icon: "🌐", iconBg: "bg-blue-500", status: "In Progress", statusColor: "bg-blue-100 text-blue-600",
    client: "Sun Marino Enterprises", totalCost: "$5,500", hoursOfWork: "168 Hrs", createdOn: "14 May 2025",
    startDate: "16 Jun 2025", dueDate: "31 Jul 2025", overdue: true, createdBy: "Cameron", priority: "High",
    team: ["Leona", "Lana", "Phelix", "Brittney"], teamLead: "Beth", projectManager: "Joseph",
    tags: ["Healthcare", "Web App"],
    description: "The World Health Tracking System (WHTS) project aims to modernize and streamline the global health management processes within.",
    timeSpent: "85/168 Hrs", timeSpentPercent: 51,
    tasks: [
      { name: "Update calendar and schedule", status: "Completed", statusColor: "bg-green-100 text-green-600", priority: "medium", tag: "Internal", description: "Update the calendar and scheduling system", assignee: "Sophie" },
      { name: "Appointment booking with payment gateway", status: "In Progress", statusColor: "bg-purple-100 text-purple-600", priority: "medium", tag: "External", description: "Integrate payment gateway for online appointment booking", assignee: "John" },
      { name: "Patient and Doctor video conferencing", status: "Completed", statusColor: "bg-green-100 text-green-600", priority: "high", tag: "Internal", description: "Implement video call functionality between patients and doctors", assignee: "Sophie" },
      { name: "Behaviour Analysis Module", status: "Pending", statusColor: "bg-orange-100 text-orange-600", priority: "high", tag: "Team", description: "Analyze patient behavior patterns and generate insights", assignee: "Mike" },
      { name: "Go Live and Post Implementation Support", status: "Pending", statusColor: "bg-orange-100 text-orange-600", priority: "medium", tag: "Client", description: "Provide support after project go-live and ensure smooth operations", assignee: "Sophie" },
    ],
    images: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=200&fit=crop", "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200&h=200&fit=crop", "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&h=200&fit=crop"],
    files: [
      { name: "Project_1.docx", size: "1.2 MB", icon: "📘", color: "text-blue-500", date: "13 May 2026, 4:30 PM", by: "men/32" },
      { name: "Proposal.pdf", size: "1.5 MB", icon: "📕", color: "text-red-500", date: "13 May 2026, 4:30 PM", by: "men/45" },
      { name: "Logo-img.zip", size: "4.1 MB", icon: "📁", color: "text-yellow-500", date: "13 May 2026, 4:30 PM", by: "women/65" },
    ],
    notes: [
      { date: "13 May 2025", title: "Changes & design", text: "An offline status update for project information, deadlines for completion." },
      { date: "13 May 2025", title: "Changes & design", text: "An offline status update for project information, deadlines for completion." },
    ],
    activity: [
      { color: "bg-blue-500", text: "Leona added a new task", time: "13 May 2026, 4:30 PM" },
      { color: "bg-yellow-500", text: "Lana moved task 'Patient appointment booking'", time: "13 May 2026, 4:30 PM" },
    ],
  },
  "Hospital Administration": {
    projectId: "PRO-0002", icon: "🏥", iconBg: "bg-purple-500", status: "In Progress", statusColor: "bg-blue-100 text-blue-600",
    client: "Sun Marino Enterprises", totalCost: "$5,500", hoursOfWork: "168 Hrs", createdOn: "14 May 2025",
    startDate: "16 Jun 2025", dueDate: "31 May 2026", overdue: true, createdBy: "Cameron", priority: "High",
    team: ["Leona", "Lana", "Phelix", "Brittney"], teamLead: "Beth", projectManager: "Joseph",
    tags: ["Healthcare", "Web App"],
    description: "The Enhanced Patient Management System (EPMS) project aims to modernize and streamline the patient management processes.",
    timeSpent: "66/120 Hrs", timeSpentPercent: 55,
    tasks: [
      { name: "Patient appointment booking", status: "Completed", statusColor: "bg-green-100 text-green-600", priority: "low", tag: "Internal", description: "Schedule patient appointments with hospital staff", assignee: "Sophie" },
      { name: "Appointment booking with payment gateway", status: "In Progress", statusColor: "bg-purple-100 text-purple-600", priority: "medium", tag: "External", description: "Payment gateway integration for hospital appointments", assignee: "John" },
      { name: "Patient and Doctor video conferencing", status: "Completed", statusColor: "bg-green-100 text-green-600", priority: "high", tag: "Internal", description: "Video consultation between patients and hospital doctors", assignee: "Sophie" },
      { name: "Behaviour Analysis Module", status: "Pending", statusColor: "bg-orange-100 text-orange-600", priority: "high", tag: "Team", description: "Analyze patient behavior and treatment patterns", assignee: "Mike" },
      { name: "Go Live and Post Implementation Support", status: "Pending", statusColor: "bg-orange-100 text-orange-600", priority: "medium", tag: "Client", description: "Post-launch support and maintenance", assignee: "Sophie" },
    ],
    images: ["https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200&h=200&fit=crop", "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200&h=200&fit=crop"],
    files: [
      { name: "Project_1.docx", size: "1.2 MB", icon: "📘", color: "text-blue-500", date: "13 May 2026, 4:30 PM", by: "men/32" },
      { name: "Proposal.pdf", size: "1.5 MB", icon: "📕", color: "text-red-500", date: "13 May 2026, 4:30 PM", by: "men/45" },
    ],
    notes: [{ date: "13 May 2025", title: "Changes & design", text: "An offline status update for project information." }],
    activity: [
      { color: "bg-blue-500", text: "Leona added a new task", time: "13 May 2026, 4:30 PM" },
      { color: "bg-purple-500", text: "Phelix moved task", time: "13 May 2026, 4:30 PM" },
    ],
  },
};

// ========== UTILITY FUNCTIONS ==========
const getStatusColor = (status) => {
  const colors = { Completed: "bg-green-100 text-green-600", "In Progress": "bg-purple-100 text-purple-600", Pending: "bg-orange-100 text-orange-600", "On Hold": "bg-yellow-100 text-yellow-600" };
  return colors[status] || "bg-gray-100 text-gray-600";
};

const priorityStyles = { high: { dot: "bg-red-500" }, medium: { dot: "bg-orange-400" }, low: { dot: "bg-green-500" } };

const getPriorityColor = (p) => ({ High: "text-red-500", Medium: "text-orange-400", Low: "text-green-500" }[p] || "text-gray-500");

// ========== REUSABLE COMPONENTS ==========
const InputField = ({ label, name, value, onChange, error, placeholder, type = "text", disabled = false }) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    <input name={name} value={value} onChange={onChange} placeholder={placeholder} type={type} disabled={disabled}
      className={`w-full px-3 py-1.5 text-sm border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const FormButtons = ({ onCancel, onSave, saveText = "Save" }) => (
  <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
    <button onClick={onCancel} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancel</button>
    <button onClick={onSave} className="px-5 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors">{saveText}</button>
  </div>
);

const Avatar = ({ name, size = "lg", imageUrl }) => {
  const sizeClasses = size === "lg" ? "w-20 h-20 text-xl" : "w-10 h-10 text-xs";
  if (imageUrl) return <img src={imageUrl} alt={name} className={`${sizeClasses} rounded-full border-2 border-white object-cover shadow-lg`} />;
  return <div className={`${sizeClasses} rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center font-bold text-white shadow-lg`}>{name?.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>;
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start justify-between py-2.5 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-3 text-gray-400 min-w-[160px]"><span className="text-sm">{icon}</span><span className="text-sm text-gray-500">{label}</span></div>
    <span className="text-sm text-gray-700 text-right flex-1">{value}</span>
  </div>
);

const SectionCard = ({ title, children, defaultOpen = false, onEdit }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 bg-white hover:bg-gray-50 transition-colors">
        <span className="text-base font-medium text-gray-700">{title}</span>
        <div className="flex gap-2 items-center">
          {onEdit && <span className="text-gray-400 text-sm cursor-pointer hover:text-gray-600" onClick={(e) => { e.stopPropagation(); onEdit(); }}>✎</span>}
          <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && <div className="px-5 pb-4 bg-white">{children}</div>}
    </div>
  );
};

const ModalWrapper = ({ isOpen, onClose, title, children, onSave, saveText = "Save" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        <FormButtons onCancel={onClose} onSave={onSave} saveText={saveText} />
      </div>
    </div>
  );
};

const DropdownMenu = ({ isOpen, onClose, options, buttonRef }) => {
  const ref = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target) && buttonRef?.current && !buttonRef.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, buttonRef]);
  if (!isOpen) return null;
  return (
    <div ref={ref} className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 py-1 z-50 min-w-[200px] animate-fadeIn" style={{ animation: 'fadeIn 0.15s ease-out' }}>
      {options.map((opt, i) => <button key={i} onClick={() => { opt.action(); onClose(); }} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"><span className="text-base">{opt.icon}</span><span>{opt.label}</span></button>)}
    </div>
  );
};

const AttachmentButton = ({ onFileSelect }) => {
  const fileInputRef = useRef(null);
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { alert("File size should be less than 10MB"); return; }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) { alert("Please upload an image or PDF file"); return; }
      const reader = new FileReader();
      reader.onloadend = () => onFileSelect({ name: file.name, type: file.type, size: file.size, data: reader.result });
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };
  return (
    <>
      <button onClick={() => fileInputRef.current.click()} className="text-gray-400 hover:text-gray-600 transition-colors" title="Attach file">📎</button>
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
    </>
  );
};

const AttachmentModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  const options = [{ icon: "📷", label: "Camera" }, { icon: "🖼️", label: "Gallery" }, { icon: "🎵", label: "Audio" }, { icon: "📍", label: "Location" }, { icon: "💻", label: "Windows" }, { icon: "📞", label: "Contact" }];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800">Attach</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-3 gap-4">
            {options.map((opt, idx) => (
              <button key={idx} onClick={() => { alert(`${opt.label} option selected`); onClose(); }} className="flex flex-col items-center gap-2 py-4 px-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl">{opt.icon}</div>
                <span className="text-xs text-gray-600 font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100"><p className="text-xs text-orange-600 text-center">💡 to activate Window</p></div>
        </div>
      </div>
    </div>
  );
};

// ========== CHAT COMPONENTS ==========
const ChatListItem = ({ chat, isActive, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${isActive ? "bg-orange-50" : "hover:bg-gray-50"}`}>
    <div className="relative flex-shrink-0"><img src={chat.avatar} alt={chat.name} className="w-11 h-11 rounded-full object-cover" />{chat.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}</div>
    <div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold text-gray-800 truncate">{chat.name}</span><span className="text-xs text-gray-400 whitespace-nowrap">{chat.time}</span></div><div className="flex items-center justify-between gap-2 mt-0.5"><span className={`text-xs truncate ${chat.lastMessageColor || "text-gray-500"} ${chat.isTyping ? "italic" : ""}`}>{chat.icon && <span className="mr-1">{chat.icon}</span>}{chat.lastMessage}</span>{chat.badge ? <span className={`flex-shrink-0 text-[10px] font-bold text-white rounded-full w-5 h-5 flex items-center justify-center ${chat.badgeColor}`}>{chat.badge}</span> : chat.trailingIcon ? <span className="flex-shrink-0 text-xs text-gray-400">{chat.trailingIcon}</span> : null}</div></div>
  </button>
);

const ChatBubble = ({ message, partner }) => {
  const [showMenu, setShowMenu] = useState(false);
  const btnRef = useRef(null);
  const isMe = message.sender === "me";
  const menuOptions = [
    { icon: "↩️", label: "Reply", action: () => alert(`Reply to: "${message.text}"`) },
    { icon: "➡️", label: "Forward", action: () => alert(`Forward: "${message.text}"`) },
    { icon: "📋", label: "Copy", action: () => alert(`Copy: "${message.text}"`) },
    { icon: "⭐", label: "Mark as Favourite", action: () => alert("Marked as favourite") },
    { icon: "🗑️", label: "Delete", action: () => alert("Message deleted") },
  ];
  return (
    <div className={`flex items-end gap-2.5 mb-5 ${isMe ? "justify-end" : "justify-start"}`}>
      {!isMe && <img src={partner.avatar} alt={partner.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />}
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[60%]`}>
        <div className="flex items-center gap-2">
          <button ref={btnRef} onClick={() => setShowMenu(!showMenu)} className="text-gray-400 hover:text-gray-600 cursor-pointer text-sm transition-colors">⋮</button>
          <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-orange-50 text-gray-700" : "bg-gray-100 text-gray-700"}`}>{message.text}</div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 px-1">{isMe && <span className="text-green-500 text-xs">✓</span>}<span className="text-xs text-gray-400">{message.time}</span>{!isMe && <><span className="text-gray-300">•</span><span className="text-xs text-gray-400">{partner.name}</span></>}{isMe && <span className="text-xs text-gray-400">You</span>}</div>
      </div>
      {isMe && <img src="https://randomuser.me/api/portraits/men/45.jpg" alt="You" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />}
      <DropdownMenu isOpen={showMenu} onClose={() => setShowMenu(false)} options={menuOptions} buttonRef={btnRef} />
    </div>
  );
};

const ChatPage = ({ onBack }) => {
  const [activeChatId, setActiveChatId] = useState(1);
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState(initialConversation);
  const [draft, setDraft] = useState("");
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  const menuBtnRef = useRef(null);
  const scrollRef = useRef(null);
  const activeChat = chatList.find(c => c.id === activeChatId) || chatList[0];
  const filteredChats = chatList.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, activeChatId]);

  const handleSend = () => {
    if (!draft.trim()) return;
    setMessages(prev => [...prev, { id: prev.length + 1, sender: "me", text: draft.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setDraft("");
  };

  const chatMenuOptions = [
    { icon: "🔕", label: "Mute Notification", action: () => alert("Muted") },
    { icon: "⏳", label: "Disappearing Message", action: () => alert("Disappearing message enabled") },
    { icon: "🗑️", label: "Clear Message", action: () => alert("Messages cleared") },
    { icon: "🚫", label: "Delete Chat", action: () => alert("Chat deleted") },
    { icon: "🚷", label: "Block", action: () => alert("User blocked") },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
      <div className="mb-4"><h1 className="text-2xl font-semibold text-gray-800">Chat</h1><div className="flex items-center gap-2 text-sm text-gray-400 mt-1"><button onClick={onBack} className="hover:text-gray-600 transition-colors">🏠</button><span>›</span><button onClick={onBack} className="hover:text-gray-600 transition-colors">Applications</button><span>›</span><span className="text-gray-500">Chat</span></div></div>
      <div className="flex gap-0 bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
        <div className="w-[300px] flex-shrink-0 border-r border-gray-200 flex flex-col">
          <div className="px-4 py-4 border-b border-gray-100"><h2 className="text-lg font-semibold text-gray-800 mb-3">Chats</h2>
            <div className="relative"><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search For Contacts or Messages" className="w-full pl-3 pr-9 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50" /><svg className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div>
          </div>
          <div className="px-4 pt-3 pb-1"><span className="text-xs font-semibold text-gray-500">All Chats</span></div>
          <div className="flex-1 overflow-y-auto px-1 pb-3">{filteredChats.length ? filteredChats.map(chat => <ChatListItem key={chat.id} chat={chat} isActive={chat.id === activeChatId} onClick={() => setActiveChatId(chat.id)} />) : <p className="text-sm text-gray-400 text-center mt-6">No contacts found.</p>}</div>
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3"><img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover" /><div><p className="text-sm font-semibold text-gray-800">{activeChat.name}</p><p className={`text-xs ${activeChat.online ? "text-green-500" : "text-gray-400"}`}>{activeChat.online ? "Online" : "Offline"}</p></div></div>
            <div className="flex items-center gap-4 text-gray-400">
              <button className="hover:text-gray-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></button>
              <button ref={menuBtnRef} onClick={() => setShowChatMenu(!showChatMenu)} className="hover:text-gray-600 transition-colors text-2xl font-bold leading-none">⋮</button>
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5">{messages.map(msg => <ChatBubble key={msg.id} message={msg} partner={activeChat} />)}<div className="flex items-center justify-center my-4"><span className="bg-gray-900 text-white text-xs px-4 py-1.5 rounded-full">Today, July 24</span></div></div>
          <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-200">
            <button className="text-gray-400 hover:text-gray-600 transition-colors">🎤</button>
            <input type="text" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Type your Message" className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50" />
            <button className="text-gray-400 hover:text-gray-600 transition-colors">😊</button>
            <AttachmentButton onFileSelect={(file) => alert(`File uploaded: ${file.name}`)} />
            <button onClick={() => setShowAttachment(true)} className="text-gray-400 hover:text-gray-600 transition-colors text-lg font-bold">⋮</button>
            <button onClick={handleSend} className="w-9 h-9 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">➤</button>
          </div>
        </div>
      </div>
      <DropdownMenu isOpen={showChatMenu} onClose={() => setShowChatMenu(false)} options={chatMenuOptions} buttonRef={menuBtnRef} />
      <AttachmentModal isOpen={showAttachment} onClose={() => setShowAttachment(false)} />
    </div>
  );
};

// ========== EDIT PROJECT MODAL ==========
const EditProjectModal = ({ isOpen, onClose, onSave, project }) => {
  const [formData, setFormData] = useState({
    projectName: project?.name || "",
    client: project?.client || "",
    startDate: project?.startDate || "",
    endDate: project?.dueDate || "",
    priority: project?.priority || "Select",
    projectValue: "",
    priceType: "",
    description: project?.description || "",
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (project) {
      setFormData({
        projectName: project.name || "",
        client: project.client || "",
        startDate: project.startDate || "",
        endDate: project.dueDate || "",
        priority: project.priority || "Select",
        projectValue: "",
        priceType: "",
        description: project.description || "",
      });
    }
  }, [project]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("Image should be below 4 MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setUploadedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file.name);
    }
  };

  const validate = () => {
    const err = {};
    if (!formData.projectName.trim()) err.projectName = "Project name is required";
    if (!formData.client.trim()) err.client = "Client name is required";
    if (!formData.startDate) err.startDate = "Start date is required";
    if (!formData.endDate) err.endDate = "End date is required";
    if (formData.priority === "Select") err.priority = "Priority is required";
    if (!formData.description.trim()) err.description = "Description is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      const updatedProject = {
        ...project,
        name: formData.projectName,
        client: formData.client,
        startDate: formData.startDate,
        dueDate: formData.endDate,
        priority: formData.priority,
        description: formData.description,
      };
      onSave(updatedProject);
      onClose();
    }
  };

  const memberAvatars = [
    "https://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/api/portraits/women/65.jpg",
    "https://randomuser.me/api/portraits/men/45.jpg",
    "https://randomuser.me/api/portraits/women/68.jpg",
  ];

  const annotations = ["Onhold", "Inprogress", "Completed", "Pending", "Inprogress"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Edit Project</h2>
            <p className="text-xs text-gray-400">Project ID: {project?.projectId || "PRO-0004"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>

            {/* Members */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-2">Members</label>
              <div className="flex items-center gap-2">
                {memberAvatars.map((avatar, i) => (
                  <img key={i} src={avatar} alt={`Member ${i+1}`} className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover" />
                ))}
                <button className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-400 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Upload Project Logo */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-2">Upload Project Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="Project Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-gray-400">📷</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Image should be below 4 mb</p>
                  <div className="flex gap-2">
                    <label className="px-3 py-1 text-xs bg-orange-500 text-white rounded-lg cursor-pointer hover:bg-orange-600 transition-colors">
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    <button 
                      onClick={() => setUploadedImage(null)} 
                      className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Name & Client */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Project Name</label>
                <input
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleChange}
                  placeholder="Office Management"
                  className={`w-full px-3 py-1.5 text-sm border ${errors.projectName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {errors.projectName && <p className="text-xs text-red-500 mt-1">{errors.projectName}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Client</label>
                <input
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  placeholder="Anthony Lewis"
                  className={`w-full px-3 py-1.5 text-sm border ${errors.client ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {errors.client && <p className="text-xs text-red-500 mt-1">{errors.client}</p>}
              </div>
            </div>

            {/* Start Date & End Date */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-sm border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-sm border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
              </div>
            </div>

            {/* Priority, Project Value & Price Type */}
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 text-sm border ${errors.priority ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white`}
                >
                  <option value="Select">Select</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
                {errors.priority && <p className="text-xs text-red-500 mt-1">{errors.priority}</p>}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Project Value</label>
                <input
                  type="text"
                  name="projectValue"
                  value={formData.projectValue}
                  onChange={handleChange}
                  placeholder="$"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Price Type</label>
                <select
                  name="priceType"
                  value={formData.priceType}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="">Price</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* Description with toolbar */}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <div className={`border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-500`}>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                  <button className="text-sm text-gray-600 hover:text-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors">14</button>
                  <button className="text-sm font-bold text-gray-600 hover:text-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors">B</button>
                  <button className="text-sm italic text-gray-600 hover:text-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors">I</button>
                  <button className="text-sm underline text-gray-600 hover:text-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors">U</button>
                  <button className="text-sm text-gray-600 hover:text-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors">S</button>
                  <button className="text-sm text-gray-600 hover:text-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors">[ ]</button>
                </div>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2 text-sm border-0 focus:outline-none resize-none"
                  placeholder="Enter project description..."
                />
              </div>
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
            </div>

            {/* Upload Files */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Upload Files</label>
              <div className="flex items-center gap-3">
                <label className="px-4 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-300 transition-colors">
                  Choose File
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                <span className="text-sm text-gray-400">{selectedFile || "No file chosen"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Priority/Time and Buttons */}
        <div className="border-t border-gray-200">
          {/* Priority & Time row */}
          <div className="flex items-center justify-between px-6 py-2 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">Priority</span>
              <span className="text-xs text-orange-500 font-medium">{formData.priority}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{project?.timeSpent || "65/120 Hrs"}</span>
            </div>
          </div>

          {/* Annotations */}
          <div className="px-6 py-2 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-700">Annotations</span>
              {annotations.map((item, index) => (
                <span 
                  key={index} 
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    index === 0 ? "bg-yellow-100 text-yellow-700" :
                    index === 1 ? "bg-blue-100 text-blue-700" :
                    index === 2 ? "bg-green-100 text-green-700" :
                    index === 3 ? "bg-gray-100 text-gray-700" :
                    "bg-purple-100 text-purple-700"
                  }`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{project?.timeSpent || "65/120 Hrs"}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-5 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors">Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========== EDIT MODALS ==========
const EditEmployeeModal = ({ isOpen, onClose, onSave, employeeData }) => {
  const [form, setForm] = useState({
    firstName: employeeData?.name?.split(" ")[0] || "Anthony",
    lastName: employeeData?.name?.split(" ")[1] || "Lewis",
    employeeId: employeeData?.clientId || "Emp-001",
    username: employeeData?.name?.split(" ")[0] || "Anthony",
    joiningDate: "2022-10-17",
    email: employeeData?.email || "anthony@example.com",
    password: "",
    confirmPassword: "",
    phoneNumber: employeeData?.phone || "(123) 4567 890",
    company: "Abac Company",
    department: "Finance",
    designation: "Finance",
    about: "As an award winning designer, I deliver exceptional quality work and bring value to your brand! With 10 years of experience and 350+ projects completed worldwide with satisfied customers, I developed the 360° brand approach, which helped me to create numerous brands that are relevant, meaningful and loved.",
  });
  const [errors, setErrors] = useState({});
  if (!isOpen) return null;

  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); };
  const validate = () => {
    const err = {};
    if (!form.firstName) err.firstName = "First Name is required";
    if (!form.employeeId) err.employeeId = "Employee ID is required";
    if (!form.username) err.username = "Username is required";
    if (!form.joiningDate) err.joiningDate = "Joining Date is required";
    if (!form.email) err.email = "Email is required";
    if (!form.phoneNumber) err.phoneNumber = "Phone Number is required";
    if (!form.password) err.password = "Password is required";
    if (form.password !== form.confirmPassword) err.confirmPassword = "Passwords do not match";
    if (!form.about) err.about = "About is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div><h2 className="text-base font-semibold text-gray-800">Edit Employee</h2><p className="text-xs text-gray-500">Employee ID: {form.employeeId}</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div><h3 className="text-xs font-semibold text-gray-700 mb-2">Basic Information</h3><div className="grid grid-cols-2 gap-3">
            <InputField label="First Name *" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} />
            <InputField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
            <InputField label="Employee ID *" name="employeeId" value={form.employeeId} onChange={handleChange} error={errors.employeeId} />
            <InputField label="Joining Date *" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} error={errors.joiningDate} />
            <InputField label="Username *" name="username" value={form.username} onChange={handleChange} error={errors.username} />
            <InputField label="Email *" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
            <InputField label="Password *" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} />
            <InputField label="Confirm Password *" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
            <InputField label="Phone Number *" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} error={errors.phoneNumber} />
            <InputField label="Company *" name="company" value={form.company} onChange={handleChange} />
            <div><label className="block text-xs text-gray-500 mb-1">Department</label><select name="department" value={form.department} onChange={handleChange} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">{["Select", "Finance", "Developer", "Executive"].map(opt => <option key={opt}>{opt}</option>)}</select></div>
            <div><label className="block text-xs text-gray-500 mb-1">Designation</label><select name="designation" value={form.designation} onChange={handleChange} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">{["Select", "Finance", "Developer", "Executive"].map(opt => <option key={opt}>{opt}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">About *</label><textarea name="about" value={form.about} onChange={handleChange} rows="3" className={`w-full px-3 py-1.5 text-sm border ${errors.about ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none`} />{errors.about && <p className="text-xs text-red-500 mt-1">{errors.about}</p>}</div>
          </div></div>
        </div>
        <FormButtons onCancel={onClose} onSave={() => { if (validate()) { onSave(form); onClose(); } }} />
      </div>
    </div>
  );
};

const PersonalInfoModal = ({ isOpen, onClose, onSave, employeeData }) => {
  const [form, setForm] = useState({
    passportNo: employeeData?.passportNo || "",
    passportExpDate: employeeData?.passportExpDate || "",
    nationality: employeeData?.nationality || "",
    religion: employeeData?.religion || "",
    maritalStatus: employeeData?.maritalStatus || "",
    employmentOfSpouse: employeeData?.employmentOfSpouse || "",
    noOfChildren: employeeData?.noOfChildren || "",
  });
  const [errors, setErrors] = useState({});
  if (!isOpen) return null;
  const validate = () => {
    const err = {};
    if (!form.passportNo) err.passportNo = "Passport No is required";
    if (!form.passportExpDate) err.passportExpDate = "Passport Expiry Date is required";
    if (!form.nationality) err.nationality = "Nationality is required";
    if (!form.maritalStatus) err.maritalStatus = "Marital status is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); };
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Edit Personal Info" onSave={() => { if (validate()) { onSave(form); onClose(); } }}>
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100"><div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-base font-bold">{employeeData?.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "SP"}</div><div><h3 className="text-sm font-semibold text-gray-800">{employeeData?.name || "Stephan Peralt"}</h3><div className="flex items-center gap-2 text-xs text-gray-500"><span>{employeeData?.role || "Software Developer"}</span><span className="text-gray-300">|</span><span>{employeeData?.experience || "10+ years"}</span></div></div></div>
      <div className="space-y-3 mt-4">
        <InputField label="Passport No *" name="passportNo" value={form.passportNo} onChange={handleChange} error={errors.passportNo} placeholder="Enter Passport Number" />
        <InputField label="Passport Expiry Date *" name="passportExpDate" type="date" value={form.passportExpDate} onChange={handleChange} error={errors.passportExpDate} />
        <InputField label="Nationality *" name="nationality" value={form.nationality} onChange={handleChange} error={errors.nationality} placeholder="Enter Nationality" />
        <InputField label="Religion" name="religion" value={form.religion} onChange={handleChange} placeholder="Enter Religion" />
        <div><label className="block text-xs text-gray-500 mb-1">Marital status *</label><select name="maritalStatus" value={form.maritalStatus} onChange={handleChange} className={`w-full px-3 py-1.5 text-sm border ${errors.maritalStatus ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}><option value="">Select</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option></select>{errors.maritalStatus && <p className="text-xs text-red-500 mt-1">{errors.maritalStatus}</p>}</div>
        <div><label className="block text-xs text-gray-500 mb-1">Employment spouse</label><select name="employmentOfSpouse" value={form.employmentOfSpouse} onChange={handleChange} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"><option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option></select></div>
        <InputField label="No. of children" name="noOfChildren" type="number" value={form.noOfChildren} onChange={handleChange} placeholder="0" />
      </div>
    </ModalWrapper>
  );
};

const BankDetailsModal = ({ isOpen, onClose, onSave, bankData }) => {
  const [form, setForm] = useState({ bankName: bankData?.bankName || "", accountNo: bankData?.accountNo || "", ifscCode: bankData?.ifscCode || "", branch: bankData?.branch || "" });
  const [errors, setErrors] = useState({});
  if (!isOpen) return null;
  const validate = () => {
    const err = {};
    if (!form.bankName) err.bankName = "Bank Name is required";
    if (!form.accountNo) err.accountNo = "Account Number is required";
    if (!form.ifscCode) err.ifscCode = "IFSC Code is required";
    if (!form.branch) err.branch = "Branch is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); };
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Edit Bank Details" onSave={() => { if (validate()) { onSave(form); onClose(); } }}>
      <div className="space-y-4">
        <InputField label="Bank Name *" name="bankName" value={form.bankName} onChange={handleChange} error={errors.bankName} placeholder="Enter Bank Name" />
        <InputField label="Account No *" name="accountNo" value={form.accountNo} onChange={handleChange} error={errors.accountNo} placeholder="Enter Account Number" />
        <InputField label="IFSC Code *" name="ifscCode" value={form.ifscCode} onChange={handleChange} error={errors.ifscCode} placeholder="Enter IFSC Code" />
        <InputField label="Branch *" name="branch" value={form.branch} onChange={handleChange} error={errors.branch} placeholder="Enter Branch" />
      </div>
    </ModalWrapper>
  );
};

const FamilyDetailsModal = ({ isOpen, onClose, onSave, familyData }) => {
  const [form, setForm] = useState({ name: familyData?.name || "", relationship: familyData?.relationship || "", dateOfBirth: familyData?.dateOfBirth || "", phone: familyData?.phone || "" });
  const [errors, setErrors] = useState({});
  if (!isOpen) return null;
  const validate = () => {
    const err = {};
    if (!form.name) err.name = "Name is required";
    if (!form.relationship) err.relationship = "Relationship is required";
    if (!form.phone) err.phone = "Phone is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); };
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Edit Family Member" onSave={() => { if (validate()) { onSave(form); onClose(); } }}>
      <div className="space-y-4">
        <InputField label="Name *" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="Enter Name" />
        <InputField label="Relationship *" name="relationship" value={form.relationship} onChange={handleChange} error={errors.relationship} placeholder="Enter Relationship" />
        <InputField label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
        <InputField label="Phone *" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="Enter Phone Number" />
      </div>
    </ModalWrapper>
  );
};

const EducationModal = ({ isOpen, onClose, onSave, educationData }) => {
  const [form, setForm] = useState({ institution: educationData?.institution || "", course: educationData?.course || "", years: educationData?.years || "" });
  const [errors, setErrors] = useState({});
  if (!isOpen) return null;
  const validate = () => {
    const err = {};
    if (!form.institution) err.institution = "Institution name is required";
    if (!form.course) err.course = "Course is required";
    if (!form.years) err.years = "Years is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); };
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Edit Education" onSave={() => { if (validate()) { onSave(form); onClose(); } }}>
      <div className="space-y-4">
        <InputField label="Institution *" name="institution" value={form.institution} onChange={handleChange} error={errors.institution} placeholder="Enter Institution Name" />
        <InputField label="Course *" name="course" value={form.course} onChange={handleChange} error={errors.course} placeholder="Enter Course" />
        <InputField label="Years *" name="years" value={form.years} onChange={handleChange} error={errors.years} placeholder="e.g. 2020 - 2022" />
      </div>
    </ModalWrapper>
  );
};

const ExperienceModal = ({ isOpen, onClose, onSave, experienceData }) => {
  const [form, setForm] = useState({ company: experienceData?.company || "", role: experienceData?.role || "", years: experienceData?.years || "" });
  const [errors, setErrors] = useState({});
  if (!isOpen) return null;
  const validate = () => {
    const err = {};
    if (!form.company) err.company = "Company name is required";
    if (!form.role) err.role = "Role is required";
    if (!form.years) err.years = "Years is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); };
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Edit Experience" onSave={() => { if (validate()) { onSave(form); onClose(); } }}>
      <div className="space-y-4">
        <InputField label="Company *" name="company" value={form.company} onChange={handleChange} error={errors.company} placeholder="Enter Company Name" />
        <InputField label="Role *" name="role" value={form.role} onChange={handleChange} error={errors.role} placeholder="Enter Role" />
        <InputField label="Years *" name="years" value={form.years} onChange={handleChange} error={errors.years} placeholder="e.g. Jan 2013 - Present" />
      </div>
    </ModalWrapper>
  );
};

const EmergencyContactModal = ({ isOpen, onClose, onSave, emergencyContacts }) => {
  const [form, setForm] = useState({
    primaryName: emergencyContacts?.[0]?.name || "",
    primaryPhone: emergencyContacts?.[0]?.phone || "",
    primaryRelation: emergencyContacts?.[0]?.relation || "",
    secondaryName: emergencyContacts?.[1]?.name || "",
    secondaryPhone1: emergencyContacts?.[1]?.phone || "",
    secondaryPhone2: "",
    secondaryRelation: emergencyContacts?.[1]?.relation || "",
  });
  const [errors, setErrors] = useState({});
  if (!isOpen) return null;
  const validate = () => {
    const err = {};
    if (!form.primaryName) err.primaryName = "Name is required";
    if (!form.primaryPhone) err.primaryPhone = "Phone No 1 is required";
    if (!form.secondaryName) err.secondaryName = "Name is required";
    if (!form.secondaryPhone1) err.secondaryPhone1 = "Phone No 1 is required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };
  const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" })); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 sticky top-0 bg-white z-10"><h2 className="text-base font-semibold text-gray-800">Emergency Contact</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button></div>
        <div className="px-5 py-4 space-y-4">
          <div><h3 className="text-sm font-semibold text-gray-700 mb-2">Primary</h3><div className="space-y-3"><InputField label="Name *" name="primaryName" value={form.primaryName} onChange={handleChange} error={errors.primaryName} placeholder="Enter Name" /><InputField label="Phone No 1 *" name="primaryPhone" value={form.primaryPhone} onChange={handleChange} error={errors.primaryPhone} placeholder="Enter Phone Number" /><InputField label="Relationship" name="primaryRelation" value={form.primaryRelation} onChange={handleChange} placeholder="Enter Relationship" /></div></div>
          <div className="border-t border-gray-200 pt-3"><h3 className="text-sm font-semibold text-gray-700 mb-2">Secondary Contact Details</h3><div className="space-y-3"><InputField label="Name *" name="secondaryName" value={form.secondaryName} onChange={handleChange} error={errors.secondaryName} placeholder="Enter Name" /><InputField label="Phone No 1 *" name="secondaryPhone1" value={form.secondaryPhone1} onChange={handleChange} error={errors.secondaryPhone1} placeholder="Enter Phone Number" /><InputField label="Phone No 2" name="secondaryPhone2" value={form.secondaryPhone2} onChange={handleChange} placeholder="Enter Alternate Phone Number" /><InputField label="Relationship" name="secondaryRelation" value={form.secondaryRelation} onChange={handleChange} placeholder="Enter Relationship" /></div></div>
        </div>
        <FormButtons onCancel={onClose} onSave={() => { if (validate()) { onSave([{ type: "Primary", name: form.primaryName, relation: form.primaryRelation, phone: form.primaryPhone }, { type: "Secondary", name: form.secondaryName, relation: form.secondaryRelation, phone: form.secondaryPhone1 }]); onClose(); } }} />
      </div>
    </div>
  );
};

const BankStatutoryModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({ salaryBasis: '', salaryAmount: '', paymentType: '', pfContribution: '', pfNo: '', employeePfRate: '', totalPfRate: '', esiContribution: '', esiNumber: '', employeeEsiRate: '', totalEsiRate: '', additionalRate: '', totalRate: '' });
  const [errors, setErrors] = useState({});
  if (!isOpen) return null;

  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' })); };
  const validate = () => {
    const newErrors = {};
    if (!formData.salaryBasis) newErrors.salaryBasis = 'Salary basis is required';
    if (!formData.pfContribution) newErrors.pfContribution = 'PF contribution is required';
    if (!formData.esiContribution) newErrors.esiContribution = 'ESI contribution is required';
    if (!formData.employeeEsiRate) newErrors.employeeEsiRate = 'Employee ESI rate is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const SelectField = ({ label, name, value, options, required, error }) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <select name={name} value={value} onChange={handleChange} className={`w-full px-3 py-1.5 text-sm border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white`}>
        <option value="">Select</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  const SectionHeader = ({ title }) => <h3 className="text-sm font-semibold text-gray-700 mb-2.5">{title}</h3>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-base font-semibold text-gray-800">Bank & Statutory</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="px-5 py-4 space-y-5">
          <div><SectionHeader title="Basic Salary Information" /><div className="grid grid-cols-3 gap-3">
            <SelectField label="Salary basis" name="salaryBasis" value={formData.salaryBasis} options={["Monthly", "Weekly", "Daily", "Hourly"]} required error={errors.salaryBasis} />
            <InputField label="Salary basis" name="salaryAmount" value={formData.salaryAmount} placeholder="$" onChange={handleChange} />
            <SelectField label="Payment type" name="paymentType" value={formData.paymentType} options={["Bank Transfer", "Cash", "Check"]} />
          </div></div>
          <div><SectionHeader title="PF Information" /><div className="grid grid-cols-3 gap-3">
            <SelectField label="PF contribution" name="pfContribution" value={formData.pfContribution} options={["Yes", "No"]} required error={errors.pfContribution} />
            <InputField label="PF No" name="pfNo" value={formData.pfNo} onChange={handleChange} />
            <InputField label="Employee PF rate" name="employeePfRate" value={formData.employeePfRate} onChange={handleChange} />
            <InputField label="Total rate" name="totalPfRate" value={formData.totalPfRate} onChange={handleChange} />
          </div></div>
          <div><SectionHeader title="ESI Information" /><div className="grid grid-cols-3 gap-3">
            <SelectField label="ESI contribution" name="esiContribution" value={formData.esiContribution} options={["Yes", "No"]} required error={errors.esiContribution} />
            <InputField label="ESI Number" name="esiNumber" value={formData.esiNumber} onChange={handleChange} />
            <InputField label="Employee ESI rate" name="employeeEsiRate" value={formData.employeeEsiRate} required error={errors.employeeEsiRate} onChange={handleChange} />
            <InputField label="Total rate" name="totalEsiRate" value={formData.totalEsiRate} onChange={handleChange} />
          </div></div>
          <div><SectionHeader title="Experience" /><div className="grid grid-cols-3 gap-3">
            <SelectField label="Additional rate" name="additionalRate" value={formData.additionalRate} options={["Yes", "No"]} />
            <InputField label="Total rate" name="totalRate" value={formData.totalRate} onChange={handleChange} />
          </div></div>
        </div>
        <div className="border-t border-gray-200"><div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2"><span className="text-xs text-gray-400">8 tasks • 15 Completed</span><span className="text-xs text-gray-300">|</span><button className="text-xs text-blue-500 hover:text-blue-600 transition-colors">Go to Settings to activate Windows.</button></div>
          <div className="flex items-center gap-3"><button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancel</button><button onClick={() => { if (validate()) { onSave(formData); onClose(); } }} className="px-5 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors">Save</button></div>
        </div></div>
      </div>
    </div>
  );
};

// ========== ASSET COMPONENTS ==========
const AssetCard = ({ asset, onViewInfo, onRaiseIssue }) => {
  const [showMenu, setShowMenu] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl p-5 flex-1 min-w-[280px] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">{asset.icon || "💻"}</div>
          <div><p className="text-base font-semibold text-gray-800">{asset.name}</p><p className="text-sm text-gray-400">{asset.id}</p></div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <button onClick={() => { setShowMenu(false); onViewInfo(); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.543-7z"/></svg>View Info
              </button>
              <button onClick={() => { setShowMenu(false); onRaiseIssue(); }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>Raise Issue
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2 mt-2">
        <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Asset ID</span><span className="text-sm font-semibold text-red-500">{asset.assetId}</span></div>
        <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Assigned on</span><span className="text-sm font-medium text-gray-700">{asset.assignedOn}</span></div>
        <div className="pt-2 border-t border-gray-100"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">Assigned by</span><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-xs font-semibold text-orange-700">{asset.assignedBy?.split(" ").map(n => n[0]).join("") || "AS"}</div><span className="text-sm font-medium text-gray-700">{asset.assignedBy}</span></div></div></div>
      </div>
    </div>
  );
};

const AssetInfoModal = ({ isOpen, onClose, asset }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10"><h2 className="text-lg font-semibold text-gray-800">Asset Information</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button></div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100"><div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl">{asset?.icon || "💻"}</div><div><h3 className="text-xl font-bold text-gray-800">{asset?.name}</h3><p className="text-sm text-gray-400">{asset?.id}</p><p className="text-sm font-semibold text-red-500">{asset?.assetId}</p></div></div>
          <div className="grid grid-cols-2 gap-4">
            {[{ label: "Type", value: asset?.type || "Laptop" }, { label: "Brand", value: asset?.brand || "Dell" }, { label: "Category", value: asset?.category || "Computer" }, { label: "Serial No", value: asset?.serialNo || "3647952145678" }, { label: "Cost", value: asset?.cost || "$800" }, { label: "Vendor", value: asset?.vendor || "Compusoft Systems Ltd." }].map((item, i) => <div key={i} className="space-y-1"><p className="text-xs text-gray-400">{item.label}</p><p className="text-sm font-medium text-gray-800">{item.value}</p></div>)}
            <div className="space-y-1 col-span-2"><p className="text-xs text-gray-400">Warranty</p><p className="text-sm font-medium text-gray-800">{asset?.warranty || "12 Jan 2022 - 12 Jan 2026"}</p></div>
            <div className="space-y-1 col-span-2"><p className="text-xs text-gray-400">Location</p><p className="text-sm font-medium text-gray-800">{asset?.location || "46 Laurel Lane, TX 79701"}</p></div>
          </div>
          <div className="pt-4 border-t border-gray-100"><div className="flex items-center justify-between"><span className="text-xs text-gray-400">Assigned by</span><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-sm font-bold text-orange-700">{asset?.assignedBy?.split(" ").map(n => n[0]).join("") || "AS"}</div><span className="text-sm font-semibold text-gray-800">{asset?.assignedBy || "Andrew Symon"}</span></div></div></div>
          <div className="pt-4 border-t border-gray-100"><p className="text-xs text-gray-400 mb-3">Asset Images</p><div className="flex gap-3 flex-wrap">{(asset?.images || []).map((img, idx) => <div key={idx} className="w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"><img src={img} alt={`Asset ${idx + 1}`} className="w-full h-full object-cover" /></div>)}</div></div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl"><button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">Close</button></div>
      </div>
    </div>
  );
};

const RaiseIssueModal = ({ isOpen, onClose, asset }) => {
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10"><h2 className="text-lg font-semibold text-gray-800">Raise Issue</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button></div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-gray-100"><div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-2xl">{asset?.icon || "💻"}</div><div><p className="text-sm font-semibold text-gray-800">{asset?.name}</p><p className="text-xs text-gray-400">{asset?.id}</p><p className="text-xs font-semibold text-red-500">{asset?.assetId}</p></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label><textarea value={description} onChange={(e) => { setDescription(e.target.value); if (error) setError(""); }} rows="6" className={`w-full px-4 py-3 text-sm border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none`} placeholder="Describe the issue in detail..." />{error && <p className="text-xs text-red-500 mt-1">{error}</p>}</div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl"><button onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button><button onClick={() => { if (!description.trim()) { setError("Description is required"); return; } alert(`Issue raised for ${asset?.name}: ${description}`); onClose(); }} className="px-6 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-all hover:shadow-md">Submit</button></div>
      </div>
    </div>
  );
};

// ========== PROJECT COMPONENTS ==========
const ProjectCard = ({ project, onClick }) => (
  <div onClick={onClick} className="border border-gray-200 rounded-xl p-5 flex-1 min-w-[280px] cursor-pointer hover:shadow-md hover:border-orange-200 transition-all">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-8 h-8 rounded-full ${project.color} flex items-center justify-center`}><span className="text-white text-sm">✦</span></div>
      <div><p className="text-base font-semibold text-gray-800">{project.name}</p><p className="text-sm text-gray-400">{project.tasks} tasks • {project.completed} Completed</p></div>
    </div>
    <div className="flex gap-8 mt-3">
      <div><p className="text-sm text-gray-400 mb-1">Deadline</p><p className="text-sm font-medium text-gray-700">{project.deadline}</p></div>
      <div><p className="text-sm text-gray-400 mb-1">Project Lead</p><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-orange-300 flex items-center justify-center text-xs text-white font-bold">{project.lead[0]}</div><span className="text-sm font-medium text-gray-700">{project.lead}</span></div></div>
    </div>
  </div>
);

// ========== PROJECT DETAILS PAGE ==========
const ProjectDetailsPage = ({ project, onBack }) => {
  const [tasks, setTasks] = useState(project.tasks || []);
  const [activeTaskMenu, setActiveTaskMenu] = useState(null);
  const [showEditTodoModal, setShowEditTodoModal] = useState(false);
  const [showAddTodoModal, setShowAddTodoModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(null);
  const [selectedTaskData, setSelectedTaskData] = useState(null);
  const taskMenuRef = useRef(null);
  const [openSections, setOpenSections] = useState({ tasks: true, images: true, files: true, notes: true, activity: true });
  const toggle = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    const handleClickOutside = (e) => { if (taskMenuRef.current && !taskMenuRef.current.contains(e.target)) setActiveTaskMenu(null); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleTask = (index) => {
    const newTasks = [...tasks];
    newTasks[index].status = newTasks[index].status === "Completed" ? "Pending" : "Completed";
    newTasks[index].statusColor = getStatusColor(newTasks[index].status);
    setTasks(newTasks);
  };

  const handleTaskMenuClick = (index, e) => { e.stopPropagation(); setActiveTaskMenu(activeTaskMenu === index ? null : index); };

  const handleTaskAction = (action, index) => {
    if (action === "Edit") {
      setSelectedTaskIndex(index);
      setSelectedTaskData(tasks[index]);
      setShowEditTodoModal(true);
      setActiveTaskMenu(null);
    } else if (action === "Delete") {
      const newTasks = tasks.filter((_, i) => i !== index);
      setTasks(newTasks);
      setActiveTaskMenu(null);
      alert(`Task deleted`);
    }
  };

  const handleSaveTodo = (formData) => {
    if (selectedTaskIndex !== null) {
      const newTasks = [...tasks];
      newTasks[selectedTaskIndex] = {
        ...newTasks[selectedTaskIndex],
        name: formData.title,
        tag: formData.tag,
        description: formData.description,
        assignee: formData.assignee,
        priority: formData.priority.toLowerCase(),
        status: formData.status,
        statusColor: getStatusColor(formData.status),
      };
      setTasks(newTasks);
    }
    setShowEditTodoModal(false);
    setSelectedTaskIndex(null);
    setSelectedTaskData(null);
  };

  const handleAddTodo = (formData) => {
    setTasks(prev => [...prev, { name: formData.title, tag: formData.tag, priority: formData.priority.toLowerCase(), description: formData.description, assignee: formData.assignee, status: formData.status, statusColor: getStatusColor(formData.status) }]);
  };

  const handleEditProject = () => {
    setShowEditProjectModal(true);
  };

  const handleSaveProject = (updatedProject) => {
    Object.assign(project, updatedProject);
    alert("Project updated successfully!");
  };

  const EditTodoModal = ({ isOpen, onClose, task, onSave }) => {
    const [formData, setFormData] = useState({ title: task?.name || "", tag: task?.tag || "Internal", priority: task?.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "Medium", description: task?.description || "", assignee: task?.assignee || "Sophie", status: task?.status || "Pending" });
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10"><h2 className="text-base font-semibold text-gray-800">Edit Todo</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
          <div className="px-6 py-5 space-y-4">
            <InputField label="Todo Title" name="title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Tag</label><select value={formData.tag} onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"><option value="Internal">Internal</option><option value="External">External</option><option value="Team">Team</option><option value="Client">Client</option></select></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Priority</label><select value={formData.priority} onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
            </div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Descriptions</label><textarea rows="3" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Assignee</label><input type="text" value={formData.assignee} onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"><option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="On Hold">On Hold</option></select></div>
          </div>
          <div className="border-t border-gray-200"><div className="flex items-center justify-between px-6 py-2 bg-gray-50"><span className="text-xs font-medium text-gray-700">Priority <span className="text-orange-500">{formData.priority}</span></span><span className="text-xs text-gray-500">65/120 Hrs</span></div></div>
          <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl"><button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancel</button><button onClick={() => { onSave(formData); onClose(); }} className="px-5 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors">Submit</button></div>
        </div>
      </div>
    );
  };

  const AddNewTodoModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({ title: "", tag: "", priority: "Medium", description: "", assignee: "Sophie", status: "Pending" });
    const [errors, setErrors] = useState({});
    if (!isOpen) return null;
    const validate = () => {
      const newErrors = {};
      if (!formData.title.trim()) newErrors.title = "Todo title is required";
      if (!formData.tag) newErrors.tag = "Tag is required";
      if (!formData.assignee.trim()) newErrors.assignee = "Assignee is required";
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10"><h2 className="text-base font-semibold text-gray-800">Add New Todo</h2><button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></div>
          <div className="px-6 py-5 space-y-4">
            <InputField label="Todo Title *" name="title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} error={errors.title} />
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Tag *</label><select value={formData.tag} onChange={(e) => setFormData(prev => ({ ...prev, tag: e.target.value }))} className={`w-full px-3 py-2 text-sm border ${errors.tag ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white`}><option value="">Select</option><option value="Internal">Internal</option><option value="External">External</option><option value="Team">Team</option><option value="Client">Client</option></select>{errors.tag && <p className="text-xs text-red-500 mt-1">{errors.tag}</p>}</div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Priority</label><select value={formData.priority} onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
            </div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Descriptions</label><textarea rows="3" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Assignee *</label><input type="text" value={formData.assignee} onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))} className={`w-full px-3 py-2 text-sm border ${errors.assignee ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`} />{errors.assignee && <p className="text-xs text-red-500 mt-1">{errors.assignee}</p>}</div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"><option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Completed">Completed</option><option value="On Hold">On Hold</option></select></div>
          </div>
          <div className="border-t border-gray-200"><div className="flex items-center justify-between px-6 py-2 bg-gray-50"><span className="text-xs font-medium text-gray-700">Priority <span className="text-orange-500">{formData.priority}</span></span><span className="text-xs text-gray-500">65/120 Hrs</span></div></div>
          <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl"><button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancel</button><button onClick={() => { if (validate()) { onSave(formData); onClose(); } }} className="px-5 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors">Add New Todo</button></div>
        </div>
      </div>
    );
  };

  if (!project) return null;
  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"><span>‹</span> Back to List</button>
      <div className="flex gap-6">
        <div className="w-[280px] flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Project Details</h3>
            <div className="space-y-3 text-sm">
              {[{ label: "Client", value: project.client }, { label: "Project Total Cost", value: project.totalCost }, { label: "Hours of Work", value: project.hoursOfWork }, { label: "Created on", value: project.createdOn }, { label: "Started on", value: project.startDate }, { label: "Due Date", value: project.dueDate }, { label: "Created by", value: project.createdBy }].map((item, i) => (
                <div key={i} className={`flex items-center justify-between ${i > 0 ? 'border-t border-gray-50 pt-2.5' : ''}`}>
                  <span className="text-xs text-gray-400">{item.label}</span>
                  <span className="text-gray-700 font-medium">{item.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-gray-50 pt-2.5">
                <span className="text-xs text-gray-400">Priority</span>
                <span className="font-medium"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block mr-1"></span><span className="text-red-500">{project.priority}</span></span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Tasks Details</h3>
            <div className="space-y-3">
              <div><p className="text-xs text-gray-400 mb-1">Tasks Done</p><p className="text-base font-semibold text-gray-800">{tasks.filter(t => t.status === "Completed").length} / {tasks.length}</p></div>
              <div className="space-y-1.5 pt-1">
                {["high", "medium", "low"].map(p => <div key={p} className="flex items-center justify-between"><span className="text-xs text-gray-400 flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${priorityStyles[p].dot}`}></span> {p.charAt(0).toUpperCase() + p.slice(1)}</span><span className="text-xs font-medium text-gray-700">{tasks.filter(t => t.priority === p).length}</span></div>)}
              </div>
              <div className="border-t border-gray-50 pt-3">
                <p className="text-xs text-gray-400">{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "Completed").length / tasks.length) * 100) : 0}% Completed</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "Completed").length / tasks.length) * 100) : 0}%` }}></div></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-full ${project.iconBg} flex items-center justify-center text-lg text-white`}>{project.icon}</div><div><p className="text-base font-semibold text-gray-800">{project.name}</p><p className="text-xs text-gray-400">Project Id: <span className="text-orange-500">{project.projectId}</span></p></div></div>
              <button onClick={handleEditProject} className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">✎ Edit Project</button>
            </div>
            <div className="px-5 pb-4 space-y-3 text-sm">
              <div className="flex items-start gap-4"><span className="text-gray-400 w-28 flex-shrink-0">Status</span><span className={`text-xs font-medium px-2.5 py-1 rounded-full ${project.statusColor}`}>{project.status}</span></div>
              <div className="flex items-start gap-4 pt-3 border-t border-gray-50"><span className="text-gray-400 w-28 flex-shrink-0">Team</span><div className="flex items-center gap-2 flex-wrap">{project.team.map((m, j) => <span key={j} className="flex items-center gap-1 text-gray-700 text-xs bg-gray-50 px-2 py-1 rounded-full"><span className="w-4 h-4 rounded-full bg-orange-200 text-orange-700 text-[9px] flex items-center justify-center font-bold">{m[0]}</span>{m}</span>)}</div></div>
              <div className="flex items-start gap-4 pt-3 border-t border-gray-50"><span className="text-gray-400 w-28 flex-shrink-0">Team Lead</span><span className="text-gray-700">{project.teamLead}</span></div>
              <div className="flex items-start gap-4 pt-3 border-t border-gray-50"><span className="text-gray-400 w-28 flex-shrink-0">Project Manager</span><span className="text-gray-700">{project.projectManager}</span></div>
              <div className="flex items-start gap-4 pt-3 border-t border-gray-50"><span className="text-gray-400 w-28 flex-shrink-0">Tags</span><div className="flex items-center gap-2 flex-wrap">{project.tags.map((tag, j) => <span key={j} className={`text-xs font-medium px-2.5 py-1 rounded-full ${j % 2 === 0 ? "bg-pink-100 text-pink-600" : "bg-blue-100 text-blue-600"}`}>{tag}</span>)}</div></div>
              <div className="pt-3 border-t border-gray-50"><p className="text-gray-400 mb-1">Description</p><p className="text-gray-600 text-sm leading-relaxed">{project.description}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => toggle('tasks')} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <span className="text-base font-medium text-gray-700">Tasks</span>
              <span className="text-gray-400 text-sm">{openSections.tasks ? "▲" : "▼"}</span>
            </button>
            {openSections.tasks && (
              <div className="border-t border-gray-100">
                {tasks.map((task, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-gray-300 text-xs">⋮⋮</span>
                      <input type="checkbox" checked={task.status === "Completed"} onChange={() => handleToggleTask(i)} className="w-4 h-4 rounded accent-orange-500 cursor-pointer" />
                      <span className={`text-sm text-gray-700 truncate ${task.status === "Completed" ? "line-through text-gray-400" : ""}`}>{task.name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${task.statusColor}`}>{task.status}</span>
                      <span className={`w-2 h-2 rounded-full ${priorityStyles[task.priority]?.dot}`}></span>
                      <div className="relative" ref={taskMenuRef}>
                        <button onClick={(e) => handleTaskMenuClick(i, e)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
                        </button>
                        {activeTaskMenu === i && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-30">
                            {["Edit", "Delete", "View"].map((action) => <button key={action} onClick={() => handleTaskAction(action, i)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><span className="text-gray-400">{action === "Edit" && "✎"}{action === "Delete" && "🗑️"}{action === "View" && "👁️"}</span>{action}</button>)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => setShowAddTodoModal(true)} className="w-full text-left px-4 py-3 text-sm text-orange-500 hover:bg-orange-50 transition-colors border-t border-dashed border-orange-200">+ New task</button>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => toggle('images')} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <span className="text-base font-medium text-gray-700">Images</span>
              <span className="text-gray-400 text-sm">{openSections.images ? "▲" : "▼"}</span>
            </button>
            {openSections.images && <div className="px-5 pb-5 border-t border-gray-100 pt-4"><div className="flex gap-3 flex-wrap">{project.images.map((img, i) => <div key={i} className="w-24 h-24 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0"><img src={img} alt={`Project ${i + 1}`} className="w-full h-full object-cover" /></div>)}</div></div>}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => toggle('files')} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <span className="text-base font-medium text-gray-700">Files</span>
              <span className="text-gray-400 text-sm">{openSections.files ? "▲" : "▼"}</span>
            </button>
            {openSections.files && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                <div className="flex gap-4 flex-wrap">{project.files.map((file, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 flex-1 min-w-[220px]">
                    <div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className={`text-xl ${file.color}`}>{file.icon}</span><div><p className="text-sm font-medium text-gray-700">{file.name}</p><p className="text-xs text-gray-400">{file.size}</p></div></div><span className="text-gray-400 text-sm cursor-pointer">⋮</span></div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50"><span className="text-xs text-gray-400">{file.date}</span><img src={`https://randomuser.me/api/portraits/${file.by}.jpg`} alt="uploader" className="w-5 h-5 rounded-full object-cover" /></div>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => toggle('notes')} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <span className="text-base font-medium text-gray-700">Notes</span>
                <span className="text-gray-400 text-sm">{openSections.notes ? "▲" : "▼"}</span>
              </button>
              {openSections.notes && <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">{project.notes.map((note, i) => <div key={i} className="border border-gray-100 rounded-lg p-3.5"><div className="flex items-center justify-between mb-1.5"><span className="text-xs text-gray-400">{note.date}</span><span className="text-gray-400 text-sm cursor-pointer">⋮</span></div><p className="text-sm font-medium text-gray-700 mb-1">✎ {note.title}</p><p className="text-xs text-gray-500 leading-relaxed">{note.text}</p></div>)}</div>}
            </div>
            <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button onClick={() => toggle('activity')} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <span className="text-base font-medium text-gray-700">Activity</span>
                <span className="text-gray-400 text-sm">{openSections.activity ? "▲" : "▼"}</span>
              </button>
              {openSections.activity && <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">{project.activity.map((act, i) => <div key={i} className="flex items-start gap-3"><span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${act.color}`}></span><div><p className="text-sm text-gray-700">{act.text}</p><p className="text-xs text-gray-400 mt-1">{act.time}</p></div></div>)}</div>}
            </div>
          </div>
        </div>
      </div>
      <EditTodoModal isOpen={showEditTodoModal} onClose={() => { setShowEditTodoModal(false); setSelectedTaskIndex(null); setSelectedTaskData(null); }} task={selectedTaskData} onSave={handleSaveTodo} />
      <AddNewTodoModal isOpen={showAddTodoModal} onClose={() => setShowAddTodoModal(false)} onSave={handleAddTodo} />
      <EditProjectModal isOpen={showEditProjectModal} onClose={() => setShowEditProjectModal(false)} project={project} onSave={handleSaveProject} />
    </div>
  );
};

// ========== MAIN COMPONENT ==========
export default function EmployeeDetails() {
  const [view, setView] = useState("profile");
  const [activeTab, setActiveTab] = useState("Projects");
  const [selectedProjectName, setSelectedProjectName] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modals, setModals] = useState({ bank: false, edit: false, bankDetails: false, family: false, education: false, experience: false, personalInfo: false, emergencyContact: false, assetInfo: false, raiseIssue: false });
  const [selectedIndex, setSelectedIndex] = useState({ education: null, experience: null });
  const [state, setState] = useState({ bankDetails: employeeData.bankDetails, familyMembers: employeeData.familyMembers, educationDetails: employeeData.educationDetails, experienceDetails: employeeData.experienceDetails, emergencyContacts: employeeData.emergencyContacts });
  const emp = employeeData;
  const profileImageUrl = "https://randomuser.me/api/portraits/men/32.jpg";

  const toggleModal = (key) => setModals(prev => ({ ...prev, [key]: !prev[key] }));
  const openEducationModal = (idx) => { setSelectedIndex(prev => ({ ...prev, education: idx })); toggleModal('education'); };
  const openExperienceModal = (idx) => { setSelectedIndex(prev => ({ ...prev, experience: idx })); toggleModal('experience'); };

  const handleViewAssetInfo = (asset) => { setSelectedAsset(asset); toggleModal('assetInfo'); };
  const handleRaiseIssue = (asset) => { setSelectedAsset(asset); toggleModal('raiseIssue'); };
  const openProjectDetails = (projectName) => { setSelectedProjectName(projectName); setView("project"); };
  const openAssetDetails = (asset) => { setSelectedAsset(asset); setView("asset"); };

  const saveHandler = (key, updater) => (data, index) => {
    const newData = Array.isArray(state[key]) ? [...state[key]] : { ...state[key] };
    if (Array.isArray(newData) && index !== null && index !== undefined) newData[index] = updater ? updater(data) : data;
    else if (Array.isArray(newData)) newData.push(updater ? updater(data) : data);
    else Object.assign(newData, data);
    setState(prev => ({ ...prev, [key]: newData }));
    emp[key] = newData;
    alert(`${key.replace(/([A-Z])/g, ' $1').trim()} saved successfully!`);
  };

  const saveEducation = (data) => ({ institution: data.institution, course: data.course, years: data.years });
  const saveExperience = (data) => ({ company: data.company, role: data.role, years: data.years });

  if (view === "chat") return <ChatPage onBack={() => setView("profile")} />;
  if (view === "project") return <ProjectDetailsPage project={projectDetailsData[selectedProjectName]} onBack={() => setView("profile")} />;
  if (view === "asset") return <AssetDetailsPage asset={selectedAsset} onBack={() => setView("profile")} />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6">
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 rounded-t-xl">
        <button className="flex items-center gap-2 text-base text-gray-600 hover:text-gray-900"><span>‹</span> Employee Details</button>
        <button onClick={() => toggleModal('bank')} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"><span>⚙</span> Bank &amp; Statutory</button>
      </div>

      <div className="flex gap-6 p-6">
        <div className="w-[400px] flex-shrink-0 space-y-4">
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-white">
            <div className="h-28 bg-gradient-to-r from-orange-400 to-yellow-400 relative"><div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"><Avatar name={emp.name} size="lg" imageUrl={profileImageUrl} /></div></div>
            <div className="pt-12 pb-5 px-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-1"><span className="text-lg font-semibold text-gray-800">{emp.name}</span><span className="text-green-500 text-sm">●</span></div>
              <div className="flex items-center justify-center gap-3 mb-4"><span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">{emp.role}</span><span className="bg-red-50 text-red-500 text-xs px-3 py-1 rounded-full font-medium">{emp.experience}</span></div>
              <div className="text-left space-y-1.5 mb-4 px-2">{[{ icon: "🪪", label: "Client ID", value: emp.clientId }, { icon: "⭐", label: "Team", value: emp.team }, { icon: "📅", label: "Date Of Join", value: emp.dateOfJoin }, { icon: "🏢", label: "Report Office", value: emp.reportOffice }].map(item => <div key={item.label} className="flex items-center justify-between text-sm"><span className="text-gray-400 flex items-center gap-2"><span>{item.icon}</span> {item.label}</span><span className="text-gray-700 font-medium">{item.value}</span></div>)}</div>
              <div className="flex gap-3">
                <button onClick={() => toggleModal('edit')} className="flex-1 flex items-center justify-center gap-1 bg-gray-900 text-white text-sm py-2.5 rounded-lg hover:bg-gray-700 transition-colors">✎ Edit Info</button>
                <button onClick={() => setView("chat")} className="flex-1 flex items-center justify-center gap-1 bg-orange-500 text-white text-sm py-2.5 rounded-lg hover:bg-orange-600 transition-colors">✉ Message</button>
              </div>
            </div>
          </div>

          {[
            { title: "Basic Information", onEdit: () => toggleModal('edit'), data: [{ icon: "📞 Phone", value: emp.phone }, { icon: "✉ Email", value: emp.email }, { icon: "⚧ Gender", value: emp.gender }, { icon: "🎂 Birthday", value: emp.birthday }, { icon: "📍 Address", value: emp.address }] },
            { title: "Personal Information", onEdit: () => toggleModal('personalInfo'), data: [{ icon: "🪪 Passport No", value: emp.passportNo }, { icon: "📅 Passport Exp Date", value: emp.passportExpDate }, { icon: "🌍 Nationality", value: emp.nationality }, { icon: "✝ Religion", value: emp.religion }, { icon: "💍 Marital status", value: emp.maritalStatus }, { icon: "👤 Employment of spouse", value: emp.employmentOfSpouse }, { icon: "👶 No. of children", value: emp.noOfChildren }] }
          ].map((section, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3"><span className="text-base font-semibold text-gray-700">{section.title}</span><span className="text-gray-400 text-sm cursor-pointer hover:text-gray-600" onClick={() => section.onEdit()}>✎</span></div>
              <div className="space-y-1">{section.data.map((item, i) => <InfoRow key={i} icon={item.icon} label={item.label || ""} value={item.value} />)}</div>
            </div>
          ))}

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3"><span className="text-base font-semibold text-gray-700">Emergency Contact Number</span><span className="text-gray-400 text-sm cursor-pointer hover:text-gray-600" onClick={() => toggleModal('emergencyContact')}>✎</span></div>
            <div className="space-y-3">{state.emergencyContacts.map(contact => <div key={contact.type} className="border border-gray-100 rounded-lg p-3.5"><p className="text-xs text-gray-400 mb-1.5">{contact.type}</p><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-gray-700"><span className="font-medium">{contact.name}</span><span className="text-gray-300">•</span><span className="text-gray-400">{contact.relation}</span></div><span className="text-sm text-gray-600">{contact.phone}</span></div></div>)}</div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <SectionCard title="About Employee" defaultOpen={true} onEdit={() => toggleModal('edit')}>
            <div className="text-sm text-gray-600 leading-relaxed"><p>As an award winning designer, I deliver exceptional quality work and bring value to your brand! With 10 years of experience and 350+ projects completed worldwide with satisfied customers, I developed the 360° brand approach, which helped me to create numerous brands that are relevant, meaningful and loved.</p></div>
          </SectionCard>

          <SectionCard title="Bank Information" defaultOpen={true} onEdit={() => toggleModal('bankDetails')}>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200">{["Bank Name", "Bank account no", "IFSC Code", "Branch"].map(h => <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead><tbody><tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">{Object.values(state.bankDetails).map((val, i) => <td key={i} className="py-2.5 px-3 text-sm text-gray-700">{val}</td>)}</tr></tbody></table></div>
          </SectionCard>

          <SectionCard title="Family Information" defaultOpen={true} onEdit={() => toggleModal('family')}>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-gray-50 border-b border-gray-200">{["Name", "Relationship", "Date of birth", "Phone"].map(h => <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-600">{h}</th>)}</tr></thead><tbody>{state.familyMembers.map((member, i) => <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">{Object.values(member).map((val, j) => <td key={j} className="py-2.5 px-3 text-sm text-gray-700">{val}</td>)}</tr>)}</tbody></table></div>
          </SectionCard>

          <div className="flex gap-4">
            <div className="flex-1"><SectionCard title="Education Details" defaultOpen={true} onEdit={() => openEducationModal(0)}>{state.educationDetails.map((edu, i) => <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"><p className="text-sm font-medium text-gray-800">{edu.institution}</p><p className="text-sm font-bold text-gray-900">{edu.years}</p><p className="text-sm text-gray-600">- {edu.course}</p></div>)}</SectionCard></div>
            <div className="flex-1"><SectionCard title="Experience" defaultOpen={true} onEdit={() => openExperienceModal(0)}>{state.experienceDetails.map((exp, i) => <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"><p className="text-sm font-semibold text-gray-800">{exp.company}</p><p className="text-sm text-gray-600 mt-1">• {exp.role}</p><p className="text-xs text-gray-500 mt-1">{exp.years}</p></div>)}</SectionCard></div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex gap-6 border-b border-gray-100 mb-4">{["Projects", "Assets"].map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2.5 text-base font-medium transition-colors ${activeTab === tab ? "text-orange-500 border-b-2 border-orange-500" : "text-gray-400 hover:text-gray-600"}`}>{tab}</button>)}</div>
            {activeTab === "Projects" && <div className="flex flex-wrap gap-4">{emp.projects.map(p => <ProjectCard key={p.name} project={p} onClick={() => openProjectDetails(p.name)} />)}</div>}
            {activeTab === "Assets" && <div className="flex flex-wrap gap-4">{emp.assets.map((asset, i) => <AssetCard key={i} asset={asset} onViewInfo={() => openAssetDetails(asset)} onRaiseIssue={() => handleRaiseIssue(asset)} />)}</div>}
          </div>
        </div>
      </div>

      <BankStatutoryModal isOpen={modals.bank} onClose={() => toggleModal('bank')} onSave={(data) => { console.log("Bank & Statutory details saved:", data); alert("Bank & Statutory details saved successfully!"); }} />
      <RaiseIssueModal isOpen={modals.raiseIssue} onClose={() => toggleModal('raiseIssue')} asset={selectedAsset} />
      <AssetInfoModal isOpen={modals.assetInfo} onClose={() => toggleModal('assetInfo')} asset={selectedAsset} />
      <EmergencyContactModal isOpen={modals.emergencyContact} onClose={() => toggleModal('emergencyContact')} onSave={saveHandler('emergencyContacts')} emergencyContacts={state.emergencyContacts} />
      <PersonalInfoModal isOpen={modals.personalInfo} onClose={() => toggleModal('personalInfo')} onSave={(data) => { Object.assign(emp, data); alert("Personal information saved successfully!"); }} employeeData={emp} />
      <EditEmployeeModal isOpen={modals.edit} onClose={() => toggleModal('edit')} onSave={(data) => { console.log("Employee data saved:", data); alert("Employee details saved successfully!"); }} employeeData={emp} />
      <BankDetailsModal isOpen={modals.bankDetails} onClose={() => toggleModal('bankDetails')} onSave={saveHandler('bankDetails')} bankData={state.bankDetails} />
      <FamilyDetailsModal isOpen={modals.family} onClose={() => toggleModal('family')} onSave={saveHandler('familyMembers')} familyData={state.familyMembers[0]} />
      <EducationModal isOpen={modals.education} onClose={() => toggleModal('education')} onSave={saveHandler('educationDetails', saveEducation)} educationData={selectedIndex.education !== null ? state.educationDetails[selectedIndex.education] : null} />
      <ExperienceModal isOpen={modals.experience} onClose={() => toggleModal('experience')} onSave={saveHandler('experienceDetails', saveExperience)} experienceData={selectedIndex.experience !== null ? state.experienceDetails[selectedIndex.experience] : null} />
    </div>
  );
}

// ========== ASSET DETAILS PAGE ==========
const AssetDetailsPage = ({ asset, onBack }) => {
  const [openSections, setOpenSections] = useState({ overview: true, specifications: true, images: true, history: true, documents: true });
  const toggle = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  const [assetStatus, setAssetStatus] = useState("Active");
  const statusOptions = ["Active", "In Use", "Under Maintenance", "Retired", "Lost/Stolen"];

  const maintenanceRecords = [
    { date: "15 Jan 2025", type: "Regular Maintenance", status: "Completed", performedBy: "John Doe", notes: "Cleaned and updated drivers" },
    { date: "20 Feb 2025", type: "Hardware Check", status: "Completed", performedBy: "Jane Smith", notes: "Replaced battery" },
  ];
  const documents = [
    { name: "Warranty_Certificate.pdf", size: "2.4 MB", date: "12 Jan 2022" },
    { name: "Invoice_Receipt.pdf", size: "1.8 MB", date: "15 Jan 2022" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"><span>‹</span> Back to List</button>
      <div className="flex gap-6">
        <div className="w-[320px] flex-shrink-0 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-4"><div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-3xl">{asset.icon || "💻"}</div><div><h2 className="text-xl font-bold text-gray-800">{asset.name}</h2><p className="text-sm text-gray-400">{asset.id}</p><p className="text-sm font-semibold text-red-500">{asset.assetId}</p></div></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-400">Status</span><select value={assetStatus} onChange={(e) => setAssetStatus(e.target.value)} className="text-sm font-medium border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">{statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-400">Type</span><span className="text-sm font-medium text-gray-700">{asset.type}</span></div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-400">Brand</span><span className="text-sm font-medium text-gray-700">{asset.brand}</span></div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-400">Category</span><span className="text-sm font-medium text-gray-700">{asset.category}</span></div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-400">Serial No</span><span className="text-sm font-medium text-gray-700">{asset.serialNo}</span></div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-400">Cost</span><span className="text-sm font-bold text-gray-800">{asset.cost}</span></div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100"><span className="text-sm text-gray-400">Vendor</span><span className="text-sm font-medium text-gray-700">{asset.vendor}</span></div>
              <div className="flex items-center justify-between py-2"><span className="text-sm text-gray-400">Warranty</span><span className="text-sm font-medium text-gray-700">{asset.warranty}</span></div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-4 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => toggle('overview')} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"><span className="text-base font-medium text-gray-700">Overview</span><span className="text-gray-400 text-sm">{openSections.overview ? "▲" : "▼"}</span></button>
            {openSections.overview && <div className="px-5 pb-5 border-t border-gray-100 pt-4"><div className="grid grid-cols-2 gap-4"><div className="bg-gray-50 rounded-lg p-4"><p className="text-xs text-gray-400">Total Assets</p><p className="text-2xl font-bold text-gray-800">1,247</p></div><div className="bg-gray-50 rounded-lg p-4"><p className="text-xs text-gray-400">Active Assets</p><p className="text-2xl font-bold text-gray-800">892</p></div></div></div>}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => toggle('images')} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"><span className="text-base font-medium text-gray-700">Images</span><span className="text-gray-400 text-sm">{openSections.images ? "▲" : "▼"}</span></button>
            {openSections.images && <div className="px-5 pb-5 border-t border-gray-100 pt-4"><div className="flex gap-3 flex-wrap">{asset.images?.map((img, i) => <div key={i} className="w-32 h-32 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0"><img src={img} alt={`Asset ${i + 1}`} className="w-full h-full object-cover" /></div>)}</div></div>}
          </div>
        </div>
      </div>
    </div>
  );
};