
import React, { useState, useMemo } from 'react';
import { Employee, User, AttendanceStatus, AttendanceRecord } from '../../types';
import { Save, Search, Download, Calendar as CalendarIcon, Clock, Filter, CheckCircle2 } from 'lucide-react';
import { calculateLateHours, calculateOvertime, cn, getLocalDate } from '../../lib/utils';

interface ManualAttendanceProps {
  employees: Employee[];
  user: User;
  onUpdateEmployees: (employees: Employee[]) => void;
}

export const ManualAttendance: React.FC<ManualAttendanceProps> = ({ employees, user, onUpdateEmployees }) => {
  const [date, setDate] = useState(getLocalDate());
  const [searchTerm, setSearchTerm] = useState('');
  const [campusFilter, setCampusFilter] = useState<string>(user.campus === 'all' ? 'Main Campus' : user.campus);
  const [statusBuffer, setStatusBuffer] = useState<Record<string, { timeIn: string; timeOut: string; status: AttendanceStatus; remarks: string }>>({});
  const [isSaved, setIsSaved] = useState(false);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesCampus = user.role === 'admin' || user.role === 'mudeer' ? (campusFilter === 'all' || emp.campus === campusFilter) : (emp.campus === user.campus);
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCampus && matchesSearch;
    });
  }, [employees, user, campusFilter, searchTerm]);

  // Auto-load records when filters change
  React.useEffect(() => {
    loadAttendance();
  }, [date, campusFilter, employees]);

  // Load existing records for the date
  const loadAttendance = () => {
    const buffer: any = {};
    filteredEmployees.forEach(emp => {
      const existing = emp.attendance.find(a => a.date === date);
      if (existing) {
        buffer[emp.id] = {
          timeIn: existing.timeIn,
          timeOut: existing.timeOut,
          status: existing.status,
          remarks: existing.remarks || ''
        };
      } else {
        buffer[emp.id] = {
          timeIn: '',
          timeOut: '',
          status: 'Absent',
          remarks: ''
        };
      }
    });
    setStatusBuffer(buffer);
    setIsSaved(false);
  };

  const handleUpdateBuffer = (id: string, field: string, value: string) => {
    setStatusBuffer(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    const updatedEmployees = employees.map(emp => {
      if (statusBuffer[emp.id]) {
        const { timeIn, timeOut, status, remarks } = statusBuffer[emp.id];
        const lateHours = calculateLateHours(timeIn, emp.shiftStart);
        const overtime = calculateOvertime(timeOut, emp.shiftEnd);
        
        let finalStatus = status;
        if (lateHours > 0 && status === 'Present') {
          finalStatus = 'Late';
        }

        const newRecord: AttendanceRecord = {
          date,
          timeIn,
          timeOut,
          lateHours,
          overtime,
          onTime: lateHours === 0 && (status === 'Present' || status === 'Late'),
          status: finalStatus,
          remarks
        };

        const existingAttendance = emp.attendance.filter(a => a.date !== date);
        return {
          ...emp,
          attendance: [...existingAttendance, newRecord]
        };
      }
      return emp;
    });

    onUpdateEmployees(updatedEmployees);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="bento-box flex flex-wrap items-center gap-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Operational Date</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-bento-ink"
            />
          </div>
        </div>

        {(user.role === 'admin' || user.role === 'mudeer') && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Campus Terminal</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
              <select 
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-bento-ink appearance-none"
              >
                <option value="Main Campus">Main Campus</option>
                <option value="Johar Campus">Johar Campus</option>
                <option value="Masjid Campus">Masjid Campus</option>
                <option value="Maktab Campus">Maktab Campus</option>
                <option value="all">Global Access</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 opacity-40">Employee Lookup</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
            <input 
              type="text"
              placeholder="NAME / ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bento-bg/30 border border-bento-line text-xs font-bold uppercase focus:outline-hidden focus:ring-1 focus:ring-bento-ink"
            />
          </div>
        </div>

        <div className="flex items-end space-x-2">
          <button 
            onClick={loadAttendance}
            className="btn-accent px-8 py-3 text-[10px] font-black tracking-widest uppercase"
          >
            INITIALIZE
          </button>
          <button 
            onClick={handleSave}
            disabled={Object.keys(statusBuffer).length === 0}
            className="btn-primary px-8 py-3 text-[10px] font-black tracking-widest uppercase flex items-center space-x-2 disabled:opacity-20 translate-y-[-1px]"
          >
            <Save size={14} />
            <span>COMMIT CHANGES</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="bg-emerald-50 text-emerald-800 px-6 py-4 border-l-4 border-emerald-600 flex items-center text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="mr-3" size={20} />
          <span>System Archive Updated - Authentication Successful</span>
        </div>
      )}

      <div className="bento-box overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[10px]">
            <thead className="border-b-2 border-bento-ink/10 opacity-40 uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Identity</th>
                <th className="px-6 py-4">Protocol</th>
                <th className="px-6 py-4">Log In</th>
                <th className="px-6 py-4">Log Out</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bento-bg">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center opacity-20 italic">
                    NO EMPLOYEES FOUND - INITIALIZE DATA LOAD
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => {
                  const data = statusBuffer[emp.id] || { timeIn: '', timeOut: '', status: 'Absent' as const, remarks: '' };
                  return (
                    <tr key={`${emp.id}-${idx}`} className="hover:bg-bento-bg/10 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-bento-ink text-white flex items-center justify-center font-bold mr-3 border border-bento-accent">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-bento-ink uppercase">{emp.name}</div>
                            <div className="text-[8px] opacity-40 font-bold uppercase">{emp.id} | {emp.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[9px] font-bold opacity-60">
                          {emp.shiftStart} - {emp.shiftEnd}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="time" 
                          value={data.timeIn}
                          onChange={(e) => handleUpdateBuffer(emp.id, 'timeIn', e.target.value)}
                          className="px-2 py-1 bg-bento-bg/30 border border-bento-line text-[10px] font-bold"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="time" 
                          value={data.timeOut}
                          onChange={(e) => handleUpdateBuffer(emp.id, 'timeOut', e.target.value)}
                          className="px-2 py-1 bg-bento-bg/30 border border-bento-line text-[10px] font-bold"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={data.status}
                          onChange={(e) => handleUpdateBuffer(emp.id, 'status', e.target.value as any)}
                          className={cn(
                            "px-2 py-1 border text-[9px] font-black uppercase appearance-none",
                            data.status === 'Present' && "border-emerald-200 text-emerald-800 bg-emerald-50",
                            data.status === 'Late' && "border-orange-200 text-orange-800 bg-orange-50",
                            data.status === 'Absent' && "border-red-200 text-red-800 bg-red-50",
                            data.status === 'Holiday' && "border-blue-200 text-blue-800 bg-blue-50",
                            data.status === 'Leave' && "border-purple-200 text-purple-800 bg-purple-50"
                          )}
                        >
                          <option value="Present">Present</option>
                          <option value="Late">Late</option>
                          <option value="Absent">Absent</option>
                          <option value="Holiday">Holiday</option>
                          <option value="Leave">Leave</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="text" 
                          placeholder="Log remarks..."
                          value={data.remarks}
                          onChange={(e) => handleUpdateBuffer(emp.id, 'remarks', e.target.value)}
                          className="w-full px-2 py-1 bg-bento-bg/30 border border-bento-line text-[10px] font-bold uppercase"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
