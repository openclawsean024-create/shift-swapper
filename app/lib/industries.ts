import type { Industry, IndustryId } from './types';

export const INDUSTRIES: Record<IndustryId, Industry> = {
  restaurant: {
    id: 'restaurant',
    name: '餐飲服務',
    emoji: '🍽️',
    description: '餐廳/咖啡廳/小吃店 排班',
    peakDays: [5, 6], // 五六
    weeklyHoursRule: 48,
    shiftTypes: [
      { id: 'morning', label: '早班', start: '08:00', end: '14:00', hourlyRate: 190, color: 'bg-amber-100', text: 'text-amber-900' },
      { id: 'noon',    label: '午班', start: '14:00', end: '18:00', hourlyRate: 200, color: 'bg-orange-100', text: 'text-orange-900' },
      { id: 'evening', label: '晚班', start: '18:00', end: '22:00', hourlyRate: 220, color: 'bg-rose-100',   text: 'text-rose-900' },
      { id: 'night',   label: '夜班', start: '22:00', end: '02:00', hourlyRate: 280, color: 'bg-indigo-100', text: 'text-indigo-900' },
    ],
  },
  retail: {
    id: 'retail',
    name: '零售門市',
    emoji: '🛍️',
    description: '便利商店/百貨/門市 排班',
    peakDays: [0, 6],
    weeklyHoursRule: 40,
    shiftTypes: [
      { id: 'morning', label: '早班', start: '08:00', end: '14:00', hourlyRate: 183, color: 'bg-sky-100',    text: 'text-sky-900' },
      { id: 'noon',    label: '中班', start: '14:00', end: '20:00', hourlyRate: 195, color: 'bg-emerald-100', text: 'text-emerald-900' },
      { id: 'evening', label: '晚班', start: '20:00', end: '00:00', hourlyRate: 220, color: 'bg-purple-100', text: 'text-purple-900' },
    ],
  },
  medical: {
    id: 'medical',
    name: '醫療院所',
    emoji: '🏥',
    description: '診所/醫院 護理排班',
    peakDays: [1, 2, 3, 4, 5],
    weeklyHoursRule: 40,
    shiftTypes: [
      { id: 'day',          label: '白班 08-16',  start: '08:00', end: '16:00', hourlyRate: 320, color: 'bg-cyan-100',    text: 'text-cyan-900' },
      { id: 'evening-nurse', label: '小夜 16-24', start: '16:00', end: '24:00', hourlyRate: 380, color: 'bg-blue-100',    text: 'text-blue-900' },
      { id: 'night-nurse',  label: '大夜 00-08',  start: '00:00', end: '08:00', hourlyRate: 460, color: 'bg-slate-200',   text: 'text-slate-900' },
    ],
  },
  logistics: {
    id: 'logistics',
    name: '物流倉儲',
    emoji: '🚚',
    description: '倉儲/配送/物流中心',
    peakDays: [1, 2, 3, 4, 5],
    weeklyHoursRule: 48,
    shiftTypes: [
      { id: 'day-shift',   label: '日班 09-18',    start: '09:00', end: '18:00', hourlyRate: 220, color: 'bg-yellow-100', text: 'text-yellow-900' },
      { id: 'night-shift', label: '夜班 21-06',    start: '21:00', end: '06:00', hourlyRate: 290, color: 'bg-indigo-100', text: 'text-indigo-900' },
      { id: 'overtime',    label: '加班 06-09',    start: '06:00', end: '09:00', hourlyRate: 330, color: 'bg-red-100',    text: 'text-red-900' },
    ],
  },
  callcenter: {
    id: 'callcenter',
    name: '客服中心',
    emoji: '📞',
    description: '電話客服/文字客服',
    peakDays: [1, 2, 3, 4, 5],
    weeklyHoursRule: 40,
    shiftTypes: [
      { id: 'cs-morning', label: '早班 08-14',  start: '08:00', end: '14:00', hourlyRate: 200, color: 'bg-amber-100', text: 'text-amber-900' },
      { id: 'cs-noon',    label: '午班 14-20',  start: '14:00', end: '20:00', hourlyRate: 210, color: 'bg-orange-100', text: 'text-orange-900' },
      { id: 'cs-evening', label: '晚班 20-02',  start: '20:00', end: '02:00', hourlyRate: 250, color: 'bg-rose-100', text: 'text-rose-900' },
    ],
  },
  gym: {
    id: 'gym',
    name: '健身房',
    emoji: '💪',
    description: '健身教練/櫃台',
    peakDays: [5, 6],
    weeklyHoursRule: 44,
    shiftTypes: [
      { id: 'gym-early',  label: '早場 06-10', start: '06:00', end: '10:00', hourlyRate: 250, color: 'bg-yellow-100', text: 'text-yellow-900' },
      { id: 'gym-day',    label: '午場 10-17', start: '10:00', end: '17:00', hourlyRate: 220, color: 'bg-emerald-100', text: 'text-emerald-900' },
      { id: 'gym-evening', label: '晚場 17-22', start: '17:00', end: '22:00', hourlyRate: 270, color: 'bg-rose-100', text: 'text-rose-900' },
      { id: 'gym-late',   label: '跨日 22-02', start: '22:00', end: '02:00', hourlyRate: 320, color: 'bg-purple-100', text: 'text-purple-900' },
    ],
  },
};

export const INDUSTRY_LIST = Object.values(INDUSTRIES);

export function getShiftType(industryId: IndustryId, shiftTypeId: string) {
  return INDUSTRIES[industryId].shiftTypes.find((s) => s.id === shiftTypeId);
}

// 計算班表時數 (含跨夜)
export function calcShiftHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // 跨夜
  return (endMin - startMin) / 60;
}
