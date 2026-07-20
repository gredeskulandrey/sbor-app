// Считает разблокированные ачивки на основе постоянного журнала встреч (completed_meetings)
// и показателя явки. Ничего не хранится отдельно — всё выводится из уже сохранённых данных.
export function computeAchievements({ meetings, attendanceRatePercent, createdAt }) {
  const byCategory = {};
  meetings.forEach((m) => {
    byCategory[m.category] = (byCategory[m.category] || 0) + 1;
  });

  const guestCount = meetings.filter((m) => m.role === 'guest').length;
  const organizerCount = meetings.filter((m) => m.role === 'organizer').length;
  const totalCount = meetings.length;
  const lateCount = meetings.filter((m) => m.was_late).length;
  const distinctCities = new Set(meetings.map((m) => m.city).filter(Boolean)).size;

  const daysSinceJoined = createdAt
    ? Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const unlocked = new Set();
  if ((byCategory.movies || 0) >= 5) unlocked.add('movies');
  if ((byCategory.bars || 0) >= 5) unlocked.add('bars');
  if ((byCategory.boardgames || 0) >= 5) unlocked.add('boardgames');
  if ((byCategory.museums || 0) >= 5) unlocked.add('museums');
  if ((byCategory.rest || 0) >= 5) unlocked.add('rest');
  if ((byCategory.sport || 0) >= 5) unlocked.add('sport');
  if ((byCategory.concerts || 0) >= 5) unlocked.add('concerts');
  if ((byCategory.workshops || 0) >= 5) unlocked.add('workshops');
  if (distinctCities >= 3) unlocked.add('cities3');
  if (attendanceRatePercent > 95 && guestCount > 5) unlocked.add('reliable');
  if (guestCount >= 10) unlocked.add('guest10');
  if (organizerCount >= 5) unlocked.add('organizer5');
  if (totalCount >= 20) unlocked.add('total20');
  if (daysSinceJoined >= 30) unlocked.add('days30');
  if (lateCount >= 5) unlocked.add('late5');

  return unlocked;
}
