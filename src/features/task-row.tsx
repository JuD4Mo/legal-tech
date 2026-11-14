'use client';

import Link from 'next/link';
import { Check, Pencil } from 'lucide-react';
import { useWorkspace } from '@/components/workspace';
import { Badge } from '@/components/ui';
import { formatDate, today } from '@/lib/dates';
import type { Task } from '@/types/domain';

export function TaskRow({ task, variant = 'full' }: { task: Task; variant?: 'full' | 'compact' | 'deadline' }) {
  const { db, save, openForm, notify } = useWorkspace();
  const matter = db.cases.find(c => c.id === task.caseId);
  const assignee = db.members.find(m => m.id === task.assigneeId);
  const overdue = task.date < today() && task.status === 'pendiente';
  const deadline = variant === 'deadline';
  const full = variant === 'full';
  const month = new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'America/Bogota' })
    .format(new Date(`${task.date}T12:00:00-05:00`));

  return (
    <article className={`task-row task-row--${variant} ${task.status === 'completada' ? 'completed' : ''} ${overdue ? 'is-overdue' : ''}`}>
      {!deadline && (
        <time className="date-tile" dateTime={task.date} aria-label={formatDate(task.date, true)}>
          <b>{Number(task.date.slice(8))}</b><span>{month}</span>
        </time>
      )}
      <div className="task-row-main">
        <div className="task-row-heading">
          <Link className="task-title" href={`/agenda/${task.id}`}>{task.name}</Link>
          {(full || deadline) && (
            overdue ? <Badge>vencida</Badge> : full ? <Badge>{task.status}</Badge> :
              ['alta', 'urgente'].includes(task.priority) ? <Badge>{task.priority}</Badge> : null
          )}
        </div>
        <div className="task-details">
          <div className="task-meta">
            {deadline && <time dateTime={task.date}>{formatDate(task.date)}</time>}
            <span>{task.time || 'Todo el día'}</span>
            <span>{task.type}</span>
            {full && <span>{assignee?.name}</span>}
            {full && <span className="task-priority" data-priority={task.priority}>Prioridad {task.priority}</span>}
          </div>
          {matter && (
            <Link className="task-case" href={`/expedientes/${matter.id}`}>
              {matter.code} · {matter.name}
            </Link>
          )}
        </div>
      </div>
      {!deadline && (
        <div className="task-row-actions">
          <button className="icon-button edit-task" aria-label={`Editar ${task.name}`} title="Editar actividad"
            onClick={() => openForm({ collection: 'tasks', existing: task })}>
            <Pencil size={16} />
          </button>
          {task.status === 'pendiente' && (
            <button className="icon-button" aria-label={`Completar ${task.name}`} title="Marcar como completada"
              onClick={() => void save('tasks', { ...task, status: 'completada' }).catch(e => notify(e.message))}>
              <Check size={18} />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
