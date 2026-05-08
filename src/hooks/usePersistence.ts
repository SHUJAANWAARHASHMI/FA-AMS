
import { useState, useEffect, useRef } from 'react';
import { Employee, User, SystemSettings, AppNotification } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_USERS } from '../data/initialData';
import { supabaseService } from '../services/supabaseService';
import { normalizeCampus } from '../lib/utils';

export function usePersistence() {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('fa_employees');
    const data = saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    return data.map((e: any) => ({ ...e, campus: normalizeCampus(e?.campus || 'main') }));
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('fa_users');
    const data = saved ? JSON.parse(saved) : INITIAL_USERS;
    return data.map((u: any) => ({ ...u, campus: normalizeCampus(u?.campus || 'main') }));
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('fa_settings');
    const defaultSettings: SystemSettings = { enforceLocation: true, autoSyncEnabled: true, syncInterval: 300 };
    if (!saved) return defaultSettings;
    try {
      const parsed = JSON.parse(saved);
      return { ...defaultSettings, ...parsed };
    } catch (e) {
      return defaultSettings;
    }
  });

  const [currentUser, setCurrentUser] = useState<User | Employee | null>(() => {
    const saved = localStorage.getItem('fa_current_user');
    if (!saved || saved === 'null') return null;
    try {
      const data = JSON.parse(saved);
      if (!data) return null;
      return { ...data, campus: normalizeCampus(data.campus) };
    } catch (e) {
      console.error('Failed to parse current user:', e);
      return null;
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const isFirstSyncDone = useRef(false);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newNotif: AppNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Detect data changes for notifications
  const detectChanges = (oldEmps: Employee[], newEmps: Employee[], user: User | Employee | null) => {
    if (!user || oldEmps.length === 0 || !isFirstSyncDone.current) return;

    const isAdmin = 'role' in user && (user.role === 'admin' || user.role === 'mudeer');
    const isEmployee = 'designation' in user;

    if (isAdmin) {
      // Check for NEW leave requests for Admin
      newEmps.forEach(newEmp => {
        const oldEmp = oldEmps.find(e => e.id === newEmp.id);
        const newRequests = newEmp.leaveRequests.filter(nr => 
          nr.status === 'Pending' && (!oldEmp || !oldEmp.leaveRequests.find(or => or.id === nr.id))
        );

        if (newRequests.length > 0) {
          addNotification(
            'New Leave Request', 
            `${newEmp.name} submitted a ${newRequests[0].type} leave request.`,
            'info'
          );
        }
      });
    }

    if (isEmployee) {
      // Check for STATUS changes for Employee
      const oldMe = oldEmps.find(e => e.id === user.id);
      const newMe = newEmps.find(e => e.id === user.id);

      if (oldMe && newMe) {
        newMe.leaveRequests.forEach(nr => {
          const oldReq = oldMe.leaveRequests.find(or => or.id === nr.id);
          if (oldReq && oldReq.status !== nr.status) {
            addNotification(
              'Leave Request Updated',
              `Your ${nr.type} leave (${nr.from} to ${nr.to}) is now ${nr.status.toUpperCase()}.`,
              nr.status === 'Approved' ? 'success' : 'error'
            );
          }
        });
      }
    }
  };

  // Load from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsSyncing(true);
        console.log('Fetching data from Supabase...');
        const [dbEmployees, dbUsers, dbSettings] = await Promise.all([
          supabaseService.getEmployees(),
          supabaseService.getAdminUsers(),
          supabaseService.getSystemSettings()
        ]);

        setIsOnline(true);
        if (dbSettings) {
          setSystemSettings(dbSettings);
        }

        if (dbEmployees.length > 0) {
          console.log(`Found ${dbEmployees.length} employees in Supabase`);
          setEmployees(dbEmployees.map((e: any) => ({ ...e, campus: normalizeCampus(e?.campus || 'main') })));
        } else {
          console.log('Supabase empty, initializing with local data...');
          // Force sync local employees to Supabase
          await forceSyncEmployeesToSupabase(employees);
        }

        if (dbUsers.length > 0) {
          console.log(`Found ${dbUsers.length} admin users in Supabase`);
          setUsers(dbUsers.map((u: any) => ({ ...u, campus: normalizeCampus(u?.campus || 'main') })));
        } else {
          // Initialize users if empty
          users.forEach(u => supabaseService.saveAdminUser(u));
        }

        // Mark initial sync as done
        isFirstSyncDone.current = true;
      } catch (err) {
        console.error('Failed to fetch from Supabase:', err);
        setIsOnline(false);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchData();
  }, []);

  const forceSyncEmployeesToSupabase = async (employeeList: Employee[]) => {
    try {
      for (const emp of employeeList) {
        await supabaseService.saveEmployee(emp);
        if (emp.attendance.length > 0) {
          await supabaseService.upsertAttendance(emp.id, emp.attendance);
        }
        for (const req of emp.leaveRequests) {
          await supabaseService.upsertLeaveRequest(emp.id, req);
        }
      }
    } catch (err) {
      console.error('Force sync error:', err);
    }
  };

  useEffect(() => {
    localStorage.setItem('fa_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('fa_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('fa_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('fa_settings', JSON.stringify(systemSettings));
  }, [systemSettings]);

  // Keep currentUser in sync with the employees/users lists
  useEffect(() => {
    if (!currentUser) return;

    if ('designation' in currentUser) {
      const updated = employees.find(e => e.id === currentUser.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
      }
    } else {
      const updated = users.find(u => u.username === (currentUser as User).username);
      if (updated && JSON.stringify(updated) !== JSON.stringify(currentUser)) {
        setCurrentUser(updated);
      }
    }
  }, [employees, users]);

  const updateSystemSettings = async (newSettings: SystemSettings) => {
    // Optimistic update
    setSystemSettings(newSettings);
    localStorage.setItem('fa_settings', JSON.stringify(newSettings));
    
    setIsSyncing(true);
    try {
      await supabaseService.saveSystemSettings(newSettings);
    } catch (err) {
      console.warn('Failed to sync system settings to cloud, strictly using local storage:', err);
      // We don't rollback state here because we want local to work if DB fails
    } finally {
      setIsSyncing(false);
    }
  };

  const login = (username: string, password: string, portal: 'admin' | 'employee', campus?: string, rememberMe?: boolean) => {
    const normalizedUsername = username.toLowerCase();
    if (portal === 'admin') {
      const user = users.find(u => u.username.toLowerCase() === normalizedUsername && u.password === password && (u.campus === campus || u.role === 'admin'));
      if (user) {
        if (user.accountLocked) {
          return { success: false, locked: true };
        }
        setCurrentUser(user);
        return { success: true, user };
      }
    } else {
      const employee = employees.find(e => e.username.toLowerCase() === normalizedUsername && e.password === password);
      if (employee) {
        if (employee.accountLocked) {
          return { success: false, locked: true };
        }
        const userObj: Employee = { ...employee };
        setCurrentUser(userObj);
        return { success: true, user: userObj };
      }
    }
    return { success: false };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateEmployees = async (newEmployees: Employee[]) => {
    const oldEmployees = employees;
    setEmployees(newEmployees);
    
    setIsSyncing(true);
    try {
      // Find what changed
      const addedOrUpdated = newEmployees.filter(newEmp => {
        const oldEmp = oldEmployees.find(e => e.id === newEmp.id);
        return !oldEmp || JSON.stringify(oldEmp) !== JSON.stringify(newEmp);
      });

      const deleted = oldEmployees.filter(oldEmp => !newEmployees.find(e => e.id === oldEmp.id));

      // Sync added/updated
      const syncPromises = addedOrUpdated.map(async (emp) => {
        const oldEmp = oldEmployees.find(e => e.id === emp.id);
        
        // Always save employee basic info if they are new or changed
        await supabaseService.saveEmployee(emp);
        
        // Find specifically which attendance records changed or are new
        const changedAttendance = emp.attendance.filter(record => {
          if (!oldEmp) return true;
          const oldRecord = oldEmp.attendance.find(r => r.date === record.date);
          return !oldRecord || JSON.stringify(oldRecord) !== JSON.stringify(record);
        });

        if (changedAttendance.length > 0) {
          await supabaseService.upsertAttendance(emp.id, changedAttendance);
        }
        
        // Handle leave requests specifically too
        const changedLeaves = emp.leaveRequests.filter(req => {
          if (!oldEmp) return true;
          const oldReq = oldEmp.leaveRequests.find(r => r.id === req.id);
          return !oldReq || JSON.stringify(oldReq) !== JSON.stringify(req);
        });

        for (const req of changedLeaves) {
          await supabaseService.upsertLeaveRequest(emp.id, req);
        }
      });

      // Sync deletions
      const deletePromises = deleted.map(emp => supabaseService.deleteEmployee(emp.id));

      await Promise.all([...syncPromises, ...deletePromises]);
    } catch (err) {
      console.error('Supabase sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateUsers = async (newUsers: User[]) => {
    const oldUsers = users;
    setUsers(newUsers);
    
    setIsSyncing(true);
    try {
      // Find what changed
      const addedOrUpdated = newUsers.filter(newUser => {
        const oldUser = oldUsers.find(u => u.id === newUser.id);
        return !oldUser || JSON.stringify(oldUser) !== JSON.stringify(newUser);
      });

      const deleted = oldUsers.filter(oldUser => !newUsers.find(u => u.id === oldUser.id));

      // Sync added/updated
      const syncPromises = addedOrUpdated.map(user => supabaseService.saveAdminUser(user));

      // Sync deletions
      const deletePromises = deleted.map(user => supabaseService.deleteAdminUser(user.id));

      await Promise.all([...syncPromises, ...deletePromises]);
    } catch (err) {
      console.error('Supabase user update error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const employeesRef = useRef(employees);
  const usersRef = useRef(users);
  const systemSettingsRef = useRef(systemSettings);

  useEffect(() => { employeesRef.current = employees; }, [employees]);
  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { systemSettingsRef.current = systemSettings; }, [systemSettings]);

  const triggerManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const [dbEmployees, dbUsers, dbSettings] = await Promise.all([
        supabaseService.getEmployees(),
        supabaseService.getAdminUsers(),
        supabaseService.getSystemSettings()
      ]);

      if (dbSettings) setSystemSettings(dbSettings);
      if (dbEmployees.length > 0) {
        const remoteNormalized = dbEmployees.map((e: any) => ({ ...e, campus: normalizeCampus(e?.campus || 'main') }));
        
        // Detect changes before setting new state
        detectChanges(employeesRef.current, remoteNormalized, currentUser);
        
        setEmployees(remoteNormalized);
      }
      if (dbUsers.length > 0) {
        setUsers(dbUsers.map((u: any) => ({ ...u, campus: normalizeCampus(u?.campus || 'main') })));
      }
      setIsOnline(true);
    } catch (err) {
      console.error('Manual sync failed:', err);
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // Background Auto-Sync Loop
  useEffect(() => {
    if (!systemSettings.autoSyncEnabled || !isOnline) return;

    const intervalMs = (systemSettings.syncInterval || 300) * 1000;
    
    const syncLoop = setInterval(async () => {
      // Use the refs to check if we are already syncing or if settings changed
      if (isSyncing) return;
      
      console.log(`[Auto-Sync] Heartbeat - Interval: ${systemSettings.syncInterval || 300}s`);
      try {
        const [dbEmployees, dbUsers, dbSettings] = await Promise.all([
          supabaseService.getEmployees(),
          supabaseService.getAdminUsers(),
          supabaseService.getSystemSettings()
        ]);

        // Sync Settings
        if (dbSettings && JSON.stringify(dbSettings) !== JSON.stringify(systemSettingsRef.current)) {
          console.log('[Auto-Sync] Settings updated from cloud');
          setSystemSettings(dbSettings);
        }
        
        // Sync Employees (Deep comparison)
        if (dbEmployees.length > 0) {
          const remoteNormalized = dbEmployees.map((e: any) => ({ ...e, campus: normalizeCampus(e?.campus || 'main') }));
          
          // Use a more stable serialization for comparison
          const normalizeForCompare = (arr: any[]) => JSON.stringify(arr.map(item => {
            const { ...rest } = item;
            // Ensure stable key order
            return Object.keys(rest).sort().reduce((obj: any, key) => {
              obj[key] = rest[key];
              return obj;
            }, {});
          }));

          const remoteSerialized = normalizeForCompare(remoteNormalized);
          const localSerialized = normalizeForCompare(employeesRef.current);
          
          if (remoteSerialized !== localSerialized) {
            console.log('[Auto-Sync] Employee data change detected, updating local state...');
            
            // Detect changes for notifications
            detectChanges(employeesRef.current, remoteNormalized, currentUser);
            
            setEmployees(remoteNormalized);
          }
        }

        // Sync Admin Users
        if (dbUsers.length > 0) {
          const remoteNormalized = dbUsers.map((u: any) => ({ ...u, campus: normalizeCampus(u?.campus || 'main') }));
          
          const normalizeForCompare = (arr: any[]) => JSON.stringify(arr.map(item => {
            const { ...rest } = item;
            return Object.keys(rest).sort().reduce((obj: any, key) => {
              obj[key] = rest[key];
              return obj;
            }, {});
          }));

          const remoteSerialized = normalizeForCompare(remoteNormalized);
          const localSerialized = normalizeForCompare(usersRef.current);
          
          if (remoteSerialized !== localSerialized) {
            console.log('[Auto-Sync] Admin user change detected, updating local state...');
            setUsers(remoteNormalized);
          }
        }
        
        setIsOnline(true);
      } catch (err) {
        console.warn('[Auto-Sync] Background sync failed:', err);
        setIsOnline(false);
      }
    }, intervalMs);

    return () => clearInterval(syncLoop);
  }, [systemSettings.autoSyncEnabled, systemSettings.syncInterval, isOnline]);

  const rebuildCloud = async () => {
    setIsSyncing(true);
    try {
      console.log('REBUILDING CLOUD REGISTRY...');
      
      // 1. Clear current employees in Supabase (or at least prepare for full upsert)
      // Since we use upserts, we can just loop through INITIAL_EMPLOYEES
      // But we should also handle deletions for any employees NOT in the new list
      const currentRemote = await supabaseService.getEmployees();
      const idsToKeep = new Set(INITIAL_EMPLOYEES.map(e => e.id));
      const idsToDelete = currentRemote.filter(r => !idsToKeep.has(r.id)).map(r => r.id);

      // Delete orphans
      for (const id of idsToDelete) {
        await supabaseService.deleteEmployee(id);
      }

      // 2. Full Force Sync
      await forceSyncEmployeesToSupabase(INITIAL_EMPLOYEES);
      
      // 3. Update Users too
      for (const u of INITIAL_USERS) {
        await supabaseService.saveAdminUser(u);
      }

      // Update local state to match system data exactly
      setEmployees(INITIAL_EMPLOYEES);
      setUsers(INITIAL_USERS);
      
      addNotification('Cloud Rebuilt', `Registry synchronized with ${INITIAL_EMPLOYEES.length} staff members.`, 'success');
    } catch (err) {
      console.error('Rebuild failed:', err);
      addNotification('Rebuild Error', 'Cloud sync failed for some records. Check console.', 'error');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    employees,
    users,
    systemSettings,
    currentUser,
    isSyncing,
    isOnline,
    login,
    logout,
    updateEmployees,
    updateUsers,
    updateSystemSettings,
    setCurrentUser,
    triggerManualSync,
    rebuildCloud,
    notifications,
    dismissNotification
  };
}
