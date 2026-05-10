
export type CampusCode = 'Main Campus' | 'Johar Campus' | 'Masjid Campus' | 'Maktab Campus';
export type UserRole = 'admin' | 'mudeer' | 'user' | 'employee';
export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Holiday' | 'Leave';

export interface AttendanceSession {
  checkIn: string;
  checkOut: string;
  location?: { lat: number; lng: number };
  campusName?: string;
}

export interface SystemSettings {
  enforceLocation: boolean;
  autoSyncEnabled: boolean;
  syncInterval: number; // in seconds
}

export interface AttendanceRecord {
  date: string;
  timeIn: string;
  timeOut: string;
  sessions?: AttendanceSession[];
  lateHours: number;
  overtime: number;
  onTime: boolean;
  status: AttendanceStatus;
  remarks: string;
}

export interface LeaveRequest {
  id: string;
  type: 'Annual' | 'Casual' | 'Medical';
  from: string;
  to: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
  staffResponse?: string;
}

export interface LeaveBalance {
  total: number;
  used: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

export interface Leaves {
  annual: LeaveBalance;
  casual: LeaveBalance;
  medical: LeaveBalance;
}

export interface PerformanceReview {
  date: string;
  rating: number;
  feedback: string;
}

export interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  campus: CampusCode;
  status: 'full_time' | 'part_time';
  shiftStart: string;
  shiftEnd: string;
  username: string;
  password: string;
  accountLocked?: boolean;
  attendance: AttendanceRecord[];
  leaves: Leaves;
  leaveRequests: LeaveRequest[];
  performanceReviews: PerformanceReview[];
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email?: string;
  campus: CampusCode | 'all';
  role: UserRole;
  accountLocked: boolean;
  createdAt: string;
}
