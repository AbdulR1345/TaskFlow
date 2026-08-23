export const STATUS_ORDER = ['todo', 'in-progress', 'done'];

export const normalizeStatus = (status) => {
  if (!status) return 'todo';
  return status.toLowerCase().trim();
};

export const matchesTaskSearch = (task, term = '') => {
  if (!term || !task) return true;

  const normalized = term.trim().toLowerCase();
  if (!normalized) return true;

  const searchable = [
    task.title,
    task.description,
    task.priority,
    task.status,
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
    task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  const statusText = normalizeStatus(task.status).replace('-', ' ');
  searchable.push(statusText);

  return searchable.some((value) => value.includes(normalized));
};

export const getReminderMeta = (task, now = new Date()) => {
  if (!task?.dueDate) return null;

  const dueDate = new Date(task.dueDate);
  const status = normalizeStatus(task.status);

  if (status === 'done') {
    return { type: 'done', label: 'Completed', tone: 'green' };
  }

  const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffHours < 0) {
    const overdueHours = Math.abs(Math.round(diffHours));
    const label = overdueHours >= 24
      ? `Overdue by ${Math.ceil(overdueHours / 24)} day${Math.ceil(overdueHours / 24) === 1 ? '' : 's'}`
      : `Overdue by ${Math.min(overdueHours, 23)} hour${Math.min(overdueHours, 23) === 1 ? '' : 's'}`;
    return { type: 'overdue', label, tone: 'red' };
  }

  if (diffHours <= 24) {
    return { type: 'due-soon', label: 'Due today', tone: 'amber' };
  }

  if (diffHours <= 48) {
    return { type: 'due-soon', label: 'Due tomorrow', tone: 'amber' };
  }

  return { type: 'upcoming', label: 'Upcoming', tone: 'blue' };
};
