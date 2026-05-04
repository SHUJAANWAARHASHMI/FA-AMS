
import { useState, useEffect } from 'react';
import { Employee, User, SystemSettings } from '../types';
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
    const defaultSettings: SystemSettings = { enforceLocation: true, autoSyncEnabled: true, syncInterval: 5 };
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

  // Background Auto-Sync Loop
  useEffect(() => {
    if (!systemSettings.autoSyncEnabled || !isOnline) return;

    const intervalMs = (systemSettings.syncInterval || 5) * 1000;
    
    const syncLoop = setInterval(async () => {
      console.log(`[Auto-Sync] Triggering background sync (${systemSettings.syncInterval}s interval)`);
      try {
        const [dbEmployees, dbUsers, dbSettings] = await Promise.all([
          supabaseService.getEmployees(),
          supabaseService.getAdminUsers(),
          supabaseService.getSystemSettings()
        ]);

        if (dbSettings && JSON.stringify(dbSettings) !== JSON.stringify(systemSettings)) {
          setSystemSettings(dbSettings);
        }
        
        if (dbEmployees.length > 0) {
          const remoteSerialized = JSON.stringify(dbEmployees.map(e => e.id).sort());
          const localSerialized = JSON.stringify(employees.map(e => e.id).sort());
          
          if (remoteSerialized !== localSerialized) {
            console.log('[Auto-Sync] Remote employee list differs, updating...');
            setEmployees(dbEmployees.map((e: any) => ({ ...e, campus: normalizeCampus(e?.campus || 'main') })));
          }
        }
      } catch (err) {
        console.warn('[Auto-Sync] Background sync failed:', err);
      }
    }, intervalMs);

    return () => clearInterval(syncLoop);
  }, [systemSettings.autoSyncEnabled, systemSettings.syncInterval, isOnline, employees, systemSettings]);

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
    setCurrentUser
  };
}
