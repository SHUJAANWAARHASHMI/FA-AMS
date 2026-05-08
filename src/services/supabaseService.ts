import { supabase } from '../lib/supabase';
import { Employee, User, AttendanceRecord, LeaveRequest, PerformanceReview, SystemSettings } from '../types';

export const supabaseService = {
  // --- Admin Users ---
  async getAdminUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('admin_users').select('*');
    if (error) throw error;
    return data.map(u => ({
      id: u.id,
      username: u.username,
      password: u.password,
      name: u.name,
      email: u.email,
      campus: u.campus as any,
      role: u.role as any,
      accountLocked: u.account_locked || false,
      createdAt: u.created_at
    }));
  },

  async saveAdminUser(user: User) {
    const payload: any = {
      id: user.id,
      username: user.username,
      password: user.password,
      name: user.name,
      email: user.email,
      campus: user.campus,
      role: user.role,
      created_at: user.createdAt
    };
    const { error } = await supabase.from('admin_users').upsert(payload);
    if (error) throw error;
  },

  async saveAdminUsersBatch(users: User[]) {
    const payloads = users.map(user => ({
      id: user.id,
      username: user.username,
      password: user.password,
      name: user.name,
      email: user.email,
      campus: user.campus,
      role: user.role,
      created_at: user.createdAt
    }));
    const { error } = await supabase.from('admin_users').upsert(payloads);
    if (error) throw error;
  },

  async deleteAdminUser(id: string) {
    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) throw error;
  },

  // --- Employees ---
  async getEmployees(): Promise<Employee[]> {
    // Fetch all related data in parallel or separate queries
    const [empRes, attRes, leaveRes, perfRes] = await Promise.all([
      supabase.from('employees').select('*'),
      supabase.from('attendance').select('*'),
      supabase.from('leave_requests').select('*'),
      supabase.from('performance_reviews').select('*')
    ]);

    if (empRes.error) throw empRes.error;
    
    const employees: Employee[] = empRes.data.map(emp => {
      const attendance = (attRes.data || [])
        .filter(a => a.employee_id === emp.id)
        .map(a => ({
          date: a.date,
          timeIn: a.time_in,
          timeOut: a.time_out,
          lateHours: Number(a.late_hours),
          overtime: Number(a.overtime),
          onTime: a.on_time,
          status: a.status as any,
          remarks: a.remarks?.split('||SESSIONS:')[0] || a.remarks,
          sessions: a.remarks?.includes('||SESSIONS:') 
            ? JSON.parse(a.remarks.split('||SESSIONS:')[1]) 
            : []
        }));

      const leaveRequests = (leaveRes.data || [])
        .filter(l => l.employee_id === emp.id)
        .map(l => ({
          id: l.id,
          type: l.type as any,
          from: l.from_date,
          to: l.to_date,
          reason: l.reason,
          status: l.status as any
        }));

      const performanceReviews = (perfRes.data || [])
        .filter(p => p.employee_id === emp.id)
        .map(p => ({
          date: p.date,
          rating: p.rating,
          feedback: p.feedback
        }));

      return {
        id: emp.id,
        name: emp.name,
        designation: emp.designation,
        department: emp.department,
        campus: emp.campus as any,
        status: emp.status as any,
        shiftStart: emp.shift_start,
        shiftEnd: emp.shift_end,
        username: emp.username,
        password: emp.password,
        accountLocked: emp.account_locked || false,
        leaves: {
          annual: { total: emp.leaves_annual_total, used: emp.leaves_annual_used },
          casual: { total: emp.leaves_casual_total, used: emp.leaves_casual_used },
          medical: { total: emp.leaves_medical_total, used: emp.leaves_medical_used }
        },
        attendance,
        leaveRequests,
        performanceReviews
      };
    });

    return employees;
  },

  async saveEmployee(emp: Employee) {
    const payload: any = {
      id: emp.id,
      name: emp.name,
      designation: emp.designation,
      department: emp.department,
      campus: emp.campus,
      status: emp.status,
      shift_start: emp.shiftStart,
      shift_end: emp.shiftEnd,
      username: emp.username,
      password: emp.password,
      leaves_annual_total: emp.leaves.annual.total,
      leaves_annual_used: emp.leaves.annual.used,
      leaves_casual_total: emp.leaves.casual.total,
      leaves_casual_used: emp.leaves.casual.used,
      leaves_medical_total: emp.leaves.medical.total,
      leaves_medical_used: emp.leaves.medical.used
    };
    const { error } = await supabase.from('employees').upsert(payload);
    if (error) throw error;

    // Sync sub-collections (this is naive, but works for the current logic)
    // In a real app, we'd update specific records, but here we'll just handle attendance/leaves when they change.
  },

  async saveEmployeesBatch(employees: Employee[]) {
    const payloads = employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      designation: emp.designation,
      department: emp.department,
      campus: emp.campus,
      status: emp.status,
      shift_start: emp.shiftStart,
      shift_end: emp.shiftEnd,
      username: emp.username,
      password: emp.password,
      leaves_annual_total: emp.leaves.annual.total,
      leaves_annual_used: emp.leaves.annual.used,
      leaves_casual_total: emp.leaves.casual.total,
      leaves_casual_used: emp.leaves.casual.used,
      leaves_medical_total: emp.leaves.medical.total,
      leaves_medical_used: emp.leaves.medical.used
    }));
    const { error } = await supabase.from('employees').upsert(payloads);
    if (error) throw error;
  },

  async deleteEmployee(id: string) {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteEmployeesBatch(ids: string[]) {
    if (ids.length === 0) return;
    const { error } = await supabase.from('employees').delete().in('id', ids);
    if (error) throw error;
  },

  // --- System Settings ---
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const { data, error } = await supabase.from('system_settings').select('*').single();
      if (error) {
        // PGRST205: Table not found, PGRST116: Row not found, 42501: RLS Violation, PGRST204: Column not found
        if (error.code === 'PGRST116') return { enforceLocation: true, autoSyncEnabled: true, syncInterval: 300 };
        if (error.code === 'PGRST205' || error.code === '42501' || error.code === 'PGRST204') {
          console.info(`System Settings sync issue (${error.code}). Using local state.`);
          const local = localStorage.getItem('fa_settings');
          return local ? JSON.parse(local) : { enforceLocation: true, autoSyncEnabled: true, syncInterval: 300 };
        }
        throw error;
      }
      return {
        enforceLocation: data.enforce_location ?? true,
        autoSyncEnabled: data.auto_sync_enabled ?? true,
        syncInterval: data.sync_interval ?? 300
      };
    } catch (err) {
      const local = localStorage.getItem('fa_settings');
      return local ? JSON.parse(local) : { enforceLocation: true, autoSyncEnabled: true, syncInterval: 300 };
    }
  },

  async saveSystemSettings(settings: SystemSettings) {
    try {
      // Try to save everything first
      const payload: any = {
        id: 1,
        enforce_location: settings.enforceLocation,
        auto_sync_enabled: settings.autoSyncEnabled,
        sync_interval: settings.syncInterval,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('system_settings').upsert(payload, { onConflict: 'id' });
      
      if (error) {
        if (error.code === 'PGRST204') {
          // Silent fallback to local storage if columns are missing in cloud
          return;
        }
        console.error('Supabase Sync Error:', error);
        throw error;
      }
    } catch (err: any) {
      // Ignore schema errors silently to avoid console clutter
      if (err?.code !== 'PGRST204') {
        console.debug('Cloud settings sync skipped: Missing schema columns.');
      }
    }
  },

  // --- Attendance ---
  async upsertAttendance(employeeId: string, records: AttendanceRecord[]) {
    if (records.length === 0) return;
    
    const payload = records.map(r => {
      const row: any = {
        employee_id: employeeId,
        date: r.date,
        time_in: r.timeIn,
        time_out: r.timeOut,
        late_hours: r.lateHours,
        overtime: r.overtime,
        on_time: r.onTime,
        status: r.status,
        remarks: `${r.remarks || ''}||SESSIONS:${JSON.stringify(r.sessions || [])}`
      };
      return row;
    });

    const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'employee_id,date' });
    if (error) {
      console.error('Attendance Batch Upsert Error:', error);
      throw error;
    }
  },

  // --- Leave Requests ---
  async upsertLeaveRequest(employeeId: string, req: LeaveRequest) {
    const { error } = await supabase.from('leave_requests').upsert({
      id: req.id,
      employee_id: employeeId,
      type: req.type,
      from_date: req.from,
      to_date: req.to,
      reason: req.reason,
      status: req.status
    });
    if (error) throw error;
  },

  // --- Performance Reviews ---
  async addPerformanceReview(employeeId: string, review: PerformanceReview) {
    const { error } = await supabase.from('performance_reviews').insert({
      employee_id: employeeId,
      date: review.date,
      rating: review.rating,
      feedback: review.feedback
    });
    if (error) throw error;
  },

  // --- Security & Audit ---
  async updateEmployeeCredentials(employeeId: string, username: string, password?: string) {
    const payload: any = { username };
    if (password) payload.password = password;
    
    const { error } = await supabase.from('employees').update(payload).eq('id', employeeId);
    if (error) throw error;

    // Record Audit Log
    await this.addAuditLog(employeeId, 'CREDENTIAL_UPDATE', `User updated credentials: ${username}`);
  },

  async addAuditLog(userId: string, action: string, details: string) {
    try {
      const { error } = await supabase.from('audit_logs').insert({
        user_id: userId,
        action,
        details,
        timestamp: new Date().toISOString()
      });
      
      // Handle "Table not found" (PGRST205) or "RLS Violation" (42501)
      if (error) {
        const isSecurityError = error.code === '42501' || error.message.includes('row-level security');
        const isNotFoundError = error.code === 'PGRST205';
        
        if (!isSecurityError && !isNotFoundError) {
          console.warn('Audit log capture deferred:', error.message);
        }
      }
    } catch (e) {
      // Silent catch for unexpected network errors
    }
  }
};
