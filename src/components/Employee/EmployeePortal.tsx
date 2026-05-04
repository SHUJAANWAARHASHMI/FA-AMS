
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Lock,
  Star,
  Zap,
  Target,
  TrendingUp,
  LogOut
} from 'lucide-react';
import { calculateLateHours, calculateOvertime, cn, getLocalDate, calculateAttendanceHours } from '../../lib/utils';

interface EmployeePortalProps {
  employee: Employee;
  allEmployees: Employee[];
  onUpdateEmployees: (employees: Employee[]) => void;
  onLogout: () => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({ employee, allEmployees, onUpdateEmployees, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'profile' | 'performance'>('attendance');
  const [mobileTab, setMobileTab] = useState<'checkin' | 'calendar' | 'summary' | 'leaves' | 'profile'>('checkin');
  const [remarks, setRemarks] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [nowVisible, setNowVisible] = useState(new Date());

  const today = getLocalDate();
  const todayAttendance = useMemo(() => {
    const latestEmployee = allEmployees.find(emp => emp.id === employee.id) || employee;
    return latestEmployee.attendance.find(a => a.date === today);
  }, [allEmployees, employee.id, today]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNowVisible(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentTime = useMemo(() => {
    return nowVisible.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }, [nowVisible]);

  const attendanceStats = useMemo(() => {
    const monthStr = currentMonth.toISOString().slice(0, 7);
    const latestEmployee = allEmployees.find(emp => emp.id === employee.id) || employee;
    const records = latestEmployee.attendance.filter(r => r.date.startsWith(monthStr));
    const presents = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const onTime = records.filter(r => r.onTime).length;
    return {
      score: records.length ? Math.round((onTime / records.length) * 100) : 0,
      presents,
      total: records.length,
      absents: records.filter(r => r.status === 'Absent').length
    };
  }, [allEmployees, employee.id, currentMonth]);

  const [dateDisplay, setDateDisplay] = useState(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric', weekday: 'long' }).replace(',', ' -');
  });

  // Precise Campus Locations derived from provided Google Maps links
  const CAMPUS_LOCATIONS: Record<string, { lat: number, lng: number, radius: number }> = {
    'Main Campus': { lat: 31.4815, lng: 74.3475, radius: 250 },   // FFP / Model Town Area
    'Johar Campus': { lat: 31.4705, lng: 74.2742, radius: 250 },  // Johar Town
    'Masjid Campus': { lat: 31.5146, lng: 74.3439, radius: 250 }, // Mall Road/Masjid Area
    'Maktab Campus': { lat: 31.5828, lng: 74.3214, radius: 250 }, // Walled City Area
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  };

  const handleMarkAttendance = async (type: 'in' | 'out') => {
    setIsLoading(true);
    try {
      if (!navigator.geolocation) {
        alert("CRITICAL: Geolocation is not supported by your browser version. Terminal access denied.");
        setIsLoading(false);
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      
      const campusConfig = CAMPUS_LOCATIONS[employee.campus] || CAMPUS_LOCATIONS['Main Campus'];
      const distance = getDistance(userLat, userLng, campusConfig.lat, campusConfig.lng);
      
      // Enforce strict radius (e.g., 250 meters)
      if (distance > campusConfig.radius) {
        const errorMsg = `SECURITY: Position Mismatch. You are outside ${employee.campus} boundaries.\nDistance: ${Math.round(distance)}m\nAllowed: ${campusConfig.radius}m`;
        alert(errorMsg);
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Geolocation error:', err);
      let errorMsg = "ERROR: Failed to verify location.";
      if (err.code === 1) errorMsg = "PERMISSIONS: Please enable GPS/Location access to mark attendance.";
      if (err.code === 3) errorMsg = "TIMEOUT: Location verification timed out. Please try again.";
      
      alert(errorMsg);
      setIsLoading(false);
      return;
    }

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    const latestEmployee = allEmployees.find(emp => emp.id === employee.id) || employee;
    let updatedAttendance = [...latestEmployee.attendance];
    const existingIndex = updatedAttendance.findIndex(a => a.date === today);

    if (type === 'in') {
      const lateHours = calculateLateHours(timeString, latestEmployee.shiftStart);
      const status: AttendanceStatus = lateHours > 0 ? 'Late' : 'Present';
      
      if (existingIndex >= 0) {
        const record = updatedAttendance[existingIndex];
        const sessions = record.sessions || [];
        
        if (sessions.some(s => !s.checkOut)) {
          alert('SECURITY: Already checked in.');
          setIsLoading(false);
          return;
        }

        updatedAttendance[existingIndex] = {
          ...record,
          sessions: [...sessions, { checkIn: timeString, checkOut: '' }],
          timeIn: record.timeIn || timeString,
          status: record.status === 'Present' ? status : record.status
        };
      } else {
        const newRecord: AttendanceRecord = {
          date: today,
          timeIn: timeString,
          timeOut: '',
          sessions: [{ checkIn: timeString, checkOut: '' }],
          lateHours,
          overtime: 0,
          onTime: lateHours === 0,
          status,
          remarks: remarks || 'Terminal Access'
        };
        updatedAttendance.push(newRecord);
      }
      alert(`SUCCESS: Registered Entry at ${timeString}`);
    } else {
      if (existingIndex < 0) {
        alert('ERROR: Entry record missing. Access denied.');
        setIsLoading(false);
        return;
      }

      const record = updatedAttendance[existingIndex];
      const sessions = [...(record.sessions || [])];
      const activeSessionIndex = sessions.findIndex(s => !s.checkOut);

      if (activeSessionIndex === -1) {
        alert('SECURITY: No active session found to Check Out.');
        setIsLoading(false);
        return;
      }

      sessions[activeSessionIndex] = { ...sessions[activeSessionIndex], checkOut: timeString };
      
      const overtime = calculateOvertime(timeString, latestEmployee.shiftEnd);
      updatedAttendance[existingIndex] = {
        ...record,
        timeOut: timeString,
        sessions: sessions,
        overtime,
        remarks: remarks || record.remarks
      };
      alert(`SUCCESS: Registered Exit at ${timeString}`);
    }

    const updatedEmployees = allEmployees.map(emp => 
      emp.id === latestEmployee.id ? { ...emp, attendance: updatedAttendance } : emp
    );
    onUpdateEmployees(updatedEmployees);
    setRemarks('');
    setIsLoading(false);
  };

  const calculateHoursWorked = (att: AttendanceRecord | undefined) => {
    return calculateAttendanceHours(att, nowVisible);
  };

  const sessionDuration = useMemo(() => {
    if (!todayAttendance) return null;
    
    // Find active session
    const sessions = todayAttendance.sessions || [];
    const activeSession = sessions.find(s => !s.checkOut);
    
    if (!activeSession && sessions.length === 0 && !todayAttendance.timeIn) return null;
    
    if (sessions.length > 0) {
      if (!activeSession) return null;
      
      const totalHours = Number(calculateAttendanceHours(todayAttendance, nowVisible));
      const totalMs = totalHours * 3600000;

      const h = Math.floor(totalMs / 3600000);
      const m = Math.floor((totalMs % 3600000) / 60000);
      const s = Math.floor((totalMs % 60000) / 1000);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    if (!todayAttendance.timeIn || todayAttendance.timeOut) return null;
    const diffHours = Number(calculateAttendanceHours(todayAttendance, nowVisible));
    const diffMs = diffHours * 3600000;
    
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [todayAttendance, nowVisible]);

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
    <div className="animate-in fade-in duration-500 overflow-hidden">
      <div className="bento-box p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 space-y-4 border-b md:border-b-0 md:border-r border-bento-line pb-4 md:pb-0 md:pr-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-bento-ink text-white border border-bento-accent">
              <Clock size={16} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-tighter">Terminal Access</h3>
          </div>

          {sessionDuration && (
            <div className="py-10 border-b border-bento-line mb-6 text-center">
              <div className="inline-flex flex-col items-center justify-center w-40 h-40 rounded-full border-4 border-bento-accent/10 relative shadow-[0_0_30px_rgba(42,92,67,0.05)]">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] font-black text-bento-accent uppercase tracking-[0.2em] mb-1">Active</span>
                  <span className="text-3xl font-black tabular-nums tracking-tight text-bento-ink drop-shadow-sm">{sessionDuration}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-bento-bg/30 p-2 border border-bento-line">
              <span className="mini-label">In</span>
              <p className="text-sm font-black">{todayAttendance?.timeIn || '--:--'}</p>
            </div>
            <div className="bg-bento-bg/30 p-2 border border-bento-line">
              <span className="mini-label">Out</span>
              <p className="text-sm font-black">{todayAttendance?.timeOut || '--:--'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <textarea 
              placeholder="LOG MESSAGE..."
              className="w-full p-2 bg-bento-bg/30 border border-bento-line text-[9px] font-bold uppercase resize-none h-16"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => handleMarkAttendance('in')}
                disabled={!!(todayAttendance?.sessions?.some(s => !s.checkOut))}
                className="flex-1 bg-bento-accent text-white py-2 shadow-sm text-[9px] font-black uppercase tracking-widest disabled:opacity-20 transition-opacity"
              >
                CLOCK IN
              </button>
              <button 
                onClick={() => handleMarkAttendance('out')}
                disabled={!(todayAttendance?.sessions?.some(s => !s.checkOut))}
                className="flex-1 bg-bento-ink text-white py-2 shadow-sm text-[9px] font-black uppercase tracking-widest disabled:opacity-20 transition-opacity"
              >
                CLOCK OUT
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-bento-line">
            <h4 className="mini-label mb-2">Session Log</h4>
            <div className="bg-bento-bg/20 p-2 border border-bento-line text-[8px] font-mono space-y-1">
              <div className="flex justify-between"><span>ENTRY</span><span className="font-black">{todayAttendance?.timeIn || 'NONE'}</span></div>
              <div className="flex justify-between"><span>EXIT</span><span className="font-black">{todayAttendance?.timeOut || 'NONE'}</span></div>
              <div className="flex justify-between"><span>DURATION</span><span className="font-black">{calculateHoursWorked(todayAttendance)} H</span></div>
            </div>
          </div>
        </div>

        <div className="md:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif italic text-sm">Temporal Log</h3>
            <div className="flex items-center space-x-3">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1 border border-bento-line hover:bg-bento-bg">
                <ChevronLeft size={14} />
              </button>
              <span className="mini-label text-bento-ink font-black">{currentMonth.toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1 border border-bento-line hover:bg-bento-bg">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={`${d}-${i}`} className="text-center mini-label">{d}</div>)}
            {[...Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay())].map((_, i) => <div key={`empty-${i}`} />)}
            {[...Array(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate())].map((_, i) => {
              const d = (i + 1).toString().padStart(2, '0');
              const m = (currentMonth.getMonth() + 1).toString().padStart(2, '0');
              const y = currentMonth.getFullYear();
              const dateStr = `${y}-${m}-${d}`;
              const latestEmployee = allEmployees.find(emp => emp.id === employee.id) || employee;
              const att = latestEmployee.attendance.find(a => a.date === dateStr);
              return (
                <div key={i} className={cn(
                  "aspect-square flex items-center justify-center text-[9px] font-black border border-bento-line/10 relative group cursor-pointer transition-colors",
                  att?.status === 'Present' && "bg-bento-accent/10 text-bento-accent",
                  att?.status === 'Late' && "bg-orange-50 text-orange-600",
                  att?.status === 'Absent' && "bg-red-50 text-red-500",
                  att?.status === 'Leave' && "bg-purple-100/50 text-purple-600",
                  dateStr === today && "border-bento-accent bg-bento-bg text-bento-accent font-black shadow-[0_0_10px_rgba(42,92,67,0.1)]"
                )}>
                  {i + 1}
                  {att && <div className={cn("absolute bottom-1 w-1 h-1 rounded-full", 
                    att.status === 'Present' ? "bg-bento-accent" : 
                    att.status === 'Late' ? "bg-orange-600" : "bg-red-500"
                  )}></div>}
                </div>
              );
            })}
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
    <div className="animate-in fade-in duration-500 overflow-hidden">
      <div className="bento-box p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 space-y-4 md:border-r border-bento-line md:pr-6">
          <h3 className="text-sm font-black uppercase tracking-tighter">Balance Details</h3>
          <div className="grid grid-cols-1 gap-2">
            <BalanceCard label="Annual" total={employee.leaves.annual.total} used={employee.leaves.annual.used} accent />
            <BalanceCard label="Casual" total={employee.leaves.casual.total} used={employee.leaves.casual.used} />
            <BalanceCard label="Medical" total={employee.leaves.medical.total} used={employee.leaves.medical.used} />
          </div>
        </div>

        <div className="md:col-span-8 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <h3 className="mini-label">Quick Register</h3>
            <form onSubmit={handleApplyLeave} className="space-y-2">
              <select 
                className="w-full p-2 bg-bento-bg/30 border border-bento-line text-[9px] font-black uppercase"
                value={leaveForm.type}
                onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value as any})}
              >
                <option value="Annual">Annual Reserve</option>
                <option value="Casual">Casual Allowance</option>
                <option value="Medical">Medical Hardship</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="p-2 border border-bento-line text-[9px] font-mono" value={leaveForm.from} onChange={e => setLeaveForm({...leaveForm, from: e.target.value})} />
                <input type="date" className="p-2 border border-bento-line text-[9px] font-mono" value={leaveForm.to} onChange={e => setLeaveForm({...leaveForm, to: e.target.value})} />
              </div>
              <textarea 
                placeholder="REASON..."
                className="w-full p-2 border border-bento-line text-[9px] font-bold uppercase resize-none h-16"
                value={leaveForm.reason}
                onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
              />
              <button type="submit" className="w-full bg-bento-accent text-white py-2 text-[9px] font-black uppercase tracking-widest shadow-sm">
                SUBMIT PROTOCOL
              </button>
            </form>
          </div>

          <div className="flex-1 border-t md:border-t-0 md:border-l border-bento-line/10 pt-4 md:pt-0 md:pl-6">
            <h3 className="mini-label mb-3">Audit Registry</h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
              {employee.leaveRequests.length === 0 ? (
                <div className="py-10 text-center opacity-10"><p className="text-[7px] font-black italic">NO ENTRIES FOUND</p></div>
              ) : (
                employee.leaveRequests.map((req, i) => (
                  <div key={i} className="p-2 border border-bento-line/50 flex justify-between items-center bg-bento-bg/10 hover:bg-bento-bg/20 transition-colors">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-tighter">{req.type}</p>
                      <p className="text-[7px] opacity-40 font-mono">{req.from} - {req.to}</p>
                    </div>
                    <span className={cn(
                      "text-[7px] font-black px-1.5 py-0.5 rounded-sm border",
                      req.status === 'Pending' ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>{req.status.toUpperCase()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const BalanceCard = ({ label, total, used, accent }: any) => {
    const available = total - used;
    return (
      <div className={cn("bg-white border-2 border-bento-line/10 p-3 flex flex-col justify-between", accent && "border-bento-accent/30 bg-bento-accent/[0.02]")}>
        <div className="flex justify-between items-start">
          <span className="mini-label">{label}</span>
          <span className="text-[9px] font-black opacity-30">{used}/{total}</span>
        </div>
        <div className="flex items-baseline space-x-1 mt-2">
          <span className="text-xl font-black tracking-tighter">{available}</span>
          <span className="text-[8px] font-bold opacity-30 uppercase">Left</span>
        </div>
        <div className="mt-2 h-1 w-full bg-bento-bg rounded-full overflow-hidden">
          <div className={cn("h-full", accent ? 'bg-bento-accent' : 'bg-bento-ink')} style={{ width: `${(used / total) * 100}%` }}></div>
        </div>
      </div>
    );
  };

  const renderProfileTab = () => (
    <div className="animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <div className="bento-box p-4 md:p-6 flex flex-col md:flex-row gap-6">
        <div className="md:w-56 space-y-3">
          <div className="aspect-square bg-bento-ink text-white flex items-center justify-center text-5xl font-black border-2 border-bento-accent">
            {employee.name.charAt(0)}
          </div>
          <div className="bg-bento-bg/30 p-2 border border-bento-line text-center">
            <h3 className="text-sm font-black text-bento-ink uppercase tracking-tighter">{employee.name}</h3>
            <span className="mini-label">{employee.id}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            <ProfileInfo label="Role" value={(employee?.designation || 'N/A').toUpperCase()} />
            <ProfileInfo label="Dept" value={(employee?.department || 'N/A').toUpperCase()} />
            <ProfileInfo label="Campus" value={(employee?.campus || 'N/A').toUpperCase()} />
            <ProfileInfo label="Shift" value={`${employee.shiftStart}-${employee.shiftEnd}`} />
            <ProfileInfo label="User ID" value={employee.username} />
            <ProfileInfo label="Security" value="SECURE" />
          </div>
          <div className="bg-yellow-50 p-2 border border-yellow-100 flex items-start space-x-2">
            <Lock size={12} className="text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-[8px] font-bold text-yellow-800 uppercase tracking-widest leading-normal">
              Profile locked by Central Registry. Contact Mudeer for credential updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const ProfileInfo = ({ label, value }: any) => (
    <div className="bg-bento-bg/20 p-2 sm:p-3 border border-bento-line/50 flex flex-col justify-center min-h-[50px]">
      <span className="mini-label block">{label}</span>
      <p className="font-black text-bento-ink tracking-tighter text-[10px] sm:text-xs truncate">{value}</p>
    </div>
  );

  const renderPerformanceTab = () => {
    const records = employee.attendance.filter(r => r.date.startsWith(currentMonth.toISOString().slice(0, 7)));
    return (
      <div className="animate-in fade-in duration-500 h-full">
        <div className="bento-box p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 space-y-4">
            <div className="bg-bento-ink p-4 rounded-sm text-white flex justify-between items-center h-24">
              <div>
                <h3 className="text-xl font-black italic tracking-tighter">ELITE PERFORMANCE</h3>
                <p className="mini-label text-white/40 mt-1">Global Ranking: Top 5%</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black text-bento-accent leading-none">{attendanceStats.score}%</p>
                <p className="mini-label text-white/40 mt-1">Index Score</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="border border-bento-line p-3">
                <div className="flex items-center space-x-2 mb-2 text-bento-accent"><Zap size={10} /><span className="mini-label">AGILITY</span></div>
                <p className="text-base font-black">HIGH</p>
              </div>
              <div className="border border-bento-line p-3">
                <div className="flex items-center space-x-2 mb-2 text-blue-500"><Target size={10} /><span className="mini-label">KPI ACCURACY</span></div>
                <p className="text-base font-black">94%</p>
              </div>
              <div className="border border-bento-line p-3">
                <div className="flex items-center space-x-2 mb-2 text-orange-400"><TrendingUp size={10} /><span className="mini-label">MOMENTUM</span></div>
                <p className="text-base font-black">+12%</p>
              </div>
            </div>

            <div className="border border-bento-line p-4 h-[240px]">
               <h4 className="mini-label mb-3">ACHIEVEMENTS GALLERY</h4>
               <div className="space-y-2 overflow-y-auto max-h-[180px] pr-2">
                 {[
                   { title: 'Early Bird', date: 'Oct 2025', desc: 'Punctual for 20 days' },
                   { title: 'Review Star', date: 'Sep 2025', desc: 'Positive Mudeer Feedback' }
                 ].map((ach, i) => (
                   <div key={i} className="bg-bento-bg/30 p-2 border border-bento-line flex items-center space-x-3">
                     <Star size={14} className="text-bento-accent" />
                     <div className="flex-1">
                       <p className="text-[10px] font-black uppercase leading-tight">{ach.title}</p>
                       <p className="text-[8px] opacity-40">{ach.desc}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-bento-line pt-4 md:pt-0 md:pl-4">
            <h4 className="mini-label mb-4">ASSESSMENT LOG</h4>
            <div className="space-y-3 overflow-y-auto max-h-[440px] pr-2">
              {employee.performanceReviews.length === 0 ? (
                <div className="p-8 text-center opacity-10"><AlertCircle size={24} className="mx-auto mb-2"/><p className="text-[8px] font-black">NO ENTRIES</p></div>
              ) : (
                employee.performanceReviews.map((rev, i) => (
                  <div key={i} className="p-3 border border-bento-line hover:border-bento-accent transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[8px] font-black opacity-30">{rev.date}</span>
                      <div className="flex space-x-0.5">
                        {[...Array(5)].map((_, j) => <Star key={j} size={6} className={j < rev.rating ? "text-bento-accent fill-bento-accent" : "text-slate-100"} />)}
                      </div>
                    </div>
                    <p className="text-[9px] italic opacity-60 leading-tight">{rev.feedback}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMobileCheckIn = () => (
    <div className="flex flex-col items-center min-h-[calc(100vh-140px)] pt-6 sm:hidden bg-slate-50/50">
      <div className="w-full flex items-center justify-between px-6 mb-8">
        <div>
          <h2 className="text-2xl font-black text-[#141414] tracking-tighter">Hey {employee.name.split(' ')[0]}</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Good Morning! Mark your attendance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onLogout}
            className="w-10 h-10 flex items-center justify-center text-red-500 bg-white shadow-sm border border-slate-100 rounded-xl active:scale-95 transition-transform"
          >
            <LogOut size={18} />
          </button>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-xl">
            <div className="w-full h-full bg-bento-ink text-white flex items-center justify-center font-bold text-lg">
              {employee.name.charAt(0)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center mt-4 h-32 justify-center">
        <AnimatePresence mode="wait">
          {sessionDuration ? (
            <motion.div 
              key="active-session"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="text-center"
            >
               <div className="text-[11px] font-black text-bento-accent uppercase tracking-[0.4em] mb-3 animate-pulse">Session Active</div>
               <div className="relative inline-block">
                  <div className="absolute -inset-8 bg-bento-accent/10 blur-3xl rounded-full animate-pulse"></div>
                  <h1 className="text-7xl sm:text-8xl font-black text-slate-900 tracking-tighter tabular-nums relative drop-shadow-2xl">{sessionDuration}</h1>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="clock"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <h1 className="text-6xl font-black text-slate-800 tracking-tighter opacity-90 drop-shadow-sm">{currentTime}</h1>
              <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em] mt-4">{dateDisplay}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 relative flex items-center justify-center w-[280px] h-[280px]">
        {/* Animated Ripples */}
        {todayAttendance?.sessions?.some(s => !s.checkOut) && (
          <>
            <div className="ripple bg-bento-accent/5" style={{ animationDelay: '0s' }}></div>
            <div className="ripple bg-bento-accent/5" style={{ animationDelay: '1.2s' }}></div>
            <div className="ripple bg-bento-accent/5" style={{ animationDelay: '2.4s' }}></div>
          </>
        )}
        
        <button 
          onClick={() => handleMarkAttendance(todayAttendance?.sessions?.some(s => !s.checkOut) ? 'out' : 'in')}
          className={cn(
            "neo-button w-40 h-40 flex flex-col items-center justify-center z-10 group",
            todayAttendance?.sessions?.some(s => !s.checkOut) ? "text-bento-accent border-bento-accent/50" : "text-slate-400"
          )}
        >
          <div className="mb-3 transition-transform group-active:scale-90">
            {todayAttendance?.sessions?.some(s => !s.checkOut) ? (
              <LogOut size={32} />
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-bento-accent/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Clock size={32} className="relative" />
              </div>
            )}
          </div>
          <span className="font-black text-[11px] uppercase tracking-widest">
            {todayAttendance?.sessions?.some(s => !s.checkOut) ? 'Check out' : 'Check in'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-3 w-full mt-auto px-4 pb-28 gap-3">
        <div className="neo-stat-card border border-transparent hover:border-slate-100 transition-colors">
          <div className="p-2.5 bg-white shadow-sm rounded-2xl mb-2 text-bento-accent border border-slate-50">
            <Clock size={18} />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Day Entry</span>
          <span className="text-xs font-black mt-1 text-slate-700">{todayAttendance?.timeIn || '--:--'}</span>
        </div>
        <div className="neo-stat-card border border-transparent hover:border-slate-100 transition-colors">
          <div className="p-2.5 bg-white shadow-sm rounded-2xl mb-2 text-bento-accent border border-slate-50">
             <LogOut size={18} />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Last Exit</span>
          <span className="text-xs font-black mt-1 text-slate-700">{todayAttendance?.timeOut || '--:--'}</span>
        </div>
        <div className="neo-stat-card border border-transparent hover:border-slate-100 transition-colors">
          <div className="p-2.5 bg-white shadow-sm rounded-2xl mb-2 text-bento-accent border border-slate-50">
            <CheckCircle2 size={18} />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Work H</span>
          <span className="text-xs font-black mt-1 text-slate-700">{calculateHoursWorked(todayAttendance)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10 max-w-full overflow-hidden min-h-screen pb-10 relative">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-12 h-12 border-4 border-bento-accent/20 border-t-bento-accent rounded-full animate-spin mb-4" />
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-bento-ink">Verifying Protocol...</p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">Authenticating physical site presence</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Desktop View */}
      <div className="hidden sm:block space-y-10">
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

      {/* Mobile View */}
      <div className="sm:hidden flex flex-col min-h-[calc(100vh-80px)]">
        <div className="flex-1 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {mobileTab === 'checkin' && renderMobileCheckIn()}
              {mobileTab === 'calendar' && <div className="p-4 pt-6">{renderAttendanceTab()}</div>}
              {mobileTab === 'summary' && <div className="p-4 pt-6">{renderPerformanceTab()}</div>}
              {mobileTab === 'leaves' && <div className="p-4 pt-6">{renderLeavesTab()}</div>}
              {mobileTab === 'profile' && <div className="p-4 pt-6">{renderProfileTab()}</div>}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="bottom-nav">
          {[
            { id: 'checkin', icon: Clock, label: 'Entry' },
            { id: 'calendar', icon: Calendar, label: 'Logs' },
            { id: 'summary', icon: TrendingUp, label: 'Stats' },
            { id: 'leaves', icon: Briefcase, label: 'Leaves' },
            { id: 'profile', icon: User, label: 'Me' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setMobileTab(item.id as any)} 
              className={cn(
                "nav-item", 
                mobileTab === item.id && "active"
              )}
            >
              {mobileTab === item.id && (
                <motion.div
                  layoutId="nav-bg"
                  className="absolute inset-0 bg-bento-accent/10 rounded-2xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon size={20} />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
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
