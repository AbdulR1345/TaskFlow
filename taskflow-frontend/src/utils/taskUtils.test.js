import test from 'node:test';
import assert from 'node:assert/strict';

import { matchesTaskSearch, getReminderMeta } from './taskUtils.js';

test('matchesTaskSearch matches text across title, description, priority, status, and date fields', () => {
  const task = {
    title: 'Prepare sprint demo',
    description: 'Finish the dashboard improvements',
    priority: 'high',
    status: 'in-progress',
    dueDate: '2026-08-20T00:00:00.000Z'
  };

  assert.equal(matchesTaskSearch(task, 'demo'), true);
  assert.equal(matchesTaskSearch(task, 'dashboard'), true);
  assert.equal(matchesTaskSearch(task, 'high'), true);
  assert.equal(matchesTaskSearch(task, 'in progress'), true);
  assert.equal(matchesTaskSearch(task, '2026-08-20'), true);
  assert.equal(matchesTaskSearch(task, 'cloud'), false);
});

test('getReminderMeta marks overdue and due soon tasks correctly', () => {
  const now = new Date('2026-08-15T12:00:00.000Z');

  assert.deepEqual(getReminderMeta({ dueDate: '2026-08-15T09:00:00.000Z', status: 'todo' }, now), {
    type: 'overdue',
    label: 'Overdue by 3 hours',
    tone: 'red'
  });

  assert.deepEqual(getReminderMeta({ dueDate: '2026-08-16T09:00:00.000Z', status: 'todo' }, now), {
    type: 'due-soon',
    label: 'Due today',
    tone: 'amber'
  });

  assert.deepEqual(getReminderMeta({ dueDate: '2026-08-20T00:00:00.000Z', status: 'done' }, now), {
    type: 'done',
    label: 'Completed',
    tone: 'green'
  });
});
