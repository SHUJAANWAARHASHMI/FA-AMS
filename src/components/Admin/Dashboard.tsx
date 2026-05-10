
import React, { useMemo, useState } from 'react';
import { Employee, User } from '../../types';
import { cn, getLocalDate } from '../../lib/utils';
import { formatTo12h } from '../../lib/timeUtils';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  Clock, 
  TrendingUp, 
  Calendar,
  Award,
  Shield,
  LogOut,
  Check,
  ChevronRight,
  Filter,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  X,
  Search,
  LayoutDashboard
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'motion/react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardProps {
  employees: Employee[];
  user: User;
  onUpdateEmployees: (employees: Employee[]) => void;
  setActiveTab?: (tab: string) => void;
}

type ViewType = 'Main Campus' | 'Johar Campus' | 'Masjid Campus' | 'Maktab Campus' | 'Summary' | 'Leave Registry';

const Building2 = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
    <path d="M9 22v-4h6v4"/>
    <path d="M8 6h.01"/>
    <path d="M16 6h.01"/>
    <path d="M12 6h.01"/>
    <path d="M12 10h.01"/>
    <path d="M12 14h.01"/>
    <path d="M16 10h.01"/>
    <path d="M16 14h.01"/>
    <path d="M8 10h.01"/>
    <path d="M8 14h.01"/>
  </svg>
);

const CompactStat = ({ title, value, icon: Icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="bg-white p-3 rounded-2xl border border-border flex flex-col justify-between active:scale-95 transition-all shadow-sm group hover:border-secondary/30"
  >
    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center mb-2", color)}>
      <Icon size={14} />
    </div>
    <div className="text-left">
      <div className="text-lg font-black text-primary leading-none tracking-tight">{value}</div>
      <div className="text-[7px] font-black text-text-gray uppercase tracking-widest mt-1 opacity-70 truncate">{title}</div>
    </div>
  </button>
);

export const AdminDashboard: React.FC<DashboardProps> = ({ employees, user, onUpdateEmployees, setActiveTab }) => {
  const isManagement = user.role === 'admin' || (user.role === 'mudeer' && user.campus === 'Main Campus');
  const [selectedView, setSelectedView] = useState<ViewType>(isManagement ? 'Summary' : user.campus as ViewType);
  const [targetDate, setTargetDate] = useState(getLocalDate());
  const [drillDown, setDrillDown] = useState<{ type: 'Present' | 'Absent' | 'Late', campus: string } | null>(null);
  const [performancePeriod, setPerformancePeriod] = useState<'today' | 'weekly' | 'monthly'>('today');

  // Filtering Logic
  const currentEmployees = useMemo(() => {
    if (selectedView === 'Summary' || selectedView === 'Leave Registry') return employees;
    return employees.filter(e => e.campus === selectedView);
  }, [employees, selectedView]);

  const stats = useMemo(() => {
    // If not management, always factor in their own campus regardless of selectedView (though selectedView should be forced to their campus)
    const secureEmployees = isManagement ? currentEmployees : employees.filter(e => e.campus === user.campus);
    const total = secureEmployees.length;
    const records = secureEmployees.map(e => e.attendance.find(a => a.date === targetDate));
    const presentCount = records.filter(r => r && (r.status === 'Present' || r.status === 'Late')).length;
    const lateCount = records.filter(r => r && r.status === 'Late').length;
    const absentCount = total - presentCount;
    const percentage = total === 0 ? 0 : Math.round((presentCount / total) * 100);

    return { total, present: presentCount, late: lateCount, absent: absentCount, percentage };
  }, [currentEmployees, targetDate, isManagement, employees, user.campus]);

  const pendingLeaves = useMemo(() => {
    const list: any[] = [];
    const secureEmployees = isManagement ? currentEmployees : employees.filter(e => e.campus === user.campus);
    secureEmployees.forEach(emp => {
      emp.leaveRequests.forEach(req => {
        if (req.status === 'Pending') {
          list.push({ ...req, employeeId: emp.id, employeeName: emp.name });
        }
      });
    });
    return list;
  }, [currentEmployees, isManagement, employees, user.campus]);

  const handleLeaveAction = (employeeId: string, requestId: string, status: 'Approved' | 'Rejected') => {
    const updated = employees.map(emp => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          leaveRequests: emp.leaveRequests.map(req => 
            req.id === requestId ? { ...req, status } : req
          )
        };
      }
      return emp;
    });
    onUpdateEmployees(updated);
  };

  const bestPerformers = useMemo(() => {
    const today = getLocalDate();
    return [...currentEmployees]
      .map(emp => {
        let score = 0;
        if (performancePeriod === 'today') {
          const att = emp.attendance.find(a => a.date === today);
          score = att ? (att.onTime ? 100 : 60) : 0;
        } else {
          const days = performancePeriod === 'weekly' ? 7 : 30;
          const recent = emp.attendance.slice(-days);
          const onTime = recent.filter(a => a.onTime).length;
          score = recent.length ? (onTime / recent.length) * 100 : 0;
        }
        return { ...emp, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [currentEmployees, performancePeriod]);

  const drillDownList = useMemo(() => {
    if (!drillDown) return [];
    return currentEmployees.filter(emp => {
      const att = emp.attendance.find(a => a.date === targetDate);
      const isPresent = att && (att.status === 'Present' || att.status === 'Late');
      const isLate = att && att.status === 'Late';

      if (drillDown.type === 'Present') return isPresent;
      if (drillDown.type === 'Late') return isLate;
      if (drillDown.type === 'Absent') return !isPresent;
      return false;
    });
  }, [drillDown, currentEmployees, targetDate]);

  const recentActivity = useMemo(() => {
    const activity: any[] = [];
    currentEmployees.forEach(emp => {
      emp.attendance.forEach(att => {
        if (att.date === targetDate) {
          activity.push({
            id: `${emp.id}-${att.timeIn}`,
            name: emp.name,
            time: att.timeIn,
            type: att.status,
            campus: emp.campus
          });
        }
      });
    });
    return activity.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 5);
  }, [currentEmployees, targetDate]);

  const renderLeaveRegistry = () => (
    <div className="flex flex-col h-full space-y-4 p-4 animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-primary uppercase tracking-tighter">Leave Protocol</h2>
          <p className="text-[10px] font-bold text-text-gray uppercase tracking-widest">{selectedView === 'Leave Registry' ? 'Global Queue' : selectedView}</p>
        </div>
        <div className="bg-primary/10 px-3 py-1.5 rounded-xl text-primary font-black text-[10px] uppercase">
          {pendingLeaves.length} PENDING
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {pendingLeaves.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
            <Calendar size={48} />
            <p className="text-xs font-black uppercase tracking-widest">Registry is Empty</p>
          </div>
        ) : (
          pendingLeaves.map(req => (
            <div key={req.id} className="bg-white p-4 rounded-[24px] border border-border shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent text-primary rounded-xl flex items-center justify-center font-black text-lg">
                    {req.employeeName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-primary uppercase truncate max-w-[120px]">{req.employeeName}</h4>
                    <p className="text-[9px] font-bold text-text-gray uppercase">{req.employeeId} | {req.campus || 'Main'}</p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-orange-50 rounded-lg text-orange-600 font-black text-[8px] uppercase border border-orange-100">
                  {req.type}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50">
                <div>
                  <p className="text-[7px] font-black text-text-gray uppercase tracking-widest mb-1">Duration</p>
                  <p className="text-[10px] font-bold text-primary">{req.from} → {req.to}</p>
                </div>
                <div>
                  <p className="text-[7px] font-black text-text-gray uppercase tracking-widest mb-1">Category</p>
                  <p className="text-[10px] font-bold text-primary">{req.type}</p>
                </div>
              </div>

              <div>
                <p className="text-[7px] font-black text-text-gray uppercase tracking-widest mb-1">Operational Reason</p>
                <p className="text-[10px] font-medium text-text-gray italic leading-relaxed">"{req.reason || 'No specific reason provided.'}"</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => handleLeaveAction(req.employeeId, req.id, 'Rejected')}
                  className="h-10 rounded-xl border border-error/20 text-error text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <X size={14} /> REJECT
                </button>
                <button 
                  onClick={() => handleLeaveAction(req.employeeId, req.id, 'Approved')}
                  className="h-10 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <Check size={14} /> APPROVE
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="h-20 shrink-0" />
    </div>
  );

  const renderDashboard = () => (
    <div className="flex flex-col h-full space-y-4 overflow-hidden p-3 pt-4">
      {/* Header with Date Picker */}
      <div className="flex items-center justify-between px-1 shrink-0">
        <h2 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
          <Activity size={16} className="text-secondary" />
          {selectedView}
        </h2>
        <input 
          type="date" 
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="h-8 px-3 bg-white border border-border text-[9px] font-bold uppercase rounded-xl outline-none focus:ring-2 focus:ring-secondary/20 shadow-sm"
        />
      </div>

      {/* Main Stats Row - Horizontal Scrollable on Mobile if needed, but grid for compact fit */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        <CompactStat 
          title="Total" 
          value={stats.total} 
          icon={Users} 
          color="bg-primary/10 text-primary" 
        />
        <CompactStat 
          title="Present" 
          value={stats.present} 
          icon={UserCheck} 
          color="bg-emerald-50 text-emerald-600" 
          onClick={() => setDrillDown({ type: 'Present', campus: selectedView })}
        />
        <CompactStat 
          title="Absent" 
          value={stats.absent} 
          icon={UserMinus} 
          color="bg-red-50 text-red-600" 
          onClick={() => setDrillDown({ type: 'Absent', campus: selectedView })}
        />
        <CompactStat 
          title="Late" 
          value={stats.late} 
          icon={Clock} 
          color="bg-warning/10 text-warning" 
          onClick={() => setDrillDown({ type: 'Late', campus: selectedView })}
        />
      </div>

      {/* Attendance Goal / Percentage */}
      <div className="bg-primary p-4 rounded-3xl text-white flex items-center justify-between shadow-xl shadow-primary/20 shrink-0 relative overflow-hidden">
        <div className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12">
          <Activity size={80} />
        </div>
        <div className="relative z-10">
          <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Operations Sync</div>
          <div className="text-2xl font-black tracking-tighter">{stats.percentage}%</div>
          <div className="text-[7px] font-bold uppercase opacity-80 mt-1">Efficiency Threshold</div>
        </div>
        <div className="relative z-10 w-12 h-12 rounded-full border-4 border-white/20 border-t-white flex items-center justify-center font-black text-xs">
          {stats.percentage}%
        </div>
      </div>

      {/* Analytics Grid - Using a more balanced stack for small screens */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        <div className="grid grid-cols-2 gap-3 min-h-0">
          {/* Top Performers */}
          <div className="bg-white p-3 rounded-3xl border border-border flex flex-col h-[180px]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">Leaders</span>
              <div className="flex gap-1">
                {(['today', 'weekly', 'monthly'] as const).map(p => (
                  <button 
                    key={p} 
                    onClick={() => setPerformancePeriod(p)}
                    className={cn("text-[6px] font-black uppercase px-1.5 py-0.5 rounded-md transition-all", performancePeriod === p ? "bg-secondary text-white shadow-sm" : "bg-bg text-text-gray")}
                  >
                    {p[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 overflow-hidden flex-1">
              {bestPerformers.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[7px] font-bold text-text-gray/40">NO DATA</div>
              ) : (
                bestPerformers.map((emp, i) => (
                  <div key={emp.id} className="flex items-center justify-between p-2 bg-bg/50 rounded-2xl border border-border/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 bg-primary text-white rounded-lg font-black text-[10px] flex items-center justify-center shrink-0 shadow-sm">{emp.name.charAt(0)}</div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-black text-primary truncate">{emp.name}</div>
                        <div className="text-[6px] font-bold text-text-gray uppercase tracking-tighter">{Math.round(emp.score)}% Sync</div>
                      </div>
                    </div>
                    <Award size={10} className={i === 0 ? "text-warning shrink-0" : "text-text-gray/20 shrink-0"} />
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Leave Queue - Compact with trigger */}
          <button 
            onClick={() => setActiveTab ? setActiveTab('leave-management' as any) : setSelectedView('Leave Registry')}
            className="bg-white p-3 rounded-3xl border border-border h-[180px] flex flex-col text-left active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">Requests</span>
              <ChevronRight size={12} className="text-text-gray/40 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-accent/50 rounded-2xl p-2">
              <div className="text-3xl font-black text-primary tracking-tighter">{pendingLeaves.length}</div>
              <div className="text-[8px] font-black text-text-gray uppercase tracking-widest mt-1">Pending</div>
              <div className="mt-2 w-full h-1 bg-accent/30 rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full" style={{ width: `${Math.min(100, pendingLeaves.length * 10)}%` }} />
              </div>
            </div>
            <p className="text-[6px] font-black text-secondary uppercase tracking-widest mt-3 text-center">MANAGE ALL</p>
          </button>
        </div>

        {/* Charts Section - Full width on mobile to avoid overlapping */}
        <div className="grid grid-cols-1 gap-3 pb-24">
          {/* Chart Wrapper to maintain aspect ratio and prevent overflow */}
          <div className="bg-white p-4 rounded-3xl border border-border h-[220px] flex flex-col relative overflow-hidden">
            <span className="text-[8px] font-black uppercase tracking-widest text-primary mb-3">
              {selectedView === 'Summary' ? 'Campus Comparison' : 'Attendance Analytics'}
            </span>
            <div className="flex-1 relative min-h-0 w-full flex items-center justify-center">
              {selectedView === 'Summary' ? (
                <Bar 
                  data={{
                    labels: ['Main', 'Johar', 'Masjid', 'Maktab'],
                    datasets: [{
                      label: 'Sync Rate',
                      data: ['Main Campus', 'Johar Campus', 'Masjid Campus', 'Maktab Campus'].map(c => {
                        const campusEmps = employees.filter(e => e.campus === c);
                        const present = campusEmps.filter(e => e.attendance.find(a => a.date === targetDate && (a.status === 'Present' || a.status === 'Late'))).length;
                        return campusEmps.length === 0 ? 0 : Math.round((present / campusEmps.length) * 100);
                      }),
                      backgroundColor: '#0066FF',
                      borderRadius: 6,
                      barThickness: 15,
                    }]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    scales: {
                      y: { 
                        display: false, 
                        max: 100 
                      },
                      x: { 
                        grid: { display: false }, 
                        ticks: { 
                          font: { size: 7, weight: 'bold', family: 'Inter' },
                          color: '#64748b'
                        } 
                      }
                    },
                    plugins: { 
                      legend: { display: false },
                      tooltip: { enabled: true, bodyFont: { size: 10 } }
                    }
                  }}
                />
              ) : (
                <Pie 
                  data={{
                    labels: ['Present', 'Late', 'Absent'],
                    datasets: [{
                      data: [stats.present - stats.late, stats.late, stats.absent],
                      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                      borderWidth: 0,
                      hoverOffset: 6
                    }]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: { 
                      legend: { display: false },
                      tooltip: { enabled: true, bodyFont: { size: 10 } }
                    }
                  }}
                />
              )}
            </div>
            {selectedView !== 'Summary' && (
              <div className="mt-3 flex justify-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5 text-[7px] font-black uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> On-Time
                </div>
                <div className="flex items-center gap-1.5 text-[7px] font-black uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-warning" /> Late
                </div>
                <div className="flex items-center gap-1.5 text-[7px] font-black uppercase text-error">
                  <div className="w-1.5 h-1.5 rounded-full bg-error" /> Absent
                </div>
              </div>
            )}
          </div>

          {/* Pulse Activity - Full width on mobile */}
          <div className="bg-white p-4 rounded-3xl border border-border h-[220px] flex flex-col">
             <span className="text-[8px] font-black uppercase tracking-widest text-primary mb-3">Live Operational Pulse</span>
             <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {recentActivity.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[8px] font-bold text-text-gray/40 uppercase tracking-widest">NO LOGS FOUND</div>
                ) : (
                  recentActivity.map(act => (
                    <div key={act.id} className="flex items-center justify-between p-2.5 bg-bg/40 rounded-xl border border-border/30 group hover:border-secondary transition-all">
                       <div className="flex items-center gap-2.5 min-w-0">
                          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", act.type === 'Late' ? "bg-warning animate-pulse" : "bg-emerald-500")} />
                          <div className="min-w-0 text-left">
                            <div className="text-[9px] font-black text-primary truncate uppercase">{act.name}</div>
                            <div className="text-[6px] font-bold text-text-gray/50 uppercase tracking-tighter">{act.campus}</div>
                          </div>
                       </div>
                       <div className="text-[9px] font-black text-primary bg-accent/50 px-2 py-1 rounded-lg">{formatTo12h(act.time)}</div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 relative bg-bento-bg">
      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {selectedView === 'Leave Registry' ? renderLeaveRegistry() : renderDashboard()}
      </div>

      {/* Fixed Bottom Navigation - Solidified and Optimized */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pt-0 z-50 pointer-events-none">
        <div className="max-w-lg mx-auto bg-primary/95 backdrop-blur-lg rounded-[32px] p-2 flex items-center justify-between shadow-2xl shadow-primary/40 pointer-events-auto border border-white/5">
          {[
            { id: 'Summary', label: 'Summary', icon: LayoutDashboard },
            { id: 'Main Campus', label: 'Main', icon: Building2 },
            { id: 'Johar Campus', label: 'Johar', icon: Building2 },
            { id: 'Masjid Campus', label: 'Masjid', icon: Building2 },
            { id: 'Maktab Campus', label: 'Maktab', icon: Building2 },
          ].filter(item => isManagement || item.id === user.campus).map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedView(item.id as ViewType)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-[24px] transition-all relative flex-1 group min-w-0",
                selectedView === item.id ? "bg-white text-primary shadow-xl" : "text-white/50 hover:text-white/80"
              )}
            >
              <item.icon size={selectedView === item.id ? 18 : 16} className={cn("mb-1 transition-transform duration-300", selectedView === item.id ? "scale-110" : "group-active:scale-90")} />
              <span className="text-[6px] font-black uppercase tracking-widest truncate w-full text-center px-1">{item.label.split(' ')[0]}</span>
              {selectedView === item.id && (
                <motion.div layoutId="nav-glow" className="absolute inset-0 bg-white/10 blur-xl rounded-full pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Drill Down Modal */}
      <AnimatePresence>
        {drillDown && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrillDown(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-bg/50">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <div className={cn(
                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                        drillDown.type === 'Present' ? "bg-emerald-100 text-emerald-700" :
                        drillDown.type === 'Absent' ? "bg-red-100 text-red-700" : "bg-warning/20 text-warning"
                      )}>
                        {drillDown.type} Log
                      </div>
                   </div>
                   <h3 className="text-xl font-black text-primary tracking-tighter uppercase">{drillDown.campus}</h3>
                </div>
                <button 
                  onClick={() => setDrillDown(null)}
                  className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center active:scale-90 transition-all"
                >
                  <X size={20} className="text-primary" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {drillDownList.length === 0 ? (
                  <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">No entries found</div>
                ) : (
                  drillDownList.map(emp => {
                    const att = emp.attendance.find(a => a.date === targetDate);
                    return (
                      <div key={emp.id} className="flex items-center justify-between p-4 bg-bg/40 rounded-2xl border border-border">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg">{emp.name.charAt(0)}</div>
                           <div>
                              <div className="text-xs font-black text-primary">{emp.name}</div>
                              <div className="text-[9px] font-bold text-text-gray uppercase">{emp.id} | {emp.designation}</div>
                           </div>
                        </div>
                        <div className="text-right">
                           <div className={cn("text-xs font-black uppercase", att ? (att.status === 'Late' ? 'text-warning' : 'text-emerald-600') : 'text-error')}>
                             {att ? formatTo12h(att.timeIn) : 'Absent'}
                           </div>
                           <div className="text-[8px] font-bold text-text-gray uppercase opacity-40">{att?.status || 'No Log'}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

