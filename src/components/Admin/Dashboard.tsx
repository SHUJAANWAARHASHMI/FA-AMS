
import React, { useMemo } from 'react';
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
  Check
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
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
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

const StatCard = ({ title, value, description, icon: Icon, color, trend }: any) => {
  return (
    <div className={cn(
      "bg-white rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-border flex flex-col justify-between h-full group hover:border-secondary/30 transition-all duration-300",
      "hover:shadow-lg hover:-translate-y-1"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
          color === 'blue' ? "bg-primary/10 text-primary" :
          color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
          color === 'warning' ? "bg-warning/10 text-warning" :
          "bg-error/5 text-error"
        )}>
          <Icon size={24} />
        </div>
        {trend && (
           <div className={cn(
             "px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1",
             trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-error/5 text-error"
           )}>
             <TrendingUp size={12} className={cn(trend < 0 && "rotate-180")} />
             <span>{Math.abs(trend)}%</span>
           </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-extrabold text-primary tracking-tight">{value}</div>
        <div className="text-xs font-bold text-text-gray uppercase tracking-widest mt-1 group-hover:text-secondary transition-colors">{title}</div>
        <div className="text-[10px] font-medium text-text-gray/60 mt-2">{description}</div>
      </div>
    </div>
  );
};

const BentoBox = ({ title, children, className, subTitle }: any) => (
  <div className={cn("bg-white rounded-[24px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-border", className)}>
    <div className="flex items-center justify-between mb-8">
      <div>
        <h3 className="text-lg font-extrabold text-primary tracking-tight uppercase">{title}</h3>
        {subTitle && <p className="text-xs font-bold text-text-gray uppercase tracking-widest mt-1">{subTitle}</p>}
      </div>
      <div className="flex space-x-2">
        <div className="w-2 h-2 rounded-full bg-secondary" />
        <div className="w-2 h-2 rounded-full bg-secondary/20" />
      </div>
    </div>
    <div className="relative">
      {children}
    </div>
  </div>
);

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

export const AdminDashboard: React.FC<DashboardProps> = ({ employees, user, onUpdateEmployees, setActiveTab }) => {
  const [targetDate, setTargetDate] = React.useState(getLocalDate());
  const [performancePeriod, setPerformancePeriod] = React.useState<'today' | 'weekly' | 'monthly'>('monthly');
  
  // Find self as employee
  const selfEmployee = useMemo(() => {
    return employees.find(e => e.id === user.username || e.name === user.name);
  }, [employees, user]);

  const todayStatus = useMemo(() => {
    if (!selfEmployee) return null;
    return selfEmployee.attendance.find(a => a.date === getLocalDate());
  }, [selfEmployee]);

  const handleSelfAttendance = () => {
    if (!selfEmployee) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const today = getLocalDate();
    
    const updatedEmployees = employees.map(emp => {
      if (emp.id === selfEmployee.id) {
        const attendance = [...emp.attendance];
        const existingIdx = attendance.findIndex(a => a.date === today);
        
        if (existingIdx >= 0) {
          // Update checkout
          attendance[existingIdx] = { ...attendance[existingIdx], timeOut: timeStr };
        } else {
          // New checkin
          attendance.push({
            date: today,
            timeIn: timeStr,
            timeOut: '--:--',
            lateHours: 0,
            overtime: 0,
            onTime: timeStr <= emp.shiftStart,
            status: timeStr <= emp.shiftStart ? 'Present' : 'Late',
            remarks: 'Self Registered (System Portal)'
          });
        }
        return { ...emp, attendance };
      }
      return emp;
    });
    
    onUpdateEmployees(updatedEmployees);
  };

  const filteredEmployees = useMemo(() => {
    if (user?.role === 'admin' || (user?.role === 'mudeer' && user?.campus === 'all')) return employees;
    if (user?.role === 'mudeer') return employees.filter(e => e?.campus === user?.campus);
    return employees.filter(e => e?.campus === user?.campus);
  }, [employees, user]);

  const stats = useMemo(() => {
    const campusStats = {
      'Main Campus': { total: 0, present: 0, late: 0 },
      'Johar Campus': { total: 0, present: 0, late: 0 },
      'Masjid Campus': { total: 0, present: 0, late: 0 },
      'Maktab Campus': { total: 0, present: 0, late: 0 },
    };

    filteredEmployees.forEach(emp => {
      if (!emp) return;
      const stats = campusStats[emp.campus as keyof typeof campusStats];
      if (stats) {
        stats.total++;
        const todayAttendance = emp.attendance.find(a => a.date === targetDate);
        if (todayAttendance) {
          if (todayAttendance.status === 'Present' || todayAttendance.status === 'Late') {
            stats.present++;
          }
          if (todayAttendance.status === 'Late') {
            stats.late++;
          }
        }
      }
    });

    const totalEmployees = filteredEmployees.length;
    const totalPresent = Object.values(campusStats).reduce((acc, curr) => acc + curr.present, 0);
    const totalLate = Object.values(campusStats).reduce((acc, curr) => acc + curr.late, 0);

    return { totalEmployees, totalPresent, totalLate, campusStats };
  }, [filteredEmployees, targetDate]);

  // Chart Data: Attendance by Campus
  const attendanceByCampusData = {
    labels: ['Main Campus', 'Johar Campus', 'Masjid Campus', 'Maktab Campus'],
    datasets: [{
      data: [
        stats.campusStats['Main Campus'].present,
        stats.campusStats['Johar Campus'].present,
        stats.campusStats['Masjid Campus'].present,
        stats.campusStats['Maktab Campus'].present
      ],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
      hoverOffset: 4
    }]
  };

  // Chart Data: Monthly Attendance Trend (Mock data for demo, in real app, derive from attendance history)
  const monthlyTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Present',
        data: [95, 92, 98, 93, 96, stats.totalPresent],
        borderColor: '#10b981',
        tension: 0.4
      },
      {
        label: 'Late',
        data: [5, 8, 2, 7, 4, stats.totalLate],
        borderColor: '#f59e0b',
        tension: 0.4
      }
    ]
  };

  // Performance - Regular vs Irregular
  const regularCount = filteredEmployees.filter(emp => {
    const totalDays = emp.attendance.length;
    if (totalDays === 0) return true;
    const onTimeDays = emp.attendance.filter(a => a.onTime).length;
    return (onTimeDays / totalDays) >= 0.8;
  }).length;

  const irregularCount = filteredEmployees.length - regularCount;

  const performancePieData = {
    labels: ['Regular (80%+ On-time)', 'Irregular'],
    datasets: [{
      data: [regularCount, irregularCount],
      backgroundColor: ['#10b981', '#f87171']
    }]
  };

  const bestEmployees = useMemo(() => {
    const now = new Date();
    const today = getLocalDate();
    
    // Helper to check if date is within range
    const isWithinRange = (dateStr: string, days: number) => {
      const date = new Date(dateStr);
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= days;
    };

    return [...filteredEmployees]
      .map(emp => {
        let score = 0;
        let displayValue = '0%';
        let subText = '';

        if (performancePeriod === 'today') {
          const todayAtt = emp.attendance.find(a => a.date === today);
          if (todayAtt) {
            const timeToMinutes = (time: string) => {
              const [h, m] = time.split(':').map(Number);
              return h * 60 + m;
            };
            const shiftStartMin = timeToMinutes(emp.shiftStart);
            const actualInMin = timeToMinutes(todayAtt.timeIn);
            // Higher score for earlier arrival. 
            // 80 base + (minutes before/after shift start)
            score = Math.max(0, Math.min(100, 90 - (actualInMin - shiftStartMin)));
            displayValue = todayAtt.onTime ? 'Punctual' : todayAtt.timeIn;
          }
          subText = todayAtt ? `In: ${todayAtt.timeIn}` : 'No Log';
        } else {
          const daysToLookBack = performancePeriod === 'weekly' ? 7 : 30;
          const periodAttendance = emp.attendance.filter(a => isWithinRange(a.date, daysToLookBack));
          
          if (periodAttendance.length > 0) {
            const onTimeDays = periodAttendance.filter(a => a.onTime).length;
            const presenceDays = periodAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
            
            score = (onTimeDays / periodAttendance.length) * 100;
            displayValue = `${score.toFixed(0)}%`;
            subText = `${onTimeDays}/${periodAttendance.length} On-Time`;
          }
        }

        return { ...emp, performanceScore: score, displayValue, subText };
      })
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 3);
  }, [filteredEmployees, performancePeriod]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-auto">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary" size={18} />
          <input 
            type="date" 
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full sm:w-auto pl-12 pr-6 h-12 bg-white border border-border text-xs font-bold uppercase rounded-xl focus:ring-2 focus:ring-secondary/10 focus:border-secondary focus:outline-none transition-all"
          />
        </div>
        
        {selfEmployee && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="w-full sm:w-auto flex items-center bg-white border border-border p-2 rounded-2xl shadow-sm"
          >
             <div className="px-4 border-r border-border mr-2">
                <p className="text-[10px] font-bold text-text-gray uppercase tracking-widest">Active Status</p>
                <p className={cn(
                  "text-xs font-extrabold",
                  todayStatus ? "text-emerald-600" : "text-error animate-pulse"
                )}>
                  {todayStatus ? (todayStatus.timeOut !== '--:--' ? 'COMPLETED' : 'ON-DUTY') : 'INACTIVE'}
                </p>
             </div>
             <button 
                onClick={handleSelfAttendance}
                disabled={todayStatus?.timeOut !== '--:--' && todayStatus !== undefined}
                className={cn(
                  "btn-primary h-11 px-6 text-xs whitespace-nowrap",
                  todayStatus?.timeOut !== '--:--' && todayStatus !== undefined && "opacity-50"
                )}
              >
                {!todayStatus ? <Clock size={16} /> : (todayStatus.timeOut === '--:--' ? <LogOut size={16} /> : <Check size={16} />)}
                <span>{!todayStatus ? 'Clock In' : (todayStatus.timeOut === '--:--' ? 'Clock Out' : 'Session Done')}</span>
              </button>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard 
          title="Total Workforce" 
          value={stats.totalEmployees} 
          description="Total active"
          icon={Users}
          color="blue"
          trend={2.4}
        />
        <StatCard 
          title="Physically Present" 
          value={stats.totalPresent} 
          description={`${((stats.totalPresent / stats.totalEmployees) * 100 || 0).toFixed(0)}% rate`}
          icon={UserCheck}
          color="emerald"
          trend={1.8}
        />
        <StatCard 
          title="Late Admissions" 
          value={stats.totalLate} 
          description="Delayed today"
          icon={Clock}
          color="warning"
          trend={-0.5}
        />
        <StatCard 
          title="Missing Logs" 
          value={stats.totalEmployees - stats.totalPresent} 
          description="No activity log"
          icon={UserMinus}
          color="error"
        />
      </div>

      {/* Quick Actions for Mobile */}
      {setActiveTab && (
        <div className="lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h3 className="mini-label mb-4">Operations Hub</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'employees', label: 'Welfare', icon: Users, color: 'primary' },
              { id: 'attendance', label: 'Terminal', icon: Clock, color: 'secondary' },
              { id: 'leaves', label: 'Leaves', icon: Calendar, color: 'warning' },
              { id: 'reports', label: 'Audit', icon: Shield, color: 'emerald' },
              { id: 'settings', label: 'System', icon: Building2, color: 'error' },
              { id: 'performance', label: 'Rank', icon: Award, color: 'blue' },
            ].map((box) => (
              <button
                key={box.id}
                onClick={() => setActiveTab(box.id)}
                className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col items-center justify-center space-y-2 active:scale-95 transition-all text-center"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-accent/30 text-primary")}>
                  <box.icon size={18} />
                </div>
                <span className="text-[9px] font-extrabold text-primary uppercase tracking-tight truncate w-full">{box.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BentoBox title="Live Operations" subTitle="Active vs Workforce" className="lg:col-span-1">
          <div className="flex flex-col h-full">
            <div className="flex flex-col items-center justify-center py-6 border-b border-border/50 mb-6">
               <span className="text-6xl font-black text-primary tracking-tighter">{stats.totalPresent}</span>
               <span className="text-xs font-bold text-text-gray uppercase tracking-widest mt-1">Personnel Active</span>
            </div>
            
            <div className="space-y-5">
              {Object.entries(stats.campusStats).map(([name, data]: [string, any]) => {
                const percentage = (data.present / data.total) * 100 || 0;
                return (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-tight">{name.replace(' Campus', '')}</span>
                      <span className="text-[10px] font-extrabold text-primary">{data.present}<span className="text-text-gray/40 font-bold mx-1">/</span>{data.total}</span>
                    </div>
                    <div className="h-3 bg-accent/30 rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          percentage > 80 ? "bg-emerald-500" : percentage > 50 ? "bg-secondary" : "bg-warning"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </BentoBox>
        
        <BentoBox title="Security & Compliance" subTitle="Attendance Reliability (Present / Total)" className="lg:col-span-2">
            <div className="h-72 mt-4 text-center">
              <Bar 
                data={{
                  labels: ['Main', 'Johar', 'Masjid', 'Maktab'],
                  datasets: [
                    {
                      label: 'Present',
                      data: [stats.campusStats['Main Campus'].present, stats.campusStats['Johar Campus'].present, stats.campusStats['Masjid Campus'].present, stats.campusStats['Maktab Campus'].present],
                      backgroundColor: '#0066FF',
                      borderRadius: 12,
                      barThickness: 32,
                      stack: 'stack1',
                    },
                    {
                      label: 'Absent/Total',
                      data: [
                        stats.campusStats['Main Campus'].total - stats.campusStats['Main Campus'].present,
                        stats.campusStats['Johar Campus'].total - stats.campusStats['Johar Campus'].present,
                        stats.campusStats['Masjid Campus'].total - stats.campusStats['Masjid Campus'].present,
                        stats.campusStats['Maktab Campus'].total - stats.campusStats['Maktab Campus'].present
                      ],
                      backgroundColor: '#002B4910',
                      borderRadius: { topLeft: 12, topRight: 12 },
                      barThickness: 32,
                      stack: 'stack1',
                    }
                  ]
                }}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    x: { 
                      grid: { display: false }, 
                      ticks: { font: { weight: 'bold' as const } },
                      stacked: true
                    },
                    y: { 
                      grid: { color: '#E2E8F0' }, 
                      ticks: { font: { weight: 'bold' as const } },
                      stacked: true
                    }
                  },
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      align: 'end',
                      labels: { usePointStyle: true, font: { weight: 'bold' as const } }
                    }
                  }
                }}
              />
            </div>
        </BentoBox>
      </div>

      <BentoBox title="Recent Logs" subTitle={`OPERATIONAL SUMMARY: ${targetDate.toUpperCase()}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-6 text-[11px] uppercase font-extrabold text-text-gray tracking-widest">Campus Site</th>
                <th className="pb-6 text-[11px] uppercase font-extrabold text-text-gray tracking-widest">Global Total</th>
                <th className="pb-6 text-[11px] uppercase font-extrabold text-text-gray tracking-widest">Present</th>
                <th className="pb-6 text-[11px] uppercase font-extrabold text-text-gray tracking-widest">Late</th>
                <th className="pb-6 text-[11px] uppercase font-extrabold text-text-gray tracking-widest text-right">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {['Main Campus', 'Johar Campus', 'Masjid Campus', 'Maktab Campus'].map((c: any) => {
                const s = stats.campusStats[c as keyof typeof stats.campusStats];
                const rate = ((s.present / s.total) * 100 || 0).toFixed(1);
                return (
                  <tr key={c} className="group hover:bg-bg transition-all duration-300">
                    <td className="py-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent/30 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                           <Building2 size={18} />
                        </div>
                        <span className="font-extrabold text-primary text-sm tracking-tight">{c}</span>
                      </div>
                    </td>
                    <td className="py-6">
                      <span className="font-bold text-text-dark">{s.total}</span>
                    </td>
                    <td className="py-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-emerald-600">{s.present}</span>
                      </div>
                    </td>
                    <td className="py-6">
                       <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-warning" />
                        <span className="font-bold text-warning">{s.late}</span>
                      </div>
                    </td>
                    <td className="py-6 text-right">
                      <div className="flex items-center justify-end space-x-4">
                        <div className="w-32 h-2 bg-accent/30 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${rate}%` }}
                             className="h-full bg-gradient-to-r from-secondary to-primary rounded-full"
                           />
                        </div>
                        <span className="font-extrabold text-primary text-sm">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </BentoBox>

      {/* Best Employees */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-lg font-extrabold text-primary tracking-tight uppercase">Top Performers</h3>
          <div className="flex bg-white p-1 border border-border rounded-xl w-full sm:w-auto">
            {(['today', 'weekly', 'monthly'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPerformancePeriod(p)} 
                className={cn(
                  "flex-1 sm:flex-none px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg",
                  performancePeriod === p ? "bg-primary text-white" : "text-text-gray hover:text-primary hover:bg-bg"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {bestEmployees.map((emp, i) => (
            <div key={emp.id} className="bg-white rounded-[24px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-border flex items-center space-x-4 hover:shadow-lg transition-all duration-300">
              <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-primary/20 shrink-0">
                {emp.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-primary text-sm tracking-tight truncate">{emp.name}</h4>
                <p className="text-[10px] font-bold text-text-gray uppercase tracking-widest mt-0.5">{(emp?.campus || 'ALL')} | {emp?.id}</p>
                <div className="flex items-center mt-3">
                  <div className="flex-1 h-1.5 bg-accent/30 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${emp.performanceScore}%` }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                    />
                  </div>
                  <span className="text-[10px] font-bold ml-3 text-emerald-600">{emp.displayValue}</span>
                </div>
                <p className="text-[9px] text-text-gray/50 font-bold mt-1 uppercase">{emp.subText}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChartCard = BentoBox;
