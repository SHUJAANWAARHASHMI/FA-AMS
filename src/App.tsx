
import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { usePersistence } from './hooks/usePersistence';
import { User, Employee, UserRole, AppNotification } from './types';
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
  CloudOff,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Portals
import { AdminDashboard } from './components/Admin/Dashboard';
import { ManualAttendance } from './components/Admin/ManualAttendance';
import { SingleAttendance } from './components/Admin/SingleAttendance';
import { EmployeeManagement } from './components/Admin/EmployeeManagement';
import { LeaveManagement } from './components/Admin/LeaveManagement';
import { Reports } from './components/Admin/Reports';
import { BackupRestore } from './components/Admin/BackupRestore';
import { AdminControls } from './components/Admin/AdminControls';
import { EmployeePerformance } from './components/Admin/EmployeePerformance';
import { EmployeePortal } from './components/Employee/EmployeePortal';

type Tab = 'dashboard' | 'manual-attendance' | 'single-attendance' | 'employee-management' | 'leave-management' | 'reports' | 'backup-restore' | 'admin-controls' | 'performance-explorer';

const NavItem = ({ tab, icon: Icon, label, roles, userRole, activeTab, setActiveTab, isSidebarOpen, restrictedForMainMudeer, isMainMudeer, onSelect }: { tab: Tab, icon: any, label: string, roles: UserRole[], userRole: string, activeTab: Tab, setActiveTab: (t: Tab) => void, isSidebarOpen: boolean, restrictedForMainMudeer?: boolean, isMainMudeer?: boolean, onSelect?: () => void }) => {
  if (!roles.includes(userRole as any)) return null;
  if (isMainMudeer && restrictedForMainMudeer) return null;
  
  return (
    <button
      onClick={() => {
        setActiveTab(tab);
        if (onSelect) onSelect();
      }}
      className={cn(
        "flex items-center space-x-3 w-full px-4 py-3 transition-all duration-200 text-sm font-medium rounded-xl",
        activeTab === tab 
          ? "bg-secondary text-white shadow-lg shadow-secondary/20" 
          : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      <Icon size={20} />
      {isSidebarOpen && <span>{label}</span>}
    </button>
  );
};

const MainMudeerNav = ({ activeTab, setActiveTab, onLogout }: { activeTab: Tab, setActiveTab: (t: Tab) => void, onLogout: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const options: { label: string, tab: Tab, icon: any }[] = [
    { label: 'Dashboard', tab: 'dashboard', icon: LayoutDashboard },
    { label: 'Employees', tab: 'employee-management', icon: Users },
    { label: 'Performance', tab: 'performance-explorer', icon: Search },
    { label: 'Leaves', tab: 'leave-management', icon: Briefcase },
    { label: 'Reports', tab: 'reports', icon: FileText },
  ];

  const activeOption = options.find(o => o.tab === activeTab) || options[0];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white border border-border h-12 px-5 rounded-2xl hover:bg-bg transition-all text-primary font-black uppercase text-[10px] tracking-widest shadow-sm active:scale-95"
      >
        <activeOption.icon size={16} className="text-secondary" />
        <span className="hidden sm:inline">{activeOption.label}</span>
        <ChevronDown size={14} className={cn("transition-transform duration-300 ml-1 opacity-50", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-3 w-64 bg-white border border-border shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[24px] z-50 overflow-hidden"
            >
              <div className="p-3 bg-bg/50 border-b border-border">
                <span className="text-[8px] font-black text-text-gray uppercase tracking-[0.2em] px-2">Navigation Core</span>
              </div>
              <div className="p-2 space-y-1">
                {options.map((opt) => (
                  <button
                    key={opt.tab}
                    onClick={() => {
                      setActiveTab(opt.tab);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center space-x-3 w-full px-4 py-3.5 text-left transition-all rounded-xl group",
                      activeTab === opt.tab 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-text-gray hover:bg-bg hover:text-primary"
                    )}
                  >
                    <opt.icon size={18} className={cn(activeTab !== opt.tab && "text-secondary")} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                  </button>
                ))}
                
                <div className="pt-2 mt-2 border-t border-border">
                  <button
                    onClick={() => onLogout()}
                    className="flex items-center space-x-3 w-full px-4 py-3.5 text-left transition-all rounded-xl text-rose-500 hover:bg-rose-50 group"
                  >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Logout System</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const NotificationDropdown = ({ notifications, dismissNotification, setIsNotificationsOpen }: { notifications: AppNotification[], dismissNotification: (id: string) => void, setIsNotificationsOpen: (o: boolean) => void }) => (
  <div className="absolute right-0 top-12 w-80 bg-white border-2 border-bento-line shadow-[8px_8px_0px_#E2E8F0] z-50 max-h-[400px] overflow-y-auto">
    <div className="p-3 border-b-2 border-bento-line bg-slate-50 flex items-center justify-between">
      <span className="text-[10px] font-black uppercase tracking-widest text-bento-ink">Notifications</span>
      {notifications.length > 0 && (
        <button 
          onClick={() => {
            notifications.forEach(n => dismissNotification(n.id));
            setIsNotificationsOpen(false);
          }}
          className="text-[8px] font-bold text-bento-accent uppercase hover:underline"
        >
          Clear All
        </button>
      )}
    </div>
    <div className="divide-y-2 divide-bento-line">
      {notifications.length === 0 ? (
        <div className="p-8 text-center">
          <Bell size={24} className="mx-auto text-slate-300 mb-2" />
          <p className="text-[9px] font-bold text-slate-400 uppercase">No new alerts</p>
        </div>
      ) : (
        notifications.map((notif) => (
          <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors relative group">
            <div className="flex items-start space-x-3">
              <div className={cn(
                "p-1.5 shrink-0 border",
                notif.type === 'success' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                notif.type === 'error' ? "bg-red-50 text-red-600 border-red-100" :
                "bg-bento-accent/10 text-bento-accent border-bento-line"
              )}>
                {notif.type === 'success' ? <CheckCircle size={12} /> : 
                 notif.type === 'error' ? <AlertCircle size={12} /> : 
                 <Info size={12} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-black uppercase tracking-tight text-bento-ink mb-0.5">{notif.title}</div>
                <div className="text-[9px] font-medium text-bento-ink/70 leading-tight">{notif.message}</div>
                <div className="text-[7px] font-bold text-slate-400 mt-1 uppercase">
                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notif.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const NotificationOverlay = ({ notifications, dismissNotification }: { notifications: AppNotification[], dismissNotification: (id: string) => void }) => {
  const firstNotif = notifications[0];
  
  useEffect(() => {
    if (firstNotif) {
      const timer = setTimeout(() => {
        dismissNotification(firstNotif.id);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [firstNotif, dismissNotification]);

  return (
    <div className="absolute top-4 right-4 z-100 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {firstNotif && (
          <motion.div
            key={firstNotif.id}
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className="pointer-events-auto bg-bento-ink text-white p-3 shadow-xl flex items-center space-x-3 w-64 border border-white/10"
          >
            <div className="p-1.5 bg-bento-accent text-white">
              <Bell size={14} className="animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] font-black uppercase tracking-widest text-bento-accent">Alert</div>
              <div className="text-[9px] font-bold truncate uppercase">{firstNotif.title}</div>
            </div>
            <button onClick={() => dismissNotification(firstNotif.id)} className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const { 
    employees, 
    users, 
    systemSettings, 
    currentUser, 
    login, 
    logout, 
    updateEmployees, 
    updateUsers, 
    updateSystemSettings, 
    isSyncing, 
    isOnline,
    isRealtimeActive,
    lastSynced,
    triggerManualSync,
    rebuildCloud,
    notifications,
    dismissNotification
  } = usePersistence();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 640);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentUser) {
    return <Login onLogin={login} />;
  }

  const isEmployeePortal = currentUser ? 'designation' in currentUser : false;
  const userRole = currentUser ? (isEmployeePortal ? 'employee' : (currentUser as User).role) : 'user';
  const isMainMudeer = !isEmployeePortal && (currentUser as User).role === 'mudeer' && (currentUser as User).campus === 'Main Campus';

  const renderContent = () => {
    if (!currentUser) return null;
    if (isEmployeePortal) {
      return <EmployeePortal 
        employee={currentUser as Employee} 
        allEmployees={employees}
        systemSettings={systemSettings}
        isSyncing={isSyncing}
        isOnline={isOnline}
        isRealtimeActive={isRealtimeActive}
        lastSynced={lastSynced}
        onUpdateEmployees={updateEmployees} 
        onLogout={logout}
      />;
    }

    const adminUser = currentUser as User;
    
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard employees={employees} user={adminUser} onUpdateEmployees={updateEmployees} setActiveTab={setActiveTab} />;
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
      case 'performance-explorer':
        return <EmployeePerformance employees={employees} />;
      case 'backup-restore':
        return <BackupRestore 
          employees={employees} 
          users={users} 
          onUpdateEmployees={updateEmployees} 
          onUpdateUsers={updateUsers} 
          onRebuildCloud={rebuildCloud}
        />;
      case 'admin-controls':
        return <AdminControls users={users} user={adminUser} settings={systemSettings} onUpdateUsers={updateUsers} onUpdateSettings={updateSystemSettings} />;
      default:
        return <AdminDashboard employees={employees} user={adminUser} />;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row h-screen bg-bento-bg overflow-hidden font-jakarta">
      {/* Sidebar */}
      {!isEmployeePortal && !isMainMudeer && (
        <aside 
          className={cn(
            "bg-primary text-white transition-all duration-300 flex flex-col z-[60] border-r border-border absolute sm:relative h-full",
            isSidebarOpen ? "w-72 translate-x-0 shadow-2xl" : "w-0 sm:w-24 -translate-x-full sm:translate-x-0 overflow-hidden",
            "sm:translate-x-0"
          )}
        >
          <div className="p-6 h-24 flex items-center">
            {isSidebarOpen ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                  <ShieldCheck size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg leading-none tracking-tight leading-none">FA</span>
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">FIQH ACADEMY</span>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center font-bold shadow-lg mx-auto">
                 <ShieldCheck size={20} />
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scrollbar-hide sm:custom-scrollbar">
            <NavItem tab="dashboard" icon={LayoutDashboard} label="Dashboard" roles={['admin', 'mudeer', 'user']} userRole={userRole} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} isMainMudeer={isMainMudeer} onSelect={() => window.innerWidth < 640 && setIsSidebarOpen(false)} />
            <NavItem tab="performance-explorer" icon={Search} label="Performance" roles={['admin', 'mudeer']} userRole={userRole} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} isMainMudeer={isMainMudeer} onSelect={() => window.innerWidth < 640 && setIsSidebarOpen(false)} />
            <NavItem tab="manual-attendance" icon={CalendarCheck} label="Manual Entry" roles={['admin', 'mudeer', 'user']} userRole={userRole} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} isMainMudeer={isMainMudeer} restrictedForMainMudeer onSelect={() => window.innerWidth < 640 && setIsSidebarOpen(false)} />
            <NavItem tab="single-attendance" icon={UserCheck} label="Quick Check" roles={['admin', 'mudeer', 'user']} userRole={userRole} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} isMainMudeer={isMainMudeer} restrictedForMainMudeer onSelect={() => window.innerWidth < 640 && setIsSidebarOpen(false)} />
            <div className="my-6 border-t border-white/10 mx-2"></div>
            <NavItem tab="employee-management" icon={Users} label="Employees" roles={['admin', 'mudeer']} userRole={userRole} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} isMainMudeer={isMainMudeer} onSelect={() => window.innerWidth < 640 && setIsSidebarOpen(false)} />
            <NavItem tab="leave-management" icon={Briefcase} label="Leaves" roles={['admin', 'mudeer']} userRole={userRole} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} isMainMudeer={isMainMudeer} onSelect={() => window.innerWidth < 640 && setIsSidebarOpen(false)} />
            <NavItem tab="reports" icon={FileText} label="Reports" roles={['admin', 'mudeer', 'user']} userRole={userRole} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} isMainMudeer={isMainMudeer} onSelect={() => window.innerWidth < 640 && setIsSidebarOpen(false)} />
            <NavItem tab="backup-restore" icon={Database} label="System Data" roles={['admin']} userRole={userRole} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} isMainMudeer={isMainMudeer} restrictedForMainMudeer onSelect={() => window.innerWidth < 640 && setIsSidebarOpen(false)} />
            <NavItem tab="admin-controls" icon={ShieldCheck} label="Access Control" roles={['admin', 'mudeer']} userRole={userRole} activeTab={activeTab} setActiveTab={setActiveTab} isSidebarOpen={isSidebarOpen} isMainMudeer={isMainMudeer} restrictedForMainMudeer onSelect={() => window.innerWidth < 640 && setIsSidebarOpen(false)} />
          </nav>

          <div className="p-4 border-t border-white/10">
            <button 
              onClick={logout}
              className="flex items-center space-x-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-white/5 transition-all font-bold uppercase text-xs tracking-widest rounded-xl"
            >
              <LogOut size={18} />
              {isSidebarOpen && <span>Logout System</span>}
            </button>
          </div>
        </aside>
      )}

      {/* Notifications */}
      <NotificationOverlay notifications={notifications} dismissNotification={dismissNotification} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className={cn(
          "bg-white px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 border-b border-border transition-all",
          isEmployeePortal ? "h-14 sm:h-24" : "h-20 sm:h-24"
        )}>
          <div className="flex items-center space-x-3 sm:space-x-8">
             {!isMainMudeer ? (
               <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 hover:bg-bg rounded-lg transition-colors text-text-gray"
                >
                  {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
             ) : (
                <div className="flex items-center space-x-4">
                   <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold shadow-lg">
                      <ShieldCheck size={24} />
                   </div>
                   <MainMudeerNav activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} />
                </div>
             )}
              
              <div className="min-w-0">
                <h2 className="text-xs sm:text-2xl font-extrabold text-primary tracking-tight truncate">
                  {isEmployeePortal ? 'Staff Terminal' : activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </h2>
                <div className="flex items-center space-x-2 sm:space-x-4 text-[10px] sm:text-xs text-text-gray font-bold mt-0.5">
                  <div className="flex items-center space-x-1 sm:space-x-1.5 whitespace-nowrap">
                    <Clock size={12} className="text-secondary sm:w-3.5 sm:h-3.5" />
                    <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                  </div>
                  <div className="w-[1px] h-3 bg-border" />
                  <span className="whitespace-nowrap">{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: '2-digit' })}</span>
                </div>
              </div>
          </div>

          <div className="flex items-center space-x-6">
            {!isEmployeePortal && (
              <div className="relative hidden xl:block group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-text-gray/40 group-focus-within:text-secondary transition-colors">
                  <Search size={18} />
                </span>
                <input 
                  type="text" 
                  placeholder="COMMAND + K TO SEARCH" 
                  className="pl-12 pr-4 h-12 bg-bg border border-border rounded-xl w-72 focus:ring-2 focus:ring-secondary/10 focus:border-secondary focus:outline-none transition-all text-xs font-bold tracking-widest"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              {/* Cloud Sync Status */}
              <div className="flex flex-col items-end hidden sm:flex">
                <button
                  onClick={() => triggerManualSync(true)}
                  disabled={isSyncing}
                  className={cn(
                    "flex items-center space-x-2 px-4 h-11 border transition-all text-xs font-bold rounded-xl",
                    !isOnline 
                      ? "bg-error/5 border-error/20 text-error" 
                      : isSyncing 
                        ? "bg-secondary/5 border-secondary/20 text-secondary animate-pulse" 
                        : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  )}
                >
                  {!isOnline ? <CloudOff size={16} /> : <Cloud size={16} className={cn(isSyncing && "animate-bounce")} />}
                  <span className="hidden xl:inline">
                    {!isOnline ? 'Cloud Offline' : isSyncing ? 'Syncing...' : 'Cloud Active'}
                  </span>
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full ml-1", 
                    isOnline ? (isRealtimeActive ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-emerald-500") : "bg-error"
                  )} />
                </button>
                <span className="text-[7px] font-black uppercase text-text-gray/50 mt-1 mr-1">
                  Synced: {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={cn(
                    "relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl transition-all border",
                    isNotificationsOpen ? "bg-secondary/5 border-secondary/20 text-secondary" : "bg-white border-border text-text-gray hover:bg-bg"
                  )}
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {isNotificationsOpen && <NotificationDropdown notifications={notifications} dismissNotification={dismissNotification} setIsNotificationsOpen={setIsNotificationsOpen} />}
              </div>

              {/* User Profile */}
                <div className="flex items-center pl-3 sm:pl-6 border-l border-border ml-1 sm:ml-2">
                  <div className="flex items-center space-x-2 sm:space-x-3 mr-2 sm:mr-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-extrabold text-primary tracking-tight leading-none">{currentUser?.name || 'User'}</p>
                      <p className="text-[10px] font-bold text-text-gray uppercase tracking-widest mt-1">
                        {isEmployeePortal ? 'STAFF' : (currentUser as User)?.role?.toUpperCase() || 'USER'}
                      </p>
                    </div>
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary text-white rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shadow-lg shadow-secondary/20 overflow-hidden">
                         <span className="relative z-10">{currentUser?.name?.charAt(0) || '?'}</span>
                         <div className="absolute inset-0 bg-gradient-to-tr from-secondary to-secondary-dark opacity-50" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="h-10 px-3 bg-accent/50 border border-secondary/10 rounded-xl hidden md:flex gap-2 items-center text-primary">
                        <Building2 size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">{currentUser?.campus || 'Main Campus'}</span>
                        <ChevronDown size={14} className="text-text-gray" />
                    </div>

                    <button 
                      onClick={logout}
                      className="w-10 h-10 flex items-center justify-center bg-error text-white sm:bg-error/5 sm:text-error rounded-xl border border-error/10 transition-all active:scale-95 group shadow-lg shadow-error/20 sm:shadow-none"
                      title="Logout System"
                    >
                      <LogOut size={18} className="sm:group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className={cn(
          "flex-1 custom-scrollbar scrollbar-hide",
          (isEmployeePortal || activeTab === 'dashboard') ? "p-0 overflow-hidden sm:overflow-y-auto" : "p-4 sm:p-10 overflow-y-auto"
        )}>
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
