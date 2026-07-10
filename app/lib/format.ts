export function formatDate(d: Date | string, withDay = true): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dayName = ['日','一','二','三','四','五','六'][date.getDay()];
  return withDay ? `${mm}/${dd} (${dayName})` : `${mm}/${dd}`;
}

export function getWeekRange(base = new Date()) {
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

export function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '剛剛';
  if (min < 60) return `${min} 分鐘前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小時前`;
  const day = Math.floor(hr / 24);
  return `${day} 天前`;
}

export function avatarFor(name: string): string {
  // 簡易 hash 從名稱選 emoji
  const arr = ['👨','👩','🧑','👨‍🍳','👩‍🍳','🧑‍💼','👨‍🔧','👩‍⚕️','🧑‍🏫','👨‍💼','👩‍💼','🧑‍🍳'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) | 0;
  return arr[Math.abs(h) % arr.length];
}
