
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, AttendanceRecord } from '../../types';
import { Search, Calendar, Award, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle, ChevronRight, User as UserIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatTo12h } from '../../lib/timeUtils';

interface EmployeePerformanceProps {
  employees: Employee[];
}

export const EmployeePerformance: React.FC<EmployeePerformanceProps> = ({ employees }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  const filteredList = useMemo(() => {
    if (!searchTerm) return [];
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, employees]);

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId);
  }, [selectedEmpId, employees]);

  const performanceData = useMemo(() => {
    if (!selectedEmployee) return null;
    
    const records = selectedEmployee.attendance; 
    const totalLogs = records.length;
    
    const presentRecords = records.filter(r => r.status === 'Present' || r.status === 'Late');
    const totalPresent = presentRecords.length;
    const onTime = records.filter(r => r.onTime).length;
    const late = records.filter(r => r.status === 'Late').length;
    
    const totalLateHours = records.reduce((sum, r) => sum + (r.lateHours || 0), 0);
    const totalOvertime = records.reduce((sum, r) => sum + (r.overtime || 0), 0);
    
    const offDays = records.filter(r => r.status === 'Absent' || r.status === 'Leave').length;
    
    const score = totalLogs > 0 ? (onTime / totalLogs) * 100 : 0;
    
    // Dynamic Rating
    let rating = 'EXCELLENT';
    let ratingColor = 'text-emerald-600';
    if (score < 60) { rating = 'CRITICAL'; ratingColor = 'text-rose-600'; }
    else if (score < 75) { rating = 'NEEDS FOCUS'; ratingColor = 'text-orange-600'; }
    else if (score < 85) { rating = 'AVERAGE'; ratingColor = 'text-indigo-600'; }
    else if (score < 95) { rating = 'GOOD'; ratingColor = 'text-secondary'; }

    let streak = 0;
    const sorted = [...selectedEmployee.attendance].sort((a, b) => b.date.localeCompare(a.date));
    for (const r of sorted) {
      if (r.status === 'Present' || r.status === 'Late') {
        if (r.onTime) streak++;
        else break;
      }
      else if (r.status === 'Holiday') continue;
      else break;
    }

    // Calculate Leave Summary
    const approvedLeaves = selectedEmployee.leaveRequests?.filter(l => l.status === 'Approved') || [];
    
    // Detailed Leave Balances
    const lv = selectedEmployee.leaves;
    const leaveStats = {
      an: { t: lv.annual.total, u: lv.annual.used, r: lv.annual.total - lv.annual.used },
      cs: { t: lv.casual.total, u: lv.casual.used, r: lv.casual.total - lv.casual.used },
      md: { t: lv.medical.total, u: lv.medical.used, r: lv.medical.total - lv.medical.used }
    };
    
    return { 
      score, 
      onTime, 
      late, 
      totalPresent,
      offDays,
      totalLateHours,
      totalOvertime,
      approvedLeaves,
      leaveStats,
      rating,
      ratingColor,
      records: sorted.slice(0, 5),
      lateRecords: records.filter(r => r.status === 'Late').sort((a, b) => b.date.localeCompare(a.date)),
      overtimeRecords: records.filter(r => (r.overtime || 0) > 0).sort((a, b) => b.date.localeCompare(a.date))
    };
  }, [selectedEmployee]);

  const [showDetailModal, setShowDetailModal] = useState<'late' | 'overtime' | 'leaves' | null>(null);

  return (
    <div className="flex flex-col h-full space-y-3 animate-in fade-in duration-500 overflow-hidden p-2 sm:p-0">
      {/* Detail Modal Overlay */}
      <AnimatePresence>
        {showDetailModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(null)}
              className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-6 border-b border-border bg-bg flex items-center justify-between">
                <h3 className="text-sm font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  {showDetailModal === 'late' && <Clock className="text-orange-500" size={18} />}
                  {showDetailModal === 'overtime' && <TrendingUp className="text-secondary" size={18} />}
                  {showDetailModal === 'leaves' && <Calendar className="text-rose-500" size={18} />}
                  {showDetailModal === 'late' ? 'LATE ARRIVAL LOGS' : showDetailModal === 'overtime' ? 'OVERTIME CONTRIBUTION LOGS' : 'LEAVE HISTORY'}
                </h3>
                <button onClick={() => setShowDetailModal(null)} className="text-text-gray hover:text-primary transition-colors">
                  <XCircle size={20} />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {showDetailModal === 'leaves' ? (
                  <>
                    {/* Leave Balance Summary Header */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {Object.entries(performanceData?.leaveStats || {}).map(([key, stats]) => (
                        <div key={key} className="bg-bg p-3 rounded-2xl border border-border/50 text-center">
                          <div className="text-[8px] font-black text-text-gray uppercase mb-1">
                            {key === 'an' ? 'Annual' : key === 'cs' ? 'Casual' : 'Medical'}
                          </div>
                          <div className="text-xs font-black text-indigo-600">
                            {stats.t} / {stats.u} / {stats.r}
                          </div>
                          <div className="text-[6px] font-bold text-text-gray/40 uppercase mt-0.5">T / U / R</div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[9px] font-black text-primary uppercase tracking-widest px-1 mb-2">Usage History</h4>
                      {performanceData?.approvedLeaves.map((leave, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-bg rounded-2xl border border-border/50">
                          <div>
                            <div className="text-[10px] font-black text-primary uppercase">{leave.date}</div>
                            <div className="text-[8px] font-bold text-text-gray uppercase mt-0.5">{leave.type} LEAVE</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-black text-rose-500 uppercase tracking-tighter">Approved</div>
                            <div className="text-[7px] font-bold text-text-gray uppercase opacity-40">{leave.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  (showDetailModal === 'late' ? performanceData?.lateRecords : performanceData?.overtimeRecords)?.map((rec, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-bg rounded-2xl border border-border/50">
                      <div>
                        <div className="text-[10px] font-black text-primary uppercase">{rec.date}</div>
                        <div className="text-[8px] font-bold text-text-gray uppercase mt-0.5">
                          {formatTo12h(rec.timeIn)} - {formatTo12h(rec.timeOut)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-[10px] font-black",
                          showDetailModal === 'late' ? "text-orange-600" : "text-secondary"
                        )}>
                          {showDetailModal === 'late' ? `+${rec.lateHours?.toFixed(1)}h Late` : `+${rec.overtime?.toFixed(1)}h OT`}
                        </div>
                        <div className="text-[7px] font-bold text-text-gray uppercase opacity-40">Verified Log</div>
                      </div>
                    </div>
                  ))
                )}
                {((showDetailModal === 'leaves' ? performanceData?.approvedLeaves : (showDetailModal === 'late' ? performanceData?.lateRecords : performanceData?.overtimeRecords))?.length || 0) === 0 && (
                  <div className="py-10 text-center opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-widest">No records found for this category</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Search Header - Ultra Compact */}
      <div className="bg-white px-4 py-2 rounded-2xl border border-border flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-border">
          <Search className="text-secondary" size={16} />
          <h2 className="text-[10px] font-black text-primary uppercase tracking-widest">
            Intel Search
          </h2>
        </div>

        <div className="relative flex-1 group">
          <input 
            type="text"
            placeholder="TYPE OPERATIVE NAME OR ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (selectedEmpId) setSelectedEmpId(null);
            }}
            className="w-full py-1.5 bg-transparent text-[10px] font-black text-primary uppercase tracking-widest outline-none transition-all placeholder:text-text-gray/20"
          />
        </div>

        {selectedEmpId && (
          <button 
            onClick={() => {
              setSelectedEmpId(null);
              setSearchTerm('');
            }}
            className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline px-3 py-1 bg-secondary/5 rounded-lg"
          >
            Clear Selection
          </button>
        )}
      </div>

      {!selectedEmployee ? (
        searchTerm ? (
          <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 animate-in slide-in-from-bottom-2 duration-300">
              {filteredList.map(emp => (
                <button 
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmpId(emp.id);
                    setSearchTerm('');
                  }}
                  className="bg-white p-4 rounded-3xl border border-border hover:border-secondary hover:shadow-lg transition-all text-left flex flex-col group relative overflow-hidden"
                >
                  <div className="absolute right-[-10px] top-[-10px] text-primary/5 group-hover:text-secondary/10 transition-colors">
                    <UserIcon size={64} />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-accent text-primary rounded-xl flex items-center justify-center text-xs font-black shrink-0">
                      {emp.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[10px] font-black text-primary uppercase truncate">{emp.name}</div>
                      <div className="text-[8px] font-bold text-text-gray uppercase truncate">{emp.designation}</div>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-[7px] font-black text-text-gray/50 uppercase tracking-widest">{emp.campus}</span>
                    <div className="bg-bg px-2 py-1 rounded-lg">
                      <ChevronRight size={12} className="text-secondary" />
                    </div>
                  </div>
                </button>
              ))}
              {filteredList.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-20">
                  <p className="text-[10px] font-black uppercase tracking-widest italic">No operatives found in current sector</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-10 space-y-2">
            <UserIcon size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest text-center">Search employee above to extract intelligence</p>
          </div>
        )
      ) : (
        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Main Info Row - Compact */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 shrink-0">
            {/* Minimal Profile */}
            <div className="lg:col-span-1 bg-primary px-4 py-4 rounded-3xl text-white flex items-center gap-3 relative overflow-hidden">
               <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl font-black border border-white/30 shrink-0">
                  {selectedEmployee.name.charAt(0)}
               </div>
               <div className="relative z-10 overflow-hidden">
                  <h3 className="text-xs font-black tracking-tighter uppercase truncate">{selectedEmployee.name}</h3>
                  <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest truncate">{selectedEmployee.designation}</p>
                  <div className="mt-1 text-[7px] font-black uppercase inline-block px-2 py-0.5 bg-white/10 rounded-full border border-white/10">
                    {selectedEmployee.campus}
                  </div>
               </div>
            </div>

            {/* Quick Vitals - Horizontal */}
            <div className="lg:col-span-3 bg-white p-3 rounded-3xl border border-border flex items-center justify-around">
               <div className="text-center">
                  <span className="text-[7px] font-bold text-text-gray uppercase block mb-0.5">Shift</span>
                  <span className="text-[9px] font-black text-primary">{formatTo12h(selectedEmployee.shiftStart)} - {formatTo12h(selectedEmployee.shiftEnd)}</span>
               </div>
               <div className="w-px h-6 bg-border" />
               <div className="text-center">
                  <span className="text-[7px] font-bold text-text-gray uppercase block mb-0.5">Hire Date</span>
                  <span className="text-[9px] font-black text-primary">{selectedEmployee.joiningDate}</span>
               </div>
               <div className="w-px h-6 bg-border" />
               <div className="text-center">
                  <span className="text-[7px] font-bold text-text-gray uppercase block mb-0.5">Status</span>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[7px] font-black rounded uppercase border border-emerald-100">Active</span>
               </div>
            </div>
          </div>

          {/* Stats Grid - Very Compact */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 shrink-0">
            <div className="bg-white p-3 rounded-2xl border border-border text-center shadow-sm">
              <div className="text-base font-black text-primary">{Math.round(performanceData?.score || 0)}%</div>
              <div className="text-[7px] font-black text-text-gray uppercase tracking-widest">Punctuality</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-border text-center shadow-sm">
              <div className="text-base font-black text-emerald-600">{performanceData?.totalPresent}</div>
              <div className="text-[7px] font-black text-text-gray uppercase tracking-widest">Present Days</div>
            </div>
            <button 
              onClick={() => setShowDetailModal('late')}
              className="bg-white p-3 rounded-2xl border border-border text-center shadow-sm hover:border-orange-200 hover:bg-orange-50/10 transition-all group"
            >
               <div className="text-base font-black text-orange-600 group-hover:scale-110 transition-transform">{performanceData?.totalLateHours.toFixed(1)}h</div>
               <div className="text-[7px] font-black text-text-gray uppercase tracking-widest">Late Hours</div>
            </button>
            <button 
              onClick={() => setShowDetailModal('overtime')}
              className="bg-white p-3 rounded-2xl border border-border text-center shadow-sm hover:border-secondary/20 hover:bg-secondary/5 transition-all group"
            >
               <div className="text-base font-black text-secondary group-hover:scale-110 transition-transform">{performanceData?.totalOvertime.toFixed(1)}h</div>
               <div className="text-[7px] font-black text-text-gray uppercase tracking-widest">Overtime</div>
            </button>
            <div className="bg-white p-3 rounded-2xl border border-border text-center shadow-sm">
               <div className="text-base font-black text-rose-500">{performanceData?.offDays}</div>
               <div className="text-[7px] font-black text-text-gray uppercase tracking-widest">Off Days</div>
            </div>
            <button 
              onClick={() => setShowDetailModal('leaves')}
              className="bg-white p-2 rounded-2xl border border-border text-center shadow-sm hover:border-indigo-200 hover:bg-indigo-50/10 transition-all group flex flex-col justify-center items-center min-h-[58px]"
            >
              <div className="grid grid-cols-1 gap-0 w-full">
                <div className="flex items-center justify-center gap-1 leading-none">
                  <span className="text-[6px] font-black text-text-gray/40">AN:</span>
                  <span className="text-[8px] font-black text-indigo-600">{performanceData?.leaveStats.an.t}/{performanceData?.leaveStats.an.u}/{performanceData?.leaveStats.an.r}</span>
                </div>
                <div className="flex items-center justify-center gap-1 leading-none mt-0.5">
                  <span className="text-[6px] font-black text-text-gray/40">CS:</span>
                  <span className="text-[8px] font-black text-indigo-600">{performanceData?.leaveStats.cs.t}/{performanceData?.leaveStats.cs.u}/{performanceData?.leaveStats.cs.r}</span>
                </div>
                <div className="flex items-center justify-center gap-1 leading-none mt-0.5">
                  <span className="text-[6px] font-black text-text-gray/40">MD:</span>
                  <span className="text-[8px] font-black text-indigo-600">{performanceData?.leaveStats.md.t}/{performanceData?.leaveStats.md.u}/{performanceData?.leaveStats.md.r}</span>
                </div>
              </div>
              <div className="text-[6px] font-black text-text-gray uppercase tracking-tighter mt-1">Leaves (T/U/R)</div>
            </button>
          </div>

          {/* Bottom Section - Split */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0 min-b-0 overflow-hidden">
            {/* Performance Visual */}
            <div className="bg-white p-4 rounded-3xl border border-border flex flex-col justify-between">
               <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[9px] font-black text-primary uppercase tracking-widest">Performance Score</h4>
                    <span className={cn("text-[9px] font-black uppercase", performanceData?.ratingColor)}>
                      {performanceData?.rating}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-bg rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${performanceData?.score}%` }} />
                    <div className="h-full bg-warning" style={{ width: `${(performanceData?.late || 0) / (performanceData?.totalPresent || 1) * 100}%` }} />
                  </div>
                  <div className="mt-2 flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[7px] font-black text-text-gray uppercase">On-Time</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                        <span className="text-[7px] font-black text-text-gray uppercase">Delayed</span>
                    </div>
                  </div>
               </div>
               
               <div className="bg-bg/50 p-3 rounded-2xl border border-border/50 mt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={12} className="text-secondary" />
                    <span className="text-[9px] font-black text-primary uppercase">Recommendation</span>
                  </div>
                  <p className="text-[8px] font-medium text-text-gray italic leading-relaxed">
                    {performanceData && performanceData.score > 90 
                      ? "Operative exhibits elite sync status. Highly recommended for advancement/bonus."
                      : performanceData && performanceData.score > 75
                      ? "Operative maintains standard operational efficiency. Consistent patterns observed."
                      : "Performance fluctuation detected. Direct oversight recommended for next cycle."
                    }
                  </p>
               </div>
            </div>

            {/* Compact Logs */}
            <div className="bg-white rounded-3xl border border-border overflow-hidden flex flex-col min-h-0">
              <div className="p-3 border-b border-border bg-bg/30">
                 <h4 className="text-[9px] font-black text-primary uppercase tracking-widest">Recent Logs</h4>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="bg-bg/20 text-[7px] font-black text-text-gray uppercase tracking-widest">
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">In/Out (12h)</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {performanceData?.records.map((rec, i) => (
                      <tr key={i} className="hover:bg-bg/30 transition-colors">
                        <td className="px-3 py-2 text-[9px] font-bold text-primary">{rec.date}</td>
                        <td className="px-3 py-2 text-[9px] font-black text-primary">
                           {formatTo12h(rec.timeIn)} - {formatTo12h(rec.timeOut)}
                        </td>
                        <td className="px-3 py-2">
                           <span className={cn(
                             "text-[7px] font-black px-2 py-0.5 rounded uppercase",
                             rec.status === 'Present' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-warning/10 text-warning border border-warning/20"
                           )}>
                             {rec.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
