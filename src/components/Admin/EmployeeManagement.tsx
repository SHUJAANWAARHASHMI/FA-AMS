
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
  Check
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
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

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

      {/* Employee List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredEmployees.map(emp => (
          <div key={emp.id} className="bento-box group hover:border-bento-accent transition-all duration-300 p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-bento-ink text-white flex items-center justify-center font-bold text-base sm:text-lg mr-3 sm:mr-4 border border-bento-accent group-hover:scale-105 transition-transform shrink-0">
                  {emp.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-bento-ink uppercase tracking-tighter line-clamp-1 text-sm sm:text-base">{emp.name}</h4>
                  <span className="text-[9px] sm:text-[10px] font-bold text-bento-accent tracking-[0.2em] uppercase opacity-60">{emp.id}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(emp)}
                  className="p-1.5 text-bento-ink hover:bg-bento-bg border border-bento-line h-[32px] w-[32px] flex items-center justify-center"
                >
                  <Edit2 size={12} />
                </button>
                <button 
                  onClick={() => handleDelete(emp.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 h-[32px] w-[32px] flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 pt-4 border-t border-bento-bg font-mono">
              <InfoRow icon={Shield} label="ROLE" value={emp.designation.toUpperCase()} />
              <InfoRow icon={Building2} label="HUB" value={emp.campus.toUpperCase()} />
              <InfoRow icon={Clock} label="SHIFT" value={`${emp.shiftStart}-${emp.shiftEnd}`} />
            </div>

            <div className="mt-6 sm:mt-8 flex items-center justify-between">
              <span className="status-pill text-[8px] sm:text-[10px] px-2 py-0.5 sm:py-1">
                {emp.status.replace('_', ' ').toUpperCase()}
              </span>
              <button 
                onClick={() => handleOpenModal(emp)}
                className="text-[9px] sm:text-[10px] font-bold text-bento-ink opacity-40 hover:opacity-100 uppercase tracking-widest underline"
              >
                FULL PROFILE
              </button>
            </div>
          </div>
        ))}
      </div>

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
