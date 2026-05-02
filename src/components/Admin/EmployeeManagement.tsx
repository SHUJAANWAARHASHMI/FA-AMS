
import React, { useState, useMemo } from 'react';
import { Employee, User, CampusCode } from '../../types';
import { 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter, 
  Building2, 
  Shield, 
  Clock,
  MoreVertical,
  X,
  Check,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmployeeManagementProps {
  employees: Employee[];
  user: User;
  onUpdateEmployees: (employees: Employee[]) => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, user, onUpdateEmployees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [newPassword, setNewPassword] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    campus: 'Main Campus' as CampusCode,
    shiftStart: '08:00',
    shiftEnd: '17:00',
    status: 'full_time' as 'full_time' | 'part_time'
  });

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLockToggle = (emp: Employee) => {
    const updatedEmployees = employees.map(e => 
      e.id === emp.id ? { ...e, accountLocked: !e.accountLocked } : e
    );
    onUpdateEmployees(updatedEmployees);
  };

  const handleOpenPasswordModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee && newPassword) {
      const updatedEmployees = employees.map(emp => 
        emp.id === editingEmployee.id ? { ...emp, password: newPassword } : emp
      );
      onUpdateEmployees(updatedEmployees);
      setIsPasswordModalOpen(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesCampus = user.role === 'admin' || user.role === 'mudeer' ? (campusFilter === 'all' || emp.campus === campusFilter) : (emp.campus === user.campus);
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCampus && matchesSearch;
    });
  }, [employees, user, campusFilter, searchTerm]);

  const generateEmployeeId = (campus: CampusCode) => {
    const prefix = { 
      'Main Campus': 'FAMC', 
      'Johar Campus': 'FAJC', 
      'Masjid Campus': 'FAMS', 
      'Maktab Campus': 'FAMT' 
    }[campus];
    const campusEmployees = employees.filter(e => e.id.startsWith(prefix));
    const nextNum = campusEmployees.length > 0 
      ? Math.max(...campusEmployees.map(e => parseInt(e.id.replace(prefix, '')))) + 1 
      : 1001;
    return `${prefix}${nextNum}`;
  };

  const handleOpenModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmployee(emp);
      setFormData({
        name: emp.name,
        designation: emp.designation,
        department: emp.department,
        campus: emp.campus,
        shiftStart: emp.shiftStart,
        shiftEnd: emp.shiftEnd,
        status: emp.status
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        designation: '',
        department: '',
        campus: (user.campus === 'all' ? 'Main Campus' : user.campus) as CampusCode,
        shiftStart: '08:00',
        shiftEnd: '17:00',
        status: 'full_time'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      const updatedEmployees = employees.map(emp => 
        emp.id === editingEmployee.id ? { ...emp, ...formData } : emp
      );
      onUpdateEmployees(updatedEmployees);
    } else {
      const newId = generateEmployeeId(formData.campus);
      const newEmployee: Employee = {
        ...formData,
        id: newId,
        username: newId,
        password: 'abc123',
        attendance: [],
        leaves: {
          annual: { total: 20, used: 0 },
          casual: { total: 10, used: 0 },
          medical: { total: 15, used: 0 }
        },
        leaveRequests: [],
        performanceReviews: []
      };
      onUpdateEmployees([...employees, newEmployee]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this employee? This will remove all their records.')) {
      onUpdateEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 bento-box p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-bento-ink h-[44px]"
            />
          </div>
          {(user.role === 'admin' || user.role === 'mudeer') && (
            <div className="relative w-full sm:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
              <select 
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-3 bg-bento-bg/30 border border-bento-line text-[10px] font-black uppercase appearance-none focus:outline-hidden focus:ring-1 focus:ring-bento-ink h-[44px]"
              >
                <option value="all">Global Hub</option>
                <option value="Main Campus">Main Complex</option>
                <option value="Johar Campus">Johar Facility</option>
                <option value="Masjid Campus">Masjid Grounds</option>
                <option value="Maktab Campus">Maktab Station</option>
              </select>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="btn-accent px-4 sm:px-8 py-3 text-[10px] font-black tracking-widest uppercase flex items-center justify-center space-x-2 h-[44px]"
        >
          <UserPlus size={14} />
          <span>NEW ENLISTMENT</span>
        </button>
      </div>

      {/* Employee List - Table Layout */}
      <div className="bento-box overflow-x-auto bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-bento-ink text-white">
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left border-r border-bento-ink/20">Employee</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left border-r border-bento-ink/20">Username/ID</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left border-r border-bento-ink/20">Password</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-left border-r border-bento-ink/20">Campus</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center border-r border-bento-ink/20">Status</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map(emp => (
              <tr key={emp.id} className="border-b border-bento-line hover:bg-bento-bg/20 transition-colors">
                <td className="px-4 py-4 border-r border-bento-line">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-bento-ink text-white flex items-center justify-center font-bold text-xs mr-3 border border-bento-accent shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase text-bento-ink leading-tight">{emp.name}</div>
                      <div className="text-[9px] font-bold text-bento-ink opacity-40 uppercase">{emp.designation}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 border-r border-bento-line">
                  <span className="font-mono text-xs font-bold text-bento-ink tracking-tight bg-bento-bg/50 px-2 py-1 rounded-sm border border-bento-line">
                    {emp.username}
                  </span>
                </td>
                <td className="px-4 py-4 border-r border-bento-line">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-bento-ink w-16">
                      {showPasswords[emp.id] ? emp.password : '••••••'}
                    </span>
                    <button 
                      onClick={() => togglePasswordVisibility(emp.id)}
                      className="p-1 hover:bg-bento-bg rounded-md text-bento-ink/40 hover:text-bento-ink"
                    >
                      {showPasswords[emp.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-4 border-r border-bento-line">
                  <span className="text-[9px] font-black uppercase text-bento-ink/60">{emp.campus}</span>
                </td>
                <td className="px-4 py-4 text-center border-r border-bento-line">
                  <span className={cn(
                    "text-[8px] font-black uppercase px-2 py-1 tracking-widest",
                    emp.accountLocked 
                      ? "bg-red-100 text-red-600 border border-red-200" 
                      : "bg-green-100 text-green-600 border border-green-200"
                  )}>
                    {emp.accountLocked ? 'Locked' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      onClick={() => handleLockToggle(emp)}
                      title={emp.accountLocked ? "Unlock Account" : "Lock Account"}
                      className={cn(
                        "p-2 border transition-all h-[36px] w-[36px] flex items-center justify-center",
                        emp.accountLocked 
                          ? "bg-green-50 border-green-200 text-green-600 hover:bg-green-100" 
                          : "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                      )}
                    >
                      {emp.accountLocked ? <Unlock size={14} /> : <Lock size={14} />}
                    </button>
                    <button 
                      onClick={() => handleOpenPasswordModal(emp)}
                      title="Update Password"
                      className="p-2 border border-bento-line text-bento-ink hover:bg-bento-bg h-[36px] w-[36px] flex items-center justify-center"
                    >
                      <Key size={14} />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(emp)}
                      title="Edit Profile"
                      className="p-2 border border-bento-line text-bento-ink hover:bg-bento-bg h-[36px] w-[36px] flex items-center justify-center"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(emp.id)}
                      title="Delete Employee"
                      className="p-2 border border-red-200 text-red-600 hover:bg-red-50 h-[36px] w-[36px] flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Password Update Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-bento-ink/80 backdrop-blur-xs animate-in fade-in duration-300"
            onClick={() => setIsPasswordModalOpen(false)}
          ></div>
          <div className="relative bento-box bg-white max-w-sm w-full p-0 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="bg-bento-ink p-4 border-b-[4px] border-bento-accent flex items-center justify-between shrink-0">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                Secure Credential Update
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-white opacity-40 hover:opacity-100">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handePasswordUpdate} className="p-6">
              <div className="mb-4">
                <div className="text-[10px] font-bold text-bento-ink/40 uppercase mb-2">Employee</div>
                <div className="text-xs font-black uppercase text-bento-ink">{editingEmployee?.name}</div>
              </div>
              <div className="mb-6">
                <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-widest mb-2 opacity-40">New Password</label>
                <input 
                  required
                  type="text" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden h-[44px]"
                  placeholder="ENTER NEW PASSWORD..."
                />
              </div>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-3 border border-bento-line text-[10px] font-black uppercase tracking-widest hover:bg-bento-bg"
                >
                  CANCEL
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 btn-primary text-[10px] font-black tracking-widest uppercase"
                >
                  UPGRADE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-bento-ink/80 backdrop-blur-xs animate-in fade-in duration-300"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="relative bento-box bg-white max-w-2xl w-full p-0 overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-bento-ink p-4 sm:p-6 border-b-[4px] border-bento-accent flex items-center justify-between shrink-0">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                {editingEmployee ? 'Update Identity' : 'New Registry'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white opacity-40 hover:opacity-100">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-10 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-widest mb-2 opacity-40">Civil Identity</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden h-[44px]"
                    placeholder="NAME..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-widest mb-2 opacity-40">Position</label>
                  <input 
                    required
                    type="text" 
                    value={formData.designation}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden h-[44px]"
                    placeholder="DESIGNATION..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-widest mb-2 opacity-40">Sector</label>
                  <input 
                    required
                    type="text" 
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden h-[44px]"
                    placeholder="DEPARTMENT..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-widest mb-2 opacity-40">Hub</label>
                  <select 
                    value={formData.campus}
                    onChange={(e) => setFormData({...formData, campus: e.target.value as CampusCode})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden appearance-none h-[44px]"
                  >
                    <option value="Main Campus">Main Complex</option>
                    <option value="Johar Campus">Johar Facility</option>
                    <option value="Masjid Campus">Masjid Grounds</option>
                    <option value="Maktab Campus">Maktab Station</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-widest mb-2 opacity-40">Class</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden appearance-none h-[44px]"
                  >
                    <option value="full_time">Full Deployment</option>
                    <option value="part_time">Partial Deployment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-widest mb-2 opacity-40">From</label>
                  <input 
                    type="time" 
                    value={formData.shiftStart}
                    onChange={(e) => setFormData({...formData, shiftStart: e.target.value})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-bento-ink uppercase tracking-widest mb-2 opacity-40">To</label>
                  <input 
                    type="time" 
                    value={formData.shiftEnd}
                    onChange={(e) => setFormData({...formData, shiftEnd: e.target.value})}
                    className="w-full px-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold h-[44px]"
                  />
                </div>

                <div className="sm:col-span-2 pt-4 sm:pt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 border border-bento-line text-[10px] font-black uppercase tracking-widest hover:bg-bento-bg transition-colors h-[50px] flex items-center justify-center order-2 sm:order-1"
                  >
                    ABORT
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 btn-primary text-[10px] font-black tracking-widest uppercase flex items-center justify-center space-x-2 h-[50px] order-1 sm:order-2"
                  >
                    <Check size={16} />
                    <span>{editingEmployee ? 'UPDATE' : 'FINALIZE'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center text-xs sm:text-sm">
    <div className="w-6 sm:w-8 flex justify-center text-gray-300 shrink-0">
      <Icon size={14} className="sm:w-4 sm:h-4" />
    </div>
    <span className="text-gray-400 font-bold mr-2 text-[9px] sm:text-[10px] uppercase">{label}:</span>
    <span className="text-bento-ink font-bold tracking-tight truncate flex-1">{value}</span>
  </div>
);
