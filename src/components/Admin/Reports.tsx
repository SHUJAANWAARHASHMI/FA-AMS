
import React, { useState } from 'react';
import { Employee, User, AttendanceRecord } from '../../types';
import { FileText, Download, Printer, Filter, Calendar, Users, Building2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  employees: Employee[];
  user: User;
}

export const Reports: React.FC<ReportsProps> = ({ employees, user }) => {
  const [reportType, setReportType] = useState('attendance_summary');
  const [targetCampus, setTargetCampus] = useState(user?.campus === 'all' ? 'all' : (user?.campus || 'all'));
  const [targetEmployee, setTargetEmployee] = useState('all');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

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
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text('FIQH ACADEMY', 105, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`Official ${reportType.replace('_', ' ').toUpperCase()} Report`, 105, 23, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${now.toLocaleString()}`, 105, 29, { align: 'center' });
    doc.text(`Period: ${month}`, 105, 34, { align: 'center' });

    let tableData: any[] = [];
    let tableHeaders: string[] = [];

    if (reportType === 'attendance_summary') {
      tableHeaders = ['ID', 'Name', 'Campus', 'Status', 'Days Present', 'Days Late', 'Avg. Performance'];
      tableData = filteredEmployees.map(emp => {
        const monthRecords = emp.attendance.filter(a => a.date.startsWith(month));
        const present = monthRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
        const late = monthRecords.filter(r => r.status === 'Late').length;
        const performance = monthRecords.length > 0 ? ((monthRecords.filter(r => r.onTime).length / monthRecords.length) * 100).toFixed(1) + '%' : 'N/A';
        return [
          emp.id || 'N/A', 
          emp.name || 'N/A', 
          (emp.campus || 'Main Campus').toUpperCase(), 
          emp.status === 'full_time' ? 'FT' : 'PT', 
          present, 
          late, 
          performance
        ];
      });
    } else if (reportType === 'late_arrivals') {
      tableHeaders = ['Date', 'ID', 'Name', 'Designation', 'Time In', 'Shift Start', 'Late Mins'];
      filteredEmployees.forEach(emp => {
        const lateRecords = emp.attendance.filter(a => a.date.startsWith(month) && a.status === 'Late');
        lateRecords.forEach(r => {
          const [inH, inM] = r.timeIn.split(':').map(Number);
          const [sH, sM] = emp.shiftStart.split(':').map(Number);
          const diff = (inH * 60 + inM) - (sH * 60 + sM);
          tableData.push([r.date, emp.id, emp.name, emp.designation, r.timeIn, emp.shiftStart, diff]);
        });
      });
    } else if (reportType === 'overtime_report') {
      tableHeaders = ['Date', 'ID', 'Name', 'Time Out', 'Shift End', 'OT Hours'];
      filteredEmployees.forEach(emp => {
        const otRecords = emp.attendance.filter(a => a.date.startsWith(month) && a.overtime > 0);
        otRecords.forEach(r => {
          tableData.push([r.date, emp.id, emp.name, r.timeOut, emp.shiftEnd, r.overtime.toFixed(1)]);
        });
      });
    } else if (reportType === 'leave_history') {
      tableHeaders = ['ID', 'Name', 'Type', 'From', 'To', 'Days', 'Status'];
      filteredEmployees.forEach(emp => {
        emp.leaveRequests.filter(req => req.from.startsWith(month)).forEach(req => {
          const from = new Date(req.from);
          const to = new Date(req.to);
          const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          tableData.push([emp.id, emp.name, req.type.toUpperCase(), req.from, req.to, days, req.status.toUpperCase()]);
        });
      });
    } else if (reportType === 'employee_credential') {
      tableHeaders = ['ID', 'Name', 'Designation', 'Campus', 'Status'];
      tableData = filteredEmployees.map(emp => [
        emp.id || 'N/A', 
        emp.name || 'N/A', 
        emp.designation || 'N/A', 
        (emp.campus || '').toUpperCase(), 
        (emp.status || '').replace('_', ' ').toUpperCase()
      ]);
    }

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 45,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    doc.save(`Fiqh_Academy_${reportType}_${month}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-10 animate-in fade-in duration-500 max-w-full overflow-hidden">
      <div className="bento-box p-4 sm:p-8">
        <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row items-center justify-between border-b border-bento-bg pb-4 sm:pb-8 gap-3 sm:gap-0">
          <h3 className="font-serif italic text-xl sm:text-2xl flex items-center text-center">
            <FileText className="mr-3 text-bento-accent shrink-0" size={28} />
            Data Compilation Engine
          </h3>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] opacity-30">REGISTRY MODULE V1.2</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-3 sm:p-4 bg-bento-bg/20 border border-bento-line/10">
            <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 sm:mb-3 opacity-60">Output Directory</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-bento-line text-[10px] font-black uppercase appearance-none h-[44px]"
              >
                <option value="attendance_summary">Periodic Attendance Archive</option>
                <option value="late_arrivals">Operational Delta Report</option>
                <option value="overtime_report">Capacity Analysis</option>
                <option value="campus_performance">Terminal KPI Aggregator</option>
                <option value="employee_credential">User Authentication List</option>
                <option value="leave_history">Resource Availability Log</option>
              </select>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-bento-bg/20 border border-bento-line/10">
            <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 sm:mb-3 opacity-60">Terminal Scope</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
              <select 
                value={targetCampus}
                onChange={(e) => setTargetCampus(e.target.value)}
                disabled={user.role !== 'admin' && user.role !== 'mudeer'}
                className="w-full pl-10 pr-4 py-3 bg-white border border-bento-line text-[10px] font-black uppercase appearance-none disabled:opacity-30 h-[44px]"
              >
                 <option value="all">Global Network</option>
                <option value="Main Campus">Main Complex</option>
                <option value="Johar Campus">Johar Facility</option>
                <option value="Masjid Campus">Masjid Grounds</option>
                <option value="Maktab Campus">Maktab Station</option>
              </select>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-bento-bg/20 border border-bento-line/10">
            <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 sm:mb-3 opacity-60">Subject Focus</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
              <select 
                value={targetEmployee}
                onChange={(e) => setTargetEmployee(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-bento-line text-[10px] font-black uppercase appearance-none h-[44px]"
              >
                <option value="all">Universal Population</option>
                {(employees || [])
                  .filter(e => targetCampus === 'all' || e?.campus === targetCampus)
                  .map((e, idx) => <option key={`${e?.id}-${idx}`} value={e?.id}>{e?.id} - {e?.name}</option>)}
              </select>
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-bento-bg/20 border border-bento-line/10">
            <label className="block text-[10px] font-black text-bento-ink uppercase tracking-widest mb-2 sm:mb-3 opacity-60">Temporal Marker</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-bento-ink/40" size={16} />
              <input 
                type="month" 
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-bento-line text-[10px] font-black uppercase h-[44px]"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-2 sm:gap-2 pt-6 sm:pt-10 border-t border-bento-bg">
          <button 
            onClick={generatePDF}
            className="btn-accent px-6 sm:px-10 py-3.5 sm:py-4 text-[10px] sm:text-xs font-black tracking-[0.1em] sm:tracking-[0.2em] uppercase flex items-center justify-center space-x-3 h-[50px] w-full sm:w-auto"
          >
            <Download size={18} />
            <span>EXPORT PDF MANIFEST</span>
          </button>
          <button 
            onClick={handlePrint}
            className="btn-primary px-6 sm:px-10 py-3.5 sm:py-4 text-[10px] sm:text-xs font-black tracking-[0.1em] sm:tracking-[0.2em] uppercase flex items-center justify-center space-x-3 h-[50px] w-full sm:w-auto"
          >
            <Printer size={18} />
            <span>THERMAL PRINT OUT</span>
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bento-box overflow-hidden p-0">
        <div className="p-4 sm:p-6 border-b border-bento-bg flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
          <h4 className="font-serif italic text-base sm:text-lg tracking-tight text-center sm:text-left">System Preview <span className="text-[10px] not-italic font-bold opacity-30 uppercase tracking-[0.2em] sm:tracking-[0.3em] ml-2">FIRST 10 ENTRIES</span></h4>
          <span className="text-[9px] sm:text-[10px] font-black bg-bento-accent/10 text-bento-accent px-3 sm:px-4 py-1 border border-bento-accent/20 uppercase tracking-widest">
            {filteredEmployees.length} INDEXED
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[500px] sm:min-w-0">
            <table className="w-full text-left font-mono text-[9px] sm:text-[10px]">
              <thead className="border-b-2 border-bento-ink/10 opacity-40 uppercase font-bold">
                <tr>
                  <th className="px-4 sm:px-6 py-4">Serial</th>
                  <th className="px-4 sm:px-6 py-4">Entity</th>
                  <th className="px-4 sm:px-6 py-4">Loc</th>
                  <th className="px-4 sm:px-6 py-4 text-center">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bento-bg">
                {filteredEmployees.slice(0, 10).map((emp, idx) => {
                   const monthRecords = emp.attendance.filter(a => a.date.startsWith(month));
                   const perf = monthRecords.length > 0 ? (monthRecords.filter(r => r.onTime).length / monthRecords.length) * 100 : 0;
                   return (
                    <tr key={`${emp.id}-${idx}`} className="hover:bg-bento-bg/10 transition-colors">
                      <td className="px-4 sm:px-6 py-4 font-black text-bento-accent">{emp.id}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="font-black text-bento-ink uppercase truncate max-w-[120px]">{emp.name}</div>
                        <div className="text-[8px] opacity-40 font-bold uppercase truncate max-w-[120px]">{emp.designation}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="status-pill px-2 py-0.5 text-[8px] sm:text-[10px]">
                          {(emp?.campus || 'N/A').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="w-16 sm:w-24 h-1 bg-bento-bg">
                            <div className="h-full bg-bento-accent" style={{ width: `${perf}%` }}></div>
                          </div>
                          <span className="font-black text-[10px] sm:text-[11px] min-w-[30px]">{perf.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                   )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
