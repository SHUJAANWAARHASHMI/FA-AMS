
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, AttendanceRecord, AttendanceStatus, LeaveRequest, SystemSettings } from '../../types';
import { calculateLateHours, calculateOvertime, cn, getLocalDate, calculateAttendanceHours, calculateAttendanceMs, formatTimeDisplay } from '../../lib/utils';
import { formatTo12h } from '../../lib/timeUtils';
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
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const [locationError, setLocationError] = useState<{ code: number; message: string; hint: string } | null>(null);

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

  // Precise Campus Locations updated based on user provided links and reported location
  // Set to 500m radius as requested by user.
  const CAMPUS_LOCATIONS: Record<string, { lat: number, lng: number, radius: number }> = {
    'Main Campus': { lat: 24.9265, lng: 67.1256, radius: 500 },   // Block 13-C, Gulistan-e-Johar
    'Johar Campus': { lat: 24.9308, lng: 67.1247, radius: 500 },  // Block 14, Gulistan-e-Johar
    'Masjid Campus': { lat: 24.8988, lng: 67.0872, radius: 500 }, // Reported address area
    'Maktab Campus': { lat: 24.9265, lng: 67.1256, radius: 500 }, // Often same/adjacent to Main Campus
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
    setLoadingMessage('Verifying GPS...');
    setLocationError(null);
    
    let userLat: number | undefined;
    let userLng: number | undefined;
    let userAccuracy: number | undefined;
    let detectedCampus: string = employee.campus;
    let validCampusObj: any = null;

    // 1. GPS Verification Protocol with Enhanced Mobile Robustness
    if (systemSettings.enforceLocation) {
      try {
        const isWebView = /wv|WebView|Android.*(Version\/[\d.]+)/.test(navigator.userAgent);
        
        if (!navigator.geolocation) {
          alert("CRITICAL: Geolocation is not supported by this device. Terminal access denied.");
          setIsLoading(false);
          return;
        }

        const getPosition = (highAccuracy: boolean, timeout: number, maxAge: number): Promise<GeolocationPosition> => {
          return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: highAccuracy,
              timeout: timeout,
              maximumAge: maxAge
            });
          });
        };

        let position: GeolocationPosition | null = null;
        
        try {
          // Tiered Attempt 1: Fast check for cached location (very fast, allows 10 min old fix)
          setLoadingMessage('Checking Cache...');
          position = await getPosition(false, 3000, 600000);
        } catch (e) {
          console.warn("No recent cached location found.");
        }

        if (!position) {
          try {
            setLoadingMessage('Waking GPS (High)...');
            // Tiered Attempt 2: Fresh High Accuracy fix
            // Give WebViews more time as they can be sluggish on first lock
            position = await getPosition(true, isWebView ? 25000 : 15000, 0);
          } catch (e) {
            console.warn("High accuracy timeout, trying balanced fix...");
            setLoadingMessage('Switching Signal (Low)...');
            // Tiered Attempt 3: Fresh Balanced Accuracy (most stable for mobile indoors)
            position = await getPosition(false, 30000, 60000);
          }
        }

        if (!position && type === 'out') {
          // Attempt 4: Clock-out fallback for weak signals (last resort for APKs)
          try {
            setLoadingMessage('Finalizing Signal...');
            position = await getPosition(false, 15000, 3600000); // 1-hour old cache allowed for Clock Out
          } catch (e) {}
        }

        if (!position) throw new Error("GEOLOCATION_UNAVAILABLE");
        
        setLoadingMessage('Syncing Terminal...');

        userLat = position.coords.latitude;
        userLng = position.coords.longitude;
        userAccuracy = position.coords.accuracy;
        
        // Find if user is within radius of ANY campus
        let minDistance = Infinity;
        let nearestCampusName = '';

        Object.entries(CAMPUS_LOCATIONS).forEach(([name, config]) => {
          const d = getDistance(userLat!, userLng!, config.lat, config.lng);
          
          // Track overall nearest regardless of radius
          if (d < minDistance) {
            minDistance = d;
            nearestCampusName = name;
          }

          if (d <= config.radius) {
            if (!validCampusObj || d < (validCampusObj.distance || Infinity)) {
              validCampusObj = { name, distance: d, config };
              detectedCampus = name;
            }
          }
        });
        
        if (!validCampusObj) {
          const distances = Object.entries(CAMPUS_LOCATIONS).map(([name, config]) => {
            const d = getDistance(userLat!, userLng!, config.lat, config.lng);
            return `${name}: ${Math.round(d)}m`;
          }).join('\n');

          const errorMsg = `LOCATION SECURITY PROTOCOL ERROR\n\n` +
                          `Detected Coords: ${userLat.toFixed(6)}, ${userLng.toFixed(6)}\n` +
                          `Signal Accuracy: ±${Math.round(userAccuracy || 0)}m\n\n` +
                          `DISTANCE TO CAMPUSES:\n${distances}\n\n` +
                          `PROTOCOL: You must be within 500m of ANY campus to mark attendance.\n\n` +
                          `HINT: If you are at a campus but see large distances above, your device's GPS signal is weak or inaccurate. Try standing near a window or outdoors.`;
                        
          alert(errorMsg);
          setLocationError({ 
            code: 0, 
            message: 'Campus Boundary Error', 
            hint: `You are too far from the campus zones. Nearest detected distance was ${Math.round(minDistance)}m. Distances: ${distances.replace(/\n/g, ', ')}` 
          });
          setIsLoading(false);
          return;
        }
      } catch (err: any) {
        console.error('Geolocation error:', err);
        const isWebView = /wv|WebView|Android.*(Version\/[\d.]+)/.test(navigator.userAgent);
        let errorHint = "Please check your device GPS settings and ensure 'High Accuracy' mode is on.";
        
        if (err.code === 1) {
          errorHint = "PERMISSION DENIED: In your phone settings, go to Apps -> [This App] -> Permissions and allow 'Location'.";
          if (isWebView) {
            errorHint = "PERMISSION DENIED: Your APK wrapper is blocking location. \n\n1. Check phone settings -> Apps -> [This App] -> Permissions.\n\n2. If not found there, the APK was built without 'ACCESS_FINE_LOCATION' permission in its manifest.";
          }
        }
        if (err.code === 2) errorHint = "POSITION UNAVAILABLE: Your device cannot get a GPS lock. Try going outdoors or near a window.";
        if (err.code === 3 || err.message === "GEOLOCATION_UNAVAILABLE") {
          errorHint = "TIMEOUT: Location signal is too weak. Please ensure GPS is ON and you are in an open area.";
          if (isWebView) {
            errorHint += "\n\nWebViews/APKs can take longer to warm up GPS. Try again in a few seconds.";
          }
        }
        
        setLocationError({ code: err.code || 0, message: err.message || 'Signal Weak', hint: errorHint });
        setIsLoading(false);
        return;
      }
    } else if (navigator.geolocation) {
      // Optional background location capture if not enforced
      try {
        const position = await new Promise<GeolocationPosition>((res) => {
          navigator.geolocation.getCurrentPosition(res, () => res({} as any), { timeout: 3000, maximumAge: 600000 });
        });
        if (position && position.coords) {
          userLat = position.coords.latitude;
          userLng = position.coords.longitude;
        }
      } catch (e) {}
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
  const [responseInputs, setResponseInputs] = useState<Record<string, string>>({});

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

  const handleStaffResponse = async (requestId: string) => {
    const response = responseInputs[requestId];
    if (!response?.trim()) return;

    setIsLoading(true);
    const updatedEmployees = allEmployees.map(emp => {
      if (emp.id === employee.id) {
        const updatedRequests = emp.leaveRequests.map(req => 
          req.id === requestId ? { ...req, staffResponse: response } : req
        );
        return { ...emp, leaveRequests: updatedRequests };
      }
      return emp;
    });
    
    try {
      await onUpdateEmployees(updatedEmployees);
      setResponseInputs(prev => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    } catch (err) {
      console.error('Staff response sync error:', err);
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
      <div className="bg-white rounded-[24px] p-4 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-border max-w-2xl mx-auto">
        <div className="flex items-center space-x-4 mb-4 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-error/10 text-error rounded-2xl flex items-center justify-center">
            <Shield size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-primary tracking-tight">Security Protocol</h3>
            <p className="text-[8px] sm:text-[10px] font-bold text-text-gray uppercase tracking-widest mt-0.5 sm:mt-1">Credential Management & Access Control</p>
          </div>
        </div>

        <form onSubmit={handleUpdateSecurity} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-bg p-3 sm:p-4 rounded-xl border border-border">
              <label className="mini-label block mb-2 text-error text-[8px] sm:text-[10px]">Identity Verification Required</label>
              <input 
                type="password"
                required
                placeholder="Enter Current Password"
                className="w-full h-10 sm:h-12 px-4 bg-white border border-border text-[10px] sm:text-xs font-bold uppercase rounded-xl outline-none focus:ring-4 focus:ring-error/10 transition-all"
                value={securityForm.currentPassword}
                onChange={e => setSecurityForm({...securityForm, currentPassword: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-2 opacity-60">
                <label className="mini-label block px-1 flex items-center gap-1.5 text-[8px] sm:text-[10px]">
                  <Lock size={10} className="text-error" />
                  Network User ID (Locked)
                </label>
                <input 
                  type="text"
                  readOnly
                  className="w-full h-10 sm:h-12 px-4 bg-accent/5 border border-border text-[10px] sm:text-xs font-bold lowercase rounded-xl cursor-not-allowed outline-none"
                  value={securityForm.newUsername}
                />
              </div>
              <div className="space-y-1 sm:space-y-2 opacity-50">
                <label className="mini-label block px-1 text-[8px] sm:text-[10px]">Employee UUID (Immutable)</label>
                <input 
                  type="text"
                  disabled
                  className="w-full h-10 sm:h-12 px-4 bg-accent/5 border border-border text-[9px] sm:text-[10px] font-mono rounded-xl cursor-not-allowed"
                  value={employee.id}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
              <div className="space-y-1 sm:space-y-2">
                <label className="mini-label block px-1 text-[8px] sm:text-[10px]">New Terminal Password</label>
                <input 
                  type="password"
                  placeholder="Keep blank to remain same"
                  className="w-full h-10 sm:h-12 px-4 bg-white border border-border text-[10px] sm:text-xs font-bold rounded-xl outline-none focus:ring-4 focus:ring-secondary/10"
                  value={securityForm.newPassword}
                  onChange={e => setSecurityForm({...securityForm, newPassword: e.target.value})}
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <label className="mini-label block px-1 text-[8px] sm:text-[10px]">Confirm Protocol</label>
                <input 
                  type="password"
                  placeholder="Re-enter new password"
                  className="w-full h-10 sm:h-12 px-4 bg-white border border-border text-[10px] sm:text-xs font-bold rounded-xl outline-none focus:ring-4 focus:ring-secondary/10"
                  value={securityForm.confirmPassword}
                  onChange={e => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 sm:pt-4">
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 sm:h-14 bg-primary text-white rounded-2xl flex items-center justify-center space-x-3 text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  <span>Update Security Registry</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-accent/10 p-3 sm:p-4 rounded-xl border border-border border-dashed">
            <div className="flex items-start space-x-3 text-text-gray">
              <Shield size={12} className="mt-0.5 shrink-0" />
              <p className="text-[8px] font-bold uppercase leading-relaxed tracking-wider">
                Encryption Layer: SHA-256 Symmetric Field Validation. All modifications logged.
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
              <p className="text-xs sm:text-sm font-bold text-primary">{formatTo12h(todayAttendance?.timeIn) || '--:--'}</p>
            </div>
            <div className="bg-accent/30 p-2 border border-border rounded-lg">
              <span className="mini-label">Out</span>
              <p className="text-xs sm:text-sm font-bold text-primary">{formatTo12h(todayAttendance?.timeOut) || '--:--'}</p>
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
                    <div className="flex justify-between text-text-dark"><span>IN:</span><span className="font-extrabold">{formatTo12h(session.checkIn)}</span></div>
                    <div className="flex justify-between text-text-dark"><span>OUT:</span><span className="font-extrabold">{formatTo12h(session.checkOut) || 'PENDING'}</span></div>
                    {session.campusName && (
                      <div className="flex justify-between text-text-dark mt-1 pt-1 border-t border-border/50 italic opacity-80">
                        <span>SITE:</span><span className="font-extrabold">{session.campusName}</span>
                      </div>
                    )}
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
    <div className="animate-in fade-in duration-700 h-full overflow-y-auto sm:overflow-visible scrollbar-hide">
      <div className="bg-white rounded-[24px] p-3 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-border grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-10">
        <div className="md:col-span-4 space-y-3 sm:space-y-6 md:border-r border-border md:pr-10">
          <h3 className="text-[10px] sm:text-sm font-extrabold uppercase tracking-tight text-primary">Balance Details</h3>
          <div className="grid grid-cols-3 md:grid-cols-1 gap-2 sm:gap-4">
            <BalanceCard label="Annual" total={employee.leaves.annual.total} used={employee.leaves.annual.used} accent />
            <BalanceCard label="Casual" total={employee.leaves.casual.total} used={employee.leaves.casual.used} />
            <BalanceCard label="Medical" total={employee.leaves.medical.total} used={employee.leaves.medical.used} />
          </div>
        </div>

        <div className="md:col-span-8 flex flex-col gap-6 sm:gap-10">
          <div className="space-y-3">
            <h3 className="mini-label text-[8px] sm:text-[10px]">Quick Register</h3>
            <form onSubmit={handleApplyLeave} className="space-y-3">
              <select 
                className="w-full h-10 sm:h-12 px-4 bg-accent/20 border border-border text-[10px] sm:text-xs font-bold uppercase rounded-xl outline-none focus:ring-4 focus:ring-secondary/10 transition-all"
                value={leaveForm.type}
                onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value as any})}
              >
                <option value="Annual">Annual Reserve</option>
                <option value="Casual">Casual Allowance</option>
                <option value="Medical">Medical Hardship</option>
              </select>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <input type="date" className="h-10 sm:h-12 px-4 border border-border text-[10px] sm:text-xs font-bold uppercase rounded-xl" value={leaveForm.from} onChange={e => setLeaveForm({...leaveForm, from: e.target.value})} />
                <input type="date" className="h-10 sm:h-12 px-4 border border-border text-[10px] sm:text-xs font-bold uppercase rounded-xl" value={leaveForm.to} onChange={e => setLeaveForm({...leaveForm, to: e.target.value})} />
              </div>
              <textarea 
                placeholder="REASON FOR LEAVE..."
                className="w-full p-3 sm:p-4 border border-border text-[10px] sm:text-xs font-bold uppercase resize-none h-20 sm:h-32 rounded-xl outline-none focus:ring-4 focus:ring-secondary/10"
                value={leaveForm.reason}
                onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})}
              />
              <button type="submit" className="w-full h-11 sm:h-14 bg-primary text-white rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">
                SUBMIT PROTOCOL
              </button>
            </form>
          </div>

          <div className="border-t border-border pt-4 sm:pt-0 sm:border-t-0 sm:border-l sm:pl-10">
            <h3 className="mini-label mb-3 sm:mb-6 text-[8px] sm:text-[10px]">Audit Registry</h3>
            <div className="space-y-4 max-h-[150px] sm:max-h-[450px] overflow-y-auto pr-2">
              {employee.leaveRequests.length === 0 ? (
                <div className="py-10 sm:py-20 text-center opacity-20"><p className="text-[8px] sm:text-[10px] font-extrabold italic uppercase">NO ENTRIES FOUND</p></div>
              ) : (
                [...employee.leaveRequests].reverse().map((req, i) => (
                  <div key={req.id} className="p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-border bg-accent/5 hover:bg-accent/10 transition-all shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] sm:text-xs font-black uppercase text-primary tracking-tight">{req.type} Leave Protocol</p>
                        <p className="text-[8px] sm:text-[10px] text-text-gray font-bold mt-1 uppercase tracking-widest">{req.from} <span className="mx-1 text-[8px] opacity-20">TO</span> {req.to}</p>
                      </div>
                      <span className={cn(
                        "text-[8px] sm:text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest",
                        req.status === 'Pending' ? "bg-orange-50 text-orange-600 border-orange-100" : 
                        req.status === 'Rejected' ? "bg-red-50 text-red-600 border-red-100" :
                        "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>{req.status}</span>
                    </div>

                    {/* Manager's Rejection Reason / Question */}
                    {req.rejectionReason && (
                      <div className="bg-red-50/50 p-3 rounded-xl border border-red-100/50">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={12} className="text-red-500" />
                          <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">Management Inquiry / Reason</span>
                        </div>
                        <p className="text-[10px] font-bold text-red-700 italic">"{req.rejectionReason}"</p>
                        
                        {/* Response Form */}
                        {!req.staffResponse ? (
                          <div className="mt-3 space-y-2">
                            <textarea 
                              placeholder="Submit your answer here..."
                              className="w-full p-2 bg-white border border-red-100 text-[10px] font-bold uppercase rounded-lg outline-none focus:ring-2 focus:ring-red-200 resize-none h-16"
                              value={responseInputs[req.id] || ''}
                              onChange={(e) => setResponseInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                            />
                            <button 
                              onClick={() => handleStaffResponse(req.id)}
                              disabled={!responseInputs[req.id]?.trim()}
                              className="w-full py-2 bg-red-600 text-white text-[8px] font-black uppercase rounded-lg hover:bg-black transition-all disabled:opacity-30"
                            >
                              Send Response
                            </button>
                          </div>
                        ) : (
                          <div className="mt-3 bg-white p-3 rounded-xl border border-red-100">
                             <span className="text-[8px] font-black text-primary uppercase tracking-widest mb-1 block">Your Protocol Response</span>
                             <p className="text-[10px] font-bold text-primary italic">"{req.staffResponse}"</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-2 border-t border-border/50">
                      <p className="text-[8px] font-black text-text-gray uppercase tracking-widest mb-1">Your Submission context</p>
                      <p className="text-[9px] font-medium text-primary/60 italic leading-snug">"{req.reason}"</p>
                    </div>
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
        "bg-white border border-border p-3 sm:p-5 rounded-2xl flex flex-col justify-between shadow-sm transition-all hover:bg-accent/5 hover:border-secondary/30", 
        accent && "bg-secondary/[0.02] border-secondary/20"
      )}>
        <div className="flex justify-between items-start mb-1 sm:mb-3">
          <span className="text-[8px] sm:text-[10px] font-extrabold text-primary uppercase tracking-widest truncate">{label}</span>
          <span className="text-[7px] sm:text-[10px] font-bold text-text-gray hidden sm:inline">{used} / {total}</span>
        </div>
        <div className="flex items-baseline space-x-1 sm:space-x-2">
          <span className="text-sm sm:text-2xl font-extrabold text-primary tracking-tight">{available}</span>
          <span className="text-[6px] sm:text-[10px] font-bold text-text-gray uppercase tracking-widest">Avl</span>
        </div>
        <div className="mt-2 sm:mt-4 h-1 sm:h-2 w-full bg-bg rounded-full overflow-hidden">
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
            <ProfileInfo label="Shift" value={`${formatTo12h(employee.shiftStart)} - ${formatTo12h(employee.shiftEnd)}`} />
            <ProfileInfo label="User ID" value={employee.username} />
            <ProfileInfo label="Security" value="SECURE ACCESS" />
          </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={async () => {
                  if (navigator.permissions) {
                    try {
                      const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                      alert(`CURRENT LOCATION STATUS: ${result.state.toUpperCase()}\n\nNote: If 'denied', check phone settings. If you can't find the setting, the APK manifest is missing location permissions.`);
                    } catch (e) {
                      alert("Unable to query standard permissions API. Try marking attendance to see error code.");
                    }
                  } else {
                    alert("Permissions API not supported in this environment.");
                  }
                }}
                className="bg-secondary/10 text-secondary px-6 py-4 rounded-xl flex items-center justify-center space-x-3 text-xs font-black uppercase tracking-widest hover:bg-secondary/20 transition-all active:scale-95 border border-secondary/20"
              >
                <Target size={16} />
                <span>Check Permissions</span>
              </button>
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

  const renderMobileCheckIn = () => {
    const activeSession = todayAttendance?.sessions?.find(s => !s.checkOut);
    return (
    <div className="flex flex-col h-full px-4 py-2 sm:hidden gap-2">
      {/* Main Status & Clock Card */}
      <div className="flex-1 min-h-0 bg-white rounded-[24px] p-4 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-border relative overflow-hidden group my-1 flex flex-col justify-center">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12"></div>
        
        <div className="relative z-10 w-full">
          <div className="flex items-center justify-between mb-2">
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
                  <h1 className="text-7xl font-extrabold text-primary tracking-tighter tabular-nums mb-0.5">{sessionDuration}</h1>
                  <p className="text-[8px] font-bold text-text-gray uppercase tracking-widest">Active Duration</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="current-time"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <h1 className="text-5xl font-extrabold text-primary tracking-tighter tabular-nums mb-0.5 opacity-10">{currentTime.split(' ')[0]}</h1>
                  <p className="text-[8px] font-bold text-text-gray uppercase tracking-widest">Awaiting Verification</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-2 flex flex-col space-y-2">
             <div className="flex space-x-2">
                <button 
                  onClick={() => handleMarkAttendance('in')}
                  disabled={!!(todayAttendance?.sessions?.some(s => !s.checkOut))}
                  className="flex-1 h-10 bg-primary text-white rounded-xl flex items-center justify-center space-x-2 text-[9px] font-extrabold uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-20"
                >
                  <Clock size={12} />
                  <span>Clock In</span>
                </button>
                <button 
                  onClick={() => handleMarkAttendance('out')}
                  disabled={!(todayAttendance?.sessions?.some(s => !s.checkOut))}
                  className="flex-1 h-10 bg-secondary text-white rounded-xl flex items-center justify-center space-x-2 text-[9px] font-extrabold uppercase tracking-widest shadow-lg shadow-secondary/20 active:scale-95 transition-all disabled:opacity-20"
                >
                  <LogOut size={12} />
                  <span>Clock Out</span>
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Grid Stats - Fit to Screen */}
      <div className="grid grid-cols-2 gap-3 shrink-0">
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-border flex flex-col justify-between h-24">
           <div className="flex items-center space-x-2 text-primary opacity-40">
             <Clock size={12} />
             <span className="text-[8px] font-extrabold uppercase tracking-widest">Checkpoint</span>
           </div>
           <div>
             <div className="text-lg font-extrabold text-primary tabular-nums">{todayAttendance?.timeIn || '--:--'}</div>
             <p className="text-[8px] font-bold text-text-gray mt-1 uppercase">Today's Start</p>
           </div>
        </div>
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-border flex flex-col justify-between h-24">
           <div className="flex items-center space-x-2 text-secondary opacity-60">
             <TrendingUp size={12} />
             <span className="text-[8px] font-extrabold uppercase tracking-widest">Efficacy</span>
           </div>
           <div>
             <div className="text-lg font-extrabold text-primary tabular-nums">{calculateHoursWorked(todayAttendance)}h</div>
             <p className="text-[8px] font-bold text-text-gray mt-1 uppercase">Operational Hrs</p>
           </div>
        </div>
      </div>

      {/* Verified Location Badge */}
      <div className="mt-1 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between bg-emerald-50 px-5 py-2 rounded-2xl border border-emerald-100">
          <div 
            onClick={async () => {
              try {
                setLoadingMessage('Waking GPS...');
                setIsLoading(true);
                await new Promise((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, maximumAge: 0 });
                });
                alert("LOCATION STATUS: Operational.\n\nYour device has successfully acquired a GPS lock.");
                setLocationError(null);
              } catch (e: any) {
                const hint = e.code === 1 ? "Permission Denied. Check phone settings." : "Signal weak or GPS disabled.";
                alert(`Diagnostic Result: ${hint}`);
              } finally {
                setIsLoading(false);
              }
            }}
            className="flex items-center space-x-2 cursor-pointer active:opacity-60 transition-opacity"
          >
            <Shield size={14} className="text-emerald-600" />
            <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-widest">
              {activeSession ? "Site Verified" : "Verification Required"}
            </span>
          </div>
          <span className="text-[9px] font-black text-emerald-800 uppercase">{(activeSession?.campusName || employee.campus).split(' ')[0]}</span>
        </div>

        {locationError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 p-3 rounded-2xl border border-red-100 space-y-2"
          >
            <div className="flex items-start space-x-2">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] font-black text-red-600 uppercase tracking-wider">Location Error Detected</p>
                <p className="text-[8px] text-red-700 leading-tight mt-1 font-medium">{locationError.hint}</p>
              </div>
            </div>
            <button 
              onClick={() => setLocationError(null)}
              className="w-full py-1.5 bg-red-100 text-red-700 text-[8px] font-black uppercase rounded-lg hover:bg-red-200 transition-colors"
            >
              Dismiss Helper
            </button>
          </motion.div>
        )}
      </div>
    </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto max-w-full overflow-hidden h-full relative flex flex-col bg-bg">
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-primary/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6" />
            <div className="space-y-2">
              <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">{loadingMessage}</p>
              <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest">Ensuring Network Integrity</p>
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
      <div className="sm:hidden flex flex-col h-full overflow-hidden bg-bg">
        {/* Persistent Mobile Header */}
        <div className="px-4 pt-4 pb-2 bg-white border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary text-white rounded-[16px] flex items-center justify-center font-bold text-base shadow-lg rotate-3">
                {employee.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-extrabold text-primary tracking-tight leading-none">Salam, {employee.name}</h2>
                <div className="flex items-center space-x-2 mt-0.5">
                  <p className="text-[8px] font-bold text-text-gray uppercase tracking-widest opacity-70 italic">Shift: {formatTo12h(employee.shiftStart)} - {formatTo12h(employee.shiftEnd)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={mobileTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {mobileTab === 'checkin' && renderMobileCheckIn()}
              {mobileTab === 'calendar' && <div className="px-4 h-full overflow-y-auto scrollbar-hide py-2">{renderAttendanceTab()}</div>}
              {mobileTab === 'leaves' && <div className="px-4 h-full overflow-y-auto scrollbar-hide py-2">{renderLeavesTab()}</div>}
              {mobileTab === 'profile' && <div className="px-4 h-full overflow-y-auto scrollbar-hide py-2">{renderProfileTab()}</div>}
              {mobileTab === 'security' && <div className="px-4 h-full overflow-y-auto scrollbar-hide py-2">{renderSecurityTab()}</div>}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="bg-secondary flex items-center justify-around px-4 pb-[env(safe-area-inset-bottom,1.25rem)] pt-2 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] shrink-0">
          {[
            { id: 'checkin', icon: Clock, label: 'Entry' },
            { id: 'calendar', icon: Calendar, label: 'Logs' },
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
