
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
  Award
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
}

export const AdminDashboard: React.FC<DashboardProps> = ({ employees, user }) => {
  const [targetDate, setTargetDate] = React.useState(getLocalDate());
  const filteredEmployees = useMemo(() => {
    if (user?.role === 'admin' || user?.role === 'mudeer') return employees;
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
    return [...filteredEmployees]
      .sort((a, b) => {
        const aScore = a.attendance.filter(att => att.onTime).length;
        const bScore = b.attendance.filter(att => att.onTime).length;
        return bScore - aScore;
      })
      .slice(0, 3);
  }, [filteredEmployees]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-full overflow-hidden">
      {/* Stats Grid */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-auto">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
          <input 
            type="date" 
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full sm:w-auto pl-10 pr-4 py-2 border border-bento-line text-[10px] font-black uppercase focus:ring-1 focus:ring-bento-ink focus:outline-hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          title="Employees" 
          value={stats.totalEmployees} 
          description="Global Count"
        />
        <StatCard 
          title="Present" 
          value={stats.totalPresent} 
          description={`${((stats.totalPresent / stats.totalEmployees) * 100 || 0).toFixed(0)}% RATE`}
        />
        <StatCard 
          title="Late" 
          value={stats.totalLate} 
          description="Delayed"
        />
        <StatCard 
          title="Perf." 
          value="94.2%" 
          description="Target 90%"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BentoBox title="Attendance by Campus">
          <div className="h-64 sm:h-64 pt-4">
            <Doughnut data={attendanceByCampusData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }} />
          </div>
        </BentoBox>
        
        <BentoBox title="Performance Distribution">
          <div className="h-64 sm:h-64 pt-4">
            <Pie data={performancePieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }} />
          </div>
        </BentoBox>

        <div className="lg:col-span-2">
          <BentoBox title="Monthly Trend" subTitle="Historical">
            <div className="h-64 sm:h-80 pt-4">
              <Line data={monthlyTrendData} options={{ maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 10, font: { size: 10 } } } }, scales: { x: { ticks: { font: { size: 9 } } }, y: { ticks: { font: { size: 9 } } } } }} />
            </div>
          </BentoBox>
        </div>
      </div>

      {/* Campus Breakdown Table */}
      <BentoBox title="Recent Activity" subTitle={`DATE: ${targetDate.toUpperCase()}`}>
        <div className="overflow-x-auto -mx-5 sm:mx-0">
          <div className="min-w-[600px] sm:min-w-0 p-5 sm:p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-bento-ink/10">
                  <th className="py-2 sm:py-4 text-[10px] uppercase font-bold opacity-40">Campus</th>
                  <th className="py-2 sm:py-4 text-[10px] uppercase font-bold opacity-40">Total</th>
                  <th className="py-2 sm:py-4 text-[10px] uppercase font-bold opacity-40">Pres.</th>
                  <th className="py-2 sm:py-4 text-[10px] uppercase font-bold opacity-40">Late</th>
                  <th className="py-2 sm:py-4 text-[10px] uppercase font-bold opacity-40">Perf %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bento-bg">
                {['Main Campus', 'Johar Campus', 'Masjid Campus', 'Maktab Campus'].map((c: any) => {
                  const s = stats.campusStats[c as keyof typeof stats.campusStats];
                  const rate = ((s.present / s.total) * 100 || 0).toFixed(1);
                  return (
                    <tr key={c} className="hover:bg-bento-bg/30 transition-colors font-mono text-[11px] sm:text-xs">
                      <td className="py-3 sm:py-4 font-bold uppercase">{c}</td>
                      <td className="py-3 sm:py-4">{s.total}</td>
                      <td className="py-3 sm:py-4 text-bento-accent font-bold">{s.present}</td>
                      <td className="py-3 sm:py-4 text-orange-600 font-bold">{s.late}</td>
                      <td className="py-3 sm:py-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-1.5 bg-bento-bg overflow-hidden hidden sm:block">
                            <div 
                              className="h-full bg-bento-accent" 
                              style={{ width: `${rate}%` }}
                            ></div>
                          </div>
                          <span className="font-bold">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </BentoBox>

      {/* Best Employees */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-serif italic text-lg text-bento-ink text-center sm:text-left">Top Performers</h3>
          <div className="flex bg-bento-bg/50 p-1 border border-bento-line/10 w-full sm:w-auto">
            {['today', 'weekly', 'monthly'].map((p) => (
              <button
                key={p}
                onClick={() => {}} // In a real app, update state to filter best employees
                className={cn(
                  "flex-1 sm:flex-none px-6 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all",
                  p === 'monthly' ? "bg-bento-ink text-white" : "text-bento-ink/40 hover:text-bento-ink"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {bestEmployees.map((emp, i) => (
            <div key={emp.id} className="bento-box flex items-center space-x-3 sm:space-x-4 border-l-4 sm:border-l-8 border-l-bento-accent p-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-bento-ink text-white flex items-center justify-center font-mono font-bold text-lg sm:text-xl shrink-0">
                {emp.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-xs uppercase tracking-tight truncate">{emp.name}</h4>
                <p className="text-[9px] sm:text-[10px] font-bold opacity-40 uppercase tracking-widest">{(emp?.campus || 'ALL')} | {emp?.id}</p>
                <div className="flex items-center mt-1.5">
                  <div className="flex-1 h-1 bg-bento-bg">
                    <div className="h-full bg-bento-accent" style={{ width: `${100 - i * 5}%` }}></div>
                  </div>
                  <span className="text-[9px] font-mono font-bold ml-2 text-bento-accent">{(98.5 - i * 1.2).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, description }: any) => {
  return (
    <div className="stat-card">
      <div className="stat-label">{title}</div>
      <div className="flex flex-col mt-4">
        <span className="stat-value">{value}</span>
        <span className="text-[10px] font-bold text-bento-accent mt-2 tracking-widest uppercase">{description}</span>
      </div>
    </div>
  );
};

const BentoBox = ({ title, children, className, subTitle }: any) => (
  <div className={cn("bento-box", className)}>
    <div className="bento-header">
      <span>{title}</span>
      {subTitle && <span className="text-[10px] font-bold not-italic opacity-40 uppercase tracking-widest">{subTitle}</span>}
    </div>
    <div className="relative">
      {children}
    </div>
  </div>
);

const ChartCard = BentoBox;
