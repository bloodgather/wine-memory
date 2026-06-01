export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todayInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function formatDate(value?: string) {
  if (!value) return '未记录';
  return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export function formatFullDate(value?: string) {
  if (!value) return '未记录';
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
}

export function formatRating(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : '-';
}

export function parseTags(value: string) {
  return value
    .split(/[,，、\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, list) => list.indexOf(tag) === index);
}

export function formatMoney(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(value % 1 ? 1 : 0)} 元` : '未记录';
}
