export type IndustryId = 'restaurant' | 'retail' | 'medical' | 'logistics' | 'callcenter' | 'gym';

export type ShiftTypeId =
  | 'morning' | 'noon' | 'evening' | 'night'        // 餐飲/零售
  | 'day' | 'evening-nurse' | 'night-nurse'         // 醫療
  | 'day-shift' | 'night-shift' | 'overtime'        // 物流
  | 'cs-morning' | 'cs-noon' | 'cs-evening'         // 客服
  | 'gym-early' | 'gym-day' | 'gym-evening' | 'gym-late'; // 健身房

export interface ShiftType {
  id: ShiftTypeId;
  label: string;
  start: string;   // "09:00"
  end: string;     // "17:00"
  hourlyRate: number; // NT$/hr
  color: string;   // tailwind bg class
  text: string;    // tailwind text class
}

export interface Industry {
  id: IndustryId;
  name: string;
  emoji: string;
  description: string;
  shiftTypes: ShiftType[];
  peakDays: number[]; // 0=Sun
  weeklyHoursRule: number; // 合約每週上限
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  avatar: string; // emoji
  hourlyRate: number;
  weeklyQuota: number;
  skills: string[]; // ['煎台','外場','吧台']
}

export interface Shift {
  id: string;
  date: string;        // YYYY-MM-DD
  employeeId: string;
  shiftTypeId: ShiftTypeId;
  industryId: IndustryId;
  status: 'scheduled' | 'completed' | 'absent' | 'swapped';
  note?: string;
}

export interface SwapRequest {
  id: string;
  requesterId: string;       // 申請人
  targetEmployeeId: string;  // 想換給誰
  shiftId: string;           // 要被換掉的班
  desiredShiftId?: string;   // 想換去對方的班（雙向交換）
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'manager-pending';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: 'sick' | 'personal' | 'annual';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PayrollMonth {
  employeeId: string;
  year: number;
  month: number;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  totalPay: number;
}
