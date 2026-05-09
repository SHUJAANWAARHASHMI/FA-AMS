
import React, { useMemo, useState } from 'react';
import { Employee, User } from '../../types';
import { cn, getLocalDate } from '../../lib/utils';
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

type ViewType = 'Main Campus' | 'Johar Campus' | 'Masjid Campus' | 'Maktab Campus' | 'Summary';

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
  const [selectedView, setSelectedView] = useState<ViewType>('Summary');
  const [targetDate, setTargetDate] = useState(getLocalDate());
  const [drillDown, setDrillDown] = useState<{ type: 'Present' | 'Absent' | 'Late', campus: string } | null>(null);
  const [performancePeriod, setPerformancePeriod] = useState<'today' | 'weekly' | 'monthly'>('today');

  // Filtering Logic
  const currentEmployees = useMemo(() => {
    if (selectedView === 'Summary') return employees;
    return employees.filter(e => e.campus === selectedView);
  }, [employees, selectedView]);

  const stats = useMemo(() => {
    const total = currentEmployees.length;
    const records = currentEmployees.map(e => e.attendance.find(a => a.date === targetDate));
    const presentCount = records.filter(r => r && (r.status === 'Present' || r.status === 'Late')).length;
    const lateCount = records.filter(r => r && r.status === 'Late').length;
    const absentCount = total - presentCount;
    const percentage = total === 0 ? 0 : Math.round((presentCount / total) * 100);

    return { total, present: presentCount, late: lateCount, absent: absentCount, percentage };
  }, [currentEmployees, targetDate]);

  const pendingLeaves = useMemo(() => {
    const list: any[] = [];
    currentEmployees.forEach(emp => {
      emp.leaveRequests.forEach(req => {
        if (req.status === 'Pending') {
          list.push({ ...req, employeeId: emp.id, employeeName: emp.name });
        }
      });
    });
    return list;
  }, [currentEmployees]);

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
    return activity.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);
  }, [currentEmployees, targetDate]);

  const renderDashboard = () => (
    <div className="flex flex-col h-full space-y-3 overflow-hidden p-3 pt-4">
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
          className="h-8 px-3 bg-white border border-border text-[10px] font-bold uppercase rounded-xl outline-none focus:ring-2 focus:ring-secondary/20"
        />
      </div>

      {/* Main Stats Row */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        <CompactStat 
          title="Workforce" 
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
      <div className="bg-primary p-4 rounded-3xl text-white flex items-center justify-between shadow-xl shadow-primary/20 shrink-0">
        <div>
          <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Daily Efficiency</div>
          <div className="text-2xl font-black tracking-tighter">{stats.percentage}%</div>
          <div className="text-[7px] font-bold uppercase opacity-80 mt-1">Personnel Consistency Score</div>
        </div>
        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white flex items-center justify-center font-black text-xs">
          {stats.percentage}%
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="flex-1 grid grid-cols-2 gap-3 min-h-0 overflow-hidden">
        {/* Left Column: List/Pending */}
        <div className="flex flex-col space-y-3 min-h-0">
          {/* Top Performers */}
          <div className="bg-white p-3 rounded-2xl border border-border flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-black uppercase tracking-widest text-primary">Top Talent</span>
              <div className="flex gap-1">
                {(['today', 'weekly', 'monthly'] as const).map(p => (
                  <button 
                    key={p} 
                    onClick={() => setPerformancePeriod(p)}
                    className={cn("text-[6px] font-black uppercase px-1 rounded", performancePeriod === p ? "bg-secondary text-white" : "bg-bg text-text-gray")}
                  >
                    {p[0]}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {bestPerformers.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[7px] font-bold text-text-gray/40">NO PERFORMANCE DATA</div>
              ) : (
                bestPerformers.map((emp, i) => (
                  <div key={emp.id} className="flex items-center justify-between p-1.5 bg-bg/50 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-5 h-5 bg-primary text-white rounded font-black text-[10px] flex items-center justify-center shrink-0">{emp.name.charAt(0)}</div>
                      <div className="min-w-0">
                        <div className="text-[8px] font-black text-primary truncate max-w-[50px]">{emp.name}</div>
                        <div className="text-[6px] font-bold text-text-gray uppercase">{Math.round(emp.score)}% Sync</div>
                      </div>
                    </div>
                    <Award size={10} className={i === 0 ? "text-warning shrink-0" : "text-text-gray/20 shrink-0"} />
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Leaves */}
          <div className="bg-white p-3 rounded-2xl border border-border h-32 flex flex-col shrink-0 min-h-0">
            <span className="text-[8px] font-black uppercase tracking-widest text-primary mb-2">Leave Queue ({pendingLeaves.length})</span>
            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {pendingLeaves.length === 0 ? (
                <div className="h-full flex items-center justify-center text-[7px] text-center font-bold text-text-gray py-4">NO PENDING PROTOCOL</div>
              ) : (
                pendingLeaves.map(req => (
                  <div key={req.id} className="p-2 bg-warning/5 border border-warning/10 rounded-xl space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <div className="text-[8px] font-black text-primary uppercase truncate">{req.employeeName}</div>
                        <div className="text-[6px] font-bold text-text-gray">{req.type} | {req.from}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 justify-end">
                      <button 
                        onClick={() => handleLeaveAction(req.employeeId, req.id, 'Approved')}
                        className="p-1 bg-emerald-500 text-white rounded-md active:scale-90"
                      >
                        <Check size={8} />
                      </button>
                      <button 
                        onClick={() => handleLeaveAction(req.employeeId, req.id, 'Rejected')}
                        className="p-1 bg-error text-white rounded-md active:scale-90"
                      >
                        <X size={8} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Charts & Recent Activity */}
        <div className="flex flex-col space-y-3 min-h-0">
          <div className="bg-white p-3 rounded-2xl border border-border flex flex-col flex-1 min-h-0">
            <span className="text-[8px] font-black uppercase tracking-widest text-primary mb-2">
              {selectedView === 'Summary' ? 'Campus Comparison' : 'Attendance Distribution'}
            </span>
            <div className="flex-1 min-h-0 relative flex items-center justify-center">
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
                      borderRadius: 8,
                    }]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      y: { display: false, max: 100 },
                      x: { grid: { display: false }, ticks: { font: { size: 8, weight: 'bold' } } }
                    },
                    plugins: { legend: { display: false } }
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
                      hoverOffset: 4
                    }]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                  }}
                />
              )}
            </div>
            {selectedView !== 'Summary' && (
              <div className="mt-2 space-y-1 shrink-0">
                <div className="flex items-center justify-between text-[7px] font-black uppercase">
                  <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-emerald-500" /> On-Time</span>
                  <span>{stats.present - stats.late}</span>
                </div>
                <div className="flex items-center justify-between text-[7px] font-black uppercase text-error">
                  <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-error" /> Absent</span>
                  <span>{stats.absent}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-3 rounded-2xl border border-border h-32 flex flex-col shrink-0 min-h-0">
             <span className="text-[8px] font-black uppercase tracking-widest text-primary mb-2">Pulse activity</span>
             <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {recentActivity.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[7px] font-bold text-text-gray/40">NO RECENT PULSE</div>
                ) : (
                  recentActivity.map(act => (
                    <div key={act.id} className="flex items-center justify-between p-1.5 bg-bg/30 rounded-lg border border-border/30">
                       <div className="flex items-center gap-1.5 min-w-0">
                          <div className={cn("w-1 h-1 rounded-full", act.type === 'Late' ? "bg-warning" : "bg-emerald-500")} />
                          <div className="text-[7px] font-black text-primary truncate max-w-[60px]">{act.name}</div>
                       </div>
                       <div className="text-[7px] font-bold text-text-gray">{act.time}</div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Spacer for fixed nav */}
      <div className="h-20 shrink-0" />
    </div>
  );

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 relative bg-bento-bg">
      {/* Content Area */}
      <div className="flex-1 overflow-hidden px-2 pt-1 pb-4">
        {renderDashboard()}
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-4 left-4 right-4 bg-primary rounded-[32px] p-2 flex items-center justify-between shadow-2xl shadow-primary/40 z-50 overflow-hidden">
        {[
          { id: 'Main Campus', label: 'Main', icon: MapPin },
          { id: 'Johar Campus', label: 'Johar', icon: Building2 },
          { id: 'Summary', label: 'Summary', icon: LayoutDashboard },
          { id: 'Masjid Campus', label: 'Masjid', icon: Building2 },
          { id: 'Maktab Campus', label: 'Maktab', icon: Building2 },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setSelectedView(item.id as ViewType)}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all relative flex-1 group",
              selectedView === item.id ? "bg-white text-primary" : "text-white/60 hover:text-white"
            )}
          >
            <item.icon size={selectedView === item.id ? 18 : 16} className={cn("mb-1 transition-all", selectedView === item.id ? "scale-110" : "group-active:scale-90")} />
            <span className="text-[7px] font-black uppercase tracking-widest truncate w-full text-center">{item.label}</span>
            {selectedView === item.id && (
              <motion.div layoutId="nav-pill" className="absolute -inset-0.5 border-2 border-white/20 rounded-2xl pointer-events-none" />
            )}
          </button>
        ))}
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
                             {att ? att.timeIn : 'Absent'}
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

