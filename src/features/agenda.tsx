'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, List, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useWorkspace } from '@/components/workspace';
import { Empty } from '@/components/ui';
import { scoped } from '@/lib/repository';
import { today } from '@/lib/dates';
import { PageHeader } from './records';
import { TaskRow } from './task-row';

export function Agenda() {
  const { db, session, openForm } = useWorkspace();
  const [view, setView] = useState('lista');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('pendiente');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');
  const [period, setPeriod] = useState('');
  const tasks = scoped(db, 'tasks', session.organizationId).filter(task =>
    (!query || task.name.toLowerCase().includes(query.toLowerCase())) &&
    (!type || task.type === type) && (!status || task.status === status) &&
    (!priority || task.priority === priority) && (!assignee || task.assigneeId === assignee) &&
    (!period || (period === 'hoy' ? task.date === today() : period === 'vencidas' ? task.date < today() : task.date >= today()))
  ).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5)) - 1;
  const days = new Date(year, m + 1, 0).getDate();
  const start = (new Date(year, m, 1).getDay() + 6) % 7;

  function move(offset: number) {
    const date = new Date(year, m + offset, 1, 12);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  return <>
    <PageHeader collection="tasks" onCreate={() => openForm({ collection: 'tasks' })} />
    <div className="agenda-toolbar">
      <div className="segmented" role="group" aria-label="Vista de agenda">
        <button aria-pressed={view === 'lista'} className={view === 'lista' ? 'selected' : ''} onClick={() => setView('lista')}><List size={16} />Lista</button>
        <button aria-pressed={view === 'calendario'} className={view === 'calendario' ? 'selected' : ''} onClick={() => setView('calendario')}><CalendarDays size={16} />Calendario</button>
      </div>
      <span className="muted">{tasks.length} actividades · Hora de Bogotá</span>
    </div>
    <div className="panel">
      <div className="filters">
        <div className="filter-search"><Search size={17} /><input placeholder="Buscar actividad…" aria-label="Buscar actividad" value={query} onChange={event => setQuery(event.target.value)} /></div>
        <select aria-label="Tipo de actividad" value={type} onChange={event => setType(event.target.value)}><option value="">Todos los tipos</option>{['tarea', 'audiencia', 'reunión', 'vencimiento', 'recordatorio'].map(value => <option key={value}>{value}</option>)}</select>
        <select aria-label="Estado de actividad" value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos los estados</option>{['pendiente', 'completada', 'cancelada'].map(value => <option key={value}>{value}</option>)}</select>
        <select aria-label="Responsable de actividad" value={assignee} onChange={event => setAssignee(event.target.value)}><option value="">Todos los responsables</option>{scoped(db, 'members', session.organizationId).map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select>
        <select aria-label="Prioridad de actividad" value={priority} onChange={event => setPriority(event.target.value)}><option value="">Todas las prioridades</option>{['baja', 'media', 'alta', 'urgente'].map(value => <option key={value}>{value}</option>)}</select>
        <select aria-label="Período" value={period} onChange={event => setPeriod(event.target.value)}><option value="">Todos los períodos</option><option value="hoy">Hoy</option><option value="vencidas">Vencidas</option><option value="proximas">Próximas</option></select>
      </div>
      {view === 'lista' ? (
        <div className="agenda-list">
          {tasks.map(task => <TaskRow key={task.id} task={task} />)}
          {!tasks.length && <Empty text="No hay actividades con estos filtros" />}
        </div>
      ) : <>
        <div className="calendar-header">
          <h2>{new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date(year, m, 15))}</h2>
          <div className="button-group">
            <button className="button secondary compact" onClick={() => setMonth(today().slice(0, 7))}>Hoy</button>
            <button className="icon-button" aria-label="Mes anterior" onClick={() => move(-1)}><ChevronLeft size={18} /></button>
            <button className="icon-button" aria-label="Mes siguiente" onClick={() => move(1)}><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="calendar-scroll" role="region" aria-label="Calendario mensual, desplazamiento horizontal disponible" tabIndex={0}>
          <div className="calendar-grid">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => <div className="calendar-day-name" key={day}>{day}</div>)}
            {Array.from({ length: start }, (_, index) => <div className="calendar-cell blank" key={`blank-${index}`} />)}
            {Array.from({ length: days }, (_, index) => {
              const date = `${month}-${String(index + 1).padStart(2, '0')}`;
              return <div className={`calendar-cell ${date === today() ? 'is-today' : ''}`} key={date}>
                <button className="calendar-date" aria-label={`Crear actividad el ${date}`} onClick={() => openForm({ collection: 'tasks', defaults: { date } })}>{index + 1}</button>
                {tasks.filter(task => task.date === date).map(task => <Link className={`calendar-event ${task.type}`} key={task.id} href={`/agenda/${task.id}`} title={`${task.time} ${task.name}`}>{task.time} {task.name}</Link>)}
              </div>;
            })}
          </div>
        </div>
      </>}
    </div>
    <p className="notice">Los términos y vencimientos deben ser verificados por el profesional responsable. Recordatorios simulados dentro de la aplicación; no se calculan términos judiciales.</p>
  </>;
}
