
import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, AttendanceStatus, LeaveRequest } from '../../types';
import { 
  Clock, 
  Calendar, 
  Briefcase, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Save,
  Lock
} from 'lucide-react';
import { LogOut } from 'lucide-react';
import { calculateLateHours, calculateOvertime, cn, getLocalDate } from '../../lib/utils';

interface EmployeePortalProps {
  employee: Employee;
  allEmployees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => void;
  onLogout: () => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({ employee, allEmployees, onUpdateEmployees, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'profile' | 'performance'>('attendance');
  const [remarks, setRemarks] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = getLocalDate();
  const todayAttendance = useMemo(() => employee.attendance.find(a => a.date === today), [employee, today]);

  const handleMarkAttendance = (type: 'in' | 'out') => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    let updatedAttendance = [...employee.attendance];
    const existingIndex = updatedAttendance.findIndex(a => a.date === today);

    if (type === 'in') {
      const lateHours = calculateLateHours(timeString, employee.shiftStart);
      const status: AttendanceStatus = lateHours > 0 ? 'Late' : 'Present';
      
      const newRecord: AttendanceRecord = {
        date: today,
        timeIn: timeString,
        timeOut: '',
        lateHours,
        overtime: 0,
        onTime: lateHours === 0,
        status,
        remarks: remarks || 'Self Check-in'
      };

      if (existingIndex >= 0) {
        updatedAttendance[existingIndex] = { ...updatedAttendance[existingIndex], ...newRecord };
      } else {
        updatedAttendance.push(newRecord);
      }
    } else {
      if (existingIndex >= 0) {
        const overtime = calculateOvertime(timeString, employee.shiftEnd);
        updatedAttendance[existingIndex] = {
          ...updatedAttendance[existingIndex],
          timeOut: timeString,
          overtime,
          remarks: remarks || updatedAttendance[existingIndex].remarks
        };
      }
    }

    const updatedEmployees = allEmployees.map(emp => 
      emp.id === employee.id ? { ...emp, attendance: updatedAttendance } : emp
    );
    onUpdateEmployees(updatedEmployees);
  };

  const [leaveForm, setLeaveForm] = useState({
    type: 'Annual' as any,
    from: today,
    to: today,
    reason: ''
  });

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest: LeaveRequest = {
      id: Math.random().toString(36).substr(2, 9),
      ...leaveForm,
      status: 'Pending'
    };

    const updatedEmployees = allEmployees.map(emp => 
      emp.id === employee.id ? { ...emp, leaveRequests: [...emp.leaveRequests, newRequest] } : emp
    );
    onUpdateEmployees(updatedEmployees);
    setLeaveForm({ type: 'Annual', from: today, to: today, reason: '' });
    alert('Leave request submitted successfully!');
  };

  const renderAttendanceTab = () => (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-in Card */}
        <div className="lg:col-span-1 bento-box flex flex-col items-center justify-center text-center p-4 sm:p-8 space-y-4 sm:space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-bento-ink text-white flex items-center justify-center border-2 border-bento-accent">
            <Clock size={28} className="sm:w-8 sm:h-8" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-bento-ink uppercase tracking-tighter">Terminal Access</h3>
            <p className="text-[9px] sm:text-[10px] font-bold text-bento-accent tracking-[0.2em] uppercase mt-1">Shift: {employee.shiftStart} - {employee.shiftEnd}</p>
          </div>

          <div className="w-full space-y-4">
            <textarea 
              placeholder="Log message or remarks..."
              className="w-full p-3 sm:p-4 bg-bento-bg/30 border border-bento-line focus:outline-hidden focus:ring-1 focus:ring-bento-ink text-xs font-bold uppercase resize-none h-20 sm:h-24"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => handleMarkAttendance('in')}
                disabled={!!todayAttendance?.timeIn}
                className="btn-accent w-full text-[10px] sm:text-xs tracking-widest uppercase disabled:opacity-20 py-3 sm:py-3.5"
              >
                CLOCK IN TERMINAL
              </button>
              <button 
                onClick={() => handleMarkAttendance('out')}
                disabled={!todayAttendance?.timeIn || !!todayAttendance?.timeOut}
                className="btn-primary w-full text-[10px] sm:text-xs tracking-widest uppercase disabled:opacity-20 py-3 sm:py-3.5"
              >
                CLOCK OUT TERMINAL
              </button>
            </div>
          </div>

          {todayAttendance && (
            <div className="w-full p-3 sm:p-4 border border-bento-line space-y-2 sm:space-y-3 font-mono text-[9px] sm:text-[10px]">
              <div className="flex justify-between font-bold border-b border-bento-bg pb-2">
                <span className="opacity-40 uppercase">IN:</span>
                <span className="text-bento-accent">{todayAttendance.timeIn || '--:--'}</span>
              </div>
              <div className="flex justify-between font-bold border-b border-bento-bg pb-2">
                <span className="opacity-40 uppercase">OUT:</span>
                <span className="">{todayAttendance.timeOut || '--:--'}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="opacity-40 uppercase">STATUS:</span>
                <span className={cn(
                  "status-pill px-2 py-1",
                  todayAttendance.status === 'Present' ? "bg-emerald-100 text-emerald-800 font-black" : "bg-orange-100 text-orange-800 font-black"
                )}>
                  {todayAttendance.status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Calendar View */}
        <div className="lg:col-span-2 bento-box p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
            <h3 className="font-serif italic text-base sm:text-lg text-center sm:text-left">Attendance <span className="text-[10px] font-bold not-italic opacity-40 uppercase tracking-widest ml-2">CALENDAR</span></h3>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1 hover:bg-bento-bg border border-bento-line"><ChevronLeft size={16} /></button>
              <span className="font-mono font-bold text-xs uppercase tracking-widest">{currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1 hover:bg-bento-bg border border-bento-line"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2 sm:mb-4">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => <div key={d} className="text-[7px] sm:text-[8px] font-black text-bento-ink opacity-30 tracking-widest">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {[...Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay())].map((_, i) => <div key={i} />)}
            {[...Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate())].map((_, i) => {
              const d = (i + 1).toString().padStart(2, '0');
              const m = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
              const y = currentMonth.getFullYear();
              const dateStr = `${y}-${m}-${d}`;
              const att = employee.attendance.find(a => a.date === dateStr);
              
              return (
                <div key={i} className={cn(
                  "h-10 sm:h-14 border border-bento-line/10 flex flex-col items-center justify-center font-mono text-[10px] sm:text-xs transition-all relative group cursor-pointer",
                  !att && "bg-bento-bg/30 opacity-40",
                  att?.status === 'Present' && "bg-emerald-50 text-emerald-900 border-emerald-200",
                  att?.status === 'Late' && "bg-orange-50 text-orange-900 border-orange-200",
                  att?.status === 'Absent' && "bg-red-50 text-red-900 border-red-200",
                  att?.status === 'Leave' && "bg-purple-50 text-purple-900 border-purple-200"
                )}>
                  <span className="text-[9px] sm:text-[10px] font-bold">{i + 1}</span>
                  {att && <div className="w-1 h-1 bg-current mt-1"></div>}
                  {att && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-bento-ink text-white p-2 rounded-none text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none uppercase tracking-widest border border-bento-accent">
                      {att.status}: {att.timeIn} - {att.timeOut}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 sm:mt-8 flex flex-wrap gap-4 sm:gap-6 pt-4 sm:pt-6 border-t border-bento-bg">
            <LegendItem color="bg-emerald-500" text="P" />
            <LegendItem color="bg-orange-500" text="L" />
            <LegendItem color="bg-red-500" text="A" />
            <LegendItem color="bg-purple-500" text="LV" />
          </div>
        </div>
      </div>
    </div>
  );

  const LegendItem = ({ color, text }: any) => (
    <div className="flex items-center space-x-1.5 sm:space-x-2">
      <div className={cn("w-2 h-2", color)}></div>
      <span className="text-[8px] sm:text-[9px] font-bold uppercase text-bento-ink opacity-40 tracking-widest">{text}</span>
    </div>
  );

  const renderLeavesTab = () => (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <BalanceCard label="Annual" total={employee.leaves.annual.total} used={employee.leaves.annual.used} accent />
        <BalanceCard label="Casual" total={employee.leaves.casual.total} used={employee.leaves.casual.used} />
        <BalanceCard label="Medical" total={employee.leaves.medical.total} used={employee.leaves.medical.used} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bento-box p-4 sm:p-6">
          <h3 className="font-serif italic text-base sm:text-lg mb-6 sm:mb-8 text-center sm:text-left">Apply for Leave <span className="text-[10px] not-italic font-bold opacity-40 uppercase tracking-widest ml-2">DOCUMENT SUBMISSION</span></h3>
          <form className="space-y-5 sm:space-y-6" onSubmit={handleApplyLeave}>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Category</label>
              <select 
                className="w-full p-3 sm:p-4 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase appearance-none"
                value={leaveForm.type}
                onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value as any})}
              >
                <option value="Annual">Annual Reserve</option>
                <option value="Casual">Casual Allowance</option>
                <option value="Medical">Medical Hardship</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">From Date</label>
                <input 
                  type="date" 
                  className="w-full p-3 sm:p-4 bg-bento-bg/30 border border-bento-line text-xs font-bold"
                  value={leaveForm.from}
                  onChange={(e) => setLeaveForm({...leaveForm, from: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">To Date</label>
                <input 
                  type="date" 
                  className="w-full p-3 sm:p-4 bg-bento-bg/30 border border-bento-line text-xs font-bold"
                  value={leaveForm.to}
                  onChange={(e) => setLeaveForm({...leaveForm, to: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Reason / Justification</label>
              <textarea 
                className="w-full p-3 sm:p-4 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase resize-none h-24 sm:h-32"
                placeholder="Declare reason for request..."
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
              />
            </div>

            <button className="btn-accent w-full text-[10px] sm:text-xs tracking-[0.2em] sm:tracking-[0.3em] font-black py-3.5 sm:py-4">
              DISPATCH REQUEST
            </button>
          </form>
        </div>

        <div className="bento-box p-4 sm:p-6 flex flex-col">
          <div className="mb-6 sm:mb-8 text-center sm:text-left">
            <h3 className="font-serif italic text-base sm:text-lg">Log Archive <span className="text-[10px] not-italic font-bold opacity-40 uppercase tracking-widest ml-2">HISTORY</span></h3>
          </div>
          <div className="flex-1 overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[400px] sm:min-w-0 p-4 sm:p-0">
              {employee.leaveRequests.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center opacity-20">
                  <AlertCircle size={32} className="mb-3" />
                  <p className="font-bold uppercase tracking-widest text-[9px]">Registry Empty</p>
                </div>
              ) : (
                <table className="w-full text-left font-mono text-[9px] sm:text-[10px]">
                  <thead>
                    <tr className="border-b-2 border-bento-ink/10 opacity-40 font-bold">
                      <th className="py-3 uppercase">Type</th>
                      <th className="py-3 text-center uppercase">Span</th>
                      <th className="py-3 text-right uppercase">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-bento-bg">
                    {employee.leaveRequests.map(req => (
                      <tr key={req.id}>
                        <td className="py-3">
                          <div className="font-black uppercase">{req.type}</div>
                          <div className="opacity-40 italic truncate max-w-[100px] sm:max-w-[120px]">{req.reason}</div>
                        </td>
                        <td className="py-3 text-center opacity-60">
                          {req.from} <br className="sm:hidden" /> <span className="hidden sm:inline">-</span> {req.to}
                        </td>
                        <td className="py-3 text-right">
                          <span className={cn(
                            "status-pill px-1.5 sm:px-2 py-0.5 sm:py-1",
                            req.status === 'Pending' && "bg-orange-100 text-orange-800",
                            req.status === 'Approved' && "bg-emerald-100 text-emerald-800",
                            req.status === 'Rejected' && "bg-red-100 text-red-800"
                          )}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const BalanceCard = ({ label, total, used, accent }: any) => {
    return (
      <div className={cn("stat-card", accent && "border-l-4 sm:border-l-8 border-l-bento-accent")}>
        <div className="stat-label text-[8px] sm:text-[10px]">{label}</div>
        <div className="flex items-end justify-between mt-4 sm:mt-6">
          <div className="flex flex-col">
            <span className="stat-value text-xl sm:text-3xl">{total - used}</span>
            <span className="text-[8px] sm:text-[9px] font-bold uppercase opacity-30 mt-1 tracking-widest">Available</span>
          </div>
          <div className="text-right font-mono text-[9px] sm:text-xs font-bold opacity-60 uppercase">
            {used} / {total}
          </div>
        </div>
        <div className="mt-3 sm:mt-4 h-1 w-full bg-bento-bg">
          <div className={cn("h-full transition-all duration-500", 
            accent ? 'bg-bento-accent' : 'bg-bento-ink'
          )} style={{ width: `${(used / total) * 100}%` }}></div>
        </div>
      </div>
    );
  };

  const renderProfileTab = () => (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 max-w-full overflow-hidden">
      <div className="bento-box grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 p-6 sm:p-10">
        <div className="flex flex-col items-center space-y-4 sm:space-y-6 border-b sm:border-b-0 sm:border-r border-bento-bg pb-6 sm:pb-0 sm:pr-8">
          <div className="w-24 h-24 sm:w-40 sm:h-40 bg-bento-ink text-white flex items-center justify-center text-4xl sm:text-6xl font-black border-4 border-bento-accent rotate-2 shadow-[8px_8px_0px_#14141410]">
            {employee.name.charAt(0)}
          </div>
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-black text-bento-ink uppercase tracking-tighter">{employee.name}</h3>
            <span className="text-[9px] sm:text-[10px] font-bold text-bento-accent tracking-[0.2em] sm:tracking-[0.3em] uppercase opacity-60">{employee.id}</span>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8 sm:space-y-10">
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-6 sm:gap-8 font-mono">
            <ProfileInfo label="Role" value={(employee?.designation || 'N/A').toUpperCase()} />
            <ProfileInfo label="Dept" value={(employee?.department || 'N/A').toUpperCase()} />
            <ProfileInfo label="Campus" value={(employee?.campus || 'N/A').toUpperCase()} />
            <ProfileInfo label="Shift" value={`${employee.shiftStart}-${employee.shiftEnd}`} />
            <ProfileInfo label="User ID" value={employee.username} />
            <ProfileInfo label="Security" value="SECURE" />
          </div>

          <div className="pt-8 sm:pt-10 border-t border-bento-bg space-y-4 sm:space-y-6">
            <h4 className="font-serif italic text-base sm:text-lg">Key Management</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                type="password" 
                placeholder="NEW SECRET KEY" 
                className="w-full p-3 sm:p-4 bg-bento-bg/30 border border-bento-line text-[10px] sm:text-xs font-bold uppercase"
              />
              <button className="btn-primary w-full text-[10px] sm:text-xs font-black tracking-widest py-3 sm:py-4">
                UPDATE VAULT ACCESS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProfileInfo = ({ label, value }: any) => (
    <div className="space-y-1">
      <span className="text-[7px] sm:text-[8px] font-black text-bento-ink opacity-30 uppercase tracking-[0.2em]">{label}</span>
      <p className="font-bold text-bento-ink tracking-tight text-xs sm:text-sm truncate">{value}</p>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="animate-in fade-in duration-500 max-w-full overflow-hidden">
      <div className="bento-box p-4 sm:p-6">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          <h3 className="font-serif italic text-base sm:text-lg text-center sm:text-left">Performance <span className="text-[10px] not-italic font-bold opacity-40 uppercase tracking-widest ml-2">REVIEW HISTORY</span></h3>
          <div className="flex items-center space-x-3 bg-bento-bg/30 p-2 sm:p-3 border border-bento-line">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-bento-ink text-white flex items-center justify-center font-mono font-bold text-lg sm:text-xl border border-bento-accent shrink-0">4.8</div>
            <span className="text-[7px] sm:text-[8px] font-black text-bento-ink opacity-40 uppercase tracking-widest">Aggregate <br/> Rating</span>
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[500px] sm:min-w-0 p-4 sm:p-0">
            {employee.performanceReviews.length === 0 ? (
              <div className="p-12 sm:p-20 text-center opacity-20">
                 <AlertCircle size={32} className="mx-auto mb-3" />
                 <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Registry Empty</span>
              </div>
            ) : (
              <table className="w-full text-left font-mono text-[9px] sm:text-[10px]">
                <thead>
                  <tr className="border-b-2 border-bento-ink/10 opacity-40 font-bold uppercase">
                    <th className="py-3 sm:py-4">Timestamp</th>
                    <th className="py-3 sm:py-4">Gauge</th>
                    <th className="py-3 sm:py-4">Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bento-bg">
                  {employee.performanceReviews.map((rev, i) => (
                    <tr key={i}>
                      <td className="py-4 sm:py-6 font-bold">{rev.date}</td>
                      <td className="py-4 sm:py-6">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, j) => (
                            <div key={j} className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2", j < rev.rating ? "bg-bento-accent" : "bg-bento-bg")}></div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 sm:py-6 italic opacity-70 text-[10px] sm:text-xs">{rev.feedback}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10 max-w-full overflow-hidden">
      <div className="tabs-container sticky top-4 z-[30] mx-auto w-full sm:w-fit bg-bento-ink border border-bento-line shadow-lg">
        <nav className="flex items-center">
          <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={Clock} label="Terminal" />
          <TabButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} icon={Briefcase} label="Leaves" />
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="Profile" />
          <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={FileText} label="Reviews" />
          <button 
            onClick={onLogout}
            className="tab-item flex items-center space-x-2 text-red-400 hover:text-red-500 hover:bg-white/5 transition-all duration-200 px-4 flex-shrink-0"
          >
            <LogOut size={14} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Logout</span>
          </button>
        </nav>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'attendance' && renderAttendanceTab()}
        {activeTab === 'leaves' && renderLeavesTab()}
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "tab-item flex items-center space-x-2 transition-all duration-200 flex-shrink-0 px-4",
      active ? "bg-white text-bento-ink font-black" : "text-white/40 hover:text-white"
    )}
  >
    <Icon size={14} className="shrink-0" />
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);
