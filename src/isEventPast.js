// Проверяет, наступила ли уже дата и время встречи (с учётом времени, а не только дня)
export function isEventPast(event) {
  const dt = new Date(`${event.event_date}T${event.event_time}`);
  return dt.getTime() < Date.now();
}
