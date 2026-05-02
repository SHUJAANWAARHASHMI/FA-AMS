
export type CampusCode = 'Main Campus' | 'Johar Campus' | 'Masjid Campus' | 'Maktab Campus';
export type UserRole = 'admin' | 'mudeer' | 'user' | 'employee';
export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Holiday' | 'Leave';

export interface AttendanceRecord {
  date: string;
  timeIn: string;
  timeOut: string;
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
}

export interface LeaveBalance {
  total: number;
  used: number;
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
  attendance: AttendanceRecord[];
  leaves: Leaves;
  leaveRequests: LeaveRequest[];
  performanceReviews: PerformanceReview[];
}

export interface User {
  username: string;
  password: string;
  name: string;
  campus: CampusCode | 'all';
  role: UserRole;
}
