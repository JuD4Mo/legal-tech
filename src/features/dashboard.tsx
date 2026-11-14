'use client';

import Link from 'next/link';
import { Users, Plus, Upload, FileText, CalendarDays } from 'lucide-react';
import { useWorkspace } from '@/components/workspace';
import { Section, Empty } from '@/components/ui';
import { scoped } from '@/lib/repository';
import { formatDate, initials, relativeDate, today } from '@/lib/dates';
import { TaskRow } from './task-row';

export function Dashboard() {
  const { db, session, openForm } = useWorkspace();
  const clients = scoped(db, 'clients', session.organizationId);
  const cases = scoped(db, 'cases', session.organizationId);
  const tasks = scoped(db, 'tasks', session.organizationId);
  const docs = scoped(db, 'documents', session.organizationId);
  const members = scoped(db, 'members', session.organizationId);
  const user = members.find(m => m.id === session.memberId)!;
  const pending = tasks.filter(t => t.status === 'pendiente');
  const byDate = (a: typeof tasks[number], b: typeof tasks[number]) =>
    `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);
  const upcoming = pending.filter(t => t.date >= today()).sort(byDate);
  const deadlines = pending.filter(t => ['vencimiento', 'audiencia'].includes(t.type) && t.date <= relativeDate(7)).sort(byDate);
  const open = cases.filter(c => !['cerrado', 'archivado'].includes(c.status));
  const overdueCount = pending.filter(t => t.date < today()).length;
  const stats = [
    { title: 'Clientes y prospectos', value: clients.length, subtitle: `${clients.filter(c => c.status === 'activo').length} clientes activos`, href: '/clientes' },
    { title: 'Expedientes abiertos', value: open.length, subtitle: `${cases.length} expedientes en total`, href: '/expedientes' },
    { title: 'Actividades pendientes', value: pending.length, subtitle: overdueCount ? `${overdueCount} vencidas` : 'Sin actividades vencidas', href: '/agenda' },
    { title: 'Próximos compromisos', value: pending.filter(t => ['audiencia', 'vencimiento'].includes(t.type) && t.date >= today() && t.date <= relativeDate(7)).length, subtitle: 'Audiencias y términos · 7 días', href: '/agenda' },
  ];

  return <>
    <header className="overview-banner">
      <div>
        <h1>Hola, {user.name.split(' ')[0]}.</h1>
        <p>{formatDate(today(), true)} · Resumen de su espacio</p>
      </div>
      <button className="button gold-button" onClick={() => openForm({ collection: 'cases' })}>
        <Plus size={17} />Nuevo expediente
      </button>
    </header>

    <div className="stats-grid" aria-label="Indicadores del espacio">
      {stats.map(stat => (
        <Link key={stat.title} href={stat.href} className="stat-card">
          <span className="stat-top">{stat.title}</span>
          <span className="stat-value">{stat.value}</span>
          <span className="stat-bottom">{stat.subtitle}</span>
        </Link>
      ))}
    </div>

    <div className="quick-actions" role="group" aria-label="Acciones rápidas">
      <button className="button secondary" onClick={() => openForm({ collection: 'clients' })}><Users size={17} />Nuevo cliente</button>
      <button className="button secondary" onClick={() => openForm({ collection: 'tasks' })}><CalendarDays size={17} />Nueva actividad</button>
      <button className="button secondary" onClick={() => openForm({ collection: 'documents' })}><Upload size={17} />Subir documento</button>
    </div>

    <div className="dashboard-columns" data-has-overdue={deadlines.some(task => task.date < today())}>
      <Section title="Su próxima agenda" href="/agenda" linkLabel="Ver agenda">
        {upcoming.length ? upcoming.slice(0, 4).map(task => <TaskRow key={task.id} task={task} variant="compact" />) : <Empty text="Su agenda está despejada" />}
      </Section>
      <Section title="Vencimientos y audiencias" href="/agenda" linkLabel="Ver todos">
        {deadlines.length ? deadlines.slice(0, 3).map(task => <TaskRow key={task.id} task={task} variant="deadline" />) : <Empty text="Sin vencimientos próximos" />}
        <p className="panel-note">Los términos deben ser verificados por el profesional responsable.</p>
      </Section>
    </div>

    <div className="dashboard-columns lower-columns">
      <Section title="Expedientes por responsable" href="/expedientes" linkLabel="Ver expedientes">
        <table className="responsible-table">
          <thead><tr><th scope="col">Responsable</th><th scope="col">Abiertos</th><th scope="col">Total</th></tr></thead>
          <tbody>{members.filter(m => m.role !== 'asistente').map(member => {
            const assigned = cases.filter(c => c.assigneeId === member.id);
            return <tr key={member.id}>
              <td><div className="member-name"><span className="avatar" aria-hidden="true">{initials(member.name)}</span><strong>{member.name}</strong></div></td>
              <td>{assigned.filter(c => !['cerrado', 'archivado'].includes(c.status)).length}</td>
              <td>{assigned.length}</td>
            </tr>;
          })}</tbody>
        </table>
      </Section>
      <Section title="Últimos documentos" href="/documentos" linkLabel="Ver documentos">
        {docs.slice(0, 3).map(doc => (
          <Link className="document-mini" key={doc.id} href={`/documentos/${doc.id}`}>
            <span className="file-icon"><FileText size={20} /></span>
            <div><strong>{doc.name}</strong><p>{doc.category} · Versión {doc.version}</p></div>
          </Link>
        ))}
        {!docs.length && <Empty />}
      </Section>
    </div>

    <Section title="Actividad reciente" href="/actividad" linkLabel="Ver historial" variant="plain">
      <div className="recent-log">
        {scoped(db, 'logs', session.organizationId).slice(0, 4).map(log => (
          <div key={log.id}><strong>{log.name}</strong><p>{log.actor}</p><time dateTime={log.createdAt}>{formatDate(log.createdAt)}</time></div>
        ))}
      </div>
    </Section>
  </>;
}
