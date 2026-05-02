
import React, { useRef } from 'react';
import { Employee, User } from '../../types';
import { Database, Download, Upload, Trash2, AlertTriangle, CheckCircle2, FileJson, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BackupRestoreProps {
  employees: Employee[];
  users: User[];
  onUpdateEmployees: (employees: Employee[]) => void;
  onUpdateUsers: (users: User[]) => void;
}

export const BackupRestore: React.FC<BackupRestoreProps> = ({ employees, users, onUpdateEmployees, onUpdateUsers }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetMonth, setTargetMonth] = React.useState(new Date().toISOString().slice(0, 7));

  const handleBackup = () => {
    const backupData = {
      employees,
      users,
      backupDate: new Date().toISOString(),
      version: "1.0.0"
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fiqh_Academy_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.employees && data.users) {
          if (confirm('Warning: This will overwrite ALL current data with the backup file. Proceed?')) {
            onUpdateEmployees(data.employees);
            onUpdateUsers(data.users);
            alert('Restore completed successfully! Application will refresh.');
            window.location.reload();
          }
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Error parsing backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleRemoveMonthData = () => {
    if (confirm(`CRITICAL ACTION: This will permanently delete ALL attendance records for ${targetMonth} across ALL campuses. Are you absolutely certain?`)) {
      const updatedEmployees = employees.map(emp => ({
        ...emp,
        attendance: emp.attendance.filter(a => !a.date.startsWith(targetMonth))
      }));
      onUpdateEmployees(updatedEmployees);
      alert(`All data for ${targetMonth} has been purged.`);
    }
  };

  const totalAttendanceRecords = employees.reduce((acc, curr) => acc + curr.attendance.length, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="bento-box p-12">
        <div className="flex items-center space-x-6 mb-12 border-b border-bento-bg pb-10">
          <div className="w-16 h-16 bg-bento-ink text-white flex items-center justify-center border border-bento-accent">
            <Database size={32} />
          </div>
          <div>
            <h3 className="font-serif italic text-3xl text-bento-ink tracking-tight">Data Preservation Suite</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 mt-2">ADMINISTRATIVE BACKUP & RECOVERY TERMINAL</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Backup Section */}
          <div className="bg-bento-bg/10 p-10 border border-bento-line flex flex-col items-center text-center space-y-8">
            <div className="w-24 h-24 bg-white text-bento-accent border border-bento-line flex items-center justify-center">
              <Download size={40} />
            </div>
            <div>
              <h4 className="font-serif italic text-xl text-bento-ink">System Export</h4>
              <p className="text-[10px] font-bold text-bento-ink/50 mt-3 px-6 leading-relaxed uppercase tracking-widest">Generate a universal JSON manifest of staff profiles, log data, and leave records.</p>
            </div>
            <div className="w-full pt-8 space-y-4 font-mono">
              <div className="flex justify-between items-center text-[10px] font-bold text-bento-ink/40 uppercase tracking-widest">
                <span>INDEXED ENTITIES</span>
                <span className="font-black text-bento-ink">{employees.length + users.length}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-bento-ink/40 uppercase tracking-widest">
                <span>TOTAL LOG COUNT</span>
                <span className="font-black text-bento-ink">{totalAttendanceRecords} REF</span>
              </div>
              <button 
                onClick={handleBackup}
                className="w-full btn-accent py-4 text-[10px] font-black tracking-[0.2em] uppercase flex items-center justify-center space-x-3"
              >
                <FileJson size={18} />
                <span>DOWNLOAD ARCHIVE</span>
              </button>
            </div>
          </div>

          {/* Restore Section */}
          <div className="bg-bento-bg/10 p-10 border border-bento-line flex flex-col items-center text-center space-y-8">
            <div className="w-24 h-24 bg-white text-bento-ink border border-bento-line flex items-center justify-center">
              <Upload size={40} />
            </div>
            <div>
              <h4 className="font-serif italic text-xl text-bento-ink">Repository Sync</h4>
              <p className="text-[10px] font-bold text-bento-ink/50 mt-3 px-6 leading-relaxed uppercase tracking-widest">Initialize synchronization by importing a previously verified system backup file.</p>
            </div>
            <div className="w-full pt-8 flex flex-col justify-end h-full">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={handleRestore}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full btn-primary py-4 text-[10px] font-black tracking-[0.2em] uppercase flex items-center justify-center space-x-3"
              >
                <Upload size={18} />
                <span>UPLOAD MANIFEST</span>
              </button>
              <div className="text-[9px] font-black text-red-600 uppercase mt-6 tracking-widest opacity-60">CRITICAL: CURRENT REPOSITORY WILL BE OVERWRITTEN</div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 p-10 border-[4px] border-red-100 bg-red-50/20">
          <div className="flex items-center space-x-3 text-red-600 mb-8 border-b border-red-100 pb-6">
            <AlertTriangle size={24} />
            <h4 className="font-black text-xs uppercase tracking-[0.4em]">SYSTEM PURGE PROTOCOL (RESTRICTED)</h4>
          </div>
          <div className="flex flex-wrap items-center gap-10">
            <div className="flex-1 min-w-[300px]">
              <p className="text-[10px] font-bold text-bento-ink/60 uppercase leading-loose tracking-widest">Select a specific temporal marker to wipe all attendance logs. This action is IRREVERSIBLE and affects the global network (ALL CAMPUSES).</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-red-600/40" size={18} />
                <input 
                  type="month" 
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="pl-10 pr-6 py-3 border border-red-200 text-[10px] font-black uppercase bg-white focus:ring-1 focus:ring-red-500"
                />
              </div>
              <button 
                onClick={handleRemoveMonthData}
                className="px-8 py-3 bg-red-600 text-white text-[10px] font-black tracking-widest uppercase hover:bg-black transition-all flex items-center space-x-3"
              >
                <Trash2 size={16} />
                <span>PURGE REGISTRY</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-3 text-bento-ink opacity-20">
        <CheckCircle2 size={16} />
        <span className="text-[9px] font-black uppercase tracking-[0.4em]">SYSTEM HEARTBEAT ACTIVE | SNAPSHOT ENABLED</span>
      </div>
    </div>
  );
};
