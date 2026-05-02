
import { useState, useEffect } from 'react';
import { Employee, User } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_USERS } from '../data/initialData';
import { supabaseService } from '../services/supabaseService';
import { normalizeCampus } from '../lib/utils';

export function usePersistence() {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('fa_employees');
    const data = saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    return data.map((e: any) => ({ ...e, campus: normalizeCampus(e.campus) }));
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('fa_users');
    const data = saved ? JSON.parse(saved) : INITIAL_USERS;
    return data.map((u: any) => ({ ...u, campus: normalizeCampus(u.campus) }));
  });

  const [currentUser, setCurrentUser] = useState<User | Employee | null>(() => {
    const saved = localStorage.getItem('fa_current_user');
    if (!saved) return null;
    const data = JSON.parse(saved);
    return { ...data, campus: normalizeCampus(data.campus) };
  });

  const [isSyncing, setIsSyncing] = useState(false);

  // Load from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsSyncing(true);
        const [dbEmployees, dbUsers] = await Promise.all([
          supabaseService.getEmployees(),
          supabaseService.getAdminUsers()
        ]);

        if (dbEmployees.length > 0) {
          setEmployees(dbEmployees.map((e: any) => ({ ...e, campus: normalizeCampus(e.campus) })));
        }
        if (dbUsers.length > 0) {
          setUsers(dbUsers.map((u: any) => ({ ...u, campus: normalizeCampus(u.campus) })));
        }
      } catch (err) {
        console.error('Failed to fetch from Supabase:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('fa_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('fa_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('fa_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

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

  const login = (username: string, password: string, portal: 'admin' | 'employee', campus?: string, rememberMe?: boolean) => {
    const normalizedUsername = username.toLowerCase();
    if (portal === 'admin') {
      const user = users.find(u => u.username.toLowerCase() === normalizedUsername && u.password === password && (u.campus === campus || u.role === 'admin'));
      if (user) {
        setCurrentUser(user);
        // We handle persistence via useEffect on currentUser, but we could use rememberMe to decide if it should be in localStorage vs sessionStorage
        return { success: true, user };
      }
    } else {
      const employee = employees.find(e => e.username.toLowerCase() === normalizedUsername && e.password === password);
      if (employee) {
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
        await supabaseService.saveEmployee(emp);
        
        // Parallelize attendance and leave updates for the employee
        const attendancePromises = emp.attendance.map(record => 
          supabaseService.upsertAttendance(emp.id, record)
        );
        const leavePromises = emp.leaveRequests.map(req => 
          supabaseService.upsertLeaveRequest(emp.id, req)
        );
        
        await Promise.all([...attendancePromises, ...leavePromises]);
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
    setUsers(newUsers);
    try {
      for (const user of newUsers) {
        await supabaseService.saveAdminUser(user);
      }
    } catch (err) {
      console.error('Supabase user update error:', err);
    }
  };

  return {
    employees,
    users,
    currentUser,
    isSyncing,
    login,
    logout,
    updateEmployees,
    updateUsers,
    setCurrentUser
  };
}
