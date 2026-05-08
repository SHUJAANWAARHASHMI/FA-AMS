
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, AttendanceRecord, AttendanceStatus, LeaveRequest, SystemSettings } from '../../types';
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
  LogOut,
  Shield,
  Award,
  Cloud,
  CloudOff
} from 'lucide-react';
import { calculateLateHours, calculateOvertime, cn, getLocalDate, calculateAttendanceHours, calculateAttendanceMs, formatTimeDisplay } from '../../lib/utils';

interface EmployeePortalProps {
  employee: Employee;
  allEmployees: Employee[];
  systemSettings: SystemSettings;
  isSyncing: boolean;
  isOnline: boolean;
  isRealtimeActive: boolean;
  lastSynced: Date;
  onUpdateEmployees: (employees: Employee[]) => Promise<void>;
  onLogout: () => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({ 
  employee, 
  allEmployees, 
  systemSettings, 
  isSyncing,
  isOnline,
  isRealtimeActive,
  lastSynced,
  onUpdateEmployees, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves' | 'profile' | 'performance' | 'security'>('attendance');
  const [mobileTab, setMobileTab] = useState<'checkin' | 'calendar' | 'summary' | 'leaves' | 'profile' | 'security'>('checkin');
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

  // Precise Campus Locations adjusted for Karachi as per user request
  const CAMPUS_LOCATIONS: Record<string, { lat: number, lng: number, radius: number }> = {
    'Main Campus': { lat: 24.9265, lng: 67.1256, radius: 1000 },   // Gulistan-e-Johar Area, Karachi
    'Johar Campus': { lat: 24.9180, lng: 67.1320, radius: 1000 },  // Near Safari Park Area
    'Masjid Campus': { lat: 24.8607, lng: 67.0011, radius: 1000 }, // Saddar/City Area
    'Maktab Campus': { lat: 24.8900, lng: 67.0800, radius: 1000 }, // Bahadurabad Area
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
    
    let userLat: number | undefined;
    let userLng: number | undefined;
    let detectedCampus: string = employee.campus;
    let validCampusObj: any = null;

    // 1. GPS Verification Protocol (Single Geolocation Call)
    if (systemSettings.enforceLocation || navigator.geolocation) {
      try {
        if (!navigator.geolocation) {
          if (systemSettings.enforceLocation) {
            alert("CRITICAL: Geolocation is not supported by your browser version. Terminal access denied.");
            setIsLoading(false);
            return;
          }
        } else {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { 
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });

          userLat = position.coords.latitude;
          userLng = position.coords.longitude;
          
          // Find if user is within radius of ANY campus
          let minDistance = Infinity;

          Object.entries(CAMPUS_LOCATIONS).forEach(([name, config]) => {
            const d = getDistance(userLat!, userLng!, config.lat, config.lng);
            if (d <= config.radius) {
              if (!validCampusObj || d < minDistance) {
                validCampusObj = { name, distance: d, config };
                minDistance = d;
                detectedCampus = name;
              }
            }
          });
          
          if (systemSettings.enforceLocation && !validCampusObj) {
            const errorMsg = `SECURITY: Outside Campus Boundaries.\n\n` +
                            `Detected: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}\n\n` +
                            `HINT: You are currently not within 1000m of ANY campus location (Main, Johar, Masjid, or Maktab).\n\n` +
                            `Please ensure you are physically present at one of the campus sites and high-accuracy GPS is enabled.`;
                          
            alert(errorMsg);
            setIsLoading(false);
            return;
          }
        }
      } catch (err: any) {
        console.error('Geolocation error:', err);
        if (systemSettings.enforceLocation) {
          let errorMsg = "ERROR: Failed to verify location.";
          if (err.code === 1) errorMsg = "PERMISSIONS: Please enable GPS/Location access to mark attendance.";
          if (err.code === 3) errorMsg = "TIMEOUT: Location verification timed out. Please try again.";
          
          alert(errorMsg);
          setIsLoading(false);
          return;
        }
      }
    }

    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0') + ':' + 
                       now.getSeconds().toString().padStart(2, '0');
    
    const currentCoords = userLat && userLng ? { lat: userLat, lng: userLng } : undefined;
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
          sessions: [...sessions, { checkIn: timeString, checkOut: '', location: currentCoords, campusName: detectedCampus }],
          timeIn: record.timeIn || timeString,
          status: record.status === 'Present' ? status : record.status
        };
      } else {
        const newRecord: AttendanceRecord = {
          date: today,
          timeIn: timeString,
          timeOut: '',
          sessions: [{ checkIn: timeString, checkOut: '', location: currentCoords, campusName: detectedCampus }],
          lateHours,
          overtime: 0,
          onTime: lateHours === 0,
          status,
          remarks: remarks || 'Terminal Access'
        };
        updatedAttendance.push(newRecord);
      }
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
    }

    const updatedEmployees = allEmployees.map(emp => 
      emp.id === latestEmployee.id ? { ...emp, attendance: updatedAttendance } : emp
    );
    
    try {
      await onUpdateEmployees(updatedEmployees);
      setRemarks('');
    } catch (err) {
      console.error('Cloud Sync Failure:', err);
    } finally {
      setIsLoading(false);
    }
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
      
      const totalMs = calculateAttendanceMs(todayAttendance, nowVisible);

      const h = Math.floor(totalMs / 3600000);
      const m = Math.floor((totalMs % 3600000) / 60000);
      const s = Math.floor((totalMs % 60000) / 1000);
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    if (!todayAttendance.timeIn || todayAttendance.timeOut) return null;
    const diffMs = calculateAttendanceMs(todayAttendance, nowVisible);
    
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

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRequest: LeaveRequest = {
      id: Math.random().toString(36).substr(2, 9),
      ...leaveForm,
      status: 'Pending'
    };

    setIsLoading(true);
    const updatedEmployees = allEmployees.map(emp => 
      emp.id === employee.id ? { ...emp, leaveRequests: [...emp.leaveRequests, newRequest] } : emp
    );
    
    try {
      await onUpdateEmployees(updatedEmployees);
      setLeaveForm({ type: 'Annual', from: today, to: today, reason: '' });
    } catch (err) {
      console.error('Leave Request Sync Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newUsername: employee.username,
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Validate Current Password
    if (securityForm.currentPassword !== employee.password) {
      alert('SECURITY: Current password verification failed.');
      return;
    }

    // 2. Validate New Password if provided
    if (securityForm.newPassword) {
      if (securityForm.newPassword !== securityForm.confirmPassword) {
        alert('VALIDATION: New passwords do not match.');
        return;
      }
      if (securityForm.newPassword.length < 6) {
        alert('VALIDATION: Security protocols require min 6 characters.');
        return;
      }
    }

    // 3. Validate Username
    if (!securityForm.newUsername || securityForm.newUsername.length < 3) {
      alert('VALIDATION: User ID must be at least 3 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const { supabaseService } = await import('../../services/supabaseService');
      
      // Update DB
      await supabaseService.updateEmployeeCredentials(
        employee.id, 
        securityForm.newUsername, 
        securityForm.newPassword || undefined
      );

      // Record Audit locally for instant feedback if needed, but App.tsx handles refresh
      const updatedEmployees = allEmployees.map(emp => 
        emp.id === employee.id 
          ? { 
              ...emp, 
              username: securityForm.newUsername, 
              password: securityForm.newPassword || emp.password 
            } 
          : emp
      );
      
      onUpdateEmployees(updatedEmployees);
      setSecurityForm({ ...securityForm, currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error('Security Update Failed:', err);
      alert('SYSTEM ERROR: Could not sync security parameters.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSecurityTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[24px] p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-border max-w-2xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-error/10 text-error rounded-2xl flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-primary tracking-tight">Security Protocol</h3>
            <p className="text-[10px] font-bold text-text-gray uppercase tracking-widest mt-1">Credential Management & Access Control</p>
          </div>
        </div>

        <form onSubmit={handleUpdateSecurity} className="space-y-6">
          <div className="space-y-4">
            <div className="bg-bg p-4 rounded-xl border border-border">
              <label className="mini-label block mb-2 text-error">Identity Verification Required</label>
              <input 
                type="password"
                required
                placeholder="Enter Current Password"
                className="w-full h-12 px-4 bg-white border border-border text-xs font-bold uppercase rounded-xl outline-none focus:ring-4 focus:ring-error/10 transition-all"
                value={securityForm.currentPassword}
                onChange={e => setSecurityForm({...securityForm, currentPassword: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 opacity-60">
                <label className="mini-label block px-1 flex items-center gap-1.5">
                  <Lock size={10} className="text-error" />
                  Network User ID (Locked)
                </label>
                <input 
                  type="text"
                  readOnly
                  className="w-full h-12 px-4 bg-accent/5 border border-border text-xs font-bold lowercase rounded-xl cursor-not-allowed outline-none"
                  value={securityForm.newUsername}
                />
              </div>
              <div className="space-y-2 opacity-50">
                <label className="mini-label block px-1">Employee UUID (Immutable)</label>
                <input 
                  type="text"
                  disabled
                  className="w-full h-12 px-4 bg-accent/5 border border-border text-[10px] font-mono rounded-xl cursor-not-allowed"
                  value={employee.id}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <label className="mini-label block px-1">New Terminal Password</label>
                <input 
                  type="password"
                  placeholder="Keep blank to remain same"
                  className="w-full h-12 px-4 bg-white border border-border text-xs font-bold rounded-xl outline-none focus:ring-4 focus:ring-secondary/10"
                  value={securityForm.newPassword}
                  onChange={e => setSecurityForm({...securityForm, newPassword: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="mini-label block px-1">Confirm Protocol</label>
                <input 
                  type="password"
                  placeholder="Re-enter new password"
                  className="w-full h-12 px-4 bg-white border border-border text-xs font-bold rounded-xl outline-none focus:ring-4 focus:ring-secondary/10"
                  value={securityForm.confirmPassword}
                  onChange={e => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-14 bg-primary text-white rounded-2xl flex items-center justify-center space-x-3 text-sm font-extrabold uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>Update Security Registry</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-accent/10 p-4 rounded-xl border border-border border-dashed">
            <div className="flex items-start space-x-3 text-text-gray">
              <Shield size={14} className="mt-0.5 shrink-0" />
              <p className="text-[9px] font-bold uppercase leading-relaxed tracking-wider">
                Encryption Layer: SHA-256 Symmetric Field Validation. All terminal modifications are logged to the Central Intelligence Registry with User ID, Timestamp, and Client IP.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  const renderAttendanceTab = () => {
    const activeSession = todayAttendance?.sessions?.find(s => !s.checkOut);
    
    return (
      <div className="animate-in fade-in duration-500 overflow-hidden">
      <div className="bg-white rounded-[24px] p-4 sm:p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-border grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 space-y-4 border-b md:border-b-0 md:border-r border-border pb-4 md:pb-0 md:pr-6">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 sm:p-2 bg-primary text-white border border-secondary">
                <Clock size={16} />
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-tight">Terminal Access</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              {isSyncing && <Zap size={12} className="text-secondary animate-pulse" />}
              {isRealtimeActive ? (
                <div className="flex items-center space-x-1 text-emerald-500">
                  <Cloud size={14} className="animate-pulse" />
                  <span className="text-[7px] font-black uppercase">Live</span>
                </div>
              ) : isOnline ? (
                <Cloud size={14} className="text-emerald-500" />
              ) : (
                <CloudOff size={14} className="text-error" />
              )}
            </div>
          </div>

          {sessionDuration && (
            <div className="py-6 sm:py-10 border-b border-border mb-4 sm:mb-6 text-center">
              <div className="inline-flex flex-col items-center justify-center w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-secondary/10 relative shadow-2xl shadow-primary/5">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[9px] sm:text-[10px] font-extrabold text-secondary uppercase tracking-[0.2em] mb-1">Active</span>
                  <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-primary drop-shadow-sm">{sessionDuration}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-accent/30 p-2 border border-border rounded-lg">
              <span className="mini-label">In</span>
              <p className="text-xs sm:text-sm font-bold text-primary">{todayAttendance?.timeIn || '--:--'}</p>
            </div>
            <div className="bg-accent/30 p-2 border border-border rounded-lg">
              <span className="mini-label">Out</span>
              <p className="text-xs sm:text-sm font-bold text-primary">{todayAttendance?.timeOut || '--:--'}</p>
            </div>
          </div>

          <div className="space-y-2">
            <textarea 
              placeholder="LOG MESSAGE..."
              className="w-full p-2 bg-white border border-border text-[9px] font-bold uppercase resize-none h-16 rounded-lg focus:ring-2 focus:ring-secondary/10 outline-none"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
            {activeSession && (
              <div className="bg-secondary/5 border border-secondary/20 p-4 rounded-xl text-center">
                <p className="text-[10px] font-extrabold text-secondary uppercase tracking-widest">SESSION IN PROGRESS</p>
                <div className="mt-2 flex items-center justify-center space-x-2">
                   <Clock size={16} className="text-secondary" />
                   <span className="text-2xl font-extrabold text-primary tracking-tight">
                     {formatTimeDisplay(calculateAttendanceMs(todayAttendance, nowVisible) / 3600000, true)}
                   </span>
                </div>
                <p className="text-[8px] font-bold text-text-gray mt-2 uppercase">SITE: <span className="text-primary">{activeSession.campusName || 'DETECTING...'}</span></p>
              </div>
            )}

            <div className="flex gap-2">
              <button 
                onClick={() => handleMarkAttendance('in')}
                disabled={isLoading || !!(todayAttendance?.sessions?.some(s => !s.checkOut))}
                className="flex-1 bg-primary text-white py-3 rounded-xl shadow-lg shadow-primary/20 text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-20 transition-all active:scale-95 flex items-center justify-center min-h-[44px]"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'CLOCK IN'}
              </button>
              <button 
                onClick={() => handleMarkAttendance('out')}
                disabled={isLoading || !(todayAttendance?.sessions?.some(s => !s.checkOut))}
                className="flex-1 bg-secondary text-white py-3 rounded-xl shadow-lg shadow-secondary/20 text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-20 transition-all active:scale-95 flex items-center justify-center min-h-[44px]"
              >
                {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'CLOCK OUT'}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h4 className="mini-label mb-2">Session History (Today)</h4>
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
              {todayAttendance?.sessions && todayAttendance.sessions.length > 0 ? (
                todayAttendance.sessions.map((session, idx) => (
                  <div key={idx} className="bg-accent/10 p-3 border border-border rounded-lg text-[9px]">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] font-extrabold text-text-gray">SESSION #{idx + 1}</span>
                      {!session.checkOut && (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-text-dark"><span>IN:</span><span className="font-extrabold">{session.checkIn}</span></div>
                    <div className="flex justify-between text-text-dark"><span>OUT:</span><span className="font-extrabold">{session.checkOut || 'PENDING'}</span></div>
                  </div>
                ))
              ) : (
                <div className="bg-bg p-4 border border-dashed border-border text-center rounded-lg">
                  <p className="text-[8px] font-bold text-text-gray italic">NO ACTIVE REQUISITIONS</p>
                </div>
              )}
              {todayAttendance && (
                <div className="bg-primary text-white p-3 rounded-lg text-[10px] font-extrabold flex justify-between">
                  <span>TOTAL WORKED</span>
                  <span>{calculateHoursWorked(todayAttendance)} H</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-extrabold text-primary tracking-tight uppercase">Temporal Log</h3>
            <div className="flex items-center space-x-3 bg-white p-1 rounded-xl border border-border shadow-sm">
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} 
                className="p-1.5 hover:bg-accent/50 rounded-lg transition-colors text-primary"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-extrabold text-primary w-24 text-center">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} 
                className="p-1.5 hover:bg-accent/50 rounded-lg transition-colors text-primary"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-3">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => <div key={`${d}-${i}`} className="text-center text-[10px] font-extrabold text-text-gray tracking-widest">{d}</div>)}
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
                  "aspect-square flex flex-col items-center justify-center text-xs font-bold rounded-2xl border border-border relative group cursor-pointer transition-all hover:border-secondary/30 hover:scale-105 shadow-sm",
                  att?.status === 'Present' && "bg-emerald-50 text-emerald-600 border-emerald-100",
                  att?.status === 'Late' && "bg-orange-50 text-orange-600 border-orange-100",
                  att?.status === 'Absent' && "bg-error/5 text-error border-error/10",
                  att?.status === 'Leave' && "bg-primary/5 text-primary border-primary/10",
                  dateStr === today && "border-secondary bg-accent/20 text-secondary ring-2 ring-secondary/10"
                )}>
                  <span>{i + 1}</span>
                  {att && (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1", 
                      att.status === 'Present' ? "bg-emerald-500" : 
                      att.status === 'Late' ? "bg-orange-500" : "bg-error"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    );
  };

  const LegendItem = ({ color, text }: any) => (
    <div className="flex items-center space-x-1.5 sm:space-x-2">
      <div className={cn("w-2 h-2", color)}></div>
      <span className="text-[8px] sm:text-[9px] font-bold uppercase text-bento-ink opacity-40 tracking-widest">{text}</span>
    </div>
  );

  const renderLeavesTab = () => (
    <div className="animate-in fade-in duration-700">
      <div className="bg-white rounded-[24px] p-4 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-border grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-10">
        <div className="md:col-span-4 space-y-4 sm:space-y-6 md:border-r border-border md:pr-10">
          <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-tight text-primary">Balance Details</h3>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <BalanceCard label="Annual" total={employee.leaves.annual.total} used={employee.leaves.annual.used} accent />
            <BalanceCard label="Casual" total={employee.leaves.casual.total} used={employee.leaves.casual.used} />
            <BalanceCard label="Medical" total={employee.leaves.medical.total} used={employee.leaves.medical.used} />
          </div>
        </div>

        <div className="md:col-span-8 flex flex-col md:flex-row gap-10">
          <div className="flex-1 space-y-4">
            <h3 className="mini-label">Quick Register</h3>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <select 
                className="w-full h-12 px-4 bg-accent/20 border border-border text-xs font-bold uppercase rounded-xl outline-none focus:ring-4 focus:ring-secondary/10 transition-all"
                value={leaveForm.type}
                onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value as any})}
              >
                <option value="Annual">Annual Reserve</option>
                <option value="Casual">Casual Allowance</option>
                <option value="Medical">Medical Hardship</option>
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="h-12 px-4 border border-border text-xs font-bold uppercase rounded-xl" value={leaveForm.from} onChange={e => setLeaveForm({...leaveForm, from: e.target.value})} />
                <input type="date" className="h-12 px-4 border border-border text-xs font-bold uppercase rounded-xl" value={leaveForm.to} onChange={e => setLeaveForm({...leaveForm, to: e.target.value})} />
              </div>
              <textarea 
                placeholder="REASON FOR LEAVE..."
                className="w-full p-4 border border-border text-xs font-bold uppercase resize-none h-32 rounded-xl outline-none focus:ring-4 focus:ring-secondary/10"
                value={leaveForm.reason}
                onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
              />
              <button type="submit" className="btn-primary w-full">
                SUBMIT PROTOCOL
              </button>
            </form>
          </div>

          <div className="flex-1 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-10">
            <h3 className="mini-label mb-6">Audit Registry</h3>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
              {employee.leaveRequests.length === 0 ? (
                <div className="py-20 text-center opacity-20"><p className="text-[10px] font-extrabold italic uppercase">NO ENTRIES FOUND</p></div>
              ) : (
                employee.leaveRequests.map((req, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-border flex justify-between items-center bg-accent/10 hover:bg-accent/20 transition-all shadow-sm">
                    <div>
                      <p className="text-xs font-extrabold uppercase text-primary tracking-tight">{req.type}</p>
                      <p className="text-[10px] text-text-gray font-bold mt-1 uppercase">{req.from} - {req.to}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-extrabold px-3 py-1 rounded-full border",
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
    const percentage = (used / total) * 100;
    return (
      <div className={cn(
        "bg-white border border-border p-5 rounded-2xl flex flex-col justify-between shadow-sm transition-all hover:bg-accent/5 hover:border-secondary/30", 
        accent && "bg-secondary/[0.02] border-secondary/20"
      )}>
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">{label}</span>
          <span className="text-[10px] font-bold text-text-gray">{used} / {total}</span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-extrabold text-primary tracking-tight">{available}</span>
          <span className="text-[10px] font-bold text-text-gray uppercase tracking-widest">Available</span>
        </div>
        <div className="mt-4 h-2 w-full bg-bg rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className={cn("h-full rounded-full", accent ? 'bg-secondary' : 'bg-primary')} 
          />
        </div>
      </div>
    );
  };

  const renderProfileTab = () => (
    <div className="animate-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white rounded-[24px] p-5 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-border flex flex-col md:flex-row gap-6 sm:gap-10">
        <div className="md:w-64 space-y-4">
          <div className="aspect-square bg-primary text-white flex items-center justify-center text-4xl sm:text-5xl font-extrabold rounded-2xl sm:rounded-3xl border-4 border-secondary/20 shadow-xl shadow-primary/10 w-24 h-24 sm:w-auto sm:h-auto mx-auto md:mx-0">
            {employee.name.charAt(0)}
          </div>
          <div className="bg-accent/20 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border text-center">
            <h3 className="text-base sm:text-lg font-extrabold text-primary tracking-tight">{employee.name}</h3>
            <span className="mini-label">{employee.id}</span>
          </div>
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <ProfileInfo label="Role" value={(employee?.designation || 'N/A').toUpperCase()} />
            <ProfileInfo label="Dept" value={(employee?.department || 'N/A').toUpperCase()} />
            <ProfileInfo label="Campus" value={(employee?.campus || 'N/A').toUpperCase()} />
            <ProfileInfo label="Shift" value={`${employee.shiftStart} - ${employee.shiftEnd}`} />
            <ProfileInfo label="User ID" value={employee.username} />
            <ProfileInfo label="Security" value="SECURE ACCESS" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-warning/5 p-4 rounded-xl border border-warning/10 flex items-start space-x-3 flex-1">
              <Lock size={16} className="text-warning mt-0.5 shrink-0" />
              <p className="text-[9px] sm:text-[10px] font-bold text-warning uppercase tracking-widest leading-relaxed">
                Core profile fields are locked by Central Registry. Contact administrative headquarters for protocol overrides.
              </p>
            </div>
            <button 
              onClick={() => {
                setActiveTab('security');
                setMobileTab('security');
              }}
              className="bg-primary text-white px-6 py-4 rounded-xl flex items-center justify-center space-x-3 text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/10"
            >
              <Shield size={16} />
              <span>Security Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ProfileInfo = ({ label, value }: any) => (
    <div className="bg-white p-3 sm:p-5 border border-border rounded-xl sm:rounded-2xl flex flex-col justify-center shadow-sm hover:border-secondary/20 transition-all">
      <span className="mini-label mb-1 text-[8px] sm:text-[10px]">{label}</span>
      <p className="font-extrabold text-primary tracking-tight text-xs sm:text-sm truncate">{value}</p>
    </div>
  );

  const renderPerformanceTab = () => {
    const records = employee.attendance.filter(r => r.date.startsWith(currentMonth.toISOString().slice(0, 7)));
    return (
      <div className="animate-in fade-in duration-700 h-full">
        <div className="bg-white rounded-[24px] p-4 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-border grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
          <div className="md:col-span-8 space-y-4 sm:space-y-6">
            <div className="bg-primary p-4 sm:p-6 rounded-[20px] sm:rounded-3xl text-white flex justify-between items-center shadow-xl shadow-primary/20">
              <div className="max-w-[60%]">
                <h3 className="text-base sm:text-2xl font-extrabold italic tracking-tight uppercase">Operational Elite</h3>
                <p className="text-[8px] sm:mini-label text-white/50 mt-1 uppercase">Top 5% Global Index</p>
              </div>
              <div className="text-right">
                <p className="text-3xl sm:text-5xl font-extrabold text-secondary leading-none">{attendanceStats.score}%</p>
                <p className="text-[8px] sm:mini-label text-white/50 mt-1 sm:mt-2 uppercase">Compliance</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="bg-white border border-border p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm group hover:border-secondary/30 transition-all">
                <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3 text-secondary"><Zap size={12} className="sm:w-3.5 sm:h-3.5" /><span className="text-[7px] sm:mini-label">AGILITY</span></div>
                <p className="text-[10px] sm:text-xl font-extrabold text-primary">OPTIMIZED</p>
              </div>
              <div className="bg-white border border-border p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm group hover:border-secondary/30 transition-all">
                <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3 text-primary"><Target size={12} className="sm:w-3.5 sm:h-3.5" /><span className="text-[7px] sm:mini-label">ACCURACY</span></div>
                <p className="text-[10px] sm:text-xl font-extrabold text-primary">94.8%</p>
              </div>
              <div className="bg-white border border-border p-3 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm group hover:border-secondary/30 transition-all">
                <div className="flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3 text-warning"><TrendingUp size={12} className="sm:w-3.5 sm:h-3.5" /><span className="text-[7px] sm:mini-label">MOMENTUM</span></div>
                <p className="text-[10px] sm:text-xl font-extrabold text-primary">+12.4%</p>
              </div>
            </div>

            <div className="bg-white border border-border p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm h-[240px] sm:h-[280px]">
               <h4 className="mini-label mb-3 sm:mb-4">ACHIEVEMENTS GALLERY</h4>
               <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-[160px] sm:max-h-[200px] pr-1 sm:pr-2">
                 {[
                   { title: 'EARLY BIRD PROTOCOL', date: 'Oct 2025', desc: '100% Punctuality cycle' },
                   { title: 'SECURITY STAR', date: 'Sep 2025', desc: 'Verified GPS certificate' }
                 ].map((ach, i) => (
                   <div key={i} className="bg-accent/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border flex items-center space-x-3 sm:space-x-4">
                     <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm text-secondary">
                        <Star size={14} className="sm:w-[18px] sm:h-[18px]" fill="currentColor" />
                     </div>
                     <div className="flex-1">
                       <p className="text-[9px] sm:text-xs font-extrabold text-primary uppercase tracking-tight leading-tight">{ach.title}</p>
                       <p className="text-[8px] sm:text-[10px] font-bold text-text-gray mt-0.5 sm:mt-1">{ach.desc}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8">
            <h4 className="mini-label mb-6">ASSESSMENT LOG</h4>
            <div className="space-y-4 overflow-y-auto max-h-[480px] pr-2">
              {employee.performanceReviews.length === 0 ? (
                <div className="p-12 text-center opacity-20 flex flex-col items-center">
                  <AlertCircle size={32} className="text-primary mb-3"/>
                  <p className="text-[10px] font-extrabold uppercase">NO ASSESSMENT RECORDS</p>
                </div>
              ) : (
                employee.performanceReviews.map((rev, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-border bg-white hover:border-secondary/30 transition-all shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-extrabold text-text-gray">{rev.date}</span>
                      <div className="flex space-x-0.5">
                        {[...Array(5)].map((_, j) => <Star key={j} size={8} className={j < rev.rating ? "text-secondary fill-secondary" : "text-bg"} />)}
                      </div>
                    </div>
                    <p className="text-xs font-bold text-primary italic leading-relaxed">"{rev.feedback}"</p>
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
    <div className="flex flex-col min-h-[calc(100vh-160px)] px-4 pt-4 sm:hidden">
      {/* Header Profile Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary text-white rounded-[16px] flex items-center justify-center font-bold text-base shadow-lg rotate-3">
            {employee.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-primary tracking-tight leading-none">Salam, {employee.name.split(' ')[0]}</h2>
            <div className="flex items-center space-x-2 mt-0.5">
              <p className="text-[8px] font-bold text-text-gray uppercase tracking-widest opacity-70 italic">Shift: {employee.shiftStart} - {employee.shiftEnd}</p>
              <div className="w-[1px] h-2 bg-border" />
              <div className="flex items-center space-x-1">
                {isSyncing ? (
                  <div className="flex items-center space-x-1 text-secondary animate-pulse">
                    <Zap size={10} className="fill-secondary" />
                    <span className="text-[7px] font-black uppercase">Syncing</span>
                  </div>
                ) : isRealtimeActive ? (
                  <div className="flex items-center space-x-1 text-emerald-600">
                    <Cloud size={10} className="animate-pulse" />
                    <span className="text-[7px] font-black uppercase">Connected</span>
                  </div>
                ) : isOnline ? (
                  <div className="flex items-center space-x-1 text-emerald-600">
                    <Cloud size={10} />
                    <span className="text-[7px] font-black uppercase">Cloud Ready</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-error">
                    <CloudOff size={10} />
                    <span className="text-[7px] font-black uppercase">Offline</span>
                  </div>
                )}
                <div className="w-[1px] h-2 bg-border" />
                <span className="text-[7px] font-bold text-text-gray/40 uppercase">
                  Updated: {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-9 h-9 flex items-center justify-center text-error bg-white shadow-sm border border-border rounded-xl active:scale-95 transition-all"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Main Status & Clock Card */}
      <div className="bg-white rounded-[24px] p-5 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-border relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 px-2 py-0.5 bg-primary/5 rounded-full border border-primary/10">
              <div className={cn("w-1.5 h-1.5 rounded-full", todayAttendance?.sessions?.some(s => !s.checkOut) ? "bg-emerald-500 animate-pulse" : "bg-text-gray/30")} />
              <span className="text-[8px] font-extrabold text-primary uppercase tracking-widest">
                {todayAttendance?.sessions?.some(s => !s.checkOut) ? 'ON AIR' : 'OFFLINE'}
              </span>
            </div>
            <span className="text-[7px] font-bold text-text-gray uppercase tracking-widest bg-bg px-2 py-1 rounded-md">{dateDisplay}</span>
          </div>

          <div className="flex flex-col items-center py-2">
            <AnimatePresence mode="wait">
              {sessionDuration ? (
                <motion.div 
                  key="duration"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <h1 className="text-4xl font-extrabold text-primary tracking-tighter tabular-nums mb-1">{sessionDuration}</h1>
                  <p className="text-[8px] font-bold text-text-gray uppercase tracking-widest">Active Duration</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="current-time"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <h1 className="text-3xl font-extrabold text-primary tracking-tighter tabular-nums mb-1 opacity-10">{currentTime.split(' ')[0]}</h1>
                  <p className="text-[8px] font-bold text-text-gray uppercase tracking-widest">Awaiting Verification</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-4 flex flex-col space-y-3">
             <div className="flex space-x-2">
                <button 
                  onClick={() => handleMarkAttendance('in')}
                  disabled={!!(todayAttendance?.sessions?.some(s => !s.checkOut))}
                  className="flex-1 h-12 bg-primary text-white rounded-xl flex items-center justify-center space-x-2 text-[9px] font-extrabold uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-20"
                >
                  <Clock size={14} />
                  <span>Clock In</span>
                </button>
                <button 
                  onClick={() => handleMarkAttendance('out')}
                  disabled={!(todayAttendance?.sessions?.some(s => !s.checkOut))}
                  className="flex-1 h-12 bg-secondary text-white rounded-xl flex items-center justify-center space-x-2 text-[9px] font-extrabold uppercase tracking-widest shadow-lg shadow-secondary/20 active:scale-95 transition-all disabled:opacity-20"
                >
                  <LogOut size={14} />
                  <span>Clock Out</span>
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Grid Stats - Fit to Screen */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-border flex flex-col justify-between h-28">
           <div className="flex items-center space-x-2 text-primary opacity-40">
             <Clock size={12} />
             <span className="text-[8px] font-extrabold uppercase tracking-widest">Checkpoint</span>
           </div>
           <div>
             <div className="text-xl font-extrabold text-primary tabular-nums">{todayAttendance?.timeIn || '--:--'}</div>
             <p className="text-[8px] font-bold text-text-gray mt-1 uppercase">Today's Start</p>
           </div>
        </div>
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-border flex flex-col justify-between h-28">
           <div className="flex items-center space-x-2 text-secondary opacity-60">
             <TrendingUp size={12} />
             <span className="text-[8px] font-extrabold uppercase tracking-widest">Efficacy</span>
           </div>
           <div>
             <div className="text-xl font-extrabold text-primary tabular-nums">{calculateHoursWorked(todayAttendance)}h</div>
             <p className="text-[8px] font-bold text-text-gray mt-1 uppercase">Operational Hrs</p>
           </div>
        </div>
      </div>

      {/* Performance Hub - Compact Grid */}
      <div className="mt-6">
        <h3 className="mini-label mb-3">Intelligence Hub</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Score', value: `${attendanceStats.score}%`, icon: Target, color: 'text-emerald-500' },
            { label: 'Rank', value: 'ELITE', icon: Award, color: 'text-secondary' },
            { label: 'Growth', value: '+12%', icon: TrendingUp, color: 'text-orange-500' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-3 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
              <item.icon size={14} className={cn("mb-1", item.color)} />
              <span className="text-[9px] font-extrabold text-primary leading-none mb-1">{item.value}</span>
              <span className="text-[7px] font-bold text-text-gray uppercase tracking-tighter">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Location Badge */}
      <div className="mt-8 flex items-center justify-between bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100">
        <div className="flex items-center space-x-2">
          <Shield size={14} className="text-emerald-600" />
          <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-widest">Site Verified</span>
        </div>
        <span className="text-[9px] font-black text-emerald-800 uppercase">{employee.campus.split(' ')[0]}</span>
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
        <div className="tabs-container sticky top-4 z-[30] mx-auto w-full sm:w-fit bg-secondary border border-border shadow-2xl rounded-2xl overflow-hidden p-1.5 flex items-center space-x-1">
          <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={Clock} label="Terminal" />
          <TabButton active={activeTab === 'leaves'} onClick={() => setActiveTab('leaves')} icon={Briefcase} label="Leaves" />
          <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={User} label="Profile" />
          <TabButton active={activeTab === 'performance'} onClick={() => setActiveTab('performance')} icon={FileText} label="Reviews" />
          <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={Lock} label="Security" />
          <div className="w-[1px] h-4 bg-white/20 mx-2" />
          <button 
            onClick={onLogout}
            className="flex items-center space-x-2 text-error hover:bg-error/10 transition-all rounded-xl px-4 py-2 flex-shrink-0"
          >
            <LogOut size={16} className="shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Logout</span>
          </button>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
          {activeTab === 'attendance' && renderAttendanceTab()}
          {activeTab === 'leaves' && renderLeavesTab()}
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'performance' && renderPerformanceTab()}
          {activeTab === 'security' && renderSecurityTab()}
        </div>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden flex flex-col min-h-[calc(100vh-80px)]">
        <div className="flex-1 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {mobileTab === 'checkin' && renderMobileCheckIn()}
              {mobileTab === 'calendar' && <div className="p-5">{renderAttendanceTab()}</div>}
              {mobileTab === 'summary' && <div className="p-5">{renderPerformanceTab()}</div>}
              {mobileTab === 'leaves' && <div className="p-5">{renderLeavesTab()}</div>}
              {mobileTab === 'profile' && <div className="p-5">{renderProfileTab()}</div>}
              {mobileTab === 'security' && <div className="p-5">{renderSecurityTab()}</div>}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="fixed bottom-6 left-6 right-6 h-20 bg-secondary rounded-[24px] shadow-2xl border border-white/5 flex items-center justify-around px-4 z-50">
          {[
            { id: 'checkin', icon: Clock, label: 'Entry' },
            { id: 'calendar', icon: Calendar, label: 'Logs' },
            { id: 'summary', icon: TrendingUp, label: 'Stats' },
            { id: 'leaves', icon: Briefcase, label: 'Leaves' },
            { id: 'security', icon: Lock, label: 'Lock' },
            { id: 'profile', icon: User, label: 'Me' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setMobileTab(item.id as any)} 
              className={cn(
                "relative flex flex-col items-center justify-center w-14 h-14 transition-all duration-300 rounded-xl", 
                mobileTab === item.id ? "text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              {mobileTab === item.id && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute inset-0 bg-primary/20 border border-primary/30 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <item.icon size={20} className={cn("relative z-10 transition-transform", mobileTab === item.id && "scale-110")} />
              <span className="text-[8px] font-bold uppercase tracking-widest mt-1 relative z-10">{item.label}</span>
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
      "flex items-center space-x-2 transition-all duration-300 flex-shrink-0 px-6 py-2.5 rounded-xl",
      active ? "bg-primary text-white shadow-lg shadow-primary/20 font-extrabold" : "text-white/50 hover:text-white/80 hover:bg-white/5"
    )}
  >
    <Icon size={14} className="shrink-0" />
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);
