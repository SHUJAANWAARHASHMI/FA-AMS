
import React, { useState } from 'react';
import { Employee, User, LeaveRequest } from '../../types';
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Briefcase, 
  Save, 
  AlertCircle,
  FileText,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface LeaveManagementProps {
  employees: Employee[];
  user: User;
  onUpdateEmployees: (employees: Employee[]) => void;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({ employees, user, onUpdateEmployees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [campusFilter, setCampusFilter] = useState(user.campus === 'all' ? 'all' : user.campus);

  const pendingRequests = employees.flatMap(emp => 
    emp.leaveRequests
      .filter(req => req.status === 'Pending')
      .map(req => ({ ...req, employeeId: emp.id, employeeName: emp.name, campus: emp.campus }))
  ).filter(req => campusFilter === 'all' || req.campus === campusFilter);

  const handleUpdateStatus = (employeeId: string, requestId: string, newStatus: 'Approved' | 'Rejected') => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        const updatedRequests = emp.leaveRequests.map(req => {
          if (req.id === requestId) {
            // Deduct from balance if approved
            if (newStatus === 'Approved') {
              const from = new Date(req.from);
              const to = new Date(req.to);
              const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              const type = req.type.toLowerCase() as 'annual' | 'casual' | 'medical';
              
              // Only deduct if balance persists (simplified)
              emp.leaves[type].used += days;

              // Also mark attendance as 'Leave' for those dates
              for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                const existingIndex = emp.attendance.findIndex(a => a.date === dateStr);
                const leaveRecord = {
                  date: dateStr,
                  timeIn: '--:--',
                  timeOut: '--:--',
                  lateHours: 0,
                  overtime: 0,
                  onTime: false,
                  status: 'Leave' as const,
                  remarks: `${req.type} Leave Approved`
                };
                if (existingIndex >= 0) {
                  emp.attendance[existingIndex] = leaveRecord;
                } else {
                  emp.attendance.push(leaveRecord);
                }
              }
            }
            return { ...req, status: newStatus };
          }
          return req;
        });
        return { ...emp, leaveRequests: updatedRequests };
      }
      return emp;
    });
    onUpdateEmployees(updatedEmployees);
  };

  const filteredEmployeesForBalances = employees.filter(emp => {
    const matchesCampus = campusFilter === 'all' || emp.campus === campusFilter;
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCampus && matchesSearch;
  });

  return (
    <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-500 max-w-full overflow-hidden">
      {/* Pending Requests */}
      <div className="bento-box overflow-hidden p-0 rounded-none">
        <div className="p-4 sm:p-8 border-b border-bento-bg bg-bento-bg/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-serif italic text-lg sm:text-xl flex items-center text-center sm:text-left">
            <ShieldCheck className="mr-3 text-bento-accent shrink-0" size={24} />
            Pending Authorization
          </h3>
          {(user.role === 'admin' || user.role === 'mudeer') && (
            <div className="relative w-full sm:w-auto">
              <select 
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-bento-line text-[10px] font-black uppercase appearance-none"
              >
                <option value="all">Global Access</option>
                <option value="Main Campus">Main Complex</option>
                <option value="Johar Campus">Johar Facility</option>
                <option value="Masjid Campus">Masjid Grounds</option>
                <option value="Maktab Campus">Maktab Station</option>
              </select>
            </div>
          )}
        </div>
        <div className="overflow-x-auto -mx-0">
          {pendingRequests.length === 0 ? (
            <div className="p-12 sm:p-20 text-center flex flex-col items-center">
              <CheckCircle2 size={40} className="text-bento-accent opacity-20 mb-4" />
              <p className="text-bento-ink opacity-30 font-black uppercase tracking-[0.2em] text-[10px]">No Pending Operations</p>
            </div>
          ) : (
            <div className="min-w-[600px] sm:min-w-0">
              <table className="w-full text-left font-mono text-[10px]">
                <thead className="border-b-2 border-bento-ink/10 opacity-40 uppercase font-bold">
                  <tr>
                    <th className="px-4 sm:px-8 py-4">Identity</th>
                    <th className="px-4 sm:px-8 py-4">Protocol</th>
                    <th className="px-4 sm:px-8 py-4 text-center">Span</th>
                    <th className="px-4 sm:px-8 py-4">Context</th>
                    <th className="px-4 sm:px-8 py-4 text-right">Commit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bento-bg">
                  {pendingRequests.map(req => (
                    <tr key={req.id} className="hover:bg-bento-bg/10 transition-colors">
                      <td className="px-4 sm:px-8 py-6">
                        <div className="flex items-center">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-bento-ink text-white flex items-center justify-center font-bold mr-3 border border-bento-accent shrink-0">
                            {req.employeeName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-bento-ink uppercase truncate">{req.employeeName}</div>
                            <div className="text-[8px] opacity-40 font-bold uppercase truncate">{req.campus.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-8 py-6">
                        <span className="status-pill text-[8px] sm:text-[10px] text-emerald-800 bg-emerald-50 border-emerald-100">{req.type.toUpperCase()}</span>
                      </td>
                      <td className="px-4 sm:px-8 py-6 text-center">
                        <div className="font-bold text-bento-ink/70">{req.from}</div>
                        <div className="text-[8px] font-black opacity-20 uppercase">To</div>
                        <div className="font-bold text-bento-ink/70">{req.to}</div>
                      </td>
                      <td className="px-4 sm:px-8 py-6 max-w-[150px] sm:max-w-xs">
                        <p className="text-[10px] font-medium text-bento-ink opacity-60 italic leading-relaxed line-clamp-2">"{req.reason}"</p>
                      </td>
                      <td className="px-4 sm:px-8 py-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleUpdateStatus(req.employeeId, req.id, 'Approved')}
                            className="p-2 border border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all active:scale-90 h-[36px] w-[36px] flex items-center justify-center"
                            title="Authorize"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(req.employeeId, req.id, 'Rejected')}
                            className="p-2 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all active:scale-90 h-[36px] w-[36px] flex items-center justify-center"
                            title="Deny"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Balance Registry */}
      <div className="bento-box overflow-hidden p-0 rounded-none">
        <div className="p-4 sm:p-8 border-b border-bento-bg flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-serif italic text-lg sm:text-xl flex items-center text-center sm:text-left">
            <FileText className="mr-3 text-bento-accent shrink-0" size={24} />
            Resource Availability Log
          </h3>
          <div className="flex items-center w-full sm:w-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
              <input 
                type="text" 
                placeholder="Lookup subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-4 py-2.5 border border-bento-line text-[10px] font-black uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[700px] sm:min-w-0">
            <table className="w-full text-left font-mono text-[10px]">
              <thead className="border-b-2 border-bento-ink/10 opacity-40 uppercase font-bold">
                <tr>
                  <th className="px-4 sm:px-8 py-4">Identity</th>
                  <th className="px-4 sm:px-8 py-4">Annual (T/U/B)</th>
                  <th className="px-4 sm:px-8 py-4">Casual (T/U/B)</th>
                  <th className="px-4 sm:px-8 py-4">Medical (T/U/B)</th>
                  <th className="px-4 sm:px-8 py-4 text-center">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bento-bg">
                {filteredEmployeesForBalances.map(emp => {
                  const totalBal = (emp.leaves.annual.total - emp.leaves.annual.used) +
                                  (emp.leaves.casual.total - emp.leaves.casual.used) +
                                  (emp.leaves.medical.total - emp.leaves.medical.used);
                  return (
                    <tr key={emp.id} className="hover:bg-bento-bg/10 transition-colors">
                      <td className="px-4 sm:px-8 py-6">
                        <div className="font-black text-bento-ink uppercase text-[11px] truncate">{emp.name}</div>
                        <div className="text-[8px] opacity-40 font-bold uppercase tracking-widest">{emp.id}</div>
                      </td>
                      <td className="px-4 sm:px-8 py-6">
                        <BalancePill label="A" total={emp.leaves.annual.total} used={emp.leaves.annual.used} color="emerald" shrink />
                      </td>
                      <td className="px-4 sm:px-8 py-6">
                        <BalancePill label="C" total={emp.leaves.casual.total} used={emp.leaves.casual.used} color="blue" shrink />
                      </td>
                      <td className="px-4 sm:px-8 py-6">
                        <BalancePill label="M" total={emp.leaves.medical.total} used={emp.leaves.medical.used} color="amber" shrink />
                      </td>
                      <td className="px-4 sm:px-8 py-6 text-center">
                        <span className="text-lg sm:text-xl font-black text-bento-ink tracking-tighter">{totalBal}</span>
                        <p className="text-[7px] sm:text-[8px] font-black opacity-30 uppercase tracking-[0.1em] mt-1">Days</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const BalancePill = ({ label, total, used, color, shrink }: any) => {
  const colors: any = {
    emerald: "text-emerald-700 bg-emerald-50 hover:bg-emerald-100",
    blue: "text-blue-700 bg-blue-50 hover:bg-blue-100",
    amber: "text-amber-700 bg-amber-50 hover:bg-amber-100",
  };
  return (
    <div className={cn(
      "inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 rounded-xl border border-transparent transition-colors", 
      colors[color]
    )}>
      <span className="text-[10px] sm:text-xs font-black">{total}</span>
      <span className="text-[9px] sm:text-[10px] font-bold opacity-30">/</span>
      <span className="text-[10px] sm:text-xs font-black">{used}</span>
      <span className="text-[9px] sm:text-[10px] font-bold opacity-30">/</span>
      <span className="text-[10px] sm:text-xs font-black underline">{total - used}</span>
    </div>
  );
};
