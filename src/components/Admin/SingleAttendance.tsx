
import React, { useState, useMemo } from 'react';
import { Employee, User, AttendanceStatus, AttendanceRecord } from '../../types';
import { UserCheck, Search, Calendar, Clock, Save, History, Building2 } from 'lucide-react';
import { calculateLateHours, calculateOvertime, cn, getLocalDate } from '../../lib/utils';

interface SingleAttendanceProps {
  employees: Employee[];
  user: User;
  onUpdateEmployees: (employees: Employee[]) => void;
}

export const SingleAttendance: React.FC<SingleAttendanceProps> = ({ employees, user, onUpdateEmployees }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [date, setDate] = useState(getLocalDate());
  const [form, setForm] = useState({
    timeIn: '',
    timeOut: '',
    status: 'Present' as AttendanceStatus,
    remarks: ''
  });

  const filteredEmployees = useMemo(() => {
    if (user?.role === 'admin' || user?.role === 'mudeer') return employees;
    return employees.filter(e => e?.campus === user?.campus);
  }, [employees, user]);

  const selectedEmployee = useMemo(() => 
    filteredEmployees.find(e => e.id === selectedEmployeeId), 
  [filteredEmployees, selectedEmployeeId]);

  React.useEffect(() => {
    handleLoad();
  }, [selectedEmployeeId, date]);

  const handleLoad = () => {
    if (!selectedEmployee) return;
    const existing = selectedEmployee.attendance.find(a => a.date === date);
    if (existing) {
      setForm({
        timeIn: existing.timeIn,
        timeOut: existing.timeOut,
        status: existing.status,
        remarks: existing.remarks || ''
      });
    } else {
      setForm({ timeIn: '', timeOut: '', status: 'Absent', remarks: '' });
    }
  };

  const handleSave = () => {
    if (!selectedEmployee) return;

    const lateHours = calculateLateHours(form.timeIn, selectedEmployee.shiftStart);
    const overtime = calculateOvertime(form.timeOut, selectedEmployee.shiftEnd);
    
    let finalStatus = form.status;
    if (lateHours > 0 && form.status === 'Present') {
      finalStatus = 'Late';
    }

    // Preserve existing sessions if editing
    const existingRecord = selectedEmployee.attendance.find(a => a.date === date);
    const sessions = existingRecord?.sessions || [];

    const newRecord: AttendanceRecord = {
      date,
      timeIn: form.timeIn,
      timeOut: form.timeOut,
      sessions,
      lateHours,
      overtime,
      onTime: lateHours === 0 && (form.status === 'Present' || form.status === 'Late'),
      status: finalStatus,
      remarks: form.remarks
    };

    const updatedEmployees = employees.map(emp => {
      if (emp.id === selectedEmployeeId) {
        const existingAttendance = emp.attendance.filter(a => a.date !== date);
        return { ...emp, attendance: [...existingAttendance, newRecord] };
      }
      return emp;
    });

    onUpdateEmployees(updatedEmployees);
    alert('Attendance record updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="bento-box p-10 flex flex-col space-y-10">
        <h3 className="font-serif italic text-3xl text-bento-ink tracking-tight flex items-center">
          <UserCheck className="mr-4 text-bento-accent" size={32} />
          Personnel Attendance Terminal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest opacity-40">Personnel Selection</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
              <select 
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-bento-bg/30 border border-bento-line text-[11px] font-black uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden appearance-none"
              >
                <option value="">Choose Unit...</option>
                {filteredEmployees.map((e, idx) => <option key={`${e.id}-${idx}`} value={e.id}>{e.id} | {e.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest opacity-40">Temporal Marker</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-bento-bg/30 border border-bento-line text-[11px] font-black uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleLoad}
          disabled={!selectedEmployeeId}
          className="w-full py-4 bg-bento-bg text-bento-ink border border-bento-line text-[10px] font-black uppercase tracking-[0.3em] hover:bg-bento-ink hover:text-white transition-all disabled:opacity-30 active:scale-95"
        >
          Initialize Data Fetch
        </button>

        {selectedEmployee && (
          <div className="p-10 border border-bento-line bg-bento-bg/5 space-y-10 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between pb-8 border-b border-bento-bg">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-bento-ink text-white flex items-center justify-center font-bold mr-5 border border-bento-accent">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-serif italic text-2xl text-bento-ink leading-none">{selectedEmployee.name}</h4>
                  <p className="text-[10px] font-black text-bento-ink opacity-30 mt-2 uppercase tracking-widest">{selectedEmployee.designation} | {(selectedEmployee?.campus || 'N/A').toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-bento-ink opacity-30 uppercase tracking-[0.2em] block mb-2">Protocol Shift</span>
                <span className="px-3 py-1.5 bg-bento-ink text-white font-mono text-[10px] font-bold tracking-tight border border-bento-accent">
                  {selectedEmployee.shiftStart} - {selectedEmployee.shiftEnd}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-mono">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest opacity-40">Entry Time (In)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/30" size={16} />
                  <input 
                    type="time" 
                    value={form.timeIn}
                    onChange={(e) => setForm({...form, timeIn: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-bento-line text-[11px] font-black focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest opacity-40">Exit Time (Out)</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/30" size={16} />
                  <input 
                    type="time" 
                    value={form.timeOut}
                    onChange={(e) => setForm({...form, timeOut: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-bento-line text-[11px] font-black focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest opacity-40">Status Toggle</label>
                <select 
                  value={form.status}
                  onChange={(e) => setForm({...form, status: e.target.value as any})}
                  className="w-full px-4 py-3 bg-white border border-bento-line text-[10px] font-black uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden appearance-none"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Leave">Leave</option>
                </select>
              </div>

              <div className="col-span-1 md:col-span-3 space-y-3">
                <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest opacity-40">Procedural Remarks</label>
                <textarea 
                  rows={2}
                  value={form.remarks}
                  onChange={(e) => setForm({...form, remarks: e.target.value})}
                  placeholder="Annotate entry..."
                  className="w-full px-4 py-3 bg-white border border-bento-line text-[11px] font-medium resize-none focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-5 btn-primary text-[10px] font-black tracking-[0.4em] uppercase flex items-center justify-center space-x-4 transition-transform active:scale-[0.98]"
            >
              <Save size={20} />
              <span>COMMIT TO ARCHIVE</span>
            </button>
          </div>
        )}
      </div>

      {/* History Log Preview */}
      {selectedEmployee && (
        <div className="bento-box overflow-hidden p-0">
          <div className="p-6 bg-bento-bg/20 border-b border-bento-bg flex items-center">
            <History className="mr-3 text-bento-accent" size={20} />
            <h4 className="font-serif italic text-lg text-bento-ink">Historical Trajectory (Last 5 Cycles)</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[10px]">
              <thead className="border-b-2 border-bento-ink/10 opacity-40 uppercase font-bold">
                <tr>
                  <th className="px-8 py-4">Marker</th>
                  <th className="px-8 py-4">State</th>
                  <th className="px-8 py-4">Flow Sequence</th>
                  <th className="px-8 py-4">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bento-bg">
                {selectedEmployee.attendance.slice(-5).reverse().map((att, i) => (
                  <tr key={`${att.date}-${i}`} className="hover:bg-bento-bg/10 transition-colors">
                    <td className="px-8 py-4 font-black">{att.date}</td>
                    <td className="px-8 py-4">
                      <span className={cn(
                        "status-pill border",
                        att.status === 'Present' ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-amber-200 text-amber-700 bg-amber-50"
                      )}>
                        {att.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-8 py-4 font-bold opacity-60">{att.timeIn} - {att.timeOut}</td>
                    <td className="px-8 py-4">
                      {att.lateHours > 0 && <span className="text-red-500 font-black tracking-tighter">DELAYED: {att.lateHours.toFixed(1)}H</span>}
                      {att.overtime > 0 && <span className="text-bento-accent font-black tracking-tighter ml-2">SURPLUS: {att.overtime.toFixed(1)}H</span>}
                      {att.lateHours === 0 && att.overtime === 0 && <span className="opacity-20 font-black">NOMINAL</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
