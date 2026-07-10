import type { Employee, IndustryId, Shift, SwapRequest, LeaveRequest } from './types';

const EMOJIS = ['👨', '👩', '🧑', '👨‍🍳', '👩‍🍳', '🧑‍💼', '👨‍🔧', '👩‍⚕️', '🧑‍🏫'];

export const MOCK_EMPLOYEES: Employee[] = [
  // 餐飲業 — 圖中示範
  { id: 'e1', name: '林小柔', role: '外場組長',   avatar: '👩‍🍳', hourlyRate: 220, weeklyQuota: 40, skills: ['外場','訂位'] },
  { id: 'e2', name: '王大明', role: '主廚',       avatar: '👨‍🍳', hourlyRate: 320, weeklyQuota: 48, skills: ['煎台','熱炒'] },
  { id: 'e3', name: '陳怡君', role: '外場',       avatar: '👩',   hourlyRate: 190, weeklyQuota: 40, skills: ['外場','吧台'] },
  { id: 'e4', name: '張志豪', role: '內場助手',   avatar: '👨',   hourlyRate: 200, weeklyQuota: 40, skills: ['切菜','洗碗'] },
  { id: 'e5', name: '李美華', role: '外場',       avatar: '👩',   hourlyRate: 190, weeklyQuota: 32, skills: ['外場'] },
  { id: 'e6', name: '許家豪', role: '吧台',       avatar: '🧑‍💼', hourlyRate: 240, weeklyQuota: 40, skills: ['吧台','調酒'] },
  { id: 'e7', name: '黃雅婷', role: '會計',       avatar: '👩',   hourlyRate: 280, weeklyQuota: 40, skills: ['會計'] },
];

// 產生 mock 班表 (本週 + 下週) — 可被外部呼叫
export function genShiftsForIndustry(industryId: IndustryId, baseDate: Date): Shift[] {
  const shifts: Shift[] = [];
  const start = new Date(baseDate);
  start.setDate(baseDate.getDate() - baseDate.getDay()); // 本週日
  const employees = MOCK_EMPLOYEES;
  const types: Record<string, string[]> = {
    restaurant: ['morning', 'noon', 'evening', 'night'],
    retail: ['morning', 'noon', 'evening'],
    medical: ['day', 'evening-nurse', 'night-nurse'],
    logistics: ['day-shift', 'night-shift'],
    callcenter: ['cs-morning', 'cs-noon', 'cs-evening'],
    gym: ['gym-early', 'gym-day', 'gym-evening', 'gym-late'],
  };
  const shiftIds = types[industryId] || types.restaurant;

  for (let day = 0; day < 14; day++) {
    const date = new Date(start);
    date.setDate(start.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      // 5 天輪班 (週六日部分輪休)
      const isOff = (day + i) % 7 === 0;
      if (isOff) continue;

      // 跳過會計只上班平日
      if (emp.role === '會計' && (day === 0 || day === 6)) continue;

      const shiftTypeId = shiftIds[(day + i) % shiftIds.length] as any;
      const status: Shift['status'] = date < baseDate ? 'completed' : 'scheduled';
      shifts.push({
        id: `s-${dateStr}-${emp.id}`,
        date: dateStr,
        employeeId: emp.id,
        shiftTypeId,
        industryId,
        status,
      });
    }
  }
  return shifts;
}

export const MOCK_SHIFTS_RESTAURANT: Shift[] = genShiftsForIndustry('restaurant', new Date());

export const MOCK_SWAPS: SwapRequest[] = [
  {
    id: 'sw1',
    requesterId: 'e3',
    targetEmployeeId: 'e4',
    shiftId: `s-${new Date().toISOString().split('T')[0]}-e3`,
    desiredShiftId: `s-${new Date().toISOString().split('T')[0]}-e4`,
    reason: '家中有事，想跟志豪換班',
    status: 'manager-pending',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sw2',
    requesterId: 'e5',
    targetEmployeeId: 'e1',
    shiftId: `s-${new Date(Date.now() + 86400000).toISOString().split('T')[0]}-e5`,
    desiredShiftId: `s-${new Date(Date.now() + 86400000).toISOString().split('T')[0]}-e1`,
    reason: '下週二想換到早班，方便接送小孩',
    status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

export const MOCK_LEAVES: LeaveRequest[] = [
  {
    id: 'l1',
    employeeId: 'e6',
    startDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 6 * 86400000).toISOString().split('T')[0],
    type: 'personal',
    reason: '處理私事',
    status: 'pending',
  },
];

export const MOCK_NOTIFICATIONS = [
  { id: 'n1', icon: '📋', text: '下週班表已發布', time: '1 小時前', type: 'schedule' },
  { id: 'n2', icon: '🔁', text: '怡君的換班申請待你核准', time: '10 分鐘前', type: 'swap' },
  { id: 'n3', icon: '💰', text: '5 月薪資單已生成', time: '昨天', type: 'payroll' },
  { id: 'n4', icon: '⏰', text: '明日提醒：早班 09:00', time: '剛剛', type: 'reminder' },
];
