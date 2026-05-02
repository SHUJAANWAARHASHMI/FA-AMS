
import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { usePersistence } from './hooks/usePersistence';
import { User, Employee, UserRole } from './types';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  UserCheck, 
  FileText, 
  Settings, 
  LogOut, 
  Clock,
  Briefcase,
  Database,
  ShieldCheck,
  Menu,
  X,
  Bell,
  Search,
  Cloud,
  CloudOff
} from 'lucide-react';
import { cn } from './lib/utils';

// Portals
import { AdminDashboard } from './components/Admin/Dashboard';
import { ManualAttendance } from './components/Admin/ManualAttendance';
import { SingleAttendance } from './components/Admin/SingleAttendance';
import { EmployeeManagement } from './components/Admin/EmployeeManagement';
import { LeaveManagement } from './components/Admin/LeaveManagement';
import { Reports } from './components/Admin/Reports';
import { BackupRestore } from './components/Admin/BackupRestore';
import { AdminControls } from './components/Admin/AdminControls';
import { EmployeePortal } from './components/Employee/EmployeePortal';

type Tab = 'dashboard' | 'manual-attendance' | 'single-attendance' | 'employee-management' | 'leave-management' | 'reports' | 'backup-restore' | 'admin-controls';

export default function App() {
  const { employees, users, currentUser, login, logout, updateEmployees, updateUsers, isSyncing } = usePersistence();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) {
    return <Login onLogin={login} />;
  }

  // Determine if it's an employee or a user
  const isEmployeePortal = 'designation' in currentUser;
  const userRole = isEmployeePortal ? 'employee' : (currentUser as User).role;

  const NavItem = ({ tab, icon: Icon, label, roles }: { tab: Tab, icon: any, label: string, roles: UserRole[] }) => {
    if (!roles.includes(userRole)) return null;
    
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={cn(
          "flex items-center space-x-3 w-full px-6 py-3 transition-all duration-200 text-sm font-bold uppercase tracking-tight",
          activeTab === tab 
            ? "bg-bento-ink text-white border-r-4 border-bento-accent" 
            : "text-bento-ink opacity-60 hover:opacity-100 hover:bg-black/5"
        )}
      >
        <Icon size={18} />
        {isSidebarOpen && <span>{label}</span>}
      </button>
    );
  };

  const renderContent = () => {
    if (isEmployeePortal) {
      return <EmployeePortal 
        employee={currentUser as Employee} 
        allEmployees={employees}
        onUpdateEmployees={updateEmployees} 
        onLogout={logout}
      />;
    }

    const adminUser = currentUser as User;
    
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard employees={employees} user={adminUser} />;
      case 'manual-attendance':
        return <ManualAttendance employees={employees} user={adminUser} onUpdateEmployees={updateEmployees} />;
      case 'single-attendance':
        return <SingleAttendance employees={employees} user={adminUser} onUpdateEmployees={updateEmployees} />;
      case 'employee-management':
        return <EmployeeManagement employees={employees} user={adminUser} onUpdateEmployees={updateEmployees} />;
      case 'leave-management':
        return <LeaveManagement employees={employees} user={adminUser} onUpdateEmployees={updateEmployees} />;
      case 'reports':
        return <Reports employees={employees} user={adminUser} />;
      case 'backup-restore':
        return <BackupRestore employees={employees} users={users} onUpdateEmployees={updateEmployees} onUpdateUsers={updateUsers} />;
      case 'admin-controls':
        return <AdminControls users={users} user={adminUser} onUpdateUsers={updateUsers} />;
      default:
        return <AdminDashboard employees={employees} user={adminUser} />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen bg-bento-bg overflow-hidden font-jakarta">
      {/* Mobile Header */}
      {!isEmployeePortal && (
        <div className="sm:hidden bg-white border-b border-bento-line p-4 flex items-center justify-between z-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-bento-accent text-white flex items-center justify-center font-mono font-bold text-sm">FA</div>
            <span className="font-black text-sm tracking-tighter uppercase">FIQH <span className="font-light opacity-60">ACADEMY</span></span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-black/5"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      )}

      {/* Sidebar */}
      {!isEmployeePortal && (
        <aside 
          className={cn(
            "bg-white text-bento-ink transition-all duration-300 flex flex-col z-[60] border-r border-bento-line absolute sm:relative h-full",
            isSidebarOpen ? "w-64 translate-x-0" : "w-0 sm:w-20 -translate-x-full sm:translate-x-0",
            "sm:translate-x-0"
          )}
        >
          <div className="p-4 hidden sm:flex items-center justify-between border-b-2 border-bento-line h-20">
            {isSidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-bento-accent text-white flex items-center justify-center font-mono font-bold">FA</div>
                <span className="font-black text-lg tracking-tighter uppercase">FIQH <span className="font-light opacity-60">ACADEMY</span></span>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-black/5 transition-colors ml-auto"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto pt-6 space-y-1 custom-scrollbar">
            <NavItem tab="dashboard" icon={LayoutDashboard} label="Dashboard" roles={['admin', 'mudeer', 'user']} />
            <NavItem tab="manual-attendance" icon={CalendarCheck} label="Manual Entry" roles={['admin', 'mudeer', 'user']} />
            <NavItem tab="single-attendance" icon={UserCheck} label="Quick Check" roles={['admin', 'mudeer', 'user']} />
            <div className="my-4 border-t border-bento-line/10 mx-6"></div>
            <NavItem tab="employee-management" icon={Users} label="Employees" roles={['admin', 'mudeer']} />
            <NavItem tab="leave-management" icon={Briefcase} label="Leaves" roles={['admin', 'mudeer']} />
            <NavItem tab="reports" icon={FileText} label="Reports" roles={['admin', 'mudeer', 'user']} />
            <NavItem tab="backup-restore" icon={Database} label="System Data" roles={['admin']} />
            <NavItem tab="admin-controls" icon={ShieldCheck} label="Access Control" roles={['admin', 'mudeer']} />
          </nav>

          <div className="p-4 border-t border-bento-line">
            <button 
              onClick={logout}
              className="flex items-center space-x-3 w-full px-6 py-3 text-red-600 hover:bg-red-50 transition-all font-bold uppercase text-xs tracking-widest"
            >
              <LogOut size={18} />
              {isSidebarOpen && <span>Logout System</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="bg-white px-4 sm:px-10 py-4 sm:h-20 border-b-2 border-bento-line flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 sticky top-0 z-40">
          <div className="flex flex-col sm:flex-row items-center sm:space-x-8 w-full sm:w-auto">
            <div className="text-center sm:text-left w-full sm:w-auto">
              <h2 className="text-lg sm:text-xl font-black text-bento-ink uppercase tracking-tighter">
                {isEmployeePortal ? 'Employee Portal' : activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h2>
              <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 text-[9px] sm:text-[10px] text-bento-ink/50 font-mono font-bold uppercase tracking-wider mt-1 sm:mt-0">
                <Clock size={10} className="sm:w-3 sm:h-3" />
                <span className="real-time-clock">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="mx-0.5 opacity-20">|</span>
                <span className="hidden sm:inline">{currentTime.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <span className="sm:hidden">{currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end space-x-4 sm:space-x-10 w-full sm:w-auto mt-2 sm:mt-0">
            {!isEmployeePortal && (
              <div className="relative hidden xl:block">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-bento-ink/40">
                  <Search size={16} />
                </span>
                <input 
                  type="text" 
                  placeholder="COMMAND + K TO SEARCH" 
                  className="pl-10 pr-4 py-2 bg-bento-bg/50 border border-bento-line rounded-none w-64 focus:ring-1 focus:ring-bento-ink focus:outline-hidden transition-all text-[10px] font-bold tracking-widest uppercase"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Cloud Sync Status */}
              <div 
                className={cn(
                  "flex items-center space-x-2 px-3 py-1.5 border transition-all text-[8px] font-black uppercase tracking-widest",
                  isSyncing 
                    ? "bg-bento-accent/10 border-bento-accent/30 text-bento-accent animate-pulse" 
                    : "bg-emerald-50 border-emerald-100 text-emerald-700"
                )}
              >
                <Cloud size={12} className={cn(isSyncing && "animate-bounce")} />
                <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Cloud Active'}</span>
              </div>

              <button className="relative p-2 text-bento-ink/60 hover:text-bento-ink transition-colors">
                <Bell size={20} className="sm:w-6 sm:h-6" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-bento-accent border-2 border-white"></span>
              </button>
              
              <button 
                onClick={logout}
                className="p-2 text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 flex items-center justify-center shrink-0"
                title="LOGOUT SYSTEM"
              >
                <LogOut size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 pl-3 sm:pl-8 border-l border-bento-line">
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-black text-bento-ink uppercase tracking-tighter truncate max-w-[100px]">{currentUser.name}</p>
                <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                  <span className="text-[8px] sm:text-[9px] font-bold text-white bg-bento-accent px-1 sm:px-1.5 py-0.5 uppercase tracking-widest leading-none">
                    {isEmployeePortal ? 'STAFF' : (currentUser as User).role.toUpperCase()}
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold text-bento-ink opacity-40 uppercase tracking-widest truncate max-w-[50px]">{currentUser.campus}</span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-bento-ink text-white flex items-center justify-center font-mono font-bold text-base sm:text-xl border border-bento-line shadow-[2px_2px_0px_#2A5C43] sm:shadow-[4px_4px_0px_#2A5C43] shrink-0">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-10 custom-scrollbar">
          {renderContent()}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

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
