'use client';

import { useState, useEffect, useMemo } from 'react';
import { INDUSTRIES, INDUSTRY_LIST, calcShiftHours, getShiftType } from './lib/industries';
import { MOCK_EMPLOYEES, MOCK_SHIFTS_RESTAURANT, MOCK_SWAPS, MOCK_LEAVES, MOCK_NOTIFICATIONS, genShiftsForIndustry } from './lib/mockData';
import type { IndustryId, ShiftTypeId, Employee, Shift, SwapRequest, LeaveRequest } from './lib/types';
import { formatDate, getWeekRange, toDateStr, relativeTime } from './lib/format';

type Tab = 'home' | 'schedule' | 'swaps' | 'leave' | 'payroll' | 'team' | 'settings';

const TAB_LABELS: Record<Tab, { icon: string; label: string }> = {
  home:     { icon: '🏠', label: '首頁' },
  schedule: { icon: '📅', label: '我的班表' },
  swaps:    { icon: '🔁', label: '換班申請' },
  leave:    { icon: '🏥', label: '請假' },
  payroll:  { icon: '💰', label: '薪資明細' },
  team:     { icon: '👥', label: '排班總覽' },
  settings: { icon: '⚙️', label: '設定' },
};

const LS_KEY = 'shift-swapper-v1';

interface AppState {
  industryId: IndustryId;
  currentEmployeeId: string;
  shifts: Shift[];
  swaps: SwapRequest[];
  leaves: LeaveRequest[];
  notificationsRead: string[];
}

function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultState();
}

function defaultState(): AppState {
  return {
    industryId: 'restaurant',
    currentEmployeeId: 'e1',
    shifts: MOCK_SHIFTS_RESTAURANT,
    swaps: MOCK_SWAPS,
    leaves: MOCK_LEAVES,
    notificationsRead: [],
  };
}

export default function Page() {
  const [state, setState] = useState<AppState>(defaultState());
  const [tab, setTab] = useState<Tab>('home');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setState(loadState());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state, mounted]);

  const industry = INDUSTRIES[state.industryId];
  const currentEmp = MOCK_EMPLOYEES.find((e) => e.id === state.currentEmployeeId)!;

  function changeIndustry(id: IndustryId) {
    setState((s) => {
      // 若切換行業，重新生成對應行業的班表 (避免舊 industry 的 shiftTypeId 找不到)
      if (id !== s.industryId) {
        const newShifts = genShiftsForIndustry(id, new Date());
        return { ...s, industryId: id, shifts: newShifts };
      }
      return { ...s, industryId: id };
    });
    setShowIndustryPicker(false);
  }

  function updateShift(shiftId: string, patch: Partial<Shift>) {
    setState((s) => ({
      ...s,
      shifts: s.shifts.map((sh) => (sh.id === shiftId ? { ...sh, ...patch } : sh)),
    }));
  }

  function approveSwap(swapId: string) {
    setState((s) => ({
      ...s,
      swaps: s.swaps.map((sw) =>
        sw.id === swapId
          ? { ...sw, status: 'approved', reviewedAt: new Date().toISOString(), reviewedBy: state.currentEmployeeId }
          : sw
      ),
    }));
  }

  function rejectSwap(swapId: string) {
    setState((s) => ({
      ...s,
      swaps: s.swaps.map((sw) =>
        sw.id === swapId ? { ...sw, status: 'rejected', reviewedAt: new Date().toISOString() } : sw
      ),
    }));
  }

  function requestSwap(targetId: string, shiftId: string, reason: string) {
    const newReq: SwapRequest = {
      id: 'sw' + Date.now(),
      requesterId: state.currentEmployeeId,
      targetEmployeeId: targetId,
      shiftId,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({ ...s, swaps: [newReq, ...s.swaps] }));
  }

  function requestLeave(start: string, end: string, type: LeaveRequest['type'], reason: string) {
    const lr: LeaveRequest = {
      id: 'l' + Date.now(),
      employeeId: state.currentEmployeeId,
      startDate: start,
      endDate: end,
      type,
      reason,
      status: 'pending',
    };
    setState((s) => ({ ...s, leaves: [lr, ...s.leaves] }));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="glass sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setShowIndustryPicker(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-teal-200 hover:bg-teal-50 transition"
            data-testid="industry-switcher"
          >
            <span className="text-xl">{industry.emoji}</span>
            <span className="font-bold text-teal-900">{industry.name}</span>
            <span className="text-teal-600 text-xs">▾</span>
          </button>
          <div className="flex-1" />
          <button className="relative p-2 rounded-lg hover:bg-white" aria-label="通知">
            <span className="text-xl">🔔</span>
            {state.notificationsRead.length < MOCK_NOTIFICATIONS.length && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full pulse-dot" />
            )}
          </button>
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white border border-slate-200">
            <span className="text-2xl">{currentEmp.avatar}</span>
            <select
              value={state.currentEmployeeId}
              onChange={(e) => setState((s) => ({ ...s, currentEmployeeId: e.target.value }))}
              className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer"
            >
              {MOCK_EMPLOYEES.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab nav (mobile bottom + desktop top) */}
        <nav className="hidden md:flex gap-2 mb-6 overflow-x-auto scroll-x" aria-label="主導航">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap font-semibold text-sm transition ${
                tab === t
                  ? 'bg-teal-700 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{TAB_LABELS[t].icon}</span>
              {TAB_LABELS[t].label}
            </button>
          ))}
        </nav>

        <main>
          {tab === 'home' && (
            <HomeView
              state={state}
              weekOffset={weekOffset}
              setWeekOffset={setWeekOffset}
              currentEmp={currentEmp}
            />
          )}
          {tab === 'schedule' && (
            <ScheduleView
              state={state}
              weekOffset={weekOffset}
              setWeekOffset={setWeekOffset}
            />
          )}
          {tab === 'swaps' && (
            <SwapsView state={state} onApprove={approveSwap} onReject={rejectSwap} onRequest={requestSwap} />
          )}
          {tab === 'leave' && <LeaveView state={state} onRequest={requestLeave} />}
          {tab === 'payroll' && <PayrollView state={state} />}
          {tab === 'team' && <TeamView state={state} updateShift={updateShift} />}
          {tab === 'settings' && (
            <SettingsView state={state} onChangeIndustry={changeIndustry} onReset={() => { localStorage.removeItem(LS_KEY); setState(defaultState()); }} />
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-slate-200 z-30">
        <div className="flex justify-around">
          {(Object.keys(TAB_LABELS) as Tab[]).slice(0, 5).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs ${
                tab === t ? 'text-teal-700 font-bold' : 'text-slate-500'
              }`}
            >
              <span className="text-lg">{TAB_LABELS[t].icon}</span>
              {TAB_LABELS[t].label}
            </button>
          ))}
        </div>
      </nav>

      {/* Industry picker modal */}
      {showIndustryPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setShowIndustryPicker(false)}>
          <div
            className="bg-white rounded-2xl w-full max-w-2xl p-6 slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-1">切換行業</h2>
            <p className="text-sm text-slate-500 mb-4">選擇你的行業，自動載入該行業的班別類型與排班規則</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INDUSTRY_LIST.map((ind) => (
                <button
                  key={ind.id}
                  onClick={() => changeIndustry(ind.id)}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    ind.id === state.industryId
                      ? 'border-teal-700 bg-teal-50'
                      : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-3xl mb-1">{ind.emoji}</div>
                  <div className="font-bold text-slate-900">{ind.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{ind.description}</div>
                  <div className="text-xs text-teal-700 mt-2">{ind.shiftTypes.length} 種班別 · {ind.weeklyHoursRule}hr/週</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ VIEWS ============

function HomeView({ state, weekOffset, setWeekOffset, currentEmp }: any) {
  const industry = INDUSTRIES[state.industryId as IndustryId];
  const week = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() - base.getDay() + weekOffset * 7);
    return getWeekRange(base);
  }, [weekOffset]);

  const today = new Date().toISOString().split('T')[0];
  const todayShift = state.shifts.find((s: Shift) => s.date === today && s.employeeId === state.currentEmployeeId);
  const pendingSwaps = state.swaps.filter((sw: SwapRequest) => sw.status !== 'approved' && sw.status !== 'rejected');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          早安，{currentEmp.name.slice(-2)}<span className="ml-1">👋</span>
        </h1>
      </div>

      {/* Today shift hero card */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-500">今日班表</div>
            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">已發布</span>
          </div>
          <div className="text-sm text-slate-500 mb-2">{formatDate(new Date())}</div>
          {todayShift ? (
            <>
              <div className="text-3xl font-bold text-slate-900">
                {getShiftType(state.industryId, todayShift.shiftTypeId)?.start} – {getShiftType(state.industryId, todayShift.shiftTypeId)?.end}
              </div>
              <div className="mt-3 text-sm text-slate-600">
                {currentEmp.role} · {industry.name}
              </div>
              <div className="mt-4 flex gap-2">
                <button className="btn-secondary text-xs">查看完整班表</button>
              </div>
            </>
          ) : (
            <div className="text-slate-500">今天休假 🎉</div>
          )}
        </div>

        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-500">近期提醒</div>
            <button className="text-xs text-teal-700 font-semibold">查看全部 ›</button>
          </div>
          <div className="space-y-3">
            {MOCK_NOTIFICATIONS.slice(0, 3).map((n) => (
              <div key={n.id} className="flex gap-3">
                <span className="text-xl">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">{n.text}</div>
                  <div className="text-xs text-slate-400">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-slate-500">換班申請進度</div>
            <button className="text-xs text-teal-700 font-semibold">查看全部 ›</button>
          </div>
          <div className="space-y-2">
            {pendingSwaps.slice(0, 3).map((sw: SwapRequest, i: number) => {
              const step = sw.status === 'pending' ? 1 : sw.status === 'manager-pending' ? 2 : sw.status === 'approved' ? 3 : 0;
              const steps = ['送出申請', '主管核准', '完成'];
              return (
                <div key={sw.id} className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {steps.map((_, j) => (
                      <div key={j} className={`w-2 h-2 rounded-full ${j < step ? 'bg-teal-600' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-slate-600">{steps[step - 1] || '送出申請'}</span>
                  <span className="text-xs text-slate-400 ml-auto">{relativeTime(sw.createdAt)}</span>
                </div>
              );
            })}
            {pendingSwaps.length === 0 && <div className="text-sm text-slate-400">目前沒有進行中的換班申請</div>}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="text-sm font-semibold text-slate-500 mb-4">快速操作</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: '🔁', label: '換班申請', desc: '自己搞定班表' },
            { icon: '🏥', label: '請假',     desc: '病假/事假/特休' },
            { icon: '📅', label: '班表查詢', desc: '查看我的排班' },
            { icon: '🔔', label: '提醒設定', desc: '設定提醒' },
          ].map((a) => (
            <button key={a.label} className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition text-left">
              <div className="text-2xl mb-1">{a.icon}</div>
              <div className="font-bold text-slate-900">{a.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{a.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Week overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-slate-500">本週班表</div>
          <div className="flex gap-1">
            <button onClick={() => setWeekOffset(weekOffset - 1)} className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded">‹</button>
            <button onClick={() => setWeekOffset(0)} className="px-3 py-1 text-xs bg-slate-100 rounded">{weekOffset === 0 ? '本週' : `±${weekOffset}週`}</button>
            <button onClick={() => setWeekOffset(weekOffset + 1)} className="px-2 py-1 text-slate-600 hover:bg-slate-100 rounded">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(week.start);
            d.setDate(week.start.getDate() + i);
            const dStr = toDateStr(d);
            const shift = state.shifts.find((s: Shift) => s.date === dStr && s.employeeId === state.currentEmployeeId);
            const st = shift ? getShiftType(state.industryId, shift.shiftTypeId) : null;
            return (
              <div key={i} className={`rounded-xl p-3 border ${st ? `${st.color} ${st.text} border-transparent` : 'border-slate-200 bg-slate-50'}`}>
                <div className="text-xs font-semibold opacity-70">{['日','一','二','三','四','五','六'][d.getDay()]}</div>
                <div className="text-lg font-bold">{d.getDate()}</div>
                {st ? (
                  <div className="mt-2 text-xs font-medium">{st.label}<br />{st.start.slice(0,2)}:{st.start.slice(3)}</div>
                ) : (
                  <div className="mt-2 text-xs text-slate-400">休假</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScheduleView({ state, weekOffset, setWeekOffset }: any) {
  const industry = INDUSTRIES[state.industryId as IndustryId];
  const base = new Date();
  base.setDate(base.getDate() - base.getDay() + weekOffset * 7);
  const week = getWeekRange(base);

  const myShifts = state.shifts
    .filter((s: Shift) => s.employeeId === state.currentEmployeeId && new Date(s.date) >= week.start && new Date(s.date) <= week.end)
    .sort((a: Shift, b: Shift) => a.date.localeCompare(b.date));

  const totalHours = myShifts.reduce((sum: number, s: Shift) => {
    const st = getShiftType(state.industryId, s.shiftTypeId);
    return sum + (st ? calcShiftHours(st.start, st.end) : 0);
  }, 0);

  const projectedPay = myShifts.reduce((sum: number, s: Shift) => {
    const st = getShiftType(state.industryId, s.shiftTypeId);
    return sum + (st ? calcShiftHours(st.start, st.end) * st.hourlyRate : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">📅 我的班表</h1>
        <div className="flex gap-1">
          <button onClick={() => setWeekOffset(weekOffset - 1)} className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg">‹ 上週</button>
          <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-sm bg-teal-700 text-white rounded-lg">{weekOffset === 0 ? '本週' : `±${weekOffset}週`}</button>
          <button onClick={() => setWeekOffset(weekOffset + 1)} className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg">下週 ›</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500">本週總時數</div>
          <div className="text-3xl font-bold text-teal-700 mt-1">{totalHours.toFixed(1)} <span className="text-base text-slate-500">hr</span></div>
          <div className="text-xs text-slate-400 mt-1">合約上限 {industry.weeklyHoursRule}hr</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500">預估本週薪資</div>
          <div className="text-3xl font-bold text-emerald-700 mt-1">NT$ {projectedPay.toLocaleString()}</div>
          <div className="text-xs text-slate-400 mt-1">不含加班費</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="text-sm text-slate-500">班別分布</div>
          <div className="text-3xl font-bold text-slate-700 mt-1">{myShifts.length} <span className="text-base text-slate-500">班</span></div>
          <div className="text-xs text-slate-400 mt-1">{myShifts.length === 0 ? '本週休假' : `${industry.shiftTypes.length} 種班別`}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3">日期</th>
              <th className="px-4 py-3">班別</th>
              <th className="px-4 py-3">時間</th>
              <th className="px-4 py-3">時數</th>
              <th className="px-4 py-3">預估薪資</th>
              <th className="px-4 py-3">狀態</th>
            </tr>
          </thead>
          <tbody>
            {myShifts.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">本週沒有排班</td></tr>
            )}
            {myShifts.map((s: Shift) => {
              const st = getShiftType(state.industryId, s.shiftTypeId);
              if (!st) return null;
              const hrs = calcShiftHours(st.start, st.end);
              const pay = hrs * st.hourlyRate;
              return (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{formatDate(s.date)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${st.color} ${st.text}`}>{st.label}</span>
                  </td>
                  <td className="px-4 py-3 font-mono">{st.start} – {st.end}</td>
                  <td className="px-4 py-3">{hrs.toFixed(1)} hr</td>
                  <td className="px-4 py-3 font-bold text-emerald-700">NT$ {pay.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                      s.status === 'absent' ? 'bg-rose-100 text-rose-700' :
                      s.status === 'swapped' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {s.status === 'completed' ? '已完成' : s.status === 'absent' ? '缺席' : s.status === 'swapped' ? '已換班' : '已排定'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        💡 <strong>提示：</strong>換班申請送出後，會先送給對方確認 → 再送主管核准 → 雙方班表自動更新。
      </div>
    </div>
  );
}

function SwapsView({ state, onApprove, onReject, onRequest }: any) {
  const [showForm, setShowForm] = useState(false);
  const [targetId, setTargetId] = useState('e2');
  const [shiftId, setShiftId] = useState('');
  const [reason, setReason] = useState('');

  const mySwaps = state.swaps.filter((sw: SwapRequest) =>
    sw.requesterId === state.currentEmployeeId || sw.targetEmployeeId === state.currentEmployeeId
  );

  const upcomingShifts = state.shifts
    .filter((s: Shift) => s.employeeId === state.currentEmployeeId && new Date(s.date) >= new Date() && s.status === 'scheduled')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🔁 換班申請</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + 新增換班申請
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-teal-200 p-5 slide-up">
          <h2 className="font-bold text-lg mb-4">建立換班申請</h2>
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">要換出去的班</span>
              <select value={shiftId} onChange={(e) => setShiftId(e.target.value)} className="mt-1 w-full p-2 border border-slate-200 rounded-lg">
                <option value="">-- 選擇 --</option>
                {upcomingShifts.map((s: Shift) => {
                  const st = getShiftType(state.industryId, s.shiftTypeId);
                  return <option key={s.id} value={s.id}>{formatDate(s.date)} · {st?.label} ({st?.start}-{st?.end})</option>;
                })}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">換給誰</span>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="mt-1 w-full p-2 border border-slate-200 rounded-lg">
                {MOCK_EMPLOYEES.filter((e) => e.id !== state.currentEmployeeId).map((e) => (
                  <option key={e.id} value={e.id}>{e.avatar} {e.name} · {e.role}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">原因</span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="mt-1 w-full p-2 border border-slate-200 rounded-lg" placeholder="例：家中有事..." />
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (shiftId && reason) {
                    onRequest(targetId, shiftId, reason);
                    setShiftId(''); setReason(''); setShowForm(false);
                  }
                }}
                disabled={!shiftId || !reason}
                className="btn-primary"
              >送出申請</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary">取消</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {mySwaps.length === 0 && <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">還沒有換班申請</div>}
        {mySwaps.map((sw: SwapRequest) => {
          const reqEmp = MOCK_EMPLOYEES.find((e) => e.id === sw.requesterId);
          const tgtEmp = MOCK_EMPLOYEES.find((e) => e.id === sw.targetEmployeeId);
          const isMe = sw.requesterId === state.currentEmployeeId;
          const isTarget = sw.targetEmployeeId === state.currentEmployeeId;
          return (
            <div key={sw.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{reqEmp?.avatar}</span>
                    <span className="font-bold">{reqEmp?.name}</span>
                    <span className="text-slate-400 text-sm">想換給</span>
                    <span className="text-2xl">{tgtEmp?.avatar}</span>
                    <span className="font-bold">{tgtEmp?.name}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">📝 {sw.reason}</p>
                  <div className="text-xs text-slate-400">{relativeTime(sw.createdAt)}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                  sw.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  sw.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                  sw.status === 'manager-pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {sw.status === 'approved' ? '✓ 已核准' : sw.status === 'rejected' ? '✗ 已拒絕' : sw.status === 'manager-pending' ? '⏳ 主管審核中' : '⏳ 對方確認中'}
                </span>
              </div>
              {isTarget && sw.status === 'pending' && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => onApprove(sw.id)} className="btn-primary text-xs">同意換班</button>
                  <button onClick={() => onReject(sw.id)} className="btn-secondary text-xs">婉拒</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaveView({ state, onRequest }: any) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<LeaveRequest['type']>('personal');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const myLeaves = state.leaves.filter((l: LeaveRequest) => l.employeeId === state.currentEmployeeId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🏥 請假申請</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">+ 新增請假</button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-teal-200 p-5 slide-up">
          <h2 className="font-bold text-lg mb-4">建立請假申請</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">類型</span>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="mt-1 w-full p-2 border border-slate-200 rounded-lg">
                <option value="sick">病假</option>
                <option value="personal">事假</option>
                <option value="annual">特休</option>
              </select>
            </label>
            <div />
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">開始日期</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full p-2 border border-slate-200 rounded-lg" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">結束日期</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full p-2 border border-slate-200 rounded-lg" />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">原因</span>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="mt-1 w-full p-2 border border-slate-200 rounded-lg" />
            </label>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                if (startDate && endDate && reason) {
                  onRequest(startDate, endDate, type, reason);
                  setStartDate(''); setEndDate(''); setReason(''); setShowForm(false);
                }
              }}
              disabled={!startDate || !endDate || !reason}
              className="btn-primary"
            >送出申請</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">取消</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {myLeaves.length === 0 && <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">沒有請假記錄</div>}
        {myLeaves.map((l: LeaveRequest) => (
          <div key={l.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <div className="font-bold">
                {l.type === 'sick' ? '🤒 病假' : l.type === 'personal' ? '📋 事假' : '🏖️ 特休'}
              </div>
              <div className="text-sm text-slate-600">{l.startDate} → {l.endDate}</div>
              <div className="text-xs text-slate-400 mt-1">{l.reason}</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              l.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
              l.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
              'bg-amber-100 text-amber-700'
            }`}>
              {l.status === 'approved' ? '✓ 已核准' : l.status === 'rejected' ? '✗ 已拒絕' : '⏳ 審核中'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayrollView({ state }: any) {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  const monthShifts = state.shifts.filter((s: Shift) => {
    const d = new Date(s.date);
    return s.employeeId === state.currentEmployeeId && d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const breakdown: Record<string, { hours: number; pay: number; count: number }> = {};
  let total = 0;
  let totalHours = 0;
  monthShifts.forEach((s: Shift) => {
    const st = getShiftType(state.industryId, s.shiftTypeId);
    if (!st) return;
    const hrs = calcShiftHours(st.start, st.end);
    const pay = hrs * st.hourlyRate;
    if (!breakdown[st.id]) breakdown[st.id] = { hours: 0, pay: 0, count: 0 };
    breakdown[st.id].hours += hrs;
    breakdown[st.id].pay += pay;
    breakdown[st.id].count += 1;
    total += pay;
    totalHours += hrs;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">💰 薪資明細</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-sm text-slate-500">{year} 年 {month} 月</div>
            <div className="text-4xl font-bold text-emerald-700 mt-1">NT$ {total.toLocaleString()}</div>
          </div>
          <button className="btn-secondary">📥 下載明細</button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-500">總時數</div>
            <div className="text-2xl font-bold mt-1">{totalHours.toFixed(1)} hr</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-500">總班數</div>
            <div className="text-2xl font-bold mt-1">{monthShifts.length} 班</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs text-slate-500">平均時薪</div>
            <div className="text-2xl font-bold mt-1">NT$ {totalHours > 0 ? Math.round(total / totalHours) : 0}</div>
          </div>
        </div>

        <div className="text-sm font-semibold text-slate-700 mb-3">班別明細</div>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr className="text-left">
              <th className="py-2">班別</th>
              <th className="py-2">班數</th>
              <th className="py-2">時數</th>
              <th className="py-2 text-right">小計</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(breakdown).map(([id, b]) => {
              const st = getShiftType(state.industryId, id as ShiftTypeId);
              if (!st) return null;
              return (
                <tr key={id} className="border-b border-slate-100">
                  <td className="py-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${st.color} ${st.text}`}>{st.label}</span></td>
                  <td className="py-3">{b.count} 班</td>
                  <td className="py-3">{b.hours.toFixed(1)} hr</td>
                  <td className="py-3 text-right font-bold text-emerald-700">NT$ {b.pay.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamView({ state, updateShift }: any) {
  const industry = INDUSTRIES[state.industryId as IndustryId];
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">👥 排班總覽 ({industry.name})</h1>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden scroll-x">
        <table className="text-sm min-w-[900px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-3 text-left sticky left-0 bg-slate-50 z-10">員工</th>
              {days.map((d, i) => (
                <th key={i} className="px-3 py-3 text-center min-w-[110px]">
                  <div className="text-xs text-slate-500">{['日','一','二','三','四','五','六'][d.getDay()]}</div>
                  <div className="font-bold">{d.getMonth() + 1}/{d.getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_EMPLOYEES.map((emp) => (
              <tr key={emp.id} className="border-t border-slate-100">
                <td className="px-3 py-3 sticky left-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{emp.avatar}</span>
                    <div>
                      <div className="font-bold text-sm">{emp.name}</div>
                      <div className="text-xs text-slate-500">{emp.role}</div>
                    </div>
                  </div>
                </td>
                {days.map((d, i) => {
                  const dStr = toDateStr(d);
                  const shift = state.shifts.find((s: Shift) => s.date === dStr && s.employeeId === emp.id);
                  const st = shift ? getShiftType(state.industryId, shift.shiftTypeId) : null;
                  return (
                    <td key={i} className="px-2 py-2 text-center">
                      {st ? (
                        <div className={`rounded-lg p-1.5 ${st.color} ${st.text}`}>
                          <div className="text-xs font-bold">{st.label}</div>
                          <div className="text-[10px] font-mono">{st.start.slice(0,5)}-{st.end.slice(0,5)}</div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-300">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
        💼 <strong>{industry.name}</strong> · {industry.weeklyHoursRule}hr/週上限 · {industry.shiftTypes.length} 種班別 ·
        尖峰日: {industry.peakDays.map((d) => '日一二三四五六'[d]).join('、')}
      </div>
    </div>
  );
}

function SettingsView({ state, onChangeIndustry, onReset }: any) {
  const industry = INDUSTRIES[state.industryId as IndustryId];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">⚙️ 設定</h1>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">目前行業：{industry.emoji} {industry.name}</h2>
        <p className="text-sm text-slate-600 mb-4">{industry.description}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {industry.shiftTypes.map((st) => (
            <div key={st.id} className={`p-3 rounded-lg ${st.color} ${st.text}`}>
              <div className="text-xs font-bold">{st.label}</div>
              <div className="text-sm font-mono">{st.start} – {st.end}</div>
              <div className="text-xs mt-1">NT$ {st.hourlyRate}/hr</div>
            </div>
          ))}
        </div>
        <button onClick={() => onChangeIndustry('restaurant')} className="btn-primary">切換行業</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="font-bold text-lg mb-3">資料管理</h2>
        <button onClick={onReset} className="btn-secondary text-rose-600 border-rose-200">
          🗑️ 重置所有資料
        </button>
        <p className="text-xs text-slate-400 mt-2">將清空所有本地班表/換班/請假記錄</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 text-sm text-slate-600">
        <div className="font-bold text-slate-900 mb-2">關於排班換班助手</div>
        純前端 MVP · 6 種行業 preset · localStorage 本地資料 · 無需後端
      </div>
    </div>
  );
}
