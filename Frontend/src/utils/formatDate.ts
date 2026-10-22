const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatDueDate(iso: string): string {
  const due = new Date(iso);
  const today = new Date();

  // Compare by calendar day only using UTC (ignores time / timezone)
  const dueUtc = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  const msPerDay = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round((dueUtc - todayUtc) / msPerDay);

  if (dayDiff === 0) return 'Due today';
  if (dayDiff === 1) return 'Due tomorrow';
  if (dayDiff < 0) {
    const days = Math.abs(dayDiff);
    return `Overdue by ${days} ${days === 1 ? 'day' : 'days'}`;
  }
  if (dayDiff <= 7) {
    return `Due in ${dayDiff} ${dayDiff === 1 ? 'day' : 'days'}`;
  }

  return `${due.getUTCDate()} ${months[due.getUTCMonth()]} ${due.getUTCFullYear()}`;
}
