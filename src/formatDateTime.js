const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

export function formatEventDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return `${d} ${MONTHS_GENITIVE[m - 1]} ${y}`;
}

export function formatEventTime(timeStr) {
  if (!timeStr) return '';
  // Из базы время иногда приходит как ЧЧ:ММ:СС — оставляем только часы и минуты
  return timeStr.slice(0, 5);
}
