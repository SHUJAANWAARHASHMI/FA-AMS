
import React, { useState } from 'react';
import { Employee, User, AttendanceRecord } from '../../types';
import { FileText, Download, Printer, Filter, Calendar, Users, Building2, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  employees: Employee[];
  user: User;
}

export const Reports: React.FC<ReportsProps> = ({ employees, user }) => {
  const isManagement = user.role === 'admin' || (user.role === 'mudeer' && user.campus === 'Main Campus');
  const [reportType, setReportType] = useState('attendance_summary');
  const [targetCampus, setTargetCampus] = useState(isManagement ? 'all' : user.campus);
  const [targetEmployee, setTargetEmployee] = useState('all');
  
  const today = new Date().toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState(today);

  const setPreset = (type: 'daily' | 'weekly' | 'monthly') => {
    const end = new Date();
    const start = new Date();
    if (type === 'daily') {
      // already set
    } else if (type === 'weekly') {
      start.setDate(end.getDate() - 7);
    } else if (type === 'monthly') {
      start.setMonth(end.getMonth() - 1);
    }
    setFromDate(start.toISOString().slice(0, 10));
    setToDate(end.toISOString().slice(0, 10));
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesCampus = targetCampus === 'all' || (emp?.campus === targetCampus);
    const matchesEmployee = targetEmployee === 'all' || emp.id === targetEmployee;
    return matchesCampus && matchesEmployee;
  });

  const generatePDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 102, 255); // primary color
    doc.text('FIQH ACADEMY', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(40);
    doc.text(`Official ${reportType.replace('_', ' ').toUpperCase()} Report`, 105, 23, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${now.toLocaleString()}`, 105, 29, { align: 'center' });
    doc.text(`Period: ${fromDate} to ${toDate}`, 105, 34, { align: 'center' });
    doc.text(`Campus: ${targetCampus === 'all' ? 'All Campuses' : targetCampus}`, 105, 39, { align: 'center' });

    let tableData: any[] = [];
    let tableHeaders: string[] = [];

    const isWithinRange = (date: string) => date >= fromDate && date <= toDate;

    if (reportType === 'attendance_summary') {
      tableHeaders = ['ID', 'Name', 'Campus', 'Total Logs', 'Present', 'Late', 'Performance'];
      tableData = filteredEmployees.map(emp => {
        const periodRecords = emp.attendance.filter(a => isWithinRange(a.date));
        const present = periodRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
        const late = periodRecords.filter(r => r.status === 'Late').length;
        const performance = periodRecords.length > 0 ? ((periodRecords.filter(r => r.onTime).length / periodRecords.length) * 100).toFixed(1) + '%' : '0%';
        return [
          emp.id, 
          emp.name, 
          emp.campus, 
          periodRecords.length,
          present, 
          late, 
          performance
        ];
      });
    } else if (reportType === 'leave_history') {
      tableHeaders = ['ID', 'Name', 'Leave Type', 'From', 'To', 'Reason', 'Status'];
      filteredEmployees.forEach(emp => {
        emp.leaveRequests.filter(req => req.from >= fromDate && req.from <= toDate).forEach(req => {
          tableData.push([emp.id, emp.name, req.type, req.from, req.to, req.reason, req.status]);
        });
      });
    } else if (reportType === 'campus_performance') {
      tableHeaders = ['Campus', 'Total Staff', 'Avg. Attendance %', 'Total Late', 'Top Performer'];
      const campuses = targetCampus === 'all' ? ['Main Campus', 'Johar Campus', 'Masjid Campus', 'Maktab Campus'] : [targetCampus];
      tableData = campuses.map(c => {
         const campusEmps = employees.filter(e => e.campus === c);
         let totalLogs = 0;
         let onTimeLogs = 0;
         let totalLate = 0;
         let bestEmp = 'N/A';
         let bestScore = -1;

         campusEmps.forEach(e => {
            const range = e.attendance.filter(a => isWithinRange(a.date));
            totalLogs += range.length;
            onTimeLogs += range.filter(r => r.onTime).length;
            totalLate += range.filter(r => r.status === 'Late').length;
            
            const score = range.length > 0 ? (range.filter(r => r.onTime).length / range.length) : 0;
            if (score > bestScore && range.length > 0) {
               bestScore = score;
               bestEmp = e.name;
            }
         });

         const avgPerf = totalLogs > 0 ? ((onTimeLogs / totalLogs) * 100).toFixed(1) + '%' : '0%';
         return [c, campusEmps.length, avgPerf, totalLate, bestEmp];
      });
    }

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 48,
      theme: 'grid',
      headStyles: { fillColor: [0, 102, 255], fontStyle: 'bold', textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    doc.save(`FIQH_REPORT_${reportType.toUpperCase()}_${fromDate}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Configuration Box */}
      <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-border shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black text-primary tracking-tighter uppercase flex items-center gap-3">
              <FileText className="text-secondary" size={28} />
              Analytical Core
            </h3>
            <p className="text-xs font-bold text-text-gray uppercase tracking-widest mt-1">Personnel Intelligence Protocol</p>
          </div>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map(p => (
              <button 
                key={p}
                onClick={() => setPreset(p)}
                className="px-4 py-2 bg-accent/50 hover:bg-accent text-[10px] font-black text-primary uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-primary/5"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Report Type */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Filter size={12} className="text-secondary" />
              Category
            </label>
            <div className="relative group">
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full pl-5 pr-10 py-4 bg-bg border border-border rounded-2xl text-[11px] font-bold text-primary uppercase appearance-none focus:ring-4 focus:ring-secondary/5 focus:border-secondary outline-none transition-all"
              >
                <option value="attendance_summary">Attendance Analytics</option>
                <option value="leave_history">Leave Registry</option>
                <option value="campus_performance">Performance Summary</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray pointer-events-none group-focus-within:rotate-180 transition-transform" size={16} />
            </div>
          </div>

          {/* Campus Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Building2 size={12} className="text-secondary" />
              Deployment Location
            </label>
            <div className="relative group">
              <select 
                value={targetCampus}
                onChange={(e) => setTargetCampus(e.target.value)}
                disabled={!isManagement}
                className="w-full pl-5 pr-10 py-4 bg-bg border border-border rounded-2xl text-[11px] font-bold text-primary uppercase appearance-none focus:ring-4 focus:ring-secondary/5 focus:border-secondary outline-none transition-all disabled:opacity-50"
              >
                {isManagement && <option value="all">All Campuses</option>}
                <option value="Main Campus">Main Campus</option>
                <option value="Johar Campus">Johar Campus</option>
                <option value="Masjid Campus">Masjid Campus</option>
                <option value="Maktab Campus">Maktab Campus</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-gray pointer-events-none group-focus-within:rotate-180 transition-transform" size={16} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} className="text-secondary" />
                  Initial
                </label>
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-5 py-4 bg-bg border border-border rounded-2xl text-[11px] font-bold text-primary focus:ring-4 focus:ring-secondary/5 outline-none"
                />
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} className="text-secondary" />
                  Terminal
                </label>
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-5 py-4 bg-bg border border-border rounded-2xl text-[11px] font-bold text-primary focus:ring-4 focus:ring-secondary/5 outline-none"
                />
             </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button 
            onClick={generatePDF}
            className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
          >
            <Download size={18} />
            Execute PDF Export
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 bg-white border border-border text-primary py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-bg transition-all active:scale-[0.98]"
          >
            <Printer size={18} />
            Interface Print
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-[32px] border border-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between bg-bg/30">
          <h4 className="text-sm font-black text-primary uppercase tracking-widest">Protocol Preview</h4>
          <span className="text-[9px] font-black bg-secondary text-white px-3 py-1 rounded-full uppercase tracking-widest">
            {filteredEmployees.length} OPERATIVES
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left font-jakarta border-collapse">
            <thead>
              <tr className="bg-bg/50">
                <th className="px-6 py-4 text-[10px] font-black text-text-gray uppercase tracking-widest">Operative</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-gray uppercase tracking-widest text-center">Sync Score</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-gray uppercase tracking-widest">Deployment</th>
                <th className="px-6 py-4 text-[10px] font-black text-text-gray uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEmployees.slice(0, 10).map((emp) => {
                 const range = emp.attendance.filter(a => a.date >= fromDate && a.date <= toDate);
                 const score = range.length > 0 ? (range.filter(r => r.onTime).length / range.length) * 100 : 0;
                 return (
                  <tr key={emp.id} className="hover:bg-bg/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent text-primary rounded-lg flex items-center justify-center font-black text-xs">{emp.name.charAt(0)}</div>
                        <div>
                          <div className="text-xs font-black text-primary">{emp.name}</div>
                          <div className="text-[9px] font-bold text-text-gray uppercase">{emp.designation}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-center">
                        <div className="text-xs font-black text-primary mb-1">{Math.round(score)}%</div>
                        <div className="w-20 h-1bg-bg rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-1000", score > 80 ? "bg-emerald-500" : score > 50 ? "bg-warning" : "bg-error")} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-primary uppercase">{emp.campus}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                        emp.status === 'full_time' ? "bg-emerald-50 text-emerald-600" : "bg-secondary/10 text-secondary"
                      )}>
                        {emp.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                 )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
